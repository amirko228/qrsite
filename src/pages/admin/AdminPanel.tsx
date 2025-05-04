import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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

// Функция debounce для оптимизации поиска
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
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
  maxHeight: '400px',
  overflow: 'auto'
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

// Мемоизированный компонент TableRow для предотвращения ненужных ререндеров
const MemoizedTableRow = memo(({ user, onEdit, onDelete, onQR, actionLoading }: {
  user: User,
  onEdit: (user: User) => void,
  onDelete: (user: User) => void,
  onQR: (user: User) => void,
  actionLoading: boolean
}) => (
  <TableRow hover>
    <TableCell>{user.id}</TableCell>
    <TableCell>{user.name}</TableCell>
    <TableCell>{user.username}</TableCell>
    <TableCell>
      <Chip 
        label={
          user.subscription ? 
            (user.subscription.is_active ? "Активна" : "Истекла") : 
            "Не активирована"
        }
        color={
          user.subscription ? 
            (user.subscription.is_active ? "success" : "error") : 
            "default"
        }
        size="small"
      />
    </TableCell>
    <TableCell>
      {user.subscription && typeof user.subscription.expiration_date === 'string' ? 
        new Date(user.subscription.expiration_date).toLocaleDateString() : 
        "-"
      }
    </TableCell>
    <TableCell align="right">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Tooltip title="Редактировать пользователя">
          <IconButton
            size="small"
            color="primary"
            onClick={() => onEdit(user)}
            disabled={actionLoading}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Удалить пользователя">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(user)}
            disabled={actionLoading}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Посмотреть QR код">
          <IconButton
            size="small"
            color="secondary"
            onClick={() => onQR(user)}
            disabled={actionLoading}
          >
            <QrCodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </TableCell>
  </TableRow>
));

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
  // Состояния
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState(''); // Новое состояние для контроля ввода
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0); // Добавляем время последнего запроса
  const [fetchCounter, setFetchCounter] = useState(0); // Счетчик для контроля перезапросов
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Оптимизированная функция загрузки пользователей с защитой от дребезга
  const fetchUsers = useCallback(async (showRefreshing = false) => {
    // Защита от слишком частых вызовов (не чаще раза в 2 секунды)
    const now = Date.now();
    if (now - lastFetchTime < 2000 && !showRefreshing) {
      console.log('Запрос отклонен: слишком частые обращения к API');
      return;
    }
    
    // Предотвращаем множественные вызовы функции
    if (loading || refreshing) {
      console.log('Запрос отклонен: загрузка уже идет');
      return;
    }
    
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setLastFetchTime(now);
      setFetchCounter(prev => prev + 1);
      const currentFetchId = fetchCounter + 1;
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('Загрузка пользователей...');
      
      const response = await axios.get('/api/admin/users', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        params: { _t: now } // Предотвращение кэширования
      });

      // Проверяем, что это самый последний запрос
      if (currentFetchId !== fetchCounter) {
        console.log('Запрос устарел, игнорируем результаты');
        return;
      }

      console.log('Данные пользователей получены');
      
      // Используем функциональное обновление состояния
      setUsers(prevUsers => {
        // Сортируем пользователей для предотвращения перестановок
        const newUsers = [...response.data].sort((a, b) => a.id - b.id);
        return JSON.stringify(prevUsers) !== JSON.stringify(newUsers) ? newUsers : prevUsers;
      });
    } catch (error: any) {
      console.error('Ошибка при загрузке пользователей:', error);
      
      let errorMessage = 'Не удалось загрузить список пользователей';
      
      if (error.response && error.response.status === 404) {
        errorMessage = 'Список пользователей недоступен: API эндпоинт не найден';
      } else if (error.response && error.response.status === 403) {
        errorMessage = 'Недостаточно прав для доступа к списку пользователей';
      } else if (error.response && error.response.status === 401) {
        errorMessage = 'Ошибка авторизации. Пожалуйста, войдите снова';
        localStorage.removeItem('accessToken');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Превышено время ожидания ответа от сервера';
      } else if (!error.response) {
        errorMessage = 'Сервер недоступен. Проверьте подключение к интернету или работу бэкенда';
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      // Используем setTimeout для обеспечения плавных переходов
      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 300);
    }
  }, [navigate, loading, refreshing, lastFetchTime, fetchCounter]);

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
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Оптимизированный обработчик поиска
  const debouncedSearch = useMemo(() => 
    debounce((value: string) => {
      setSearchQuery(value);
      setPage(0);
    }, 300),
    []
  );

  // Обработчик изменения поля поиска - контролируемый ввод для улучшения UX
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInputValue(value); // Мгновенное обновление поля ввода
    debouncedSearch(value); // Отложенное обновление запроса
  }, [debouncedSearch]);

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
      setActionLoading(true);
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
        setActionLoading(false);
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
      setActionLoading(false);
    }
  }, [formData, editMode, selectedUser, navigate, handleCloseDialog, fetchUsers]);

  // Удаление пользователя
  const handleDeleteUser = useCallback(async () => {
    try {
      setActionLoading(true);
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
      setActionLoading(false);
    }
  }, [selectedUser, navigate, handleCloseDeleteDialog, fetchUsers]);

  // Получение URL профиля пользователя
  const getProfileUrl = useCallback((username: string) => {
    return `${window.location.origin}/profile/${username}`;
  }, []);

  // Изменение вкладки
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
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

  // Мемоизированная фильтрация пользователей
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.username.toLowerCase().includes(query) ||
      user.id.toString().includes(query)
    );
  }, [searchQuery, users]);

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
  const UsersTable = useMemo(() => (
    <Paper sx={{ mt: 2, overflow: 'hidden' }} elevation={2}>
      {(loading || refreshing) && (
        <LinearProgress 
          sx={{ 
            width: '100%', 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            zIndex: 2 
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
            Добавить пользователя
          </Button>
        </Box>
      </AdminToolbar>
      
      <Divider />
      
      <StyledTableContainer
        sx={{
          height: 'calc(100vh - 300px)',
          maxHeight: 500,
          position: 'relative'
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Имя</TableCell>
              <TableCell>Логин</TableCell>
              <TableCell>Статус подписки</TableCell>
              <TableCell>Дата окончания</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderUserRows()}
          </TableBody>
        </Table>
      </StyledTableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Строк на странице:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`}
      />
    </Paper>
  ), [
    loading, 
    refreshing, 
    searchInputValue,
    handleSearchChange, 
    fetchUsers, 
    handleOpenDialog, 
    renderUserRows, 
    filteredUsers, 
    rowsPerPage, 
    page, 
    handleChangePage, 
    handleChangeRowsPerPage
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <AdminIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Панель администратора
          </Typography>
          <Button color="inherit" onClick={() => navigate('/social')}>
            Выйти из админ-панели
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 3, mb: 10, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab label="Обзор" icon={<PersonIcon />} iconPosition="start" />
            <Tab label="Пользователи" icon={<AdminIcon />} iconPosition="start" />
          </Tabs>
        </Box>
      
        {currentTab === 0 && (
          <Box sx={{ py: 2, flexGrow: 1 }}>
            <Typography variant="h5" gutterBottom>
              Обзор системы
            </Typography>
            {StatsComponent}
          </Box>
        )}
        
        {currentTab === 1 && (
          <Box sx={{ py: 2, flexGrow: 1 }}>
            {UsersTable}
          </Box>
        )}
      </Container>

      {/* Диалог добавления/редактирования пользователя */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        keepMounted={false}
      >
        <DialogTitle>
          {editMode ? 'Редактировать пользователя' : 'Добавить пользователя'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Имя пользователя"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            disabled={actionLoading}
          />
          <TextField
            margin="dense"
            name="username"
            label="Логин"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.username}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            disabled={actionLoading}
          />
          <TextField
            margin="dense"
            name="password"
            label={editMode ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={handleInputChange}
            disabled={actionLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end" disabled={actionLoading}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={actionLoading}>Отмена</Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {editMode ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={handleCloseDeleteDialog}
        keepMounted={false}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить пользователя "{selectedUser?.name}"? 
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={actionLoading}>Отмена</Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : null}
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
      >
        <DialogTitle>QR-код профиля</DialogTitle>
        <DialogContent>
          {qrUser && (
            <QRCodeContainer>
              <QRCode value={getProfileUrl(qrUser.username)} size={200} />
              <Typography variant="body2" sx={{ mt: 2 }}>
                {getProfileUrl(qrUser.username)}
              </Typography>
              <Button
                startIcon={<ContentCopyIcon />}
                onClick={() => copyToClipboard(getProfileUrl(qrUser.username))}
                sx={{ mt: 1 }}
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

export default AdminPanel; 