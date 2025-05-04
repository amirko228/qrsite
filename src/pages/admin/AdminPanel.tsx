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
  useMediaQuery
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
  FilterList as FilterListIcon
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
let persistentMockData: User[] | null = null;

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
  | { type: 'SET_CURRENT_TAB'; payload: number };

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
  actionLoading 
}: { 
  user: User; 
  onEdit: (user: User) => void; 
  onDelete: (user: User) => void; 
  onQR: (user: User) => void; 
  actionLoading: boolean; 
}) => {
  const statusColor = user.subscription?.is_active ? 'success' : 'error';
  const statusText = user.subscription?.is_active ? 'Активен' : 'Не активен';
  
  const handleEdit = useCallback(() => onEdit(user), [onEdit, user]);
  const handleDelete = useCallback(() => onDelete(user), [onDelete, user]);
  const handleQR = useCallback(() => onQR(user), [onQR, user]);
  
  return (
    <StyledTableRow hover>
      <TableCell>{user.id}</TableCell>
      <TableCell component="th" scope="row">{user.username}</TableCell>
      <TableCell>{user.name}</TableCell>
      <TableCell>
        <Chip 
          size="small" 
          color={statusColor} 
          label={statusText}
          sx={{ fontWeight: 'medium' }}
        />
      </TableCell>
      <TableCell>
        {user.subscription?.activation_date ? 
          new Date(user.subscription.activation_date).toLocaleDateString() : '-'}
      </TableCell>
      <TableCell>
        {user.subscription?.expiration_date ? 
          new Date(user.subscription.expiration_date).toLocaleDateString() : '-'}
      </TableCell>
      <TableCell align="right">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Редактировать">
            <IconButton 
              size="small" 
              onClick={handleEdit}
              disabled={actionLoading}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить">
            <IconButton 
              size="small" 
              onClick={handleDelete}
              disabled={actionLoading}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="QR-код">
            <IconButton 
              size="small" 
              onClick={handleQR}
              disabled={actionLoading}
            >
              <QrCodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </StyledTableRow>
  );
});

// Компонент "Скелет" загрузки таблицы
const TableLoadingSkeleton = memo(() => (
  <>
    {Array.from(new Array(TABLE_SKELETON_COUNT)).map((_, index) => (
      <TableRow key={index}>
        <TableCell><Skeleton animation="wave" /></TableCell>
        <TableCell><Skeleton animation="wave" /></TableCell>
        <TableCell><Skeleton animation="wave" /></TableCell>
        <TableCell><Skeleton animation="wave" width={80} /></TableCell>
        <TableCell><Skeleton animation="wave" width={100} /></TableCell>
        <TableCell><Skeleton animation="wave" width={100} /></TableCell>
        <TableCell align="right">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton animation="wave" width={120} height={36} />
          </Box>
        </TableCell>
      </TableRow>
    ))}
  </>
));

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
    currentTab: 0
  });
  
  // Локальное состояние диалогов
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({ name: '', username: '', password: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeSubscriptions: 0, expiredSubscriptions: 0 });
  
  // Оптимизированные обработчики
  
  // Дебаунсированный поиск
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    }, THROTTLE_DELAY),
    []
  );
  
  // Обработчик изменения поискового запроса
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch({ type: 'SET_SEARCH_VALUE', payload: value });
    debouncedSearch(value);
  }, [debouncedSearch]);
  
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
      // Использование кеша
      const cacheKey = `users-${state.searchQuery}-${state.currentTab}`;
      if (apiCache.has(cacheKey) && !isRefreshing) {
        dispatch({ type: 'SET_USERS', payload: apiCache.get(cacheKey) });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_REFRESHING', payload: false });
        return;
      }
      
      // Эмуляция API запроса
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Создаем моковые данные только если они ещё не были созданы
      if (!persistentMockData) {
        persistentMockData = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          username: `user${i + 1}`,
          name: `Пользователь ${i + 1}`,
          subscription: {
            activation_date: i % 3 === 0 ? new Date().toISOString() : null,
            expiration_date: i % 3 === 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            is_active: i % 3 === 0
          }
        }));
      }
      
      // Используем сохраненные данные вместо создания новых каждый раз
      let filteredData = [...persistentMockData];
      
      // Фильтрация по поиску
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filteredData = filteredData.filter(user => 
          user.name.toLowerCase().includes(query) || 
          user.username.toLowerCase().includes(query)
        );
      }
      
      // Фильтрация по вкладке
      if (state.currentTab === 1) {
        filteredData = filteredData.filter(user => user.subscription?.is_active);
      } else if (state.currentTab === 2) {
        filteredData = filteredData.filter(user => !user.subscription?.is_active);
      }
      
      // Кешируем результат
      apiCache.set(cacheKey, filteredData);
      
      // Обновляем статистику из актуальных данных
      setStats({
        totalUsers: persistentMockData.length,
        activeSubscriptions: persistentMockData.filter(user => user.subscription?.is_active).length,
        expiredSubscriptions: persistentMockData.filter(user => !user.subscription?.is_active).length
      });
      
      dispatch({ type: 'SET_USERS', payload: filteredData });
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
  }, [state.currentTab, state.searchQuery]);
  
  // Обработчик редактирования пользователя
  const handleEditUser = useCallback(async () => {
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    
    try {
      // Симуляция API запроса
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (selectedUser) {
        // Обновляем существующего пользователя
        const updatedUsers = state.users.map(user => 
          user.id === selectedUser.id 
            ? { ...user, name: userForm.name, username: userForm.username } 
            : user
        );
        
        dispatch({
          type: 'SET_USERS',
          payload: updatedUsers
        });
        
        // Также обновляем в глобальных данных
        if (persistentMockData) {
          persistentMockData = persistentMockData.map(user => 
            user.id === selectedUser.id 
              ? { ...user, name: userForm.name, username: userForm.username } 
              : user
          );
        }
        
        setSnackbar({
          open: true,
          message: 'Пользователь успешно обновлен',
          severity: 'success'
        });
      } else {
        // Создаем нового пользователя
        const newUser: User = {
          id: Math.max(...state.users.map(u => u.id), 0) + 1,
          name: userForm.name,
          username: userForm.username,
          subscription: {
            activation_date: null,
            expiration_date: null,
            is_active: false
          }
        };
        
        const updatedUsers = [...state.users, newUser];
        
        dispatch({
          type: 'SET_USERS',
          payload: updatedUsers
        });
        
        // Также добавляем в глобальные данные
        if (persistentMockData) {
          persistentMockData = [...persistentMockData, newUser];
        }
        
        setSnackbar({
          open: true,
          message: 'Пользователь успешно создан',
          severity: 'success'
        });
      }
      
      // Очищаем кеш
      apiCache.clear();
      
      handleCloseEditDialog();
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка обновления пользователя',
        severity: 'error'
      });
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [selectedUser, userForm, state.users, handleCloseEditDialog]);
  
  // Обработчик удаления пользователя
  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    
    try {
      // Симуляция API запроса
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const filteredUsers = state.users.filter(user => user.id !== selectedUser.id);
      
      dispatch({
        type: 'SET_USERS',
        payload: filteredUsers
      });
      
      // Также удаляем из глобальных данных
      if (persistentMockData) {
        persistentMockData = persistentMockData.filter(user => user.id !== selectedUser.id);
      }
      
      // Очищаем кеш
      apiCache.clear();
      
      setSnackbar({
        open: true,
        message: 'Пользователь успешно удален',
        severity: 'success'
      });
      
      handleCloseDeleteDialog();
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
  }, [selectedUser, state.users, handleCloseDeleteDialog]);
  
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
      
      if (!isAdmin) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      navigate('/login');
    }
  }, [navigate]);
  
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
  
  // Обновление данных при изменении фильтров
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Проверка авторизации при монтировании
  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);
  
  // Вычисляем пагинированные и отфильтрованные данные
  const visibleUsers = useMemo(() => {
    const start = state.page * state.rowsPerPage;
    const end = start + state.rowsPerPage;
    return state.users.slice(start, end);
  }, [state.users, state.page, state.rowsPerPage]);

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
                    size="small"
                    value={state.searchInputValue}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={state.refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
                      onClick={() => fetchUsers(true)}
                      disabled={state.loading || state.refreshing}
                    >
                      Обновить
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenEditDialog(null)}
                      disabled={state.loading || state.refreshing}
                    >
                      Добавить
                    </Button>
                  </Box>
                </AdminToolbar>
                
                {/* Таблица пользователей */}
                <StyledTableContainer>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width={60}>ID</TableCell>
                        <TableCell>Логин</TableCell>
                        <TableCell>Имя</TableCell>
                        <TableCell width={120}>Статус</TableCell>
                        <TableCell width={120}>Активация</TableCell>
                        <TableCell width={120}>Истечение</TableCell>
                        <TableCell align="right" width={120}>Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {state.loading && state.users.length === 0 ? (
                        <TableLoadingSkeleton />
                      ) : state.users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
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
                    rowsPerPageOptions={[5, 10, 25]}
                    labelRowsPerPage="Строк:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`}
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
        keepMounted={false}
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(2px)',
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
            />
            <TextField
              fullWidth
              label="Логин"
              margin="normal"
              value={userForm.username}
              onChange={handleUserFormChange('username')}
            />
            {!selectedUser && (
              <TextField
                fullWidth
                label="Пароль"
                type="password"
                margin="normal"
                value={userForm.password}
                onChange={handleUserFormChange('password')}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Отмена</Button>
          <Button 
            onClick={handleEditUser}
            variant="contained" 
            disabled={state.actionLoading}
            startIcon={state.actionLoading ? <CircularProgress size={16} /> : null}
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