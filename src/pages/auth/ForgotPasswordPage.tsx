import React, { useState } from 'react';
import { Container, Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: 'calc(100vh - 120px)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const FormCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 500,
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
}));

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Пожалуйста, введите ваш email');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Пожалуйста, введите корректный email');
      return;
    }
    
    // Здесь должна быть отправка запроса на сервер для восстановления пароля
    // Имитация успешной отправки
    setTimeout(() => {
      setEmailSent(true);
    }, 1000);
  };
  
  return (
    <PageWrapper>
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FormCard>
            <Typography variant="h4" align="center" gutterBottom>
              Восстановление пароля
            </Typography>
            
            {!emailSent ? (
              <>
                <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 4 }}>
                  Введите email, указанный при регистрации, чтобы получить инструкции по восстановлению пароля
                </Typography>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                
                <Box component="form" onSubmit={handleSubmit}>
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
                  
                  <Button 
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    sx={{ mt: 3, mb: 2 }}
                  >
                    Отправить инструкции
                  </Button>
                  
                  <Button
                    component={Link}
                    to="/login"
                    startIcon={<ArrowBack />}
                    sx={{ mt: 1 }}
                  >
                    Вернуться к странице входа
                  </Button>
                </Box>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Alert severity="success" sx={{ mb: 3 }}>
                  Инструкции по восстановлению пароля отправлены на ваш email
                </Alert>
                
                <Typography paragraph>
                  Проверьте ваш почтовый ящик и следуйте инструкциям в письме для сброса пароля. Если письмо не пришло в течение нескольких минут, проверьте папку "Спам".
                </Typography>
                
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    component={Link}
                    to="/login"
                    variant="contained"
                    color="primary"
                  >
                    Вернуться к странице входа
                  </Button>
                </Box>
              </motion.div>
            )}
          </FormCard>
        </motion.div>
      </Container>
    </PageWrapper>
  );
};

export default ForgotPasswordPage; 