import React, { useState, useEffect, useMemo, useCallback, memo, useRef, useReducer, lazy, Suspense } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  Button, 
  IconButton, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  TextField,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  Grid,
  Card,
  CardContent,
  Container,
  Tab,
  Tabs,
  AppBar,
  Toolbar,
  CircularProgress,
  LinearProgress,
  Skeleton,
  InputAdornment,
  Divider,
  useTheme,
  useMediaQuery,
  Checkbox
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  QrCode as QrCodeIcon,
  Person as PersonIcon,
  SupervisorAccount as AdminIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';

// Константы для производительности
const THROTTLE_DELAY = 300; // мс для дебаунса поиска
const TRANSITION_DELAY = 50; // мс для анимаций
const TABLE_SKELETON_COUNT = 3; // число скелетов загрузки
const TRANSITION_TIMEOUT = 300; // мс для плавных переходов
const TABLE_HEIGHT = 'calc(100vh - 300px)'; // фиксированная высота таблицы
const TABLE_MIN_HEIGHT = 400; // минимальная высота таблицы в пикселях
const FETCH_THROTTLE = 2000; // мс между запросами к API

// Кеширование запросов API
const apiCache = new Map();

// Глобальные данные для сохранения изменений между обновлениями
const loadPersistentData = (): User[] | null => {
  try {
    const savedData = localStorage.getItem('adminPanelData');
    return savedData ? JSON.parse(savedData) : null;
  } catch (e) {
    console.error('Ошибка при загрузке сохраненных данных:', e);
    return null;
  }
};

const savePersistentData = (data: User[]) => {
  try {
    localStorage.setItem('adminPanelData', JSON.stringify(data));
    localStorage.setItem('users', JSON.stringify(data)); // Синхронизируем оба хранилища
    
    // Устанавливаем флаг, который указывает, что данные были изменены администратором
    localStorage.setItem('admin_edited_users', 'true');
    
    console.log('Данные пользователей сохранены в хранилище и помечены как отредактированные администратором');
  } catch (e) {
    console.error('Ошибка при сохранении данных:', e);
  }
};

// Инициализация данных, если они отсутствуют
const initializeMockData = (): User[] => {
  const mockData = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    username: `user${i + 1}`,
    name: `Пользователь ${i + 1}`,
    subscription: {
      activation_date: i % 3 === 0 ? new Date().toISOString() : null,
      expiration_date: i % 3 === 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      is_active: i % 3 === 0
    }
  }));
  savePersistentData(mockData);
  return mockData;
};

// Загружаем данные из localStorage или используем пустой массив, если данных нет
let persistentMockData: User[] = loadPersistentData() || [];

// Функция debounce для оптимизации поиска
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      func.apply(this, args);
    }, wait);
  };
};

// Интерфейсы для типизации
interface User {
  id: number;
  username: string;
  name: string;
  password?: string;
  subscription: {
    activation_date: string | null;
    expiration_date: string | null;
    is_active: boolean;
  } | null;
}

interface UserFormData {
  name: string;
  username: string;
  password: string;
}

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
}

// Определяем интерфейсы состояния и действий для редюсера
interface AdminPanelState {
  loading: boolean;
  refreshing: boolean;
  users: User[];
  actionLoading: boolean;
  searchQuery: string;
  searchInputValue: string;
  page: number;
  rowsPerPage: number;
  currentTab: number;
  selectedUsers: number[];
}

type AdminPanelAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_ACTION_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_VALUE'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ROWS_PER_PAGE'; payload: number }
  | { type: 'SET_CURRENT_TAB'; payload: number }
  | { type: 'SET_SELECTED_USERS'; payload: number[] }
  | { type: 'TOGGLE_USER_SELECTION'; payload: number }
  | { type: 'SELECT_ALL_USERS'; payload: number[] }
  | { type: 'CLEAR_SELECTION'; payload: void };

// Стили компонентов
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  // Оптимизация рендеринга
  willChange: 'background-color',
  transition: 'background-color 0.15s ease-in-out',
}));

const QRCodeContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  willChange: 'transform',
  transform: 'translateZ(0)',
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.background.paper,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.grey[400],
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: theme.palette.grey[500],
    },
  },
  maxHeight: TABLE_HEIGHT,
  minHeight: TABLE_MIN_HEIGHT,
  height: TABLE_HEIGHT,
  position: 'relative',
  // Предотвращаем мерцание во время скроллинга
  willChange: 'transform',
  overflow: 'auto',
  // Ускоряем рендеринг
  backfaceVisibility: 'hidden',
  transform: 'translateZ(0)',
  // Сглаживаем переходы
  transition: 'opacity 0.2s ease-in-out',
  // Предотвращаем мерцание границ
  borderCollapse: 'separate'
}));

const AdminToolbar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: theme.spacing(1.5, 1),
    gap: theme.spacing(1.5),
  },
  willChange: 'transform',
  transform: 'translateZ(0)',
}));

// Добавляем прогресс-бар вне компонентов для предотвращения ререндера контейнера
const LoadingProgress = memo(({ visible }: { visible: boolean }) => (
  <LinearProgress 
    sx={{ 
      width: '100%', 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      zIndex: 9,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      height: '3px'
    }} 
  />
));

// Оптимизированная строка таблицы
const UserTableRow = memo(({ 
  user, 
  onEdit, 
  onDelete, 
  onQR, 
  actionLoading,
  isSelected,
  onToggleSelect,
  isMobile
}: { 
  user: User; 
  onEdit: (user: User | null) => void; 
  onDelete: (user: User) => void; 
  onQR: (user: User) => void; 
  actionLoading: boolean;
  isSelected: boolean;
  onToggleSelect: (userId: number) => void;
  isMobile: boolean;
}) => {
  const statusColor = user.subscription?.is_active ? 'success' : 'error';
  const statusText = user.subscription?.is_active ? 'Активен' : 'Не активен';
  
  const handleEdit = useCallback(() => onEdit(user), [onEdit, user]);
  const handleDelete = useCallback(() => onDelete(user), [onDelete, user]);
  const handleQR = useCallback(() => onQR(user), [onQR, user]);
  const handleToggleSelect = useCallback((e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleSelect(user.id);
  }, [onToggleSelect, user.id]);
  
  return (
    <StyledTableRow 
      hover
      onClick={handleToggleSelect}
      selected={isSelected}
      sx={{
        cursor: 'pointer',
        ...(isSelected && {
          backgroundColor: (theme) => `${theme.palette.primary.light}20 !important`,
        }),
        // Уменьшаем отступы и шрифт для мобильных устройств
        '& .MuiTableCell-root': {
          py: { xs: 1, sm: 1.5 },
          px: { xs: 1, sm: 2 },
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={handleToggleSelect}
          inputProps={{ 'aria-labelledby': `user-${user.id}` }}
          size={isMobile ? "small" : "medium"}
        />
      </TableCell>
      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{user.id}</TableCell>
      <TableCell component="th" scope="row" id={`user-${user.id}`}>
        {user.username}
      </TableCell>
      <TableCell>{user.name}</TableCell>
      <TableCell>
        <Chip 
          size="small" 
          color={statusColor} 
          label={statusText}
          sx={{ fontWeight: 'medium', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        />
      </TableCell>
      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
        {user.subscription?.activation_date ? 
          new Date(user.subscription.activation_date).toLocaleDateString() : '-'}
      </TableCell>
      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
        {user.subscription?.expiration_date ? 
          new Date(user.subscription.expiration_date).toLocaleDateString() : '-'}
      </TableCell>
      <TableCell align="right">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: { xs: 0, sm: 0.5 }
        }}>
          <Tooltip title="Редактировать">
            <IconButton 
              size="small" 
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleEdit(); }}
              disabled={actionLoading}
              sx={{ padding: { xs: 0.5, sm: 1 } }}
            >
              <EditIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить">
            <IconButton 
              size="small" 
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDelete(); }}
              disabled={actionLoading}
              sx={{ padding: { xs: 0.5, sm: 1 } }}
            >
              <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
          <Tooltip title="QR-код">
            <IconButton 
              size="small" 
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleQR(); }}
              disabled={actionLoading}
              sx={{ padding: { xs: 0.5, sm: 1 } }}
            >
              <QrCodeIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </StyledTableRow>
  );
});

// Компонент "Скелет" загрузки таблицы
const TableLoadingSkeleton = memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
  <>
    {Array.from(new Array(TABLE_SKELETON_COUNT)).map((_, index) => (
      <TableRow key={index}>
        <TableCell><Skeleton animation="wave" /></TableCell>
          {!isMobile && <TableCell><Skeleton animation="wave" /></TableCell>}
        <TableCell><Skeleton animation="wave" /></TableCell>
        <TableCell><Skeleton animation="wave" /></TableCell>
        <TableCell><Skeleton animation="wave" width={80} /></TableCell>
          {!isMobile && (
            <>
        <TableCell><Skeleton animation="wave" width={100} /></TableCell>
        <TableCell><Skeleton animation="wave" width={100} /></TableCell>
            </>
          )}
        <TableCell align="right">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Skeleton animation="wave" width={isMobile ? 80 : 120} height={36} />
          </Box>
        </TableCell>
      </TableRow>
    ))}
  </>
  );
});

// Редюсер для управления состоянием админ-панели
const adminPanelReducer = (state: AdminPanelState, action: AdminPanelAction): AdminPanelState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_ACTION_LOADING':
      return { ...state, actionLoading: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload, page: 0 };
    case 'SET_SEARCH_VALUE':
      return { ...state, searchInputValue: action.payload };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_ROWS_PER_PAGE': 
      return { ...state, rowsPerPage: action.payload, page: 0 };
    case 'SET_CURRENT_TAB':
      return { ...state, currentTab: action.payload, page: 0 };
    case 'SET_SELECTED_USERS':
      return { ...state, selectedUsers: action.payload };
    case 'TOGGLE_USER_SELECTION': {
      const userId = action.payload;
      const selectedUsers = [...state.selectedUsers];
      const index = selectedUsers.indexOf(userId);
      
      if (index === -1) {
        selectedUsers.push(userId);
      } else {
        selectedUsers.splice(index, 1);
      }
      
      return { ...state, selectedUsers };
    }
    case 'SELECT_ALL_USERS':
      return { ...state, selectedUsers: action.payload };
    case 'CLEAR_SELECTION':
      return { ...state, selectedUsers: [] };
    default:
      return state;
  }
};

// Добавляем компонент StatCard
const StatCard = memo(({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string; 
}) => (
  <Paper
    elevation={1}
    sx={{
      p: 2,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderTop: `4px solid ${color}`,
      willChange: 'transform',
      transform: 'translateZ(0)'
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box 
        sx={{ 
          mr: 2, 
          bgcolor: `${color}22`, 
          p: 1, 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {React.cloneElement(icon as React.ReactElement, { sx: { color } })}
      </Box>
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
    </Box>
    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
      {value}
    </Typography>
  </Paper>
));

// Функция для создания профиля пользователя
const createUserProfile = (userId: string, name: string) => {
  const profileKey = `profile_${userId}`;
  const widgetsKey = `widgets_${userId}`;
  const settingsKey = `settings_${userId}`;
  
  const initialProfile = {
    id: userId,
    name: name,
    bio: '',
    avatar: '',
    theme: 'light',
    isPublic: true,
    createdByAdmin: true
  };
  
  localStorage.setItem(profileKey, JSON.stringify(initialProfile));
  localStorage.setItem(widgetsKey, JSON.stringify([]));
  localStorage.setItem(settingsKey, JSON.stringify({
    theme: 'light',
    notifications: true,
    privacy: 'public'
  }));
  
  return initialProfile;
};

// Функция для получения профиля пользователя
const getUserProfile = (userId: string) => {
  const profileKey = `profile_${userId}`;
  try {
    const savedProfile = localStorage.getItem(profileKey);
    return savedProfile ? JSON.parse(savedProfile) : null;
  } catch (e) {
    console.error('Ошибка при загрузке профиля:', e);
    return null;
  }
};

// Функция для обновления профиля пользователя
const updateUserProfile = (userId: string, profile: any) => {
  const profileKey = `profile_${userId}`;
  try {
    localStorage.setItem(profileKey, JSON.stringify(profile));
  } catch (e) {
    console.error('Ошибка при сохранении профиля:', e);
  }
};

// Главный компонент админ-панели
const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Состояние и редюсер
  const [state, dispatch] = useReducer(adminPanelReducer, {
    loading: true,
    refreshing: false,
    users: [],
    actionLoading: false,
    searchQuery: '',
    searchInputValue: '',
    page: 0,
    rowsPerPage: 10,
    currentTab: 0,
    selectedUsers: []
  });
  
  // Локальное состояние диалогов
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [openMultiDeleteDialog, setOpenMultiDeleteDialog] = useState(false);
  const [openClearAllDialog, setOpenClearAllDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({ name: '', username: '', password: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeSubscriptions: 0, expiredSubscriptions: 0 });
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: ''
  });
  
  // Функция для обновления статистики на основе актуальных данных
  const updateStats = useCallback(() => {
    if (persistentMockData) {
      setStats({
        totalUsers: persistentMockData.length,
        activeSubscriptions: persistentMockData.filter(user => user.subscription?.is_active).length,
        expiredSubscriptions: persistentMockData.filter(user => !user.subscription?.is_active).length
      });
    }
  }, []);
  
  // Оптимизированные обработчики
  
  // Дебаунсированный поиск
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    }, THROTTLE_DELAY),
    []
  );
  
  // Обработчик изменения поискового запроса
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_VALUE', payload: e.target.value });
    
    // Используем debounce для поиска, чтобы не перегружать вычисления при каждом нажатии клавиши
    debouncedSearch(e.target.value);
  };
  
  // Обработчики для пагинации
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    dispatch({ type: 'SET_PAGE', payload: newPage });
  }, []);
  
  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_ROWS_PER_PAGE', payload: parseInt(event.target.value, 10) });
  }, []);
  
  // Обработчик смены вкладок
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    dispatch({ type: 'SET_CURRENT_TAB', payload: newValue });
  }, []);
  
  // Обработчики диалогов
  const handleOpenEditDialog = useCallback((user: User | null = null) => {
    setSelectedUser(user);
    if (user) {
      setUserForm({ name: user.name, username: user.username, password: '' });
    } else {
      setUserForm({ name: '', username: '', password: '' });
    }
    setOpenEditDialog(true);
  }, []);
  
  const handleCloseEditDialog = useCallback(() => {
    setOpenEditDialog(false);
  }, []);
  
  const handleOpenDeleteDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  }, []);
  
  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
  }, []);
  
  const handleOpenQRDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setOpenQRDialog(true);
  }, []);
  
  const handleCloseQRDialog = useCallback(() => {
    setOpenQRDialog(false);
  }, []);
  
  // Обновление данных пользователей
  const fetchUsers = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      dispatch({ type: 'SET_REFRESHING', payload: true });
    } else {
      dispatch({ type: 'SET_LOADING', payload: true });
    }
    
    try {
      // При явном refresh или при первичной загрузке - всегда берем последние данные
      if (isRefreshing || state.users.length === 0) {
        // Сбрасываем кеш
        apiCache.clear();
      }
      
      // Использование кеша только если нет обновления и не первый вызов
      const cacheKey = `users-${state.searchQuery}-${state.currentTab}`;
      if (apiCache.has(cacheKey) && !isRefreshing && state.users.length > 0) {
        dispatch({ type: 'SET_USERS', payload: apiCache.get(cacheKey) });
        updateStats(); // Всегда обновляем статистику
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_REFRESHING', payload: false });
        return;
      }

      // Эмуляция API запроса
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Загружаем последние данные из localStorage
      let freshData = loadPersistentData();
      
      // Если данных нет, инициализируем пустым массивом
      if (!freshData) {
        freshData = [];
        savePersistentData(freshData);
      }
      
      // Обновляем persistentMockData текущими данными
      persistentMockData = freshData;
      
      // Используем сохраненные данные
      let filteredData = [...persistentMockData];
      
      // Фильтрация по поиску
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filteredData = filteredData.filter(user => 
          user.name.toLowerCase().includes(query) || 
          user.username.toLowerCase().includes(query)
        );
      }
      
      // Фильтрация по вкладке - исправляем логику для вкладки пользователей
      // На вкладке 0 (Обзор) не применяем фильтры
      // На вкладке 1 (Пользователи) показываем всех пользователей без дополнительной фильтрации
      
      // Кешируем результат
      apiCache.set(cacheKey, filteredData);
      
      // Обновляем статистику из актуальных данных
      updateStats();
      
      dispatch({ type: 'SET_USERS', payload: filteredData });
      
      console.log("Данные загружены:", {
        totalFromStorage: persistentMockData.length,
        filteredCount: filteredData.length,
        searchQuery: state.searchQuery,
        currentTab: state.currentTab
      });
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка загрузки пользователей',
        severity: 'error'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [state.currentTab, state.searchQuery, updateStats, state.users.length]);
  
  // Обработчик редактирования пользователя
  const handleEditUser = useCallback(async () => {
    if (!selectedUser) return;

    dispatch({ type: 'SET_ACTION_LOADING', payload: true });

    try {
      console.log('Начало редактирования пользователя:', {
        id: selectedUser.id,
        oldName: selectedUser.name,
        newName: userForm.name,
        passwordChanged: !!userForm.password
      });
      
      // Загружаем актуальные данные из обоих хранилищ
      const adminPanelData = localStorage.getItem('adminPanelData');
      const usersData = localStorage.getItem('users');
      
      let currentAdminData = adminPanelData ? JSON.parse(adminPanelData) : [];
      let currentUsersData = usersData ? JSON.parse(usersData) : [];
      
      // Обновляем данные в обоих хранилищах
      currentAdminData = currentAdminData.map((user: User) => {
        if (user.id === selectedUser.id) {
          // Обновляем имя пользователя
          const updatedUser = { ...user, name: userForm.name };
          
          // Если введен новый пароль, обновляем его
          if (userForm.password) {
            (updatedUser as any).password = userForm.password;
          }
          
          return updatedUser;
        }
        return user;
      });
      
      currentUsersData = currentUsersData.map((user: User) => {
        if (user.id === selectedUser.id) {
          // Обновляем имя пользователя
          const updatedUser = { ...user, name: userForm.name };
          
          // Если введен новый пароль, обновляем его
          if (userForm.password) {
            (updatedUser as any).password = userForm.password;
          }
          
          return updatedUser;
        }
        return user;
      });
      
      // Сохраняем изменения в обоих хранилищах
      localStorage.setItem('adminPanelData', JSON.stringify(currentAdminData));
      localStorage.setItem('users', JSON.stringify(currentAdminData)); // Синхронизируем оба хранилища
      localStorage.setItem('admin_edited_users', 'true'); // Устанавливаем флаг редактирования
      
      // Обновляем глобальные данные
      persistentMockData = currentAdminData;
      
      console.log('Данные после редактирования пользователя:', {
        adminPanelDataLength: currentAdminData.length,
        usersDataLength: currentAdminData.length
      });

      // Обновляем данные пользователя в UI
      const updatedUsers = state.users.map(user => {
        if (user.id === selectedUser.id) {
          // Создаем копию пользователя с обновленным именем
          return { ...user, name: userForm.name };
        }
        return user;
      });

      // Обновляем профиль пользователя
      const userProfile = getUserProfile(selectedUser.id.toString());
      if (userProfile) {
        userProfile.name = userForm.name;
        updateUserProfile(selectedUser.id.toString(), userProfile);
      }

      dispatch({ type: 'SET_USERS', payload: updatedUsers });
      
      // Очищаем кеш
      apiCache.clear();
      
      handleCloseEditDialog();
      updateStats();

      setSnackbar({
        open: true,
        message: userForm.password 
          ? 'Пользователь и пароль обновлены' 
          : 'Пользователь успешно обновлен',
        severity: 'success'
      });

      console.log("Обновлен пользователь:", {
        id: selectedUser.id,
        name: userForm.name,
        passwordChanged: !!userForm.password,
        profile: userProfile
      });
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при обновлении пользователя',
        severity: 'error'
      });
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [selectedUser, userForm.name, userForm.password, state.users, handleCloseEditDialog, updateStats]);
  
  // Обработчик удаления пользователя
  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    
    try {
      // Симуляция API запроса
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Удаление пользователя. Начальное состояние:', {
        selectedUserId: selectedUser.id,
        selectedUserName: selectedUser.name,
      });
      
      // Загружаем актуальные данные из обоих хранилищ
      const adminPanelData = localStorage.getItem('adminPanelData');
      const usersData = localStorage.getItem('users');
      
      console.log('Текущие данные хранилищ:', {
        adminPanelDataExists: !!adminPanelData,
        adminPanelLength: adminPanelData ? JSON.parse(adminPanelData).length : 0,
        usersDataExists: !!usersData,
        usersLength: usersData ? JSON.parse(usersData).length : 0
      });
      
      // Обновляем данные в обоих хранилищах
      let currentAdminData = adminPanelData ? JSON.parse(adminPanelData) : [];
      let currentUsersData = usersData ? JSON.parse(usersData) : [];
      
      // Фильтруем из обоих хранилищ
      currentAdminData = currentAdminData.filter((user: User) => user.id !== selectedUser.id);
      currentUsersData = currentUsersData.filter((user: User) => user.id !== selectedUser.id);
      
      // Фильтруем пользователей в UI
      const filteredUsers = state.users.filter(user => user.id !== selectedUser.id);
      
      dispatch({
        type: 'SET_USERS',
        payload: filteredUsers
      });
      
      // Также удаляем из глобальных данных
      persistentMockData = currentAdminData || [];  // Защита от null
      
      // Сохраняем изменения в обоих хранилищах
      localStorage.setItem('adminPanelData', JSON.stringify(currentAdminData));
      localStorage.setItem('users', JSON.stringify(currentAdminData)); // Синхронизируем оба хранилища
      localStorage.setItem('admin_edited_users', 'true'); // Устанавливаем флаг редактирования
      
      console.log('Данные после удаления:', {
        adminPanelDataLength: currentAdminData.length,
        usersDataLength: currentAdminData.length,
        filteredUsersLength: filteredUsers.length
      });
      
      // Очищаем кеш
      apiCache.clear();
      
      // Принудительно обновляем список пользователей
      fetchUsers(true);
      
      // Обновляем статистику
      updateStats();
      
        setSnackbar({
          open: true,
        message: 'Пользователь успешно удален',
        severity: 'success'
      });

      handleCloseDeleteDialog();
      
      console.log("Пользователь удален:", {
        id: selectedUser.id,
        name: selectedUser.name,
        remainingTotal: persistentMockData ? persistentMockData.length : 0
      });
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
        setSnackbar({
          open: true,
        message: 'Ошибка удаления пользователя',
        severity: 'error'
      });
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [selectedUser, state.users, handleCloseDeleteDialog, updateStats, fetchUsers]);
  
  // Обработчики формы
  const handleUserFormChange = useCallback((field: keyof UserFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUserForm(prev => ({ ...prev, [field]: event.target.value }));
  }, []);
  
  // Закрытие снэкбара
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);
  
  // Проверка авторизации администратора
  const checkAdminAuth = useCallback(async () => {
    try {
      // Здесь в реальном приложении был бы запрос к API
      // для проверки прав администратора
      
      const isAdmin = true; // Мок-данные
      
      if (isAdmin) {
        // Загружаем данные при инициализации
        fetchUsers(true);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      navigate('/login');
    }
  }, [navigate, fetchUsers]);
  
  // Копирование QR-кода
  const copyQRCodeLink = useCallback(() => {
    if (!selectedUser) return;
    
    const socialLink = `${window.location.origin}/social/${selectedUser.username}`;
    navigator.clipboard.writeText(socialLink);

        setSnackbar({
          open: true,
      message: 'Ссылка скопирована в буфер обмена',
      severity: 'success'
    });
  }, [selectedUser]);
  
  // Проверка авторизации при монтировании
  useEffect(() => {
    checkAdminAuth();
    // Обновляем статистику при монтировании
    updateStats();
  }, [checkAdminAuth, updateStats]);

  // Обновление данных при изменении фильтров
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Также добавим обработчик для очистки всего хранилища
  const handleClearAllUsers = useCallback(async () => {
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    
    try {
      console.log('Начало полной очистки хранилища пользователей...');
      
      // Очищаем всех пользователей
      persistentMockData = [];
      
      // Сохраняем пустой массив и устанавливаем флаг редактирования
      localStorage.setItem('adminPanelData', JSON.stringify([]));
      localStorage.setItem('users', JSON.stringify([]));
      localStorage.setItem('admin_edited_users', 'true');
      
      console.log('Данные после очистки:', {
        adminPanelData: JSON.parse(localStorage.getItem('adminPanelData') || '[]').length,
        usersData: JSON.parse(localStorage.getItem('users') || '[]').length
      });
      
      // Очищаем кеш и обновляем UI
      apiCache.clear();
      dispatch({ type: 'SET_USERS', payload: [] });
      
      // Принудительно обновляем интерфейс
      fetchUsers(true);
      
      // Обновляем статистику
      updateStats();

        setSnackbar({
          open: true,
        message: 'Все пользователи успешно удалены',
        severity: 'success'
      });
      
      console.log("Выполнена полная очистка хранилища и установлен флаг редактирования");
      
      // Закрываем диалог
      setOpenClearAllDialog(false);
    } catch (error) {
      console.error('Ошибка при очистке данных:', error);
        setSnackbar({
          open: true,
        message: 'Ошибка при очистке данных',
        severity: 'error'
      });
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [updateStats, fetchUsers]);
  
  // Вычисляем пагинированные и отфильтрованные данные
  const visibleUsers = useMemo(() => {
    const start = state.page * state.rowsPerPage;
    const end = start + state.rowsPerPage;
    return state.users.slice(start, end);
  }, [state.users, state.page, state.rowsPerPage]);

  // Обработчики выбора пользователей
  const handleToggleUserSelection = useCallback((userId: number) => {
    dispatch({ type: 'TOGGLE_USER_SELECTION', payload: userId });
  }, []);

  const handleSelectAllUsers = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Выбираем всех пользователей на текущей странице
      const newSelected = visibleUsers.map(user => user.id);
      dispatch({ type: 'SET_SELECTED_USERS', payload: newSelected });
    } else {
      dispatch({ type: 'CLEAR_SELECTION', payload: undefined });
    }
  }, [visibleUsers]);

  // Обработка диалога массового удаления
  const handleOpenMultiDeleteDialog = useCallback(() => {
    if (state.selectedUsers.length > 0) {
      setOpenMultiDeleteDialog(true);
    }
  }, [state.selectedUsers]);

  const handleCloseMultiDeleteDialog = useCallback(() => {
    setOpenMultiDeleteDialog(false);
  }, []);

  // Обработка диалога очистки хранилища
  const handleOpenClearAllDialog = useCallback(() => {
    setOpenClearAllDialog(true);
  }, []);

  const handleCloseClearAllDialog = useCallback(() => {
    setOpenClearAllDialog(false);
  }, []);

  // Функция для массового удаления пользователей
  const handleDeleteMultipleUsers = useCallback(async () => {
    if (state.selectedUsers.length === 0) return;
    
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    
    try {
      // Симуляция API запроса
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('Начало массового удаления пользователей:', {
        selectedCount: state.selectedUsers.length,
        selectedIds: state.selectedUsers
      });
      
      // Загружаем актуальные данные из обоих хранилищ
      const adminPanelData = localStorage.getItem('adminPanelData');
      const usersData = localStorage.getItem('users');
      
      console.log('Текущие данные хранилищ:', {
        adminPanelDataExists: !!adminPanelData,
        adminPanelLength: adminPanelData ? JSON.parse(adminPanelData).length : 0,
        usersDataExists: !!usersData,
        usersLength: usersData ? JSON.parse(usersData).length : 0
      });
      
      // Фильтруем пользователей в UI
      const filteredUsers = state.users.filter(user => !state.selectedUsers.includes(user.id));
      
      dispatch({
        type: 'SET_USERS',
        payload: filteredUsers
      });
      
      // Фильтруем данные в обоих хранилищах
      let currentAdminData = adminPanelData ? JSON.parse(adminPanelData) : [];
      let currentUsersData = usersData ? JSON.parse(usersData) : [];
      
      currentAdminData = currentAdminData.filter((user: User) => !state.selectedUsers.includes(user.id));
      currentUsersData = currentUsersData.filter((user: User) => !state.selectedUsers.includes(user.id));
      
      // Также удаляем из глобальных данных
      persistentMockData = currentAdminData || [];  // Защита от null
      
      // Сохраняем изменения в обоих хранилищах
      localStorage.setItem('adminPanelData', JSON.stringify(currentAdminData));
      localStorage.setItem('users', JSON.stringify(currentAdminData)); // Синхронизируем оба хранилища
      localStorage.setItem('admin_edited_users', 'true'); // Устанавливаем флаг редактирования
      
      console.log('Данные после массового удаления:', {
        adminPanelDataLength: currentAdminData.length,
        usersDataLength: currentAdminData.length,
        filteredUsersLength: filteredUsers.length
      });
      
      // Очищаем кеш
      apiCache.clear();
      
      // Очищаем выбранных пользователей
      dispatch({ type: 'CLEAR_SELECTION', payload: undefined });

      // Принудительно обновляем список пользователей
      fetchUsers(true);

      // Обновляем статистику после удаления
      updateStats();
      
      setSnackbar({
        open: true,
        message: `Успешно удалено пользователей: ${state.selectedUsers.length}`,
        severity: 'success'
      });

      handleCloseMultiDeleteDialog();
      
      console.log("Массовое удаление завершено:", {
        removedCount: state.selectedUsers.length,
        remainingTotal: persistentMockData ? persistentMockData.length : 0
      });
    } catch (error) {
      console.error('Ошибка массового удаления пользователей:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при удалении пользователей',
        severity: 'error'
      });
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [state.selectedUsers, state.users, handleCloseMultiDeleteDialog, updateStats, fetchUsers]);

  // Проверка, все ли пользователи на текущей странице выбраны
  const isAllSelected = useMemo(() => {
    return visibleUsers.length > 0 && visibleUsers.every(user => state.selectedUsers.includes(user.id));
  }, [visibleUsers, state.selectedUsers]);

  // Функция для создания нового пользователя
  const handleCreateUser = useCallback(async () => {
    if (!userForm.username || !userForm.password || !userForm.name) {
    setSnackbar({
      open: true,
        message: 'Заполните все поля',
        severity: 'error'
      });
      return;
    }

    dispatch({ type: 'SET_ACTION_LOADING', payload: true });

    try {
      console.log('Начало создания нового пользователя:', {
        username: userForm.username,
        name: userForm.name
      });
      
      // Создаем нового пользователя
      const newUserData = {
        id: Date.now(),
        username: userForm.username,
        name: userForm.name,
        password: userForm.password,
        subscription: null
      };

      // Создаем профиль пользователя
      const userProfile = createUserProfile(newUserData.id.toString(), userForm.name);
      console.log('Создан профиль пользователя:', userProfile);

      // Загружаем актуальные данные из обоих хранилищ
      const adminPanelData = localStorage.getItem('adminPanelData');
      const usersData = localStorage.getItem('users');
      
      let currentAdminData = adminPanelData ? JSON.parse(adminPanelData) : [];
      let currentUsersData = usersData ? JSON.parse(usersData) : [];
      
      // Добавляем пользователя в хранилища
      currentAdminData.push(newUserData);
      currentUsersData.push(newUserData);

      // Сохраняем изменения в обоих хранилищах
      localStorage.setItem('adminPanelData', JSON.stringify(currentAdminData));
      localStorage.setItem('users', JSON.stringify(currentAdminData)); // Синхронизируем оба хранилища
      localStorage.setItem('admin_edited_users', 'true'); // Устанавливаем флаг редактирования
      
      // Обновляем глобальные данные
      persistentMockData = currentAdminData;
      
      console.log('Данные после создания пользователя:', {
        adminPanelDataLength: currentAdminData.length,
        usersDataLength: currentAdminData.length
      });

      // Добавляем пользователя в список (без пароля для хранения в state)
      const userDataWithoutPassword = {
        id: newUserData.id,
        username: newUserData.username,
        name: newUserData.name,
        subscription: null
      };

      const updatedUsers = [...state.users, userDataWithoutPassword];
      dispatch({ type: 'SET_USERS', payload: updatedUsers });
      
      // Очищаем кеш
      apiCache.clear();

      // Сбрасываем форму и закрываем диалог
      setUserForm({ name: '', username: '', password: '' });
      handleCloseEditDialog();
      updateStats();

      setSnackbar({
        open: true,
        message: 'Пользователь успешно создан',
        severity: 'success'
      });

      console.log("Создан новый пользователь:", {
        username: newUserData.username,
        id: newUserData.id,
        profile: userProfile
      });
    } catch (error) {
      console.error('Ошибка создания пользователя:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при создании пользователя',
        severity: 'error'
      });
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [userForm, state.users, handleCloseEditDialog, updateStats]);

  // Добавляем обработчик очистки поиска
  const handleClearSearch = () => {
    dispatch({ type: 'SET_SEARCH_VALUE', payload: '' });
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        overflow: 'hidden', // Предотвращаем скроллинг всей страницы
        bgcolor: theme.palette.background.default, // Фиксированный фон для предотвращения мерцаний
      }}
    >
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <AdminIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Панель администратора
              </Typography>
          <Button color="inherit" onClick={() => navigate('/social')}>
            Выйти
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container 
        maxWidth="lg"
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          flex: 1,
          pt: 3,
          pb: 3,
          overflow: 'hidden', // Важно для предотвращения скроллбаров
          // Плавная анимация для перехода между вкладками
          '& > div': {
            transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
          }
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={state.currentTab} 
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              // Предотвращаем shift табов при переключении
              '& .MuiTabs-flexContainer': {
                justifyContent: isMobile ? 'space-around' : 'flex-start',
              }
            }}
          >
            <Tab label="Обзор" icon={<PersonIcon />} iconPosition="start" />
            <Tab label="Пользователи" icon={<AdminIcon />} iconPosition="start" />
          </Tabs>
        </Box>
      
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'auto',
            // Предотвращаем shift контента при загрузке
            minHeight: 400,
          }}
        >
          {state.currentTab === 0 ? (
            <Box sx={{ py: 2, flex: 1 }}>
              <Typography variant="h5" gutterBottom>
                Обзор системы
                </Typography>
              
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4}>
                  <StatCard 
                    title="Всего пользователей" 
                    value={stats.totalUsers} 
                    icon={<PersonIcon />} 
                    color={theme.palette.primary.main} 
                  />
        </Grid>
                <Grid item xs={12} md={4}>
                  <StatCard 
                    title="Активные подписки" 
                    value={stats.activeSubscriptions} 
                    icon={<VisibilityIcon />} 
                    color={theme.palette.success.main} 
                  />
        </Grid>
                <Grid item xs={12} md={4}>
                  <StatCard 
                    title="Истекшие подписки" 
                    value={stats.expiredSubscriptions} 
                    icon={<VisibilityOffIcon />} 
                    color={theme.palette.error.main} 
                  />
        </Grid>
      </Grid>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Статистика использования
                </Typography>
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography color="text.secondary" align="center" sx={{ py: 5 }}>
                    Графики статистики будут доступны в следующем обновлении
                  </Typography>
                </Paper>
    </Box>
            </Box>
          ) : (
            <Box 
              sx={{ 
                py: 2, 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <Paper sx={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
                {/* Прогресс-бар загрузки */}
                <LoadingProgress visible={state.loading || state.refreshing} />
                
                {/* Панель инструментов */}
      <AdminToolbar>
        <TextField
          placeholder="Поиск пользователей..."
                    value={state.searchInputValue}
          onChange={handleSearchChange}
          variant="outlined"
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize={isMobile ? "small" : "medium"} />
              </InputAdornment>
            ),
            endAdornment: state.searchInputValue ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
                    sx={{ width: { xs: '100%', sm: 300 } }}
        />
        
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 0.5, sm: 1 },
          flexWrap: 'wrap',
          justifyContent: { xs: 'space-between', sm: 'flex-end' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          {state.selectedUsers.length > 0 && (
          <Button 
            variant="outlined" 
              color="error"
              size="small"
              startIcon={<DeleteIcon fontSize={isMobile ? "small" : "medium"} />}
              onClick={handleOpenMultiDeleteDialog}
              disabled={state.actionLoading}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
            >
              Удалить ({state.selectedUsers.length})
            </Button>
          )}
          <Button 
            variant="outlined" 
                      size="small"
            startIcon={state.refreshing ? 
              <CircularProgress size={isMobile ? 16 : 20} /> : 
              <RefreshIcon fontSize={isMobile ? "small" : "medium"} />
            }
            onClick={() => fetchUsers(true)}
                      disabled={state.loading || state.refreshing}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
                      size="small"
            startIcon={<AddIcon fontSize={isMobile ? "small" : "medium"} />}
                      onClick={() => handleOpenEditDialog(null)}
                      disabled={state.loading || state.refreshing}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
          >
                      Добавить
          </Button>
          <Tooltip title="Очистить все данные">
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon fontSize={isMobile ? "small" : "medium"} />}
              onClick={handleOpenClearAllDialog}
              disabled={state.actionLoading || persistentMockData?.length === 0}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
            >
              {isMobile ? "Очистить" : "Очистить все"}
            </Button>
          </Tooltip>
        </Box>
      </AdminToolbar>
      
                {/* Таблица пользователей */}
      <StyledTableContainer>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            indeterminate={state.selectedUsers.length > 0 && !isAllSelected}
                            checked={isAllSelected}
                            onChange={handleSelectAllUsers}
                            disabled={state.users.length === 0 || state.loading}
                          />
                        </TableCell>
              <TableCell width={60} sx={{ display: { xs: 'none', sm: 'table-cell' } }}>ID</TableCell>
              <TableCell>Логин</TableCell>
                        <TableCell>Имя</TableCell>
                        <TableCell width={120}>Статус</TableCell>
              <TableCell width={120} sx={{ display: { xs: 'none', md: 'table-cell' } }}>Активация</TableCell>
              <TableCell width={120} sx={{ display: { xs: 'none', md: 'table-cell' } }}>Истечение</TableCell>
                        <TableCell align="right" width={120}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
                      {state.loading && state.users.length === 0 ? (
                        <TableLoadingSkeleton />
                      ) : state.users.length === 0 ? (
              <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary">
                              {state.searchQuery ? 'Пользователи не найдены' : 'Список пользователей пуст'}
                  </Typography>
                </TableCell>
              </TableRow>
                      ) : (
                        visibleUsers.map(user => (
                          <UserTableRow
                            key={user.id}
                            user={user}
                            onEdit={handleOpenEditDialog}
                            onDelete={handleOpenDeleteDialog}
                            onQR={handleOpenQRDialog}
                            actionLoading={state.actionLoading}
                            isSelected={state.selectedUsers.includes(user.id)}
                            onToggleSelect={handleToggleUserSelection}
                  isMobile={isMobile}
                          />
                        ))
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
      
                {/* Пагинация */}
                {state.users.length > 0 && (
      <TablePagination
        component="div"
                    count={state.users.length}
                    page={state.page}
                    rowsPerPage={state.rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25]}
        labelRowsPerPage={isMobile ? "Строк:" : "Строк на странице:"}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`}
        sx={{
          '.MuiTablePagination-selectLabel': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          },
          '.MuiTablePagination-select': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          },
          '.MuiTablePagination-displayedRows': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          },
          '.MuiTablePagination-actions': {
            marginLeft: { xs: 0, sm: 2 }
          }
        }}
      />
                )}
    </Paper>
          </Box>
        )}
          </Box>
      </Container>

      {/* Диалог добавления/редактирования пользователя */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        keepMounted={false}
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(2px)',
          },
          '& .MuiDialog-paper': {
            margin: isMobile ? 0 : '32px',
            maxHeight: isMobile ? '100%' : 'calc(100% - 64px)'
          }
        }}
      >
        <DialogTitle>
          {selectedUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
              label="Имя"
              margin="normal"
              value={userForm.name}
              onChange={handleUserFormChange('name')}
            size={isMobile ? "small" : "medium"}
          />
          <TextField
            fullWidth
              label="Логин"
              margin="normal"
              value={userForm.username}
              onChange={handleUserFormChange('username')}
            size={isMobile ? "small" : "medium"}
            />
            {!selectedUser && (
          <TextField
            fullWidth
                label="Пароль"
                type="password"
                margin="normal"
                value={userForm.password}
                onChange={handleUserFormChange('password')}
              size={isMobile ? "small" : "medium"}
              />
            )}
            {selectedUser && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Новый пароль"
                  type="password"
                  margin="normal"
                  value={userForm.password}
                  onChange={handleUserFormChange('password')}
                  size={isMobile ? "small" : "medium"}
                  placeholder="Оставьте пустым, чтобы не менять"
                  helperText="Введите новый пароль для пользователя или оставьте поле пустым, чтобы сохранить текущий пароль"
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} size={isMobile ? "small" : "medium"}>Отмена</Button>
          <Button 
            onClick={selectedUser ? handleEditUser : handleCreateUser}
            variant="contained"
            disabled={state.actionLoading}
            startIcon={state.actionLoading ? <CircularProgress size={isMobile ? 16 : 20} /> : null}
            size={isMobile ? "small" : "medium"}
          >
            {selectedUser ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={handleCloseDeleteDialog}
        keepMounted={false}
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(2px)',
          }
        }}
      >
        <DialogTitle>Удаление пользователя</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить пользователя "{selectedUser?.name}"? 
            Это действие невозможно отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Отмена</Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            disabled={state.actionLoading}
            startIcon={state.actionLoading ? <CircularProgress size={16} /> : null}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог QR-кода */}
      <Dialog 
        open={openQRDialog} 
        onClose={handleCloseQRDialog}
        keepMounted={false}
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(2px)',
          }
        }}
      >
        <DialogTitle>QR-код профиля</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <QRCodeContainer>
              <Typography variant="subtitle1" gutterBottom>
                {selectedUser.name}
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, mb: 2 }}>
                <QRCode 
                  value={`${window.location.origin}/social/${selectedUser.username}`}
                  size={200}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                {`${window.location.origin}/social/${selectedUser.username}`}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={copyQRCodeLink}
              >
                Копировать ссылку
              </Button>
            </QRCodeContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQRDialog}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения массового удаления */}
      <Dialog 
        open={openMultiDeleteDialog} 
        onClose={handleCloseMultiDeleteDialog}
        keepMounted={false}
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(2px)',
          }
        }}
      >
        <DialogTitle>Массовое удаление пользователей</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить выбранных пользователей ({state.selectedUsers.length} шт.)? 
            Это действие невозможно отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMultiDeleteDialog}>Отмена</Button>
          <Button 
            onClick={handleDeleteMultipleUsers} 
            color="error" 
            variant="contained"
            disabled={state.actionLoading}
            startIcon={state.actionLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            Удалить всех выбранных
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения очистки всех пользователей */}
      <Dialog 
        open={openClearAllDialog} 
        onClose={handleCloseClearAllDialog}
        keepMounted={false}
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(2px)',
          }
        }}
      >
        <DialogTitle>Очистка всех данных</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить ВСЕХ пользователей? 
            Эта операция необратима и приведет к полной очистке хранилища.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearAllDialog}>Отмена</Button>
          <Button 
            onClick={() => {
              handleClearAllUsers();
              handleCloseClearAllDialog();
            }} 
            color="error" 
            variant="contained"
            disabled={state.actionLoading}
            startIcon={state.actionLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            Удалить всех пользователей
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомление */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default memo(AdminPanel); 