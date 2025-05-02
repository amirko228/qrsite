import React, { useState } from 'react';
import { Container, Box, Paper, Typography, TextField, Button, Tabs, Tab, Divider, Alert, Checkbox, FormControlLabel, Grid, Link as MuiLink } from '@mui/material';
import { Google, Facebook, LinkedIn, Email, Lock, Person, CheckCircle } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

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

const SocialButton = styled(Button)(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: 8,
  justifyContent: 'flex-start',
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(2),
  },
}));

const SuccessBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
}));

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError('');
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Валидация
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (!validateEmail(email)) {
      setError('Пожалуйста, введите корректный email');
      return;
    }

    if (activeTab === 1) { // Регистрация
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }

      if (!agreedToTerms) {
        setError('Необходимо согласиться с условиями использования');
        return;
      }

      if (!name) {
        setError('Пожалуйста, введите ваше имя');
        return;
      }
    }

    // Имитация успешной авторизации/регистрации
    setSuccess(true);
    
    // Перенаправление на страницу профиля через 2 секунды
    setTimeout(() => {
      navigate('/social');
    }, 2000);
  };

  const handleSocialLogin = (provider: string) => {
    // Здесь должна быть логика авторизации через соц. сети
    console.log(`Login with ${provider}`);
    
    // Имитация успешной авторизации
    setSuccess(true);
    
    // Перенаправление на страницу профиля через 2 секунды
    setTimeout(() => {
      navigate('/social');
    }, 2000);
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
                  {activeTab === 0 ? 'Вход в аккаунт' : 'Создание аккаунта'}
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 4 }}>
                  {activeTab === 0 
                    ? 'Войдите в свой аккаунт для доступа к профилю' 
                    : 'Зарегистрируйтесь для создания своего профиля'}
                </Typography>

                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{ mb: 4 }}
                >
                  <Tab label="Вход" />
                  <Tab label="Регистрация" />
                </Tabs>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  {activeTab === 1 && (
                    <TextField
                      fullWidth
                      label="Имя"
                      variant="outlined"
                      margin="normal"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      InputProps={{
                        startAdornment: <Person color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  )}

                  <TextField
                    fullWidth
                    label="Email"
                    variant="outlined"
                    margin="normal"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: <Email color="action" sx={{ mr: 1 }} />,
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Пароль"
                    variant="outlined"
                    margin="normal"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                    }}
                  />

                  {activeTab === 1 && (
                    <>
                      <TextField
                        fullWidth
                        label="Подтвердите пароль"
                        variant="outlined"
                        margin="normal"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        InputProps={{
                          startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                        }}
                      />

                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                          />
                        }
                        label={
                          <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                            Я согласен с <MuiLink component={Link} to="/terms">условиями использования</MuiLink> и <MuiLink component={Link} to="/privacy">политикой конфиденциальности</MuiLink>
                          </Box>
                        }
                        sx={{ mt: 2 }}
                      />
                    </>
                  )}

                  {activeTab === 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 3 }}>
                      <MuiLink component={Link} to="/forgot-password" underline="hover">
                        Забыли пароль?
                      </MuiLink>
                    </Box>
                  )}

                  <Button 
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    sx={{ mt: activeTab === 1 ? 3 : 0, mb: 3 }}
                  >
                    {activeTab === 0 ? 'Войти' : 'Зарегистрироваться'}
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    или
                  </Typography>
                </Divider>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <SocialButton
                      variant="outlined"
                      startIcon={<Google />}
                      onClick={() => handleSocialLogin('google')}
                    >
                      Google
                    </SocialButton>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <SocialButton
                      variant="outlined"
                      startIcon={<Facebook />}
                      onClick={() => handleSocialLogin('facebook')}
                    >
                      Facebook
                    </SocialButton>
                  </Grid>
                </Grid>
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
                  {activeTab === 0 ? 'Вы успешно вошли!' : 'Регистрация успешна!'}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {activeTab === 0 
                    ? 'Перенаправляем вас в ваш профиль...' 
                    : 'Ваш аккаунт создан. Перенаправляем вас на страницу профиля...'}
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