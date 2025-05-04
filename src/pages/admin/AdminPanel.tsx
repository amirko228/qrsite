import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// Главный компонент админ-панели
const AdminPanel: React.FC = () => {
  // Состояния
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0
  });
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Мемоизированный фильтр пользователей
  useEffect(() => {
    // Используем отложенное выполнение, чтобы не блокировать основной поток
    const timeoutId = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredUsers(users);
        return;
      }
      
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.username.toLowerCase().includes(query) ||
        user.id.toString().includes(query)
      );
      
      setFilteredUsers(filtered);
    }, 50); // небольшая задержка для дебаунсинга
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, users]);

  // Мемоизированные статистические данные
  useEffect(() => {
    const calculateStats = () => {
      const totalUsers = users.length;
      const activeSubscriptions = users.filter(
        user => user.subscription && user.subscription.is_active
      ).length;
      const expiredSubscriptions = users.filter(
        user => user.subscription && !user.subscription.is_active
      ).length;
      
      setStats({
        totalUsers,
        activeSubscriptions,
        expiredSubscriptions
      });
    };
    
    if (users.length > 0) {
      calculateStats();
    }
  }, [users]);

  // Загрузка списка пользователей
  const fetchUsers = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else if (!users.length) { // только показываем полный loading, если пользователей еще нет
        setLoading(true);
      }
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('Попытка загрузки пользователей...');
      
      // Запрос к API - НЕ удаляем префикс '/api', так как он нужен для проксирования
      const response = await axios.get('/api/admin/users', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Добавляем таймаут для запроса
        timeout: 10000
      });

      console.log('Данные пользователей получены:', response.data);
      
      // Используем функциональное обновление состояния для избежания race conditions
      if (response.data && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
        // Не обновляем filteredUsers напрямую - это произойдет автоматически через useEffect
      }
    } catch (error: any) {
      console.error('Ошибка при загрузке пользователей:', error);
      
      if (error.response) {
        console.error('Статус ответа:', error.response.status);
        console.error('Данные ответа:', error.response.data);
        console.error('Заголовки ответа:', error.response.headers);
        console.error('Метод запроса:', error.config?.method);
        console.error('URL запроса:', error.config?.url);
      } else if (error.request) {
        console.error('Запрос был сделан, но ответ не получен', error.request);
      } else {
        console.error('Сообщение об ошибке:', error.message);
      }
      
      // Более конкретное сообщение об ошибке на основе детального разбора
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
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  // Проверка авторизации и загрузка пользователей при монтировании
  useEffect(() => {
    let isMounted = true; // флаг для предотвращения обновления стейта после размонтирования
    
    const checkAdminAuth = async () => {
      try {
        console.log('Проверка авторизации администратора...');
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.log('Токен не найден, перенаправление на страницу входа');
          navigate('/login');
          return;
        }

        const userResponse = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Данные пользователя получены:', userResponse.data);

        if (!userResponse.data.is_admin) {
          console.log('Пользователь не является администратором, перенаправление на социальную страницу');
          navigate('/social');
          return;
        }

        console.log('Пользователь имеет права администратора, загрузка списка пользователей');
        if (isMounted) {
          fetchUsers();
        }
      } catch (error: any) {
        console.error('Ошибка аутентификации:', error);
        
        if (error.response) {
          console.error('Статус ответа:', error.response.status);
          console.error('Данные ответа:', error.response.data);
        }
        
        if (isMounted) {
          navigate('/login');
        }
      }
    };

    checkAdminAuth();
    
    // Функция очистки, которая сработает при размонтировании компонента
    return () => {
      isMounted = false;
    };
  }, [navigate, fetchUsers]);

  // Обработчики пагинации
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Создаем функцию debounce для поиска
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchQuery(value);
      setPage(0);
    }, 300),
    []
  );

  // Обработчик изменения поля поиска  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Обработчики формы
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Открытие диалога создания/редактирования пользователя
  const handleOpenDialog = (user?: User) => {
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
  };

  // Закрытие диалога
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setShowPassword(false);
  };

  // Открытие диалога удаления
  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  // Закрытие диалога удаления
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Создание нового пользователя
  const handleCreateUser = async () => {
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

      if (editMode) {
        // Обновление существующего пользователя
        console.log('Обновление пользователя:', selectedUser?.id, formData);
        await axios.put(`/api/admin/users/${selectedUser?.id}`, formData, {
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
        console.log('Создание нового пользователя:', formData);
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
      fetchUsers(); // Обновляем список пользователей
    } catch (error: any) {
      console.error('Ошибка при создании/обновлении пользователя:', error);
      
      let errorMessage = 'Не удалось создать/обновить пользователя';
      
      if (error.response) {
        console.error('Статус ответа:', error.response.status);
        console.error('Данные ответа:', error.response.data);
        
        if (error.response.data && error.response.data.detail) {
          errorMessage = `Ошибка: ${error.response.data.detail}`;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token || !selectedUser) {
        navigate('/login');
        return;
      }

      console.log('Удаление пользователя:', selectedUser.id);
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
      fetchUsers(); // Обновляем список пользователей
    } catch (error: any) {
      console.error('Ошибка при удалении пользователя:', error);
      
      let errorMessage = 'Не удалось удалить пользователя';
      
      if (error.response) {
        console.error('Статус ответа:', error.response.status);
        console.error('Данные ответа:', error.response.data);
        
        if (error.response.data && error.response.data.detail) {
          errorMessage = `Ошибка: ${error.response.data.detail}`;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Закрытие уведомления
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Переключение видимости пароля
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Копирование текста в буфер обмена
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: 'Скопировано в буфер обмена',
      severity: 'success',
    });
  };

  // Открытие диалога QR-кода
  const handleOpenQRDialog = (user: User) => {
    setQrUser(user);
    setOpenQRDialog(true);
  };

  // Закрытие диалога QR-кода
  const handleCloseQRDialog = () => {
    setOpenQRDialog(false);
  };

  // Получение URL профиля пользователя
  const getProfileUrl = (username: string) => {
    return `${window.location.origin}/profile/${username}`;
  };

  // Форматирование даты
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Не задано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  // Изменение вкладки
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Отображение статистики
  const renderStats = () => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Всего пользователей
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" width="100%" height={40} />
              ) : (
                <Typography variant="h4" component="div" color="primary">
                  {stats.totalUsers}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Активные подписки
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" width="100%" height={40} />
              ) : (
                <Typography variant="h4" component="div" color="success.main">
                  {stats.activeSubscriptions}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Истекшие подписки
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" width="100%" height={40} />
              ) : (
                <Typography variant="h4" component="div" color="error.main">
                  {stats.expiredSubscriptions}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Отображение таблицы пользователей
  const renderUsersTable = () => (
    <Paper sx={{ mt: 2, overflow: 'hidden' }}>
      {(loading || refreshing) && (
        <LinearProgress sx={{ width: '100%' }} />
      )}
      
      <AdminToolbar>
        <TextField
          placeholder="Поиск пользователей..."
          variant="outlined"
          size="small"
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
            startIcon={<RefreshIcon />} 
            variant="outlined" 
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Добавить пользователя
          </Button>
        </Box>
      </AdminToolbar>
      
      <Divider />
      
      <StyledTableContainer>
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
            {loading ? (
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton variant="rectangular" height={40} />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <StyledTableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <Chip
                          label={user.subscription.is_active ? 'Активна' : 'Истекла'}
                          color={user.subscription.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      ) : (
                        <Chip label="Не активирована" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.subscription
                        ? formatDate(user.subscription.expiration_date)
                        : 'Не задано'}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Редактировать">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleOpenDeleteDialog(user)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Показать QR код">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleOpenQRDialog(user)}
                          >
                            <QrCodeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))
            ) : (
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
                      >
                        Попробовать снова
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
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
  );

  // Мемоизируем таблицу пользователей для предотвращения лишних перерендеров
  const usersTable = useMemo(() => renderUsersTable(), [
    loading, 
    refreshing, 
    page, 
    rowsPerPage, 
    filteredUsers,
    handleOpenDialog,
    handleOpenDeleteDialog
  ]);

  // Мемоизируем статистику
  const statsDisplay = useMemo(() => renderStats(), [stats, loading]);

  return (
    <Box>
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
      
      <Container maxWidth="lg" sx={{ mt: 3, mb: 10 }}>
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
          <Box sx={{ py: 2 }}>
            <Typography variant="h5" gutterBottom>
              Обзор системы
            </Typography>
            {statsDisplay}
          </Box>
        )}
        
        {currentTab === 1 && (
          <Box sx={{ py: 2 }}>
            {usersTable}
          </Box>
        )}
      </Container>

      {/* Диалог добавления/редактирования пользователя */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
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
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
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
      <Dialog open={openQRDialog} onClose={handleCloseQRDialog}>
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