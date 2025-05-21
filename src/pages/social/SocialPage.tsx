import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Grid, 
  TextField, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  CircularProgress, 
  Tooltip,
  useTheme,
  Alert,
  AlertTitle,
  LinearProgress,
  Fab,
  useMediaQuery
} from '@mui/material';
import { 
  Add, 
  Delete, 
  Edit, 
  Image, 
  TextFields, 
  Link as LinkIcon, 
  YouTube, 
  Instagram, 
  Facebook, 
  Twitter, 
  AccountBox, 
  QrCode, 
  Share, 
  FamilyRestroom,
  DragIndicator,
  AccountCircle
} from '@mui/icons-material';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import FamilyTreeWidget from '../../components/widgets/FamilyTreeWidget';
import QRCode from 'react-qr-code';
import { useAuth } from '../../contexts/AuthContext';
import { Block as ConstructorBlock } from '../constructor/types';
import Constructor from '../constructor/Constructor';

// Типы виджетов
const WIDGET_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  SOCIAL: 'social',
  YOUTUBE: 'youtube',
  PROFILE_INFO: 'profile_info',
  FAMILY_TREE: 'family_tree'
};

// Тип Social для социальных сетей
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SocialData {
  type: 'instagram' | 'facebook' | 'twitter' | 'custom';
  url: string;
  username?: string;
}

// Интерфейс виджета
interface Widget {
  id: string;
  type: string;
  content: any;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  zIndex: number;
  borderRadius?: number;
  template?: string;
}

// Интерфейс профиля
interface Profile {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  theme: string;
  isPublic?: boolean;
  createdByAdmin?: boolean;
}

// Обновляем стили для основного контейнера профиля
const ProfileContainer = styled.div`
  width: 100%;
  max-width: 100%; /* Изменено с 1200px, чтобы контейнер мог быть шире */
  margin: 0 auto;
  padding: 32px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: auto; /* Позволяем прокручивать содержимое */
  min-height: 600px;
  position: relative; /* Добавлено для позиционирования */
  list-style: none; /* Убираем стиль списка */
  
  & ul, & ol, & li {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 0;
  }
`;

// Обновленный контейнер для виджета с поддержкой перетаскивания
const WidgetContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  margin-bottom: clamp(12px, 2vw, 24px);
  align-self: flex-start;
  max-width: 100%;
  box-sizing: border-box; /* Учитываем padding в размере */
  overflow: visible; /* Позволяем тени выходить за края контейнера */
  
  &:active {
    cursor: grabbing;
    z-index: 10;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 10px;
  }
`;

// Анимация для плавного перемещения виджетов
const widgetContainerVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.96
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 20,
      mass: 0.8
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.96,
    transition: {
      duration: 0.3
    }
  }
};

// Улучшим обработчик перетаскивания для виджетов
const WidgetElement = styled.div<{
  $backgroundColor?: string;
  $textColor?: string;
  $isSelected?: boolean;
  $isDragging?: boolean;
}>`
  border-radius: 12px;
  overflow: hidden;
  background-color: ${props => props.$backgroundColor || 'white'};
  color: ${props => props.$textColor || 'inherit'};
  position: relative;
  transition: box-shadow 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: ${props => 
    props.$isDragging 
      ? '0 15px 35px rgba(0, 0, 0, 0.25)' 
      : props.$isSelected 
        ? '0 5px 15px rgba(0, 0, 0, 0.15)' 
        : '0 2px 10px rgba(0, 0, 0, 0.08)'
  };
  transform: ${props => props.$isDragging ? 'scale(1.03)' : 'scale(1)'};
  touch-action: none;
  padding: 16px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  word-break: break-word;
  will-change: transform, box-shadow;
  
  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
  
  /* Более заметные стили при выборе виджета */
  ${props => props.$isSelected && `
    outline: 3px solid #2196f3;
    box-shadow: 0 8px 25px rgba(33, 150, 243, 0.35);
  `}
  
  ${props => props.$isDragging && `
  z-index: 10;
  `}
  
  @media (max-width: 768px) {
    border-radius: 10px;
    padding: 12px;
  }
  
  @media (max-width: 480px) {
    border-radius: 8px;
    padding: 10px;
  }
`;

// Улучшаем стили для процесса перетаскивания виджетов
const DragHandle = styled.div`
  position: absolute;
  right: 16px;
  top: 16px;
  cursor: grab;
  opacity: 0.7;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 10;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }

  ${WidgetElement}:hover & {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    right: 12px;
    top: 12px;
  }
  
  @media (max-width: 480px) {
    right: 10px;
    top: 10px;
  }
`;

// Визуальный индикатор места перетаскивания
const DropIndicator = styled.div<{ isActive: boolean }>`
  width: 100%;
  height: 4px;
  background-color: ${props => props.isActive ? '#2196f3' : 'transparent'};
  margin: 8px 0;
  transition: all 0.3s ease;
  border-radius: 4px;
`;
  
// Контролы виджета
const WidgetControls = styled.div`
    position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  ${WidgetElement}:hover & {
      opacity: 1;
      transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Создание нового виджета
const createWidget = (type: string): Widget => {
  let content = {};
  let width = 200;
  let height = 100;
  let backgroundColor = '#ffffff';
  let textColor = '#212529';
  
  switch (type) {
    case WIDGET_TYPES.TEXT:
      content = { text: 'Нажмите для редактирования текста' };
      width = 300;
      height = 150;
      backgroundColor = '#f8f9ff';
      textColor = '#333744';
      break;
    case WIDGET_TYPES.IMAGE:
      content = { url: 'https://source.unsplash.com/random/300x200', caption: 'Подпись к изображению' };
      width = 320;
      height = 250;
      backgroundColor = '#f0f7ff';
      textColor = '#2c3e50';
      break;
    case WIDGET_TYPES.SOCIAL:
      content = { type: 'instagram', username: 'username', url: 'https://instagram.com/username' };
      width = 250;
      height = 80;
      backgroundColor = '#f6f5ff';
      textColor = '#4527a0';
      break;
    case WIDGET_TYPES.YOUTUBE:
      content = { videoId: 'dQw4w9WgXcQ', caption: 'Видео с YouTube' };
      width = 400;
      height = 300;
      backgroundColor = '#fff7f7';
      textColor = '#b71c1c';
      break;
    case WIDGET_TYPES.PROFILE_INFO:
      content = { title: 'Обо мне', description: 'Расскажите о себе' };
      width = 350;
      height = 150;
      backgroundColor = '#e8f5e9';
      textColor = '#1b5e20';
      break;
    case WIDGET_TYPES.FAMILY_TREE:
      content = { 
        title: 'Семейное древо', 
        members: [],
        userId: 'user123' 
      };
      width = 600;
      height = 400;
      backgroundColor = '#e3f2fd';
      textColor = '#0d47a1';
      break;
  }
  
  return {
    id: Date.now().toString(),
    type,
    content,
    x: 0, // Не используется в новом макете
    y: 0, // Не используется в новом макете
    width, // Будет использоваться для указания макс. ширины
    height, // Минимальная высота
    backgroundColor, // Используем улучшенные цвета фона
    textColor, // Улучшенные цвета текста для контраста
    zIndex: 1,
    borderRadius: 2
  };
};

// Стили для страницы с блюром (для неоплаченной подписки)
const BlurredPage = styled.div`
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SubscriptionWarning = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  z-index: 1000;
  text-align: center;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StorageIndicator = styled(Box)`
  margin: 16px 0;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
`;

// Демо-данные для профилей пользователей
const demoProfiles: Record<string, Profile> = {
  'ivan': {
    id: 'ivan',
    name: 'Иван Петров',
    bio: 'Историк, люблю путешествовать и изучать новые места. Моя страница посвящена памяти моей семьи.',
    avatar: 'https://source.unsplash.com/random/300x300/?man',
    theme: 'light'
  },
  'anna': {
    id: 'anna',
    name: 'Анна Смирнова',
    bio: 'Фотограф, снимаю природу и города. Храню воспоминания о близких через фотографии и истории.',
    avatar: 'https://source.unsplash.com/random/300x300/?woman',
    theme: 'light'
  },
  'mikhail': {
    id: 'mikhail',
    name: 'Михаил Козлов',
    bio: 'Инженер, люблю горы и велосипеды. Создал эту страницу в память о моих родителях.',
    avatar: 'https://source.unsplash.com/random/300x300/?man2',
    theme: 'light'
  },
  'elena': {
    id: 'elena',
    name: 'Елена Морозова',
    bio: 'Художник, живу у моря. Делюсь воспоминаниями о моих предках и их историях.',
    avatar: 'https://source.unsplash.com/random/300x300/?woman2',
    theme: 'light'
  },
  'user123': {
    id: 'user123',
    name: 'Текущий пользователь',
    bio: 'Память о близком человеке',
    avatar: 'https://source.unsplash.com/random/300x300/?portrait',
    theme: 'light'
  }
};

// Демо-данные виджетов для разных профилей
const getDemoWidgets = (profileId: string, profileName: string, profileBio: string): Widget[] => {
  const widgetsByProfile: Record<string, Widget[]> = {
    'ivan': [
      {
        id: '1',
        type: WIDGET_TYPES.PROFILE_INFO,
        content: { 
          title: 'Привет, я Иван Петров', 
          description: 'Историк, люблю путешествовать и изучать новые места. Моя страница посвящена памяти моей семьи.'
        },
        x: 50,
        y: 50,
        width: 400,
        height: 150,
        backgroundColor: '#e3f2fd',
        textColor: '#0d47a1',
        zIndex: 1,
        borderRadius: 2
      },
      {
        id: '2',
        type: WIDGET_TYPES.IMAGE,
        content: {
          url: 'https://source.unsplash.com/random/300x200/?history',
          caption: 'Исторические места, которые я посетил'
        },
        x: 50,
        y: 220,
        width: 300,
        height: 240,
        backgroundColor: '#fff',
        textColor: '#212529',
        zIndex: 1,
        borderRadius: 2
      },
      {
        id: '3',
        type: WIDGET_TYPES.FAMILY_TREE,
        content: {
          title: 'Моя семья', 
          members: [],
          userId: 'ivan'
        },
        x: 370,
        y: 220,
        width: 500,
        height: 300,
        backgroundColor: '#f5f5f5',
        textColor: '#333',
        zIndex: 1,
        borderRadius: 2
      }
    ],
    'anna': [
      {
        id: '1',
        type: WIDGET_TYPES.PROFILE_INFO,
        content: { 
          title: 'Фотограф Анна Смирнова', 
          description: 'Фотограф, снимаю природу и города. Храню воспоминания о близких через фотографии и истории.'
        },
        x: 50,
        y: 50,
        width: 400,
        height: 150,
        backgroundColor: '#fff3e0',
        textColor: '#e65100',
        zIndex: 1,
        borderRadius: 2
      },
      {
        id: '2',
        type: WIDGET_TYPES.IMAGE,
        content: {
          url: 'https://source.unsplash.com/random/300x200/?camera',
          caption: 'Моя любимая камера'
        },
        x: 50,
        y: 220,
        width: 300,
        height: 240,
        backgroundColor: '#fff',
        textColor: '#212529',
        zIndex: 1,
        borderRadius: 2
      },
      {
        id: '3',
        type: WIDGET_TYPES.SOCIAL,
        content: {
          type: 'instagram',
          username: 'annaphoto',
          url: 'https://instagram.com/annaphoto'
        },
        x: 370,
        y: 220,
        width: 250,
        height: 80,
        backgroundColor: '#fce4ec',
        textColor: '#c2185b',
        zIndex: 1,
        borderRadius: 2
      }
    ],
    'mikhail': [
      {
        id: '1',
        type: WIDGET_TYPES.PROFILE_INFO,
        content: { 
          title: 'Михаил Козлов - инженер и путешественник', 
          description: 'Инженер, люблю горы и велосипеды. Создал эту страницу в память о моих родителях.'
        },
        x: 50,
        y: 50,
        width: 400,
        height: 150,
        backgroundColor: '#e8f5e9',
        textColor: '#2e7d32',
        zIndex: 1,
        borderRadius: 2
      },
      {
        id: '2',
        type: WIDGET_TYPES.IMAGE,
        content: {
          url: 'https://source.unsplash.com/random/300x200/?mountains',
          caption: 'Мои походы в горы'
        },
        x: 50,
        y: 220,
        width: 300,
        height: 240,
        backgroundColor: '#fff',
        textColor: '#212529',
        zIndex: 1,
        borderRadius: 2
      },
      {
        id: '3',
        type: WIDGET_TYPES.YOUTUBE,
        content: {
          videoId: '3ZiMvhIO-d4',
          caption: 'Мое велопутешествие'
        },
        x: 370,
        y: 220,
        width: 400,
        height: 300,
        backgroundColor: '#f5f5f5',
        textColor: '#333',
        zIndex: 1,
        borderRadius: 2
      }
    ],
    'elena': [
      {
        id: '1',
        type: WIDGET_TYPES.PROFILE_INFO,
        content: { 
          title: 'Елена Морозова - художник', 
          description: 'Художник, живу у моря. Делюсь воспоминаниями о моих предках и их историях.'
        },
        x: 50,
        y: 50,
        width: 400,
        height: 150,
        backgroundColor: '#e0f7fa',
        textColor: '#006064',
        zIndex: 1,
        borderRadius: 2
      },
      {
        id: '2',
        type: WIDGET_TYPES.IMAGE,
        content: {
          url: 'https://source.unsplash.com/random/300x200/?art',
          caption: 'Мои работы'
        },
        x: 50,
        y: 220,
        width: 300,
        height: 240,
        backgroundColor: '#fff',
        textColor: '#212529',
        zIndex: 1,
        borderRadius: 2
      },
      {
        id: '3',
        type: WIDGET_TYPES.TEXT,
        content: {
          text: 'Искусство для меня - это способ сохранить память о моих близких. Через свои картины я передаю истории их жизни и наследие, которое они оставили.'
        },
        x: 370,
        y: 220,
        width: 350,
        height: 200,
        backgroundColor: '#f5f5f5',
        textColor: '#333',
        zIndex: 1,
        borderRadius: 2
      }
    ]
  };

  // Возвращаем виджеты для конкретного профиля или дефолтные виджеты
  if (widgetsByProfile[profileId]) {
    return widgetsByProfile[profileId];
  }

  // Дефолтные виджеты, если для id нет готовых
  return [
    {
      id: '1',
      type: WIDGET_TYPES.PROFILE_INFO,
      content: { 
        title: 'Привет, я ' + profileName, 
        description: profileBio || 'Добро пожаловать на страницу памяти! Здесь вы можете узнать больше о человеке.'
      },
      x: 50,
      y: 50,
      width: 400,
      height: 150,
      backgroundColor: '#e3f2fd',
      textColor: '#0d47a1',
      zIndex: 1,
      borderRadius: 2
    },
    {
      id: '2',
      type: WIDGET_TYPES.IMAGE,
      content: {
        url: 'https://source.unsplash.com/random/300x200/?nature',
        caption: 'Люблю природу и путешествия'
      },
      x: 50,
      y: 220,
      width: 300,
      height: 240,
      backgroundColor: '#fff',
      textColor: '#212529',
      zIndex: 1,
      borderRadius: 2
    },
    {
      id: '3',
      type: WIDGET_TYPES.TEXT,
      content: {
        text: 'Это текстовый блок, где вы можете рассказать о своих увлечениях, хобби или поделиться мыслями.'
      },
      x: 370,
      y: 220,
      width: 350,
      height: 200,
      backgroundColor: '#f5f5f5',
      textColor: '#333',
      zIndex: 1,
      borderRadius: 2
    }
  ];
};

// Стили для плавающей кнопки - устанавливаем display: none всегда
const FloatingActionButton = styled(Fab)`
  display: none !important; // Полностью скрываем кнопку для всех устройств
`;

// В верхней части файла, где импорты
// Добавим определение production-режима
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const MOCK_API = isProduction; // Всегда используем мок-данные в продакшн

// QR-код диалог - компонент
interface QRCodeDialogProps {
  open: boolean;
  onClose: () => void;
  profileUrl: string;
  onCopyLink: () => void;
}

const QRCodeDialog: React.FC<QRCodeDialogProps> = ({ 
  open, 
  onClose, 
  profileUrl, 
  onCopyLink 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: { xs: '10px', sm: '16px' },
          p: { xs: 0.5, sm: 1.5 },
          width: { xs: 'calc(100% - 16px)', sm: 'auto' },
          m: { xs: '8px', sm: '32px' }
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          fontSize: { xs: '0.95rem', sm: '1.25rem' },
          pt: { xs: 1, sm: 2 },
          pb: { xs: 0.5, sm: 1 },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        QR-код вашего профиля
      </DialogTitle>
      <DialogContent>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 2 },
          py: { xs: 0.5, sm: 1.5 }
        }}>
          <Box 
            sx={{ 
              padding: { xs: 0.5, sm: 2 },
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}
          >
            <QRCode 
              value={profileUrl} 
              size={Math.min(window.innerWidth * 0.4, 180)}
            />
          </Box>
          <Typography 
            variant="body2"
            sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.875rem' },
              wordBreak: 'break-all',
              textAlign: 'center',
              px: { xs: 0.5, sm: 2 }
            }}
          >
            {profileUrl}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Share sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }} />}
            onClick={onCopyLink}
            size={window.innerWidth < 600 ? "small" : "medium"}
            sx={{ 
              mt: { xs: 0.5, sm: 1 }, 
              fontSize: { xs: '0.7rem', sm: '0.875rem' },
              borderRadius: '8px',
              py: { xs: 0.3, sm: 'auto' },
              px: { xs: 1, sm: 'auto' },
            }}
          >
            Копировать ссылку
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: { xs: 'center', sm: 'flex-end' }, p: { xs: 1, sm: 2 } }}>
        <Button 
          onClick={onClose}
          size={window.innerWidth < 600 ? "small" : "medium"}
          sx={{ 
            fontSize: { xs: '0.7rem', sm: '0.875rem' },
            borderRadius: '8px',
            py: { xs: 0.3, sm: 'auto' },
            px: { xs: 1, sm: 'auto' },
          }}
        >
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Главный компонент страницы
const SocialPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const theme = useTheme();

  // Состояния для UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQRCodeDialogOpen, setIsQRCodeDialogOpen] = useState<boolean>(false);
  
  // Состояния для профиля
  const [profile, setProfile] = useState<Profile>({
    id: '',
    name: '',
    bio: '',
    avatar: '',
      theme: 'light'
  });
  
  // Состояния для данных из конструктора
  const [constructorBackgroundColor, setConstructorBackgroundColor] = useState<string>('#ffffff');
  const [constructorBlocks, setConstructorBlocks] = useState<ConstructorBlock[]>([]);
  const [showOnMap, setShowOnMap] = useState<boolean>(true);
  
  const isOwner = !id && isLoggedIn;
  const viewingId = id || (user?.username || '');

  // Базовые функции для работы со страницей
  const getProfileUrl = useCallback(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/social/${id || user?.username}`;
  }, [id, user]);

  const handleCopyProfileLink = useCallback(() => {
    navigator.clipboard.writeText(getProfileUrl());
  }, [getProfileUrl]);

  const handleOpenQRCodeDialog = useCallback(() => {
    setIsQRCodeDialogOpen(true);
  }, []);

  const handleCloseQRCodeDialog = useCallback(() => {
    setIsQRCodeDialogOpen(false);
  }, []);

  // Загрузка данных конструктора при первом рендеринге
  useEffect(() => {
    const userId = id || (user?.username || '');
    const storageKey = userId ? `pageMemoryData_${userId}` : 'pageMemoryData';
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setConstructorBlocks(parsedData.blocks || []);
        setConstructorBackgroundColor(parsedData.backgroundColor || '#ffffff');
        setShowOnMap(parsedData.showOnMap !== undefined ? parsedData.showOnMap : true);
      } catch (e) {
        console.error(`Ошибка при загрузке сохраненных данных конструктора для пользователя ${userId}:`, e);
      }
    }
  }, [id, user]);

  // Загрузка профиля пользователя
  useEffect(() => {
    if (!user && !id) return;
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Для демо-профилей
        if (id && demoProfiles[id]) {
          setProfile(demoProfiles[id]);
          setLoading(false);
          return;
        }
        
        const userId = id || (user?.username || '');
        const loadUserProfile = async (userId: string) => {
          const profileKey = `profile_${userId}`;
          try {
            const savedProfile = localStorage.getItem(profileKey);
            return savedProfile ? JSON.parse(savedProfile) : null;
          } catch (e) {
            console.error('Ошибка при загрузке профиля:', e);
            return null;
          }
        };
        
        const userProfile = await loadUserProfile(userId);
        if (userProfile) {
          setProfile(userProfile);
        } else {
          const newProfile: Profile = {
            id: userId,
            name: user?.name || '',
            bio: '',
            avatar: '',
            theme: 'light'
          };
          setProfile(newProfile);
        }
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке профиля:', error);
        setError('Не удалось загрузить данные профиля');
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [id, user]);

  return (
    <Container maxWidth="lg" sx={{ my: 4, px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          {profile.name || 'Страница памяти'}
          </Typography>
                  
                  {isOwner && (
          <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
              variant="outlined"
              startIcon={<QrCode />}
                    onClick={handleOpenQRCodeDialog}
            >
              QR-код
            </Button>
                    </Box>
        )}
          </Box>
          
      {/* Интегрируем конструктор прямо на страницу */}
      <Constructor 
        savedData={{
          blocks: constructorBlocks,
          backgroundColor: constructorBackgroundColor,
          showOnMap
        }}
        userId={viewingId}
      />
      
      {/* QR код диалог */}
      <QRCodeDialog
        open={isQRCodeDialogOpen} 
        onClose={handleCloseQRCodeDialog}
        profileUrl={getProfileUrl()}
        onCopyLink={handleCopyProfileLink}
      />
    </Container>
  );
};

export default SocialPage; 