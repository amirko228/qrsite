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

const StyledSection = styled(Box)`
  padding: 80px 0;
  background: #fff;
  animation: ${fadeIn} 1s ease-out;
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

const InfoBlock = styled(motion.div)`
  padding: 30px;
  background: #f8f9fa;
  border-radius: 16px;
  margin-bottom: 20px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const QRCodeContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
`;

const AnimatedQRCode = styled(motion.div)`
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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

const InfoBlockTitle = styled(Typography)`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`;

const StepCard = styled(motion.div)`
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
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

const Landing: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [qrValue, setQrValue] = useState('https://socialqr.app/demo');
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
    <Box sx={{ overflow: 'hidden', pb: 10 }}>
      {/* Hero Section */}
      <StyledSection ref={heroRef}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <Typography variant="h2" component="h1" gutterBottom>
                    Вспомнить все
                  </Typography>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Typography variant="h5" color="textSecondary" paragraph>
                    Сохрани память о родных и близких в цифровом пространстве. Поделитесь воспоминаниями через Qr-код.
                  </Typography>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="large"
                      onClick={handleCreateProfile}
                    >
                      Создать страницу
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large"
                      onClick={() => scrollToSection('how-it-works')}
                    >
                      Узнать больше
                    </Button>
                  </Box>
                </motion.div>
              </Box>
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
                      <QRCode value={qrValue} size={200} />
                      <Typography variant="subtitle1" align="center" sx={{ mt: 2 }}>
                        Отсканируйте, чтобы увидеть пример
                      </Typography>
                    </AnimatedQRCode>
                  )}
                </QRCodeContainer>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </StyledSection>

      {/* Что это такое */}
      <StyledSection id="what-is" ref={whatIsRef} component="section" sx={{ background: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={whatIsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" component="h2" gutterBottom>
                Что это такое
              </Typography>
              <Typography variant="h6" color="textSecondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                SocialQR — цифровая платформа для сохранения и передачи памяти о близких людях
              </Typography>
            </motion.div>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={whatIsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <InfoBlock>
                  <InfoBlockTitle variant="h5">
                    <Info color="primary" /> Мемориальная страница
                  </InfoBlockTitle>
                  <Typography>
                    Персональное пространство в интернете, посвященное памяти о человеке. Здесь можно собрать фотографии, истории и воспоминания.
                  </Typography>
                </InfoBlock>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={whatIsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <InfoBlock>
                  <InfoBlockTitle variant="h5">
                    <QrCode color="primary" /> Доступ через QR-код
                  </InfoBlockTitle>
                  <Typography>
                    Уникальный QR-код для каждой страницы, который можно разместить на памятнике или в памятных местах.
                  </Typography>
                </InfoBlock>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={whatIsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <InfoBlock>
                  <InfoBlockTitle variant="h5">
                    <Security color="primary" /> Надежное хранение
                  </InfoBlockTitle>
                  <Typography>
                    Безопасное хранение всех материалов с возможностью управления доступом и конфиденциальностью.
                  </Typography>
                </InfoBlock>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </StyledSection>

      {/* Зачем это нужно */}
      <StyledSection id="why-us" ref={whyUsRef} component="section">
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={whyUsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" component="h2" gutterBottom>
                Зачем это нужно
              </Typography>
              <Typography variant="h6" color="textSecondary" sx={{ maxWidth: 800, mx: 'auto' }}>
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
                <InfoBlock>
                  <InfoBlockTitle variant="h5">
                    <Lightbulb color="primary" /> Сохранение истории
                  </InfoBlockTitle>
                  <Typography>
                    Создайте цифровой архив воспоминаний и историй, которые иначе могли бы быть забыты со временем.
                  </Typography>
                </InfoBlock>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={whyUsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <InfoBlock>
                  <InfoBlockTitle variant="h5">
                    <AccessTime color="primary" /> Связь поколений
                  </InfoBlockTitle>
                  <Typography>
                    Дайте возможность будущим поколениям узнать о своих предках, их жизни и достижениях.
                  </Typography>
                </InfoBlock>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </StyledSection>

      {/* Интерактивная карта */}
      <StyledSection id="map" ref={mapRef} component="section" sx={{ background: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={mapInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" component="h2" gutterBottom>
                Наши пользователи
              </Typography>
              <Typography variant="h6" color="textSecondary">
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
                zoom={4} 
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
        </Container>
      </StyledSection>

      {/* Как это работает */}
      <StyledSection id="how-it-works" ref={howItWorksRef} component="section">
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" component="h2" gutterBottom>
                Как это работает
              </Typography>
              <Typography variant="h6" color="textSecondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                Создайте мемориальную страницу всего за несколько шагов
              </Typography>
            </motion.div>
          </Box>
          
          <Box sx={{ mb: 6 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <StepCard>
                <StepNumber>1</StepNumber>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Регистрация
                  </Typography>
                  <Typography color="textSecondary">
                    Создайте аккаунт, указав базовую информацию о себе.
                  </Typography>
                </Box>
              </StepCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <StepCard>
                <StepNumber>2</StepNumber>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Создание страницы
                  </Typography>
                  <Typography color="textSecondary">
                    Добавьте фото, видео, биографию и другую информацию с помощью визуального конструктора.
                  </Typography>
                </Box>
              </StepCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <StepCard>
                <StepNumber>3</StepNumber>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Получение QR-кода
                  </Typography>
                  <Typography color="textSecondary">
                    Система автоматически сгенерирует уникальный QR-код для доступа к странице.
                  </Typography>
                </Box>
              </StepCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <StepCard>
                <StepNumber>4</StepNumber>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Размещение QR-кода
                  </Typography>
                  <Typography color="textSecondary">
                    Разместите QR-код на памятнике, в мемориальных местах или поделитесь им с близкими.
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
                color="primary" 
                size="large"
                onClick={handleCreateProfile}
              >
                Создать страницу
              </Button>
            </motion.div>
          </Box>
        </Container>
      </StyledSection>

      {/* Условия */}
      <StyledSection id="terms" ref={termsRef} component="section" sx={{ background: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={termsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" component="h2" gutterBottom>
                Условия использования
              </Typography>
              <Typography variant="h6" color="textSecondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                Важная информация о наших правилах и подписке
              </Typography>
            </motion.div>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={termsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <InfoBlock>
                  <InfoBlockTitle variant="h5">
                    <GavelOutlined color="primary" /> Правила использования
                  </InfoBlockTitle>
                  <Typography paragraph>
                    При создании и использовании мемориальных страниц, пожалуйста, соблюдайте следующие правила:
                  </Typography>
                  <Typography component="ul" sx={{ pl: 2 }}>
                    <li>Размещайте только контент, на который имеете права</li>
                    <li>Уважайте память и достоинство людей</li>
                    <li>Не используйте платформу для распространения недостоверной информации</li>
                    <li>Не нарушайте законодательство своей страны</li>
                  </Typography>
                  <Box sx={{ mt: 2 }}>
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
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={termsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <InfoBlock>
                  <InfoBlockTitle variant="h5">
                    <CheckCircle color="primary" /> Подписка и хранение
                  </InfoBlockTitle>
                  <Typography paragraph>
                    Подписка на наш сервис дает вам следующие преимущества:
                  </Typography>
                  <Typography component="ul" sx={{ pl: 2 }}>
                    <li>Безлимитный доступ к странице для посетителей</li>
                    <li>Гарантированное хранение до 5 ГБ информации</li>
                    <li>Возможность связывать профили в семейное древо</li>
                    <li>Экспорт данных в любой момент</li>
                    <li>Техническая поддержка</li>
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      component={Link} 
                      to="/pricing" 
                      variant="outlined" 
                      size="small"
                    >
                      Узнать о ценах
                    </Button>
                  </Box>
                </InfoBlock>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </StyledSection>

      {/* Пример */}
      <StyledSection id="example" ref={exampleRef} component="section">
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={exampleInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h3" component="h2" gutterBottom>
                Пример страницы
              </Typography>
              <Typography variant="h6" color="textSecondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                Посмотрите, как может выглядеть мемориальная страница
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
                      alt="Пример мемориальной страницы"
                    />
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Пример мемориальной страницы
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
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
        </Container>
      </StyledSection>

      {/* Нижний QR-код */}
      <StyledSection id="bottom-qr" ref={bottomQrRef} component="section" sx={{ background: '#f8f9fa' }}>
        <Container maxWidth="lg">
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
                Отсканируйте QR-код или нажмите кнопку, чтобы создать мемориальную страницу
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
                    <QRCode value={qrValue} size={200} />
                    <Typography variant="subtitle1" align="center" sx={{ mt: 2 }}>
                      QR-код для доступа к примеру
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
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleCreateProfile}
                sx={{ px: 4, py: 1.5 }}
              >
                Создать свою страницу
              </Button>
            </motion.div>
          </Box>
        </Container>
      </StyledSection>

      <FloatingButton 
        color="primary" 
        variant="contained"
        onClick={handleCreateProfile}
        aria-label="Create profile"
      >
        <Add />
      </FloatingButton>
    </Box>
  );
};

export default Landing; 