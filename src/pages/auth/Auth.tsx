import React, { useState, useEffect } from 'react';
import { Container, Box, Paper, Typography, TextField, Button, Alert, Grid, Link as MuiLink } from '@mui/material';
import { Email, Lock, CheckCircle } from '@mui/icons-material';
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
      const result = await login(username, password);
      
      if (result.success) {
        setSuccess(true);
        // Перенаправление происходит в useEffect выше
      } else {
        setError(result.error || 'Ошибка при входе');
      }
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
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
                    Нет аккаунта? Обратитесь к администратору для получения доступа.
                  </Typography>
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