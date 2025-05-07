import React from 'react';
import { Container, Typography, Grid, Box, Card, CardContent, TextField, Button } from '@mui/material';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Phone, Email, LocationOn, Send } from '@mui/icons-material';

// Определим основные цвета для соответствия главной странице
const customColors = {
  primary: '#0A3D67', // Темно-синий
  secondary: '#3E9AFF', // Голубой
  white: '#FFFFFF', // Белый
  gray: '#f8f9fa' // Светло-серый
};

// Основной контейнер для всех секций
const PageContainer = styled(Box)`
  background-color: ${customColors.gray};
  padding: 40px 20px;
  min-height: 100vh;
  width: 100%;
  
  @media (max-width: 600px) {
    padding: 20px 10px;
  }
`;

// Базовая секция с закругленными углами
const BaseSection = styled(Box)`
  background: ${customColors.white};
  border-radius: 20px;
  overflow: hidden;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  position: relative;
  
  @media (max-width: 600px) {
    padding: 30px 20px;
    border-radius: 15px;
  }
`;

// Заголовок страницы
const HeaderSection = styled(BaseSection)`
  padding: 60px 40px;
  background: linear-gradient(135deg, ${customColors.white} 0%, ${customColors.secondary}15 100%);
  border-radius: 30px 30px 20px 20px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0; 
    width: 150px;
    height: 150px;
    background: ${customColors.secondary}20;
    border-radius: 0 0 0 100%;
    z-index: 0;
  }
  
  @media (max-width: 600px) {
    padding: 40px 20px;
  }
`;

// Секция формы контактов
const ContactFormSection = styled(BaseSection)`
  background: linear-gradient(135deg, ${customColors.white} 0%, ${customColors.secondary}10 100%);
  border-radius: 20px 50px 20px 20px;
`;

// Секция информации о контактах
const ContactInfoSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 20px 20px 50px 20px;
`;

// Секция карты
const MapSection = styled(BaseSection)`
  background: linear-gradient(135deg, ${customColors.secondary}10 0%, ${customColors.white} 100%);
  border-radius: 20px 20px 20px 50px;
  min-height: 400px;
`;

// Контактная карточка
const ContactCard = styled(motion(Card))`
  height: 100%;
  transition: transform 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

// Стили для каждого варианта карточки
const TopLeftRoundedCard = styled(ContactCard)`
  border-radius: 30px 15px 15px 15px;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 90px;
    height: 90px;
    background: ${customColors.secondary}15;
    border-radius: 0 0 0 100%;
    z-index: 0;
  }
`;

const TopRightRoundedCard = styled(ContactCard)`
  border-radius: 15px 30px 15px 15px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 80px;
    height: 80px;
    background: ${customColors.secondary}20;
    border-radius: 0 0 0 100%;
    z-index: 0;
  }
`;

const BottomLeftRoundedCard = styled(ContactCard)`
  border-radius: 15px 15px 15px 30px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    background: ${customColors.secondary}15;
    border-radius: 0 0 100% 0;
    z-index: 0;
  }
`;

const Contact: React.FC = () => {
  const contactInfo = [
    {
      title: 'Телефон',
      icon: <Phone fontSize="large" color="primary" />,
      content: '+7 (800) 123-45-67',
      action: 'Позвонить нам'
    },
    {
      title: 'Email',
      icon: <Email fontSize="large" color="primary" />,
      content: 'info@socialqr.ru',
      action: 'Написать письмо'
    },
    {
      title: 'Адрес',
      icon: <LocationOn fontSize="large" color="primary" />,
      content: 'г. Москва, ул. Примерная, д. 123',
      action: 'Проложить маршрут'
    }
  ];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Логика обработки формы
    console.log('Форма отправлена');
  };

  // Функция для выбора компонента карточки в зависимости от индекса
  const getCardComponent = (index: number) => {
    switch (index % 3) {
      case 0:
        return TopLeftRoundedCard;
      case 1:
        return TopRightRoundedCard;
      case 2:
        return BottomLeftRoundedCard;
      default:
        return ContactCard;
    }
  };

  return (
    <PageContainer>
      <Container maxWidth="lg">
        {/* Заголовок страницы */}
        <HeaderSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography variant="h2" align="center" gutterBottom sx={{ position: 'relative', zIndex: 1 }}>
              Связаться с нами
            </Typography>
            <Typography variant="h5" align="center" color="textSecondary" paragraph sx={{ position: 'relative', zIndex: 1 }}>
              Мы всегда готовы ответить на ваши вопросы и выслушать предложения
            </Typography>
          </motion.div>
        </HeaderSection>

        {/* Секция информации о контактах */}
        <ContactInfoSection>
          <Typography variant="h3" align="center" gutterBottom>
            Наши контакты
          </Typography>
          <Grid container spacing={4}>
            {contactInfo.map((info, index) => {
              const CardComponent = getCardComponent(index);
              
              return (
                <Grid item xs={12} md={4} key={info.title}>
                  <CardComponent
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <CardContent sx={{ textAlign: 'center', position: 'relative', zIndex: 1, py: 4 }}>
                      <Box sx={{ mb: 2 }}>
                        {info.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {info.title}
                      </Typography>
                      <Typography variant="body1" color="textSecondary" gutterBottom>
                        {info.content}
                      </Typography>
                      <Button 
                        variant="text" 
                        color="primary" 
                        sx={{ mt: 1 }}
                      >
                        {info.action}
                      </Button>
                    </CardContent>
                  </CardComponent>
                </Grid>
              );
            })}
          </Grid>
        </ContactInfoSection>

        {/* Секция формы контактов */}
        <ContactFormSection>
          <Typography variant="h3" align="center" gutterBottom>
            Напишите нам
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  label="Ваше имя"
                  name="name"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="subject"
                  label="Тема сообщения"
                  name="subject"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="message"
                  label="Ваше сообщение"
                  name="message"
                  multiline
                  rows={4}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<Send />}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${customColors.secondary} 0%, ${customColors.primary} 100%)`
                  }}
                >
                  Отправить сообщение
                </Button>
              </Grid>
            </Grid>
          </Box>
        </ContactFormSection>

        {/* Секция карты */}
        <MapSection>
          <Typography variant="h3" align="center" gutterBottom>
            Мы на карте
          </Typography>
          <Box
            sx={{
              height: '400px',
              width: '100%',
              mt: 4,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.1)',
                pointerEvents: 'none',
                borderRadius: 4
              }
            }}
          >
            {/* Здесь будет карта с вашими координатами */}
            <Box
              sx={{
                height: '100%',
                width: '100%',
                background: 'rgba(62, 154, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="body1">
                Карта загружается...
              </Typography>
            </Box>
          </Box>
        </MapSection>
      </Container>
    </PageContainer>
  );
};

export default Contact; 