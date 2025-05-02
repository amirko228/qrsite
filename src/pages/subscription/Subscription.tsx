import React, { useState } from 'react';
import { Container, Typography, Box, Grid, Paper, Button, TextField, Divider, Alert, Tabs, Tab, Card, CardContent, CardActions, Radio, RadioGroup, FormControlLabel, FormControl, Chip } from '@mui/material';
import { CreditCard, CreditCardOff, CheckCircle, ContentPaste } from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const PricingCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 16,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  },
}));

const QRContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  margin: '24px 0',
}));

const PaymentOption = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
  transition: 'border-color 0.3s ease, background-color 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
  },
}));

const PlatformButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  height: 70,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
  },
}));

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

const Subscription: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [selectedPayment, setSelectedPayment] = useState<string>('card');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    { id: 'card', name: 'Банковская карта', icon: <CreditCard fontSize="large" /> },
    { id: 'qr', name: 'Оплата по QR-коду', icon: <QRCode value="payment:12345" size={40} /> },
    { id: 'sbp', name: 'Система быстрых платежей', icon: <ContentPaste fontSize="large" /> },
  ];

  const plans: PlanOption[] = [
    {
      id: 'monthly',
      name: 'Ежемесячно',
      price: 500,
      description: 'Базовый план с ежемесячной оплатой',
      features: [
        '5 ГБ хранилища',
        'Основные функции',
        'Базовая техподдержка',
      ]
    },
    {
      id: 'yearly',
      name: 'Ежегодно',
      price: 4000,
      description: 'Выгоднее на 33%',
      features: [
        '5 ГБ хранилища',
        'Все функции',
        'Приоритетная техподдержка',
        'Скидка 33% от месячной стоимости'
      ],
      isPopular: true
    },
    {
      id: 'lifetime',
      name: 'Пожизненно',
      price: 10000,
      description: 'Единоразовая оплата',
      features: [
        '10 ГБ хранилища',
        'Все функции включая будущие',
        'Премиум поддержка',
        'Нет повторных платежей'
      ]
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handlePlanChange = (plan: string) => {
    setSelectedPlan(plan);
  };

  const handlePaymentChange = (method: string) => {
    setSelectedPayment(method);
  };

  const handleApplyCoupon = () => {
    // Здесь должна быть проверка купона на сервере
    if (couponCode.trim() !== '') {
      setCouponApplied(true);
    }
  };

  const handleSubmitPayment = () => {
    setPaymentStatus('processing');
    
    // Имитация оплаты
    setTimeout(() => {
      setPaymentStatus('success');
    }, 2000);
  };

  const getSelectedPlanDetails = () => {
    return plans.find(plan => plan.id === selectedPlan);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Оплата подписки
        </Typography>
        <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom sx={{ mb: 4 }}>
          Выберите подходящий тарифный план для использования всех возможностей сервиса
        </Typography>
      </motion.div>

      <Tabs 
        value={selectedTab} 
        onChange={handleTabChange} 
        centered 
        sx={{ mb: 5 }}
        variant="fullWidth"
      >
        <Tab label="Выбор тарифа" />
        <Tab label="Способ оплаты" disabled={selectedPlan === ''} />
        <Tab label="Подтверждение" disabled={selectedPayment === '' || selectedPlan === ''} />
      </Tabs>

      {/* Первая вкладка - выбор тарифа */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <PricingCard 
                  elevation={selectedPlan === plan.id ? 8 : 2}
                  sx={{
                    border: selectedPlan === plan.id ? '2px solid' : '1px solid',
                    borderColor: selectedPlan === plan.id ? 'primary.main' : 'divider',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  {plan.isPopular && (
                    <Chip 
                      label="Популярный" 
                      color="primary" 
                      sx={{ 
                        position: 'absolute', 
                        top: -12, 
                        right: 16
                      }}
                    />
                  )}
                  <Typography variant="h5" component="h2" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h3" component="p" gutterBottom>
                    {plan.price} ₽
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    {plan.features.map((feature, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CheckCircle fontSize="small" color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Button 
                    variant={selectedPlan === plan.id ? "contained" : "outlined"} 
                    color="primary" 
                    fullWidth 
                    sx={{ mt: 3 }}
                    onClick={() => handlePlanChange(plan.id)}
                  >
                    {selectedPlan === plan.id ? "Выбрано" : "Выбрать"}
                  </Button>
                </PricingCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Вторая вкладка - способ оплаты */}
      {selectedTab === 1 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Способ оплаты
            </Typography>
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup 
                value={selectedPayment} 
                onChange={(e) => handlePaymentChange(e.target.value)}
              >
                {paymentMethods.map((method) => (
                  <PaymentOption 
                    key={method.id} 
                    sx={{ 
                      borderColor: selectedPayment === method.id ? 'primary.main' : 'divider',
                      backgroundColor: selectedPayment === method.id ? 'rgba(33, 150, 243, 0.05)' : 'transparent',
                    }}
                    onClick={() => handlePaymentChange(method.id)}
                  >
                    <FormControlLabel 
                      value={method.id} 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 2 }}>{method.icon}</Box>
                          <Typography>{method.name}</Typography>
                        </Box>
                      }
                      sx={{ width: '100%', margin: 0 }}
                    />
                  </PaymentOption>
                ))}
              </RadioGroup>
            </FormControl>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Магазины
              </Typography>
              <PlatformButton 
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => window.open('https://www.ozon.ru', '_blank')}
              >
                <img src="https://logobank.ru/images/logos/ozon-new-logo.png" alt="Ozon" height="40" />
              </PlatformButton>
              
              <PlatformButton 
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => window.open('https://www.wildberries.ru', '_blank')}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Wildberries.svg/2560px-Wildberries.svg.png" alt="Wildberries" height="40" />
              </PlatformButton>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Детали заказа
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Тарифный план:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {getSelectedPlanDetails()?.name}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Стоимость:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {getSelectedPlanDetails()?.price} ₽
                  </Typography>
                </Box>
                
                {couponApplied && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" color="error">Скидка:</Typography>
                    <Typography variant="body1" fontWeight="bold" color="error">
                      -500 ₽
                    </Typography>
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Итого:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {couponApplied 
                      ? `${(getSelectedPlanDetails()?.price || 0) - 500} ₽` 
                      : `${getSelectedPlanDetails()?.price} ₽`}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Промокод"
                    variant="outlined"
                    fullWidth
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                    sx={{ mb: 1 }}
                  />
                  <Button 
                    variant="outlined" 
                    onClick={handleApplyCoupon}
                    disabled={couponApplied || couponCode.trim() === ''}
                  >
                    Применить
                  </Button>
                  {couponApplied && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      Промокод успешно применен! Скидка 500 ₽
                    </Alert>
                  )}
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  size="large"
                  onClick={() => setSelectedTab(2)}
                  disabled={!selectedPayment}
                >
                  Продолжить
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Третья вкладка - подтверждение платежа */}
      {selectedTab === 2 && (
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Подтверждение оплаты
              </Typography>
              
              {paymentStatus === 'idle' && (
                <>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Пожалуйста, проверьте детали заказа перед оплатой.
                  </Alert>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" gutterBottom>
                      Вы выбрали тарифный план: <strong>{getSelectedPlanDetails()?.name}</strong>
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Способ оплаты: <strong>{paymentMethods.find(m => m.id === selectedPayment)?.name || 'Не выбран'}</strong>
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Итоговая сумма: <strong>
                        {couponApplied 
                          ? `${(getSelectedPlanDetails()?.price || 0) - 500} ₽` 
                          : `${getSelectedPlanDetails()?.price} ₽`}
                      </strong>
                    </Typography>
                  </Box>
                  
                  {selectedPayment === 'qr' && (
                    <QRContainer>
                      <QRCode 
                        value={`payment:${getSelectedPlanDetails()?.id}:${getSelectedPlanDetails()?.price}`} 
                        size={200} 
                      />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        Отсканируйте QR-код для оплаты
                      </Typography>
                    </QRContainer>
                  )}
                  
                  {selectedPayment === 'card' && (
                    <Box sx={{ mb: 3 }}>
                      <TextField
                        label="Номер карты"
                        variant="outlined"
                        fullWidth
                        placeholder="0000 0000 0000 0000"
                        sx={{ mb: 2 }}
                      />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Срок действия"
                            variant="outlined"
                            fullWidth
                            placeholder="ММ/ГГ"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="CVV/CVC"
                            variant="outlined"
                            fullWidth
                            placeholder="123"
                            type="password"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    size="large"
                    onClick={handleSubmitPayment}
                  >
                    Оплатить
                  </Button>
                </>
              )}
              
              {paymentStatus === 'processing' && (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <CreditCard fontSize="large" color="primary" />
                  </motion.div>
                  <Typography variant="h6" sx={{ mt: 3 }}>
                    Обрабатываем ваш платеж...
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Пожалуйста, не закрывайте эту страницу
                  </Typography>
                </Box>
              )}
              
              {paymentStatus === 'success' && (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle fontSize="large" color="success" sx={{ fontSize: 80 }} />
                  </motion.div>
                  <Typography variant="h5" sx={{ mt: 3 }}>
                    Оплата прошла успешно!
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Ваша подписка активирована
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ mt: 4 }}
                    href="/social"
                  >
                    Перейти в мой профиль
                  </Button>
                </Box>
              )}
              
              {paymentStatus === 'error' && (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CreditCardOff fontSize="large" color="error" sx={{ fontSize: 80 }} />
                  </motion.div>
                  <Typography variant="h5" sx={{ mt: 3 }} color="error">
                    Ошибка оплаты
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Пожалуйста, проверьте данные карты или выберите другой способ оплаты
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ mt: 4 }}
                    onClick={() => setPaymentStatus('idle')}
                  >
                    Попробовать снова
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
};

export default Subscription; 