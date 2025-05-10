import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Divider, 
  Alert, 
  IconButton, 
  Tab, 
  Tabs, 
  CircularProgress 
} from '@mui/material';
import { Save, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Стилизованные компоненты
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(3),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
}));

const ProfileSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  
  // Состояния для формы смены пароля
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Состояния для проверки входных данных
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Обработчик смены вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Обработчик смены пароля
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Сбрасываем состояния ошибок и успеха
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setError('');
    setSuccess('');
    
    // Проверяем текущий пароль
    if (!currentPassword) {
      setCurrentPasswordError('Введите текущий пароль');
      return;
    }
    
    // Проверяем новый пароль
    if (!newPassword) {
      setNewPasswordError('Введите новый пароль');
      return;
    }
    
    if (newPassword.length < 6) {
      setNewPasswordError('Пароль должен содержать минимум 6 символов');
      return;
    }
    
    // Проверяем подтверждение пароля
    if (!confirmPassword) {
      setConfirmPasswordError('Подтвердите новый пароль');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Пароли не совпадают');
      return;
    }
    
    setLoading(true);
    
    try {
      // В реальном приложении здесь будет запрос к API
      // Имитируем запрос с задержкой
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Получаем текущих пользователей из localStorage
      let storedUsers = localStorage.getItem('users');
      
      // Проверяем существование списка пользователей
      if (!storedUsers) {
        // Создаем список с текущим пользователем, если пользователей нет
        const adminPanelData = localStorage.getItem('adminPanelData');
        
        if (adminPanelData) {
          // Используем данные из adminPanelData, если они есть
          localStorage.setItem('users', adminPanelData);
          storedUsers = adminPanelData;
        } else {
          // Создаем запись для текущего пользователя
          const defaultUsers = [{
            id: user?.id,
            username: user?.username,
            name: user?.name,
            password: currentPassword
          }];
          localStorage.setItem('users', JSON.stringify(defaultUsers));
          storedUsers = JSON.stringify(defaultUsers);
        }
      }
      
      const users = JSON.parse(storedUsers);
      
      // Находим текущего пользователя
      let currentUser = users.find((u: any) => u.id === user?.id);
      if (!currentUser) {
        // Если пользователь не найден, добавляем его
        const newUser = {
          id: user?.id,
          username: user?.username,
          name: user?.name,
          password: currentPassword
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Устанавливаем текущего пользователя
        currentUser = newUser;
      }
      
      // Проверяем текущий пароль
      if (currentUser.password !== currentPassword) {
        setCurrentPasswordError('Неверный текущий пароль');
        throw new Error('Неверный текущий пароль');
      }
      
      // Обновляем пароль пользователя
      currentUser.password = newPassword;
      
      // Сохраняем обновленный список пользователей
      localStorage.setItem('users', JSON.stringify(users));
      // Также обновляем adminPanelData для синхронизации пароля
      const adminPanelData = localStorage.getItem('adminPanelData');
      if (adminPanelData) {
        const adminUsers = JSON.parse(adminPanelData);
        const adminUser = adminUsers.find((u: any) => u.id === user?.id);
        if (adminUser) {
          adminUser.password = newPassword;
          localStorage.setItem('adminPanelData', JSON.stringify(adminUsers));
        }
      }
      
      // Успешно обновили пароль
      setSuccess('Пароль успешно изменен');
      
      // Сбрасываем поля формы
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (!currentPasswordError) {
        setError(err.message || 'Произошла ошибка при смене пароля');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Необходимо войти в систему
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Войти
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Настройки профиля
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Управление настройками вашего профиля и учетной записи
        </Typography>
        
        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Безопасность" />
            <Tab label="Общие настройки" />
            <Tab label="Уведомления" />
          </Tabs>
          <Divider />
        </Box>
        
        {activeTab === 0 && (
          <Box>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Смена пароля
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleChangePassword}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Текущий пароль"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      error={!!currentPasswordError}
                      helperText={currentPasswordError}
                      InputProps={{
                        startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                          >
                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Новый пароль"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      error={!!newPasswordError}
                      helperText={newPasswordError}
                      InputProps={{
                        startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Подтвердите новый пароль"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={!!confirmPasswordError}
                      helperText={confirmPasswordError}
                      InputProps={{
                        startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                      disabled={loading}
                    >
                      {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </StyledPaper>
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Общие настройки профиля
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="body2" color="text.secondary">
                Дополнительные настройки профиля будут доступны в ближайшее время
              </Typography>
            </StyledPaper>
          </Box>
        )}
        
        {activeTab === 2 && (
          <Box>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Настройки уведомлений
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="body2" color="text.secondary">
                Настройки уведомлений будут доступны в ближайшее время
              </Typography>
            </StyledPaper>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ProfileSettings; 