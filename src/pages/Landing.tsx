import React from 'react';
import { Box, Container, Typography, Button, Grid, useTheme } from '@mui/material';
import QRCode from 'react-qr-code';
import styled, { keyframes } from 'styled-components';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledMap = styled(MapContainer)`
  height: 400px;
  width: 100%;
  margin: 20px 0;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const AnimatedBox = styled(motion.div)`
  animation: ${fadeIn} 0.6s ease-out;
`;

const StyledButton = styled(Button)`
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const FeatureCard = styled(Box)`
  padding: 24px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }
`;

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleCreateProfile = () => {
    // В реальном приложении здесь будет API-запрос для создания профиля
    const newProfileId = Date.now().toString();
    navigate(`/profile/${newProfileId}`);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* Верхний баннер */}
        <AnimatedBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ 
            textAlign: 'center', 
            mb: 4,
            py: 8,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Сохраните память о близких
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary" 
              paragraph
              sx={{ maxWidth: '600px', margin: '0 auto' }}
            >
              Создайте уникальную страницу памяти с QR-кодом
            </Typography>
            <StyledButton 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleCreateProfile}
              sx={{ 
                mt: 2,
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              }}
            >
              Создать страницу памяти
            </StyledButton>
          </Box>
        </AnimatedBox>

        {/* QR-код и кнопки маркетплейсов */}
        <AnimatedBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 4, 
            mb: 6,
            p: 4,
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <QRCode 
              value="https://marketplace-link"
              style={{ 
                padding: '16px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <StyledButton 
                variant="contained" 
                href="https://ozon.ru"
                sx={{ 
                  background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E8E 90%)',
                  borderRadius: '12px',
                }}
              >
                Купить на Ozon
              </StyledButton>
              <StyledButton 
                variant="contained" 
                href="https://wildberries.ru"
                sx={{ 
                  background: 'linear-gradient(45deg, #CB11AB 30%, #E313BF 90%)',
                  borderRadius: '12px',
                }}
              >
                Купить на Wildberries
              </StyledButton>
            </Box>
          </Box>
        </AnimatedBox>

        {/* Карта */}
        <AnimatedBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Box sx={{ mb: 6 }}>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                textAlign: 'center',
                mb: 4
              }}
            >
              Наши пользователи
            </Typography>
            <StyledMap center={[55.7558, 37.6173]} zoom={4}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* Здесь будут маркеры пользователей */}
            </StyledMap>
          </Box>
        </AnimatedBox>

        {/* Информационные блоки */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <FeatureCard>
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }}
              >
                Что это?
              </Typography>
              <Typography paragraph>
                Наш сервис позволяет создать уникальную страницу памяти с QR-кодом,
                которая сохранит важные моменты и истории о ваших близких.
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <FeatureCard>
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }}
              >
                Как это работает?
              </Typography>
              <Typography paragraph>
                1. Создайте страницу памяти
                2. Добавьте фотографии и истории
                3. Получите QR-код
                4. Разместите QR-код на памятнике или в памятном месте
              </Typography>
            </FeatureCard>
          </Grid>
        </Grid>

        {/* Условия */}
        <AnimatedBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <FeatureCard sx={{ my: 4 }}>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                color: theme.palette.primary.main
              }}
            >
              Условия
            </Typography>
            <Typography paragraph>
              • До 5 ГБ для хранения медиафайлов
              • Неограниченное количество текстовых записей
              • Возможность создания семейного древа
              • Доступ к странице по QR-коду
            </Typography>
          </FeatureCard>
        </AnimatedBox>

        {/* О нас */}
        <AnimatedBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <FeatureCard sx={{ my: 4 }}>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                color: theme.palette.primary.main
              }}
            >
              О нас
            </Typography>
            <Typography paragraph>
              Мы помогаем сохранить память о близких людях в цифровом формате,
              делая её доступной для будущих поколений.
            </Typography>
          </FeatureCard>
        </AnimatedBox>
      </Box>
    </Container>
  );
};

export default Landing; 