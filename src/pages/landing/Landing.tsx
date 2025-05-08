import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Container, Typography, Button, Grid, useTheme, useMediaQuery, Paper, Tooltip, InputAdornment, TextField, CircularProgress, Divider, Card, CardContent, CardMedia, Avatar, IconButton, Stack } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styled, { keyframes, ThemeProvider } from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Search, Add, MyLocation, QrCode, Info, Lightbulb, HelpOutline, GavelOutlined, RemoveRedEye, CheckCircle, AccessTime, Security, KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import L from 'leaflet';

// Fix marker icon issue in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Определим основные цвета согласно ТЗ
const customColors = {
  primary: '#0A3D67', // Темно-синий
  secondary: '#3E9AFF', // Голубой
  white: '#FFFFFF', // Белый
  gray: '#f8f9fa' // Светло-серый
};

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Градиентный фон для всех секций, без полукругов
const BaseSection = styled(Box)`
  background: ${customColors.white};
  border-radius: 16px;
  overflow: hidden;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  position: relative;
  
  @media (max-width: 768px) {
    padding: 24px 20px;
  }
  
  @media (max-width: 480px) {
    padding: 20px 16px;
    border-radius: 12px;
  }
`;

// Единый стиль секций, с градиентом на всю площадь
const HeroSection = styled(BaseSection)`
  padding: 48px 32px;
  background: linear-gradient(135deg, #0A3D67 0%, #3E9AFF 100%);
  box-shadow: 0 8px 30px rgba(10, 61, 103, 0.2);
  
  @media (max-width: 768px) {
    padding: 36px 24px;
  }
  
  @media (max-width: 480px) {
    padding: 24px 16px;
  }
`;

// Секция "Что это такое" - с градиентом на всю площадь
const AboutSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 16px;
`;

// Секция "Зачем это нужно" - с градиентом на всю площадь
const WhySection = styled(BaseSection)`
  background: linear-gradient(135deg, ${customColors.white} 0%, ${customColors.secondary}10 100%);
`;

// Карточка шага - улучшенный стиль и адаптив
const StepCard = styled(motion.div)<{ stepNumber?: number }>`
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 20px 16px;
  }
  
  @media (max-width: 480px) {
    padding: 16px 12px;
    gap: 12px;
  }
`;

// Улучшаем внешний вид кругов для мобильных устройств 
// Унифицированные размеры круглых элементов
const CircleStep = styled(Box)<{ active?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.active ? customColors.secondary : customColors.primary};
  color: ${customColors.white};
  font-family: 'Vetrino', sans-serif;
  font-weight: bold;
  font-size: 18px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  
  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
`;

// Заголовок с градиентным фоном - исправленный адаптив
const GradientTitle = styled(Typography)`
  color: white;
  font-family: 'Vetrino', serif;
  font-weight: 700;
  position: relative;
  z-index: 2;
  width: 100%;
  text-align: center;
  font-size: 4.5rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 12px 30px;
  
  @media (max-width: 768px) {
    font-size: 3.5rem;
    padding: 10px 20px;
  }
  
  @media (max-width: 480px) {
    font-size: 2.5rem;
    padding: 8px 16px;
  }
`;

// Основной контейнер для всех секций - улучшенный адаптив
const PageContainer = styled(Box)`
  background-color: ${customColors.gray};
  padding: 40px 20px;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  
  @media (max-width: 768px) {
    padding: 30px 15px;
  }
  
  @media (max-width: 480px) {
    padding: 20px 10px;
  }
`;

// Секция карты - удаляем полукруг
const MapCardSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 16px;
  padding-bottom: 20px;
`;

// Секция "Как это работает" - равномерное скругление
const HowSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 16px;
`;

// Секция примера - равномерное скругление
const ExampleSection = styled(BaseSection)`
  background: linear-gradient(135deg, ${customColors.secondary}10 0%, ${customColors.white} 100%);
  border-radius: 16px;
`;

// Секция условий
const TermsSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 16px;
`;

// Секция нижнего QR-кода - удаляем полукруг
const BottomQrSection = styled(BaseSection)`
  background: linear-gradient(0deg, ${customColors.secondary}15 0%, ${customColors.white} 100%);
  border-radius: 16px;
  text-align: center;
`;

// InfoBlock с центрированным содержимым - убираем разные фигуры, делаем равномерное скругление
const InfoBlock = styled(motion.div)<{ blockType?: number }>`
  padding: 30px;
  background: #f8f9fa;
  margin-bottom: 20px;
  transition: transform 0.2s;
  text-align: center;
  position: relative;
  overflow: hidden;
  z-index: 1;
  
  /* Делаем равномерное скругление для всех блоков */
  border-radius: 16px;
  
  /* Удаляем фоновые фигуры внутри блоков */

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

// Контейнер для QR-кода с улучшенной центровкой
const QRCodeContainer = styled(Box)`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 320px;
  margin: 0 auto;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 16px;
    max-width: 280px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    max-width: 250px;
  }
`;

// Анимированный блок для QR-кода с идеальным центрированием
const AnimatedQRCode = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  
  /* Центрирование QR-кода */
  & > svg {
    margin: 0 auto !important;
    display: block !important;
  }
`;

// Обертка для центрирования QR-кода и текста
const QRCodeWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 8px 0;
`;

const FloatingButton = styled(Button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  border-radius: 50%;
  padding: 0;
  min-width: 60px;
  height: 60px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 1000;
`;

const MapControls = styled(Paper)`
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  width: 300px;
  
  @media (max-width: 768px) {
    width: calc(100% - 40px);
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    border-radius: 10px;
    width: calc(100% - 20px);
  }
`;

const ProfileMarker = styled(Box)`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

interface UserMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  profileUrl: string;
  bio?: string;
  avatar?: string;
  occupation?: string;
  location?: string;
}

const demoMarkers: UserMarker[] = [
  { 
    id: '1', 
    lat: 55.7558, 
    lng: 37.6173, 
    name: "Иван Петров", 
    profileUrl: "/social/ivan",
    bio: "Историк, люблю путешествовать и изучать новые места. Моя страница посвящена памяти моей семьи.",
    avatar: "https://source.unsplash.com/random/100x100/?man",
    occupation: "Историк",
    location: "Москва"
  },
  { 
    id: '2', 
    lat: 59.9343, 
    lng: 30.3351, 
    name: "Анна Смирнова", 
    profileUrl: "/social/anna",
    bio: "Фотограф, снимаю природу и города. Храню воспоминания о близких через фотографии и истории.",
    avatar: "https://source.unsplash.com/random/100x100/?woman",
    occupation: "Фотограф",
    location: "Санкт-Петербург"
  },
  { 
    id: '3', 
    lat: 56.8519, 
    lng: 60.6122, 
    name: "Михаил Козлов", 
    profileUrl: "/social/mikhail",
    bio: "Инженер, люблю горы и велосипеды. Создал эту страницу в память о моих родителях.",
    avatar: "https://source.unsplash.com/random/100x100/?man2",
    occupation: "Инженер",
    location: "Екатеринбург"
  },
  { 
    id: '4', 
    lat: 43.5992, 
    lng: 39.7257, 
    name: "Елена Морозова", 
    profileUrl: "/social/elena",
    bio: "Художник, живу у моря. Делюсь воспоминаниями о моих предках и их историях.",
    avatar: "https://source.unsplash.com/random/100x100/?woman2",
    occupation: "Художник",
    location: "Сочи"
  },
];

// Компонент для отслеживания и центрирования карты 
const LocateMe = ({ onLocate }: { onLocate: (lat: number, lng: number) => void }) => {
  const map = useMap();
  
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 10 });
    
    map.on('locationfound', (e) => {
      onLocate(e.latlng.lat, e.latlng.lng);
    });
    
    map.on('locationerror', (e) => {
      console.error("Location error:", e);
      alert("Не удалось определить ваше местоположение");
    });
  };
  
  return (
    <Button 
      variant="contained" 
      size="small"
      startIcon={<MyLocation />}
      onClick={handleLocate}
    >
      Найти меня
    </Button>
  );
};

// Основной текст с правильным шрифтом и улучшенным адаптивом
const CenteredTypography = styled(Typography)`
  text-align: left;
  font-family: 'Arial', sans-serif;
  line-height: 1.5;
  margin: 0 auto;
  max-width: 800px;
  
  @media (max-width: 768px) {
    max-width: 95%;
  }
`;

// Заголовок с правильным шрифтом
const HeadingTypography = styled(Typography)`
  text-align: center;
  font-family: 'Vetrino', serif;
  font-weight: 700;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

// Информационный блок с заголовком
const InfoBlockTitle = styled(Typography)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-family: 'Vetrino', serif;
  font-weight: 600;
  font-size: 1.25rem;
  
  /* Предотвращаем скачки текста при рендеринге */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;

const StepNumber = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2196f3;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
`;

const ExampleCard = styled(Card)`
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
`;

// Компонент для отображения профиля пользователя в списке
const UserListItem: React.FC<{ user: UserMarker, onClick: () => void }> = ({ user, onClick }) => {
  return (
    <ProfileMarker key={user.id} onClick={onClick}>
      <Avatar src={user.avatar} alt={user.name} />
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {user.name}
        </Typography>
        {user.occupation && (
          <Typography variant="caption" color="primary" display="block">
            {user.occupation} • {user.location}
          </Typography>
        )}
        {user.bio && (
          <Typography variant="caption" color="textSecondary">
            {user.bio.substring(0, 60)}...
          </Typography>
        )}
      </Box>
    </ProfileMarker>
  );
};

// Компонент всплывающего окна с профилем
const UserProfilePopup: React.FC<{ user: UserMarker, onNavigateToProfile: () => void }> = ({ user, onNavigateToProfile }) => {
  return (
    <Box sx={{ p: 1, maxWidth: 250 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Avatar src={user.avatar} alt={user.name} sx={{ width: 40, height: 40 }} />
        <Box>
          <Typography variant="subtitle2">
            {user.name}
          </Typography>
          {user.occupation && (
            <Typography variant="caption" color="primary">
              {user.occupation} • {user.location}
            </Typography>
          )}
        </Box>
      </Box>
      <Typography variant="body2" paragraph>
        {user.bio}
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        fullWidth
        size="small"
        onClick={onNavigateToProfile}
      >
        Перейти на страницу
      </Button>
    </Box>
  );
};

// Стили для адаптации к мобильным устройствам
const MobileResponsiveBox = styled(Box)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    textAlign: 'center',
    width: '100%'
  }
}));

const MobileResponsiveGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(3),
    padding: theme.spacing(0, 1)
  }
}));

const MobileResponsiveTitle = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  lineHeight: 1.2,
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
    lineHeight: 1.1
  }
}));

const MobileResponsiveSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 0),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(5, 0)
  }
}));

// Стилизованная кнопка с улучшенной адаптивностью
const StyledButton = styled(Button)`
  background-color: ${customColors.primary};
  color: ${customColors.white};
  padding: 10px 24px;
  font-weight: 500;
  border-radius: 8px;
  text-transform: none;
  box-shadow: 0 2px 10px rgba(10, 61, 103, 0.2);
  font-family: "Tilda Sans", sans-serif;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${customColors.primary}e0;
    box-shadow: 0 4px 15px rgba(10, 61, 103, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 8px 20px;
    font-size: 0.95rem;
    width: auto;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    padding: 8px 16px;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
`;

// Фон для заголовка - градиент на всю площадь без полукруга
const TitleWrapper = styled(Box)`
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
  padding: 0;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    z-index: 1;
  }
`;

// Обновляем стиль карты и делаем более адаптивной
const MapSection = styled(Box)`
  position: relative;
  height: 600px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 992px) {
    height: 500px;
  }
  
  @media (max-width: 768px) {
    height: 450px;
  }
  
  @media (max-width: 480px) {
    height: 400px;
    border-radius: 12px;
  }
`;

// Обновляем стиль кнопки управления панелью поиска
const SearchPanelToggle = styled(motion.div)`
  position: absolute;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease;
  
  button {
    border-radius: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    background-color: white;
    color: #0A3D67;
    &:hover {
      background-color: rgba(255, 255, 255, 0.9);
    }
  }
`;

const UserCounter = styled(motion.div)`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: white;
  padding: 10px 15px;
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 8px 12px;
    top: 10px;
    right: 10px;
  }
  
  @media (max-width: 480px) {
    padding: 6px 10px;
    border-radius: 30px;
  }
`;

const Landing: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [qrValue, setQrValue] = useState('https://pagememory.app/demo');
  const [isQRVisible, setIsQRVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [filteredMarkers, setFilteredMarkers] = useState(demoMarkers);
  const [totalUsers, setTotalUsers] = useState(1248); // Пример счетчика пользователей
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(true);

  const { ref: heroRef, inView: heroInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { ref: mapRef, inView: mapInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { ref: infoRef, inView: infoInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { ref: howItWorksRef, inView: howItWorksInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { ref: whatIsRef, inView: whatIsInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { ref: whyUsRef, inView: whyUsInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { ref: termsRef, inView: termsInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { ref: exampleRef, inView: exampleInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { ref: bottomQrRef, inView: bottomQrInView } = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    const timer = setTimeout(() => setIsQRVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredMarkers(
        demoMarkers.filter(marker => 
          marker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          marker.bio?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredMarkers(demoMarkers);
    }
  }, [searchTerm]);

  const handleLocate = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setIsLocationLoading(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCreateProfile = () => {
    navigate('/social');
  };

  const handleScanQR = () => {
    // В реальном приложении здесь должна быть логика для сканирования QR-кода
    alert('Функция сканирования QR-кода будет доступна в мобильном приложении');
  };

  // Функция для перехода на страницу профиля
  const handleNavigateToProfile = (profileUrl: string) => {
    navigate(profileUrl);
  };

  // Добавляем функцию для переключения видимости панели поиска
  const toggleSearchPanel = useCallback(() => {
    setIsSearchPanelOpen(prev => !prev);
  }, []);

  return (
    <ThemeProvider theme={theme}>
    <PageContainer>
        <Container maxWidth="lg">
        {/* Верхняя секция с заголовком и подзаголовком */}
        <HeroSection ref={heroRef} sx={{ 
          background: 'linear-gradient(90deg, #0A3D67 0%, #2D6DA8 50%, #3E9AFF 100%)',
          p: {xs: 2, md: 4},
          borderRadius: 2,
          boxShadow: '0 5px 15px rgba(10, 61, 103, 0.2)',
          mb: 3
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography 
                variant="h1" 
                color="white" 
                sx={{ 
                  fontFamily: 'Vetrino, serif',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  mb: 1
                }}
              >
                Вспомнить все
              </Typography>
              <Typography 
                variant="h5" 
                color="white" 
                sx={{ 
                  fontFamily: 'Tilda Sans, sans-serif',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  fontWeight: 400,
                  mb: 2,
                  opacity: 0.95
                }}
              >
                Сохрани память о родных и близких в цифровом пространстве. Поделитесь воспоминаниями через Qr-код.
              </Typography>

              <Button 
                variant="contained" 
                size="medium"
                onClick={handleCreateProfile}
                sx={{ 
                  bgcolor: 'white',
                  color: customColors.primary,
                  fontWeight: 600,
                  py: 1,
                  px: 2,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  }
                }}
              >
                Создать страницу
              </Button>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box 
                component={Button}
                onClick={() => navigate('/example-profile')}
                sx={{ 
                  bgcolor: 'white',
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: '220px', md: '250px' },
                  height: { xs: '180px', md: '200px' },
                  textTransform: 'none',
                  color: 'text.secondary'
                }}
              >
                <Typography 
                  variant="h6" 
                  align="center" 
                  gutterBottom
                  sx={{ color: customColors.primary }}
                >
                  Пример
                </Typography>
                <Box 
                  sx={{ 
                    width: '100%',
                    height: 100,
                    borderColor: '#ccc',
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    mt: 1
                  }}
                >
                  Посмотреть пример страницы памяти
                </Box>
              </Box>
            </Grid>
          </Grid>
        </HeroSection>
        
        {/* Основные блоки - горизонтальное расположение */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Карта (левый блок) */}
          <Grid item xs={12} md={7}>
            <MapCardSection ref={mapRef} sx={{ 
              position: 'relative',
              p: 0,
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
              height: '100%'
            }}>
              <Box sx={{ 
                height: { xs: 300, md: 350 },
                position: 'relative'
              }}>
                <MapContainer 
                  center={[55.7558, 37.6173]} 
                  zoom={9} 
                  style={{ height: '100%', width: '100%' }} 
                  zoomControl={false}
                  attributionControl={!isMobile}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution={isMobile ? '' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
                  />
                  
                  {filteredMarkers.map((marker) => (
                    <Marker 
                      key={marker.id} 
                      position={[marker.lat, marker.lng]}
                    >
                      <Popup>
                        <UserProfilePopup 
                          user={marker} 
                          onNavigateToProfile={() => handleNavigateToProfile(marker.profileUrl)} 
                        />
                      </Popup>
                    </Marker>
                  ))}
                  
                  <LocateMe onLocate={handleLocate} />
                </MapContainer>

                {/* Кнопка для показа/скрытия панели поиска */}
                <IconButton 
                  sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    left: isSearchPanelOpen ? 330 : 10, 
                    zIndex: 1001,
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    }
                  }}
                  onClick={toggleSearchPanel}
                >
                  {isSearchPanelOpen ? <KeyboardArrowLeft /> : <Search />}
                </IconButton>

                {/* Поисковая панель поверх карты */}
                <Paper 
                  sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    left: 10,
                    zIndex: 1000, 
                    p: 2, 
                    borderRadius: 2,
                    width: 300,
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.3s ease',
                    transform: isSearchPanelOpen ? 'translateX(0)' : 'translateX(-120%)'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Найдено пользователей: {filteredMarkers.length}
                  </Typography>
                  
                  <TextField
                    fullWidth
                    placeholder="Поиск по имени или описанию"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color="primary" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<MyLocation />}
                    onClick={() => setIsLocationLoading(true)}
                    sx={{ mb: 1 }}
                  >
                    Рядом со мной
                  </Button>
                  
                  <Divider sx={{ mb: 1 }} />
                  
                  <Box sx={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {filteredMarkers.map((marker) => (
                      <UserListItem 
                        key={marker.id} 
                        user={marker} 
                        onClick={() => handleNavigateToProfile(marker.profileUrl)} 
                      />
                    ))}
                  </Box>
                </Paper>
              </Box>
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="caption" align="center" color="textSecondary">
                  Найдите и просмотрите страницы памяти, созданные другими пользователями
                </Typography>
              </Box>
            </MapCardSection>
          </Grid>
          
          {/* Правый блок - QR-код */}
          <Grid item xs={12} md={5}>
            <AboutSection sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" align="center" gutterBottom>
                Приобрести страницу памяти
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <QRCodeContainer 
                  sx={{ 
                    cursor: 'pointer', 
                    maxWidth: { xs: '220px', md: '250px' },
                    p: 2
                  }} 
                  onClick={() => window.open('https://multi-link-ozon-wb.com', '_blank')}
                >
                  <QRCode 
                    value="https://multi-link-ozon-wb.com" 
                    size={160}
                    bgColor="#FFFFFF"
                    fgColor={customColors.primary}
                    level="M"
                    includeMargin={false}
                  />
                  <Typography 
                    variant="caption" 
                    align="center" 
                    sx={{ 
                      mt: 1, 
                      fontFamily: 'Tilda Sans, sans-serif !important',
                      fontSize: '0.8rem',
                      display: 'block'
                    }}
                  >
                    Qr код и кликабельная ссылка на покупку (ссылка ведет на мультиссылку с Озон и ВБ)
                  </Typography>
                </QRCodeContainer>
              </Box>
            </AboutSection>
          </Grid>
        </Grid>

        {/* Зачем это нужно */}
        <WhySection id="why-us" ref={whyUsRef}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={whyUsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" align="center" gutterBottom>
                Мы помогаем сохранить память о важных людях для будущих поколений
              </Typography>
            </motion.div>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={whyUsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <InfoBlock blockType={1}>
                  <InfoBlockTitle variant="h5">
                    <Lightbulb color="primary" /> Сохранение истории
                  </InfoBlockTitle>
                  <CenteredTypography>
                    Сохраните память о тех кого любите и поделитесь воспоминаниями с друзьями и семьей с помощью цифрового архива.
                  </CenteredTypography>
                </InfoBlock>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={whyUsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <InfoBlock blockType={2}>
                  <InfoBlockTitle variant="h5">
                    <AccessTime color="primary" /> Связь поколений
                  </InfoBlockTitle>
                  <CenteredTypography>
                    Хорошо ли вы помните историю своей семьи? Не дайте воспоминаниям о ваших близких и родных пропасть бесследно. Сохрани историю жизни человека, и расскажи о нем будущим поколениям.
                  </CenteredTypography>
                </InfoBlock>
              </motion.div>
            </Grid>
            </Grid>
        </WhySection>

        {/* Что это такое */}
        <AboutSection id="what-is" ref={whatIsRef}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={whatIsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <CenteredTypography variant="h3" gutterBottom>
                Страница Памяти
              </CenteredTypography>
              <CenteredTypography variant="h6" color="textSecondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                Pagememory — цифровая платформа для сохранения и передачи памяти о близких людях
              </CenteredTypography>
            </motion.div>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={whatIsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <InfoBlock blockType={3}>
                  <InfoBlockTitle variant="h5">
                    <Info color="primary" /> Страница памяти
                  </InfoBlockTitle>
                  <CenteredTypography>
                    Персонализированное пространство в интернете, где вы можете разместить фотографии, видео, истории и воспоминания о своих близких.
                  </CenteredTypography>
                </InfoBlock>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={whatIsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <InfoBlock blockType={4}>
                  <InfoBlockTitle variant="h5">
                    <QrCode color="primary" /> Доступ через QR-код
                  </InfoBlockTitle>
                  <CenteredTypography>
                    Уникальный Qr-код со страницей воспоминаний о вашем близком человеке, для размещения на памятнике и местах памяти.
                  </CenteredTypography>
                </InfoBlock>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={whatIsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <InfoBlock blockType={5}>
                  <InfoBlockTitle variant="h5">
                    <Security color="primary" /> Надежное хранение
                  </InfoBlockTitle>
                  <CenteredTypography>
                    Безопасное хранение всех материалов с возможностью управления доступом и конфиденциальностью.
                  </CenteredTypography>
                </InfoBlock>
              </motion.div>
          </Grid>
          </Grid>
        </AboutSection>

      {/* Как это работает */}
        <HowSection id="how-it-works" ref={howItWorksRef}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <HeadingTypography 
                variant="h3" 
                gutterBottom
                sx={{ 
                  fontSize: isMobile ? '1.8rem' : '2.5rem'
                }}
              >
                Создай страницу памяти за несколько шагов
              </HeadingTypography>
            </motion.div>
          </Box>
          
          <Box sx={{ mb: 6 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <StepCard stepNumber={1}>
                <CircleStep>1</CircleStep>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontFamily: "'Vetrino', sans-serif", 
                    marginBottom: '8px',
                    fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' }
                  }}>
                    Регистрация
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: "'Tilda Sans', sans-serif",
                    color: 'text.secondary',
                    fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' }
                  }}>
                    Отсканируй Qr-код из конверта, введи заранее созданные логин и пароль. По желанию смените их.
                  </Typography>
                </Box>
              </StepCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <StepCard stepNumber={2}>
                <CircleStep>2</CircleStep>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontFamily: "'Vetrino', sans-serif", 
                    marginBottom: '8px',
                    fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' }
                  }}>
                    Создание уникальной страницы памяти
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: "'Tilda Sans', sans-serif",
                    color: 'text.secondary',
                    fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' }
                  }}>
                    С помощью визуального конструктора или заранее созданных шаблонов разместите фотографии, видео, биографию и другую информацию о близком человеке.
                  </Typography>
                </Box>
              </StepCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <StepCard stepNumber={3}>
                <CircleStep>3</CircleStep>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontFamily: "'Vetrino', sans-serif", 
                    marginBottom: '8px',
                    fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' }
                  }}>
                    Формирование семейного древа
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: "'Tilda Sans', sans-serif",
                    color: 'text.secondary',
                    fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' }
                  }}>
                    Разместите генеалогическое древо своей семьи.
                  </Typography>
                </Box>
              </StepCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <StepCard stepNumber={4}>
                <CircleStep>4</CircleStep>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontFamily: "'Vetrino', sans-serif", 
                    marginBottom: '8px',
                    fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' }
                  }}>
                    Размещение QR-кода
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: "'Tilda Sans', sans-serif",
                    color: 'text.secondary',
                    fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' }
                  }}>
                    Разместите табличку с Qr-кодом на памятнике или в месте памяти близкого человека. Поделитесь страницей памяти с родственниками.
                  </Typography>
                </Box>
              </StepCard>
            </motion.div>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button 
                variant="contained" 
                size="large"
                onClick={handleCreateProfile}
                sx={{ 
                  backgroundColor: customColors.primary,
                  color: customColors.white,
                  '&:hover': {
                    backgroundColor: '#0D4D7D',
                  }
                }}
              >
                Создать страницу
              </Button>
            </motion.div>
          </Box>
        </HowSection>

      {/* Условия */}
        <TermsSection id="terms" ref={termsRef}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={termsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" align="center" gutterBottom>
                Условия использования
              </Typography>
              <Typography variant="h6" align="center" color="textSecondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                Важная информация о наших правилах
              </Typography>
            </motion.div>
          </Box>
          
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={10}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={termsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <InfoBlock blockType={6}>
                  <InfoBlockTitle variant="h5">
                    <GavelOutlined color="primary" /> Правила использования
                  </InfoBlockTitle>
                  <Typography paragraph align="left">
                    При создании и использовании страниц памяти, пожалуйста, соблюдайте следующие правила:
                  </Typography>
                  <Typography component="ul" sx={{ pl: 2 }} align="left">
                    <li>Размещайте только контент, на который имеете права</li>
                    <li>Уважайте память и достоинство людей</li>
                    <li>Не используйте платформу для распространения недостоверной информации</li>
                    <li>Не нарушайте законодательство Российской Федерации</li>
                  </Typography>
                  <Box sx={{ mt: 2, textAlign: 'left' }}>
                    <Button 
                      component={Link} 
                      to="/terms" 
                      variant="outlined" 
                      size="small"
                      startIcon={<HelpOutline />}
                    >
                      Подробные правила
                    </Button>
                  </Box>
                </InfoBlock>
              </motion.div>
            </Grid>
            </Grid>
        </TermsSection>

      {/* Нижний QR-код */}
        <BottomQrSection id="bottom-qr" ref={bottomQrRef}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={bottomQrInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h4" gutterBottom>
                Приобрести страницу памяти
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
                Отсканируйте QR-код или нажмите кнопку, чтобы приобрести страницу памяти
              </Typography>
            </motion.div>
          </Box>
          
          <Grid container spacing={4} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={5} sx={{ textAlign: 'center' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={bottomQrInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <QRCodeContainer>
                  <AnimatedQRCode>
                    <QRCode 
                      value={qrValue} 
                      size={200}
                      bgColor="#FFFFFF"
                      fgColor={customColors.primary}
                      level="M"
                      includeMargin={false}
                    />
                    <Typography 
                      variant="subtitle1" 
                      align="center" 
                      sx={{ 
                        mt: 2, 
                        fontFamily: 'Tilda Sans, sans-serif !important',
                        fontSize: '1rem',
                        letterSpacing: '0.01em'
                      }}
                    >
                      QR-код для приобретения страницы памяти
                    </Typography>
                  </AnimatedQRCode>
                </QRCodeContainer>
              </motion.div>
            </Grid>
          </Grid>
          
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={bottomQrInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <StyledButton 
                variant="contained" 
                size="large"
                onClick={handleCreateProfile}
                sx={{ px: 4, py: 1.5 }}
              >
                Приобрести страницу памяти
              </StyledButton>
            </motion.div>
          </Box>
        </BottomQrSection>

        </Container>

      <FloatingButton 
        variant="contained"
        onClick={handleCreateProfile}
        aria-label="Create profile"
        sx={{ 
          backgroundColor: customColors.primary,
          '&:hover': {
            backgroundColor: '#0D4D7D',
          }
        }}
      >
        <Add />
      </FloatingButton>
    </PageContainer>
  </ThemeProvider>
  );
};

export default Landing; 