import React, { useState, useEffect } from 'react';
import { Container, Box, Paper, Typography, TextField, Button, Alert, Grid, Link as MuiLink, InputAdornment, IconButton } from '@mui/material';
import { Email, Lock, CheckCircle, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const AuthWrapper = styled(Box)(({ theme }) => ({
  minHeight: 'calc(100vh - 120px)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const AuthCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 500,
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
}));

const SuccessBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
}));

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Проверяем доступность localStorage при монтировании компонента
  useEffect(() => {
    try {
      // Проверяем, доступен ли localStorage
      localStorage.setItem('auth_test', 'test');
      if (localStorage.getItem('auth_test') !== 'test') {
        setError('Проблема доступа к локальному хранилищу. Возможно, оно отключено или заполнено.');
      } else {
        localStorage.removeItem('auth_test');
      }
      
      // Проверяем наличие предустановленных пользователей в localStorage
      const adminPanelData = localStorage.getItem('adminPanelData');
      const users = adminPanelData ? JSON.parse(adminPanelData) : [];
      const usersInfo = {
        total: users.length,
        admin: users.some((u: any) => u.username === 'admin'),
        user: users.some((u: any) => u.username === 'user'),
        test: users.some((u: any) => u.username === 'test')
      };
      console.log('Проверка пользователей в хранилище:', usersInfo);
      
      // Если нет пользователей, показываем подсказку
      if (users.length === 0) {
        console.info('Используйте для входа логин/пароль: admin/admin, user/user или test/test');
      }
      
    } catch (e) {
      console.error('Ошибка при проверке localStorage:', e);
      setError('Проблема с локальным хранилищем. Проверьте настройки браузера.');
    }
  }, []);

  // Перенаправляем на нужную страницу, если уже авторизован
  useEffect(() => {
    if (isLoggedIn && user) {
      // Жесткая проверка статуса администратора (должно быть строго true)
      const isAdmin = user.is_admin === true;
      
      // Принудительно отправляем обычных пользователей только на /social,
      // а админов только на /admin
      const targetPath = isAdmin ? '/admin' : '/social';
      
      // Логгируем для отладки
      console.log('Перенаправление после авторизации:', {
        username: user.username,
        isAdmin,
        targetPath,
        userObject: user
      });
      
      // Альтернативный путь из истории используем только если он 
      // соответствует уровню прав пользователя
      let from = location.state?.from?.pathname;
      
      // Проверяем, что путь соответствует уровню доступа
      if (from) {
        const isAdminPath = from.startsWith('/admin');
        
        // Если пытаемся перейти в админку, но не админ - отменяем
        if (isAdminPath && !isAdmin) {
          from = targetPath;
          console.log('Отмена перехода в админку для обычного пользователя');
        }
        
        // Если обычный путь - используем targetPath по умолчанию
        if (!from.startsWith('/admin') && !from.startsWith('/social')) {
          from = targetPath;
        }
      } else {
        from = targetPath;
      }
      
      console.log(`Итоговое перенаправление на: ${from}`);
      
      // Небольшая задержка для обновления состояния
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
  }, [isLoggedIn, navigate, user, location]);

  const validateUsername = (username: string) => {
    return username.trim().length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Валидация
    if (!username || !password) {
      setError('Пожалуйста, заполните все поля');
      setIsLoading(false);
      return;
    }

    if (!validateUsername(username)) {
      setError('Пожалуйста, введите корректный логин');
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Попытка входа с логином: "${username}"`);
      
      // Проверка наличия пользователя test в локальном хранилище
      if (username === 'test') {
        const adminPanelData = localStorage.getItem('adminPanelData');
        const users = adminPanelData ? JSON.parse(adminPanelData) : [];
        const testUser = users.find((u: any) => u.username === 'test');
        
        console.log('Проверка пользователя test в хранилище:', {
          found: !!testUser,
          totalUsers: users.length,
          storage: !!adminPanelData
        });
      }
      
      const result = await login(username, password);
      
      console.log('Результат авторизации:', {
        success: result.success,
        error: result.error || 'нет ошибок'
      });
      
      if (result.success) {
        setSuccess(true);
        // Перенаправление происходит в useEffect выше
      } else {
        setError(result.error || 'Ошибка при входе');
      }
    } catch (error: any) {
      console.error('Ошибка при авторизации:', error);
      setError(error.message || 'Произошла неизвестная ошибка при авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthWrapper>
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AuthCard>
            {!success ? (
              <>
                <Typography variant="h4" align="center" gutterBottom>
                  Вход в аккаунт
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 4 }}>
                  Войдите в свой аккаунт для доступа к профилю
                </Typography>

                {/* Информационный баннер */}
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">Тестовые учетные записи:</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                    <Typography variant="body2"><b>Админ:</b> admin / admin</Typography>
                    <Typography variant="body2"><b>Пользователь:</b> user / user</Typography>
                    <Typography variant="body2"><b>Тест:</b> test / test</Typography>
                  </Box>
                </Alert>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" component="label" htmlFor="username" gutterBottom>
                      Логин
                    </Typography>
                  <TextField
                    fullWidth
                      id="username"
                    variant="outlined"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    InputProps={{
                        startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" component="label" htmlFor="password" gutterBottom>
                      Пароль
                    </Typography>
                  <TextField
                    fullWidth
                      id="password"
                    variant="outlined"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 3 }}>
                    <MuiLink component={Link} to="/forgot-password" underline="hover">
                      Забыли пароль?
                    </MuiLink>
                  </Box>

                  <Button 
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={isLoading}
                    sx={{ mb: 3 }}
                  >
                    {isLoading ? 'Вход...' : 'Войти'}
                  </Button>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Нет аккаунта? Используйте: admin/admin, user/user или test/test
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button 
                    size="small" 
                    color="warning" 
                    variant="outlined"
                    onClick={() => {
                      // Сбрасываем данные пользователей в localStorage
                      localStorage.removeItem('adminPanelData');
                      localStorage.removeItem('users');
                      localStorage.removeItem('accessToken');
                      
                      // Перезагружаем страницу для повторной инициализации
                      alert('Данные пользователей сброшены. Страница будет перезагружена.');
                      window.location.reload();
                    }}
                  >
                    Сбросить хранилище
                  </Button>
                </Box>
              </>
            ) : (
              <SuccessBox>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <CheckCircle color="success" sx={{ fontSize: 80 }} />
                </motion.div>
                <Typography variant="h5" sx={{ mt: 3 }}>
                  Вы успешно вошли!
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Перенаправляем вас в ваш профиль...
                </Typography>
              </SuccessBox>
            )}
          </AuthCard>
        </motion.div>
      </Container>
    </AuthWrapper>
  );
};

export default Auth; 