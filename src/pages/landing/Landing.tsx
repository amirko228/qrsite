import React, { useEffect, useState, useRef } from 'react';
import { Box, Container, Typography, Button, Grid, useTheme, useMediaQuery, Paper, Tooltip, InputAdornment, TextField, CircularProgress, Divider, Card, CardContent, CardMedia, Avatar } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styled, { keyframes, ThemeProvider } from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Search, Add, MyLocation, QrCode, Info, Lightbulb, HelpOutline, GavelOutlined, RemoveRedEye, CheckCircle, AccessTime, Security } from '@mui/icons-material';
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

// Стилизованный заголовок с градиентом
const GradientTitle = styled(Typography)`
  background: linear-gradient(135deg, ${customColors.secondary} 0%, ${customColors.primary} 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  display: inline-block;
  position: relative;
  font-family: Garamond, serif;
  font-weight: 700;
  font-size: 3.5rem;
  
  @media (max-width: 600px) {
    font-size: 2.5rem;
  }
`;

// Фигура-подложка для заголовка
const TitleWrapper = styled(Box)`
  position: relative;
  display: inline-block;
  margin-bottom: 10px;
  padding: 8px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${customColors.white} 0%, ${customColors.secondary}30 100%);
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    background: ${customColors.secondary};
    border-radius: 0 0 0 100%;
    z-index: 1;
  }
`;

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

// Hero секция
const HeroSection = styled(BaseSection)`
  padding: 60px 40px;
  background: linear-gradient(135deg, ${customColors.white} 0%, ${customColors.secondary}15 100%);
  
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

// Секция "Что это такое"
const AboutSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 20px 20px 50px 20px;
`;

// Секция "Зачем это нужно"
const WhySection = styled(BaseSection)`
  background: linear-gradient(135deg, ${customColors.white} 0%, ${customColors.secondary}10 100%);
  border-radius: 20px 50px 20px 20px;
`;

// Секция карты
const MapCardSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 30px;
  padding-bottom: 20px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 40px;
    background: ${customColors.secondary}15;
    border-radius: 0 0 30px 30px;
    z-index: 0;
  }
`;

// Секция "Как это работает"
const HowSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 50px 20px 20px 20px;
`;

// Секция примера
const ExampleSection = styled(BaseSection)`
  background: linear-gradient(135deg, ${customColors.secondary}10 0%, ${customColors.white} 100%);
  border-radius: 20px 20px 20px 50px;
`;

// Секция условий
const TermsSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 20px;
`;

// Секция нижнего QR-кода
const BottomQrSection = styled(BaseSection)`
  background: linear-gradient(0deg, ${customColors.secondary}15 0%, ${customColors.white} 100%);
  border-radius: 40px 40px 20px 20px;
  text-align: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 20px;
    background: ${customColors.secondary}25;
    border-radius: 40px 40px 0 0;
    z-index: 0;
  }
`;

// Карточка шага с уникальной фигурой для каждого элемента
const StepCard = styled(motion.div)<{ stepNumber?: number }>`
  padding: 24px;
  background: white;
  border-radius: ${(props) => {
    switch(props.stepNumber) {
      case 1: return '30px 15px 15px 15px'; // Скругление вверху слева
      case 2: return '15px 30px 15px 15px'; // Скругление вверху справа
      case 3: return '15px 15px 15px 30px'; // Скругление внизу слева
      case 4: return '15px 15px 30px 15px'; // Скругление внизу справа
      default: return '16px';
    }
  }};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  overflow: hidden;
  z-index: 1;
  
  &:before {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 0;
    
    ${(props) => {
      switch(props.stepNumber) {
        case 1: return `
          width: 120px;
          height: 120px;
          background-color: rgba(62, 154, 255, 0.05);
          border-radius: 70% 30% 30% 70% / 60% 40% 60% 40%;
        `;
        case 2: return `
          width: 140px;
          height: 140px;
          background-color: rgba(10, 61, 103, 0.05);
          border-radius: 30% 70% 70% 30% / 40% 60% 40% 60%;
        `;
        case 3: return `
          width: 130px;
          height: 130px;
          background-color: rgba(62, 154, 255, 0.08);
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
        `;
        default: return `
          width: 150px;
          height: 150px;
          background-color: rgba(10, 61, 103, 0.08);
          border-radius: 40% 60% 70% 30% / 40% 70% 30% 60%;
        `;
      }
    }}
  }
`;

const MapSection = styled(Box)`
  height: 600px;
  position: relative;
  margin: 40px 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const UserCounter = styled(motion.div)`
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  padding: 15px 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

// InfoBlock с центрированным содержимым и разными фигурами
const InfoBlock = styled(motion.div)<{ blockType?: number }>`
  padding: 30px;
  background: #f8f9fa;
  margin-bottom: 20px;
  transition: transform 0.2s;
  text-align: center;
  position: relative;
  overflow: hidden;
  z-index: 1;
  
  /* Разные формы блоков в зависимости от типа */
  border-radius: ${props => {
    switch(props.blockType) {
      case 1: return '20px 20px 50px 20px'; // Скругление внизу справа
      case 2: return '20px 50px 20px 20px'; // Скругление вверху справа
      case 3: return '50px 20px 20px 20px'; // Скругление вверху слева
      case 4: return '20px 20px 20px 50px'; // Скругление внизу слева
      case 5: return '30px 30px 10px 10px'; // Скругление сверху
      case 6: return '10px 10px 30px 30px'; // Скругление снизу
      default: return '20px'; // Обычное скругление
    }
  }};
  
  /* Фоновые фигуры внутри блоков */
  &:before {
    content: '';
    position: absolute;
    z-index: -1;
    
    ${props => {
      switch(props.blockType) {
        case 1: return `
          bottom: 0;
          right: 0;
          width: 90px;
          height: 90px;
          background: ${customColors.secondary}15;
          border-radius: 0 0 0 100%;
        `;
        case 2: return `
          top: 0;
          right: 0;
          width: 80px;
          height: 80px;
          background: ${customColors.secondary}20;
          border-radius: 0 0 0 100%;
        `;
        case 3: return `
          top: 0;
          left: 0;
          width: 100px;
          height: 100px;
          background: ${customColors.secondary}15;
          border-radius: 0 0 100% 0;
        `;
        case 4: return `
          bottom: 0;
          left: 0;
          width: 70px;
          height: 70px;
          background: ${customColors.secondary}20;
          border-radius: 0 100% 0 0;
        `;
        case 5: return `
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 40px;
          background: ${customColors.secondary}15;
          border-radius: 0 0 50% 50%;
        `;
        case 6: return `
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 180px;
          height: 30px;
          background: ${customColors.secondary}15;
          border-radius: 50% 50% 0 0;
        `;
        default: return `
          display: none;
        `;
      }
    }}
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

// Контейнер для QR-кода с центрированием
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
`;

// Анимированный блок для QR-кода
const AnimatedQRCode = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  
  /* Центрирование QR-кода */
  & > svg {
    margin: 0 auto;
    display: block;
  }
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
    bio: "Художник, живу у моря. Делюсь воспоминаниями о моих предках и их историями.",
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

// Типографика с фиксированными параметрами для предотвращения "скачущих" символов
const CenteredTypography = styled(Typography)`
  text-align: center;
  font-size: ${props => props.variant === 'h5' ? '1.25rem' : '1rem'};
  font-family: 'Alegreya, sans-serif';
  line-height: 1.5;
  letter-spacing: 0.015em;
  margin: 0 auto;
  max-width: 800px;
  
  /* Предотвращаем скачки текста при рендеринге */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: auto;
  min-height: ${props => props.variant === 'h5' ? '2.5rem' : '1.5rem'};
`;

// Заголовки с фиксированными параметрами
const HeadingTypography = styled(Typography)`
  text-align: center;
  font-family: 'Garamond, serif';
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.01em;
  
  /* Предотвращаем скачки текста при рендеринге */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;

// Информационный блок с заголовком
const InfoBlockTitle = styled(Typography)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-family: 'Garamond, serif';
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
    gap: theme.spacing(4),
    padding: theme.spacing(0, 2)
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

// Унифицированные размеры круглых элементов для мобильной версии
const CircleStep = styled(Box)(({ theme }) => ({
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: customColors.primary, // Темно-синий
  color: customColors.white, // Белый текст
  fontFamily: 'Garamond, serif',
  fontWeight: 'bold',
  fontSize: '20px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  
  [theme.breakpoints.down('sm')]: {
    width: '40px', // Унифицированный размер для мобильной версии
    height: '40px', // Унифицированный размер для мобильной версии
    fontSize: '18px'
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
  font-family: Alegreya, sans-serif;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${customColors.primary}e0;
    box-shadow: 0 4px 15px rgba(10, 61, 103, 0.3);
  }
  
  @media (max-width: 600px) {
    width: 100%;
    padding: 8px 16px;
    margin-bottom: 8px;
    font-size: 0.9rem;
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

  return (
    <PageContainer>
        <Container maxWidth="lg">
        {/* Hero Section */}
        <HeroSection ref={heroRef}>
          <MobileResponsiveGrid container spacing={isMobile ? 2 : 4} alignItems="center">
            <Grid item xs={12} md={7}>
              <MobileResponsiveBox sx={{ mb: isMobile ? 2 : 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <TitleWrapper>
                    <GradientTitle variant="h1" align="center" sx={{ fontSize: isMobile ? '2rem' : '3.5rem' }}>
                      Вспомнить все
                    </GradientTitle>
                  </TitleWrapper>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <CenteredTypography 
                    variant="h5" 
                    color="textSecondary" 
                    paragraph 
                    sx={{ 
                      fontSize: isMobile ? '1.1rem' : '1.25rem',
                      lineHeight: isMobile ? 1.4 : 1.5,
                      mb: isMobile ? 2 : 3
                    }}
                  >
                    Сохрани память о родных и близких в цифровом пространстве. Поделитесь воспоминаниями через Qr-код.
                  </CenteredTypography>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Box 
                    sx={{ 
                      mt: isMobile ? 2 : 4, 
                      display: 'flex', 
                      gap: 2,
                      flexWrap: isMobile ? 'nowrap' : 'wrap',
                      justifyContent: 'center',
                      flexDirection: isMobile ? 'column' : 'row',
                      width: '100%'
                    }}
                  >
                    <StyledButton 
                      variant="contained" 
                      onClick={handleCreateProfile}
                    >
                      Создать страницу
                    </StyledButton>
                    <StyledButton 
                      variant="contained"
                      onClick={() => scrollToSection('example')}
                      sx={{
                        backgroundColor: 'transparent',
                        color: customColors.primary,
                        border: `1px solid ${customColors.primary}`,
                        '&:hover': {
                          backgroundColor: `${customColors.primary}10`,
                          borderColor: customColors.primary
                        }
                      }}
                    >
                      Пример
                    </StyledButton>
                  </Box>
                </motion.div>
              </MobileResponsiveBox>
            </Grid>
            <Grid item xs={12} md={5}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <QRCodeContainer>
                  {isQRVisible && (
                    <AnimatedQRCode
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <CenteredTypography variant="subtitle1" sx={{ mb: 2 }}>
                        Создайте мемориальную страницу близкого с историями фотографиями и видео
                      </CenteredTypography>
                      <QRCode 
                        value={qrValue} 
                        size={isMobile ? 160 : 200} 
                        bgColor="#FFFFFF"
                        fgColor={customColors.primary}
                        level="M"
                        includeMargin={false}
                      />
                      <CenteredTypography variant="subtitle1" sx={{ mt: 2 }}>
                        Карта памяти
                      </CenteredTypography>
                    </AnimatedQRCode>
                  )}
                </QRCodeContainer>
              </motion.div>
            </Grid>
          </MobileResponsiveGrid>
        </HeroSection>

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

      {/* Интерактивная карта */}
        <MapCardSection id="map" ref={mapRef}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={mapInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" align="center" gutterBottom>
                Карта памяти
              </Typography>
              <Typography variant="h6" align="center" color="textSecondary">
                Присоединяйтесь к растущему сообществу по всему миру
              </Typography>
            </motion.div>
          </Box>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mapInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <MapSection>
              <UserCounter
                initial={{ opacity: 0, scale: 0.9 }}
                animate={mapInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {totalUsers}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  пользователей
                </Typography>
              </UserCounter>
              
              <MapControls>
                <TextField
                  fullWidth
                  placeholder="Поиск по имени или месту..."
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                
                {isLocationLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      startIcon={<Search />}
                      fullWidth
                    >
                      Рядом со мной
                    </Button>
                  </Box>
                )}
                
                {filteredMarkers.length > 0 && (
                  <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Результаты ({filteredMarkers.length})
                    </Typography>
                    {filteredMarkers.map(marker => (
                      <UserListItem 
                        key={marker.id}
                        user={marker}
                        onClick={() => handleNavigateToProfile(marker.profileUrl)}
                      />
                    ))}
                  </Box>
                )}
              </MapControls>
              
              <MapContainer 
                center={[55.7558, 37.6173]} 
                zoom={9} 
                style={{ height: '100%', width: '100%' }} 
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <LocateMe onLocate={handleLocate} />
                
                {filteredMarkers.map(marker => (
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
                
                {selectedLocation && (
                  <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
                )}
              </MapContainer>
            </MapSection>
          </motion.div>
        </MapCardSection>

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
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Alegreya, sans-serif' }}>
                    Регистрация
                  </Typography>
                  <Typography color="textSecondary" align="center" sx={{ fontFamily: 'Garamond, serif' }}>
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
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Garamond, serif' }}>
                    Создание уникальной страницы памяти
                  </Typography>
                  <Typography color="textSecondary" align="center" sx={{ fontFamily: 'Alegreya, sans-serif' }}>
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
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Alegreya, sans-serif' }}>
                    Формирование семейного древа
                  </Typography>
                  <Typography color="textSecondary" align="center" sx={{ fontFamily: 'Garamond, serif' }}>
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
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Garamond, serif' }}>
                    Размещение QR-кода
                  </Typography>
                  <Typography color="textSecondary" align="center" sx={{ fontFamily: 'Alegreya, sans-serif' }}>
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
                  <Typography paragraph align="center">
                    При создании и использовании страниц памяти, пожалуйста, соблюдайте следующие правила:
                  </Typography>
                  <Typography component="ul" sx={{ pl: 2 }} align="center">
                    <li>Размещайте только контент, на который имеете права</li>
                    <li>Уважайте память и достоинство людей</li>
                    <li>Не используйте платформу для распространения недостоверной информации</li>
                    <li>Не нарушайте законодательство Российской Федерации</li>
                  </Typography>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
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

      {/* Пример */}
        <ExampleSection id="example" ref={exampleRef}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={exampleInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" align="center" gutterBottom>
                Пример страницы
              </Typography>
              <Typography variant="h6" align="center" color="textSecondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                Посмотрите, как может выглядеть страница памяти
              </Typography>
            </motion.div>
          </Box>
          
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={exampleInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Link to="/social/example" style={{ textDecoration: 'none' }}>
                  <ExampleCard>
                    <CardMedia
                      component="img"
                      height="300"
                      image="https://source.unsplash.com/random/800x400/?memorial"
                      alt="Пример страницы памяти"
                    />
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Пример страницы памяти
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph align="center">
                        Это демонстрационная страница, показывающая возможности платформы. Вы можете оформить похожую страницу для сохранения памяти о дорогом вам человеке.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<RemoveRedEye />}
                        fullWidth
                      >
                        Посмотреть пример
                      </Button>
                    </CardContent>
                  </ExampleCard>
                </Link>
              </motion.div>
            </Grid>
          </Grid>
        </ExampleSection>

      {/* Нижний QR-код */}
        <BottomQrSection id="bottom-qr" ref={bottomQrRef}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={bottomQrInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h4" gutterBottom>
                Начните сейчас
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
                    <Typography variant="subtitle1" align="center" sx={{ mt: 2 }}>
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
  );
};

export default Landing; 