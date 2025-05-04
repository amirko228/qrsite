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

// Добавим константы для оптимизации рендеринга
const TRANSITION_TIMEOUT = 300; // мс для плавных переходов
const TABLE_HEIGHT = 'calc(100vh - 300px)'; // фиксированная высота таблицы
const TABLE_MIN_HEIGHT = 400; // минимальная высота таблицы в пикселях
const FETCH_THROTTLE = 2000; // мс между запросами к API

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

// Правильная функция сравнения компонента для оптимизации перерисовок
const areTableRowsEqual = (
  prevProps: { 
    user: User; 
    onEdit: (user: User) => void; 
    onDelete: (user: User) => void; 
    onQR: (user: User) => void; 
    actionLoading: boolean;
  },
  nextProps: {
    user: User; 
    onEdit: (user: User) => void; 
    onDelete: (user: User) => void; 
    onQR: (user: User) => void; 
    actionLoading: boolean;
  }
): boolean => {
  return (
    prevProps.user.id === nextProps.user.id &&
    prevProps.user.username === nextProps.user.username &&
    prevProps.user.name === nextProps.user.name &&
    prevProps.actionLoading === nextProps.actionLoading &&
    JSON.stringify(prevProps.user.subscription) === JSON.stringify(nextProps.user.subscription)
  );
};

// Оптимизированный компонент для строк таблицы
const MemoizedTableRow = memo(({ user, onEdit, onDelete, onQR, actionLoading }: {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onQR: (user: User) => void;
  actionLoading: boolean;
}) => {
  // Мемоизируем обработчики для предотвращения ненужных ререндеров
  const handleEdit = useCallback(() => onEdit(user), [user, onEdit]);
  const handleDelete = useCallback(() => onDelete(user), [user, onDelete]);
  const handleQR = useCallback(() => onQR(user), [user, onQR]);

  return (
    <StyledTableRow>
      <TableCell>{user.id}</TableCell>
      <TableCell>{user.username}</TableCell>
      <TableCell>{user.name}</TableCell>
      <TableCell>
        {user.subscription && user.subscription.is_active 
          ? <Chip label="Активна" color="success" size="small" />
          : <Chip label="Не активна" color="error" size="small" />
        }
      </TableCell>
      <TableCell>
        {user.subscription ? new Date(user.subscription.activation_date || '').toLocaleDateString() : 'N/A'}
      </TableCell>
      <TableCell>
        {user.subscription ? new Date(user.subscription.expiration_date || '').toLocaleDateString() : 'N/A'}
      </TableCell>
      <TableCell align="right">
        <IconButton 
          size="small" 
          onClick={handleEdit} 
          disabled={actionLoading}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={handleDelete} 
          disabled={actionLoading}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={handleQR} 
          disabled={actionLoading}
        >
          <QrCodeIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </StyledTableRow>
  );
}, areTableRowsEqual);

// Мемоизированный компонент для статистики
const StatCard = memo(({ title, value, color, loading }: {
  title: string,
  value: number,
  color: string,
  loading: boolean
}) => (
  <Card>
    <CardContent>
      <Typography variant="h6" component="div" gutterBottom>
        {title}
      </Typography>
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={40} />
      ) : (
        <Typography variant="h4" component="div" color={color}>
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
));

// Главный компонент админ-панели
const AdminPanel: React.FC = () => {
  // Оптимизация: используем useRef для хранения данных, которые не должны вызывать ререндер
  const apiCallsRef = useRef({
    lastFetchTime: 0,
    fetchCounter: 0,
    isMounted: true,
    abortController: new AbortController()
  });
  
  // Определяем интерфейс состояния для типизации reducer
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
  
  // Определяем типы действий для reducer
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
  
  // Используем useReducer вместо множества useState для более оптимизированных обновлений
  const [state, dispatch] = useReducer((state: AdminPanelState, action: AdminPanelAction): AdminPanelState => {
    switch(action.type) {
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
        return { ...state, currentTab: action.payload };
      default:
        return state;
    }
  }, {
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
  
  const { loading, refreshing, users, actionLoading, searchQuery, 
          searchInputValue, page, rowsPerPage, currentTab } = state;
          
  // Сохраняем состояние для диалогов
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    username: '',
    password: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [qrUser, setQrUser] = useState<User | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Оптимизированная функция загрузки пользователей
  const fetchUsers = useCallback(async (showRefreshing = false) => {
    // Отменяем предыдущий запрос для предотвращения гонок условий
    apiCallsRef.current.abortController.abort();
    apiCallsRef.current.abortController = new AbortController();
    
    // Защита от слишком частых вызовов
    const now = Date.now();
    if (now - apiCallsRef.current.lastFetchTime < FETCH_THROTTLE && !showRefreshing) {
      return;
    }
    
    if (loading || refreshing) {
      return;
    }
    
    try {
      if (showRefreshing) {
        dispatch({ type: 'SET_REFRESHING', payload: true });
      } else {
        dispatch({ type: 'SET_LOADING', payload: true });
      }
      
      apiCallsRef.current.lastFetchTime = now;
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('/api/admin/users', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        signal: apiCallsRef.current.abortController.signal,
        params: { _t: now }
      });
      
      if (!apiCallsRef.current.isMounted) return;
      
      // Используем Promise.resolve() для обработки в микрозадаче 
      Promise.resolve().then(() => {
        if (!apiCallsRef.current.isMounted) return;
        
        try {
          const sortedUsers = [...response.data].sort((a, b) => a.id - b.id);
          
          // Более эффективное сравнение без stringify всего массива
          const usersChanged = users.length !== sortedUsers.length || 
            sortedUsers.some((user, index) => !users[index] || users[index].id !== user.id);
          
          if (usersChanged) {
            dispatch({ type: 'SET_USERS', payload: sortedUsers });
          }
          
          // Задержка для плавного скрытия индикаторов загрузки
          setTimeout(() => {
            if (apiCallsRef.current.isMounted) {
              dispatch({ type: 'SET_LOADING', payload: false });
              dispatch({ type: 'SET_REFRESHING', payload: false });
            }
          }, 100); 
        } catch (err) {
          console.error('Ошибка при обработке данных:', err);
          if (apiCallsRef.current.isMounted) {
            dispatch({ type: 'SET_LOADING', payload: false });
            dispatch({ type: 'SET_REFRESHING', payload: false });
          }
        }
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      
      console.error('Ошибка при загрузке пользователей:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        navigate('/login');
      }
      
      setSnackbar({
        open: true,
        message: 'Не удалось загрузить список пользователей',
        severity: 'error',
      });
      
      setTimeout(() => {
        if (apiCallsRef.current.isMounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_REFRESHING', payload: false });
        }
      }, 100);
    }
  }, [navigate, users, loading, refreshing]);

  // Проверка авторизации и загрузка пользователей при монтировании
  useEffect(() => {
    let mounted = true;
    
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }

        // Проверяем авторизацию, добавляем параметр для предотвращения кэширования
        const userResponse = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
          params: { _t: Date.now() }
        });

        if (!userResponse.data.is_admin) {
          navigate('/social');
          return;
        }

        if (mounted) {
          fetchUsers();
        }
      } catch (error: any) {
        console.error('Ошибка аутентификации:', error);
        navigate('/login');
      }
    };

    checkAdminAuth();
    
    // Очистка при размонтировании
    return () => {
      mounted = false;
    };
  }, [navigate, fetchUsers]);

  // Обработчики пагинации с оптимизацией
  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    dispatch({ type: 'SET_PAGE', payload: newPage });
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_ROWS_PER_PAGE', payload: parseInt(event.target.value, 10) });
    dispatch({ type: 'SET_PAGE', payload: 0 });
  }, []);

  // Оптимизированный обработчик поиска
  const debouncedSearch = useMemo(() => 
    debounce((value: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: value });
      dispatch({ type: 'SET_PAGE', payload: 0 });
    }, 300),
    []
  );

  // Мемоизация всех фильтрованных данных для предотвращения ненужных вычислений
  const filteredUsers = useMemo(() => {
    if (!state.searchQuery.trim()) {
      return state.users;
    }
    
    const query = state.searchQuery.toLowerCase();
    return state.users.filter(user => 
      user.username.toLowerCase().includes(query) || 
      user.name.toLowerCase().includes(query) ||
      user.id.toString().includes(query)
    );
  }, [state.searchQuery, state.users]);

  // Мемоизация отображаемых данных для текущей страницы
  const paginatedUsers = useMemo(() => {
    const startIndex = state.page * state.rowsPerPage;
    return filteredUsers.slice(startIndex, startIndex + state.rowsPerPage);
  }, [filteredUsers, state.page, state.rowsPerPage]);

  // Обработчики формы
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Открытие диалога создания/редактирования пользователя
  const handleOpenDialog = useCallback((user?: User) => {
    if (user) {
      setFormData({
        name: user.name,
        username: user.username,
        password: '', // Не заполняем пароль при редактировании
      });
      setSelectedUser(user);
      setEditMode(true);
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
      });
      setSelectedUser(null);
      setEditMode(false);
    }
    setOpenDialog(true);
  }, []);

  // Закрытие диалога
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setShowPassword(false);
  }, []);

  // Открытие диалога удаления
  const handleOpenDeleteDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  }, []);

  // Закрытие диалога удаления
  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
  }, []);

  // Переключение видимости пароля
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Копирование текста в буфер обмена
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: 'Скопировано в буфер обмена',
      severity: 'success',
    });
  }, []);

  // Открытие диалога QR-кода
  const handleOpenQRDialog = useCallback((user: User) => {
    setQrUser(user);
    setOpenQRDialog(true);
  }, []);

  // Закрытие диалога QR-кода
  const handleCloseQRDialog = useCallback(() => {
    setOpenQRDialog(false);
  }, []);

  // Закрытие уведомления
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Создание нового пользователя
  const handleCreateUser = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ACTION_LOADING', payload: true });
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Валидация данных формы
      if (!formData.name || !formData.username || (!editMode && !formData.password)) {
        setSnackbar({
          open: true,
          message: 'Пожалуйста, заполните все поля',
          severity: 'error',
        });
        dispatch({ type: 'SET_ACTION_LOADING', payload: false });
        return;
      }

      if (editMode && selectedUser) {
        // Обновление существующего пользователя
        await axios.put(`/api/admin/users/${selectedUser.id}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setSnackbar({
          open: true,
          message: 'Пользователь успешно обновлен',
          severity: 'success',
        });
      } else {
        // Создание нового пользователя
        await axios.post('/api/admin/users', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setSnackbar({
          open: true,
          message: 'Пользователь успешно создан',
          severity: 'success',
        });
      }

      handleCloseDialog();
      // Небольшая задержка перед обновлением списка для улучшения UX
      setTimeout(() => fetchUsers(true), 300);
    } catch (error: any) {
      console.error('Ошибка при создании/обновлении пользователя:', error);
      
      let errorMessage = 'Не удалось создать/обновить пользователя';
      
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = `Ошибка: ${error.response.data.detail}`;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [formData, editMode, selectedUser, navigate, handleCloseDialog, fetchUsers]);

  // Удаление пользователя
  const handleDeleteUser = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ACTION_LOADING', payload: true });
      const token = localStorage.getItem('accessToken');
      if (!token || !selectedUser) {
        navigate('/login');
        return;
      }

      await axios.delete(`/api/admin/users/${selectedUser.id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSnackbar({
        open: true,
        message: 'Пользователь успешно удален',
        severity: 'success',
      });

      handleCloseDeleteDialog();
      // Небольшая задержка перед обновлением списка
      setTimeout(() => fetchUsers(true), 300);
    } catch (error: any) {
      console.error('Ошибка при удалении пользователя:', error);
      
      let errorMessage = 'Не удалось удалить пользователя';
      
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = `Ошибка: ${error.response.data.detail}`;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [selectedUser, navigate, handleCloseDeleteDialog, fetchUsers]);

  // Получение URL профиля пользователя
  const getProfileUrl = useCallback((username: string) => {
    return `${window.location.origin}/profile/${username}`;
  }, []);

  // Изменение вкладки
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    dispatch({ type: 'SET_CURRENT_TAB', payload: newValue });
  }, []);

  // Мемоизированная статистика
  const statistics = useMemo(() => {
    const totalUsers = users.length;
    const activeSubscriptions = users.filter(
      user => user.subscription && user.subscription.is_active
    ).length;
    const expiredSubscriptions = users.filter(
      user => user.subscription && !user.subscription.is_active
    ).length;
    
    return {
      totalUsers,
      activeSubscriptions,
      expiredSubscriptions
    };
  }, [users]);

  // Обработчики событий для связывания с мемоизированными компонентами
  const handleEditUser = useCallback((user: User) => {
    handleOpenDialog(user);
  }, [handleOpenDialog]);

  const handleDeleteUserClick = useCallback((user: User) => {
    handleOpenDeleteDialog(user);
  }, [handleOpenDeleteDialog]);

  const handleShowQR = useCallback((user: User) => {
    handleOpenQRDialog(user);
  }, [handleOpenQRDialog]);

  // Отрисовка строк пользователей с виртуализацией для предотвращения лагов
  const renderUserRows = useCallback(() => {
    if (loading) {
      return Array.from(new Array(5)).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell colSpan={6}>
            <Skeleton variant="rectangular" height={40} animation="wave" />
          </TableCell>
        </TableRow>
      ));
    }
    
    if (filteredUsers.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} align="center">
            <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" color="textSecondary">
                {searchQuery ? "Пользователи не найдены" : "Не удалось загрузить список пользователей"}
              </Typography>
              {!searchQuery && !loading && (
                <Button 
                  variant="outlined"
                  startIcon={<RefreshIcon />} 
                  onClick={() => fetchUsers()}
                  disabled={loading || refreshing}
                >
                  Попробовать снова
                </Button>
              )}
            </Box>
          </TableCell>
        </TableRow>
      );
    }
    
    // Используем только видимые строки для оптимизации
    return filteredUsers
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .map((user) => (
        <MemoizedTableRow 
          key={user.id} 
          user={user} 
          onEdit={handleEditUser}
          onDelete={handleDeleteUserClick}
          onQR={handleShowQR}
          actionLoading={actionLoading}
        />
      ));
  }, [
    loading, 
    filteredUsers, 
    searchQuery, 
    page, 
    rowsPerPage, 
    handleEditUser, 
    handleDeleteUserClick, 
    handleShowQR, 
    actionLoading,
    fetchUsers,
    refreshing
  ]);

  // Мемоизированная таблица пользователей
  const UsersTable = useMemo(() => {
    // ИСПРАВЛЕНИЕ: используем filteredUsers вместо повторной фильтрации
    const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    
    return (
      <Paper 
        sx={{ 
          mt: 2, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          willChange: 'transform',
          transform: 'translateZ(0)',
          isolation: 'isolate'
        }} 
        elevation={2}
      >
        {(loading || refreshing) && (
          <LinearProgress 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              height: '3px',
            }} 
          />
        )}
        
        <AdminToolbar>
          <TextField
            placeholder="Поиск пользователей..."
            variant="outlined"
            size="small"
            value={searchInputValue}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: '100%', width: 300, flexGrow: 1 }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              startIcon={refreshing ? <CircularProgress size={18} /> : <RefreshIcon />} 
              variant="outlined" 
              onClick={() => fetchUsers(true)}
              disabled={refreshing || loading}
            >
              Обновить
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={loading || refreshing}
            >
              Добавить
            </Button>
          </Box>
        </AdminToolbar>
        
        <Divider />
        
        <StyledTableContainer
          sx={{
            height: 'calc(100vh - 300px)',
            maxHeight: 500,
            opacity: loading ? 0.7 : 1
          }}
        >
          <Table 
            stickyHeader 
            size="small" 
            sx={{ tableLayout: 'fixed', width: '100%' }}
          >
            <TableHead>
              <TableRow>
                <TableCell width={80}>ID</TableCell>
                <TableCell width="25%">Имя</TableCell>
                <TableCell width="25%">Логин</TableCell>
                <TableCell width="15%">Статус</TableCell>
                <TableCell width="15%">Окончание</TableCell>
                <TableCell width={120} align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && paginatedUsers.length === 0 ? (
                Array.from(new Array(3)).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell colSpan={6}>
                      <Skeleton variant="rectangular" height={40} animation="wave" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body1" color="textSecondary">
                        {searchQuery ? "Пользователи не найдены" : "Список пользователей пуст"}
                      </Typography>
                      {!searchQuery && (
                        <Button 
                          variant="outlined"
                          startIcon={<RefreshIcon />} 
                          onClick={() => fetchUsers(true)}
                          disabled={loading || refreshing}
                        >
                          Обновить
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                // Используем memo-компоненты для строк таблицы
                paginatedUsers.map((user) => (
                  <MemoizedTableRow 
                    key={user.id} 
                    user={user} 
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUserClick}
                    onQR={handleShowQR}
                    actionLoading={actionLoading}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </StyledTableContainer>
        
        {filteredUsers.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length} 
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Строк:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          />
        )}
      </Paper>
    );
  }, [
    loading, 
    refreshing, 
    searchInputValue,
    handleSearchChange, 
    fetchUsers, 
    handleOpenDialog, 
    filteredUsers, // Используем существующий filteredUsers
    rowsPerPage, 
    page, 
    handleChangePage, 
    handleChangeRowsPerPage,
    handleEditUser,
    handleDeleteUserClick,
    handleShowQR,
    actionLoading,
    searchQuery // Нужен для условного отображения сообщения
  ]);

  // Мемоизированная статистика
  const StatsComponent = useMemo(() => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Всего пользователей"
            value={statistics.totalUsers}
            color="primary.main"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Активные подписки"
            value={statistics.activeSubscriptions}
            color="success.main"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Истекшие подписки"
            value={statistics.expiredSubscriptions}
            color="error.main"
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  ), [statistics, loading]);

  // Добавляем эффект для отписки от запросов при размонтировании
  useEffect(() => {
    apiCallsRef.current.isMounted = true;
    
    // Важно: предварительно загружаем таблицу только один раз при монтировании
    const timer = setTimeout(() => {
      if (apiCallsRef.current.isMounted) {
        fetchUsers();
      }
    }, 50);
    
    return () => {
      apiCallsRef.current.isMounted = false;
      apiCallsRef.current.abortController.abort();
      clearTimeout(timer);
      // Очищаем все возможные таймеры при размонтировании
      const highestId = window.setTimeout(() => {}, 0);
      for (let i = highestId; i >= 0; i--) {
        window.clearTimeout(i);
      }
    };
  }, [fetchUsers]);

  // Добавляем оптимизацию для отображения скелетонов загрузки
  const TableSkeletons = memo(() => (
    <>
      {Array.from(new Array(TABLE_SKELETON_COUNT)).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell align="right">
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Skeleton animation="wave" width={24} height={24} sx={{ mx: 0.5 }} />
              <Skeleton animation="wave" width={24} height={24} sx={{ mx: 0.5 }} />
              <Skeleton animation="wave" width={24} height={24} sx={{ mx: 0.5 }} />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </>
  ));

  // Улучшаем функции для производительности
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_VALUE', payload: e.target.value });
  }, []);

  const debouncedSearch = useMemo(() => debounce((value: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: value });
    dispatch({ type: 'SET_PAGE', payload: 0 });
  }, THROTTLE_DELAY), []);

  // Улучшенный эффект для обработки поиска
  useEffect(() => {
    debouncedSearch(state.searchInputValue);
  }, [state.searchInputValue, debouncedSearch]);

  // Обновленная структура отрисовки с оптимизациями
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
            value={currentTab} 
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
            overflow: 'hidden',
            // Предотвращаем shift контента при загрузке
            minHeight: 400,
          }}
        >
          {currentTab === 0 ? (
            <Box sx={{ py: 2, flex: 1 }}>
              <Typography variant="h5" gutterBottom>
                Обзор системы
              </Typography>
              {StatsComponent}
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
              {UsersTable}
            </Box>
          )}
        </Box>
      </Container>

      {/* Диалог добавления/редактирования пользователя */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        keepMounted={false}
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(2px)',
          }
        }}
      >
        {/* ... existing dialog code ... */}
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
        {/* ... existing dialog code ... */}
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
        {/* ... existing dialog code ... */}
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