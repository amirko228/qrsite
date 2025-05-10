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
  Save,
  FamilyRestroom,
  DragIndicator
} from '@mui/icons-material';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import FamilyTreeWidget from '../../components/widgets/FamilyTreeWidget';
import QRCode from 'react-qr-code';
import { useAuth } from '../../contexts/AuthContext';
import WidgetPalettePanel from '../../components/WidgetPalettePanel';

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
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* Предотвращаем выход содержимого за края */
  
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

// Компонент для редактирования виджета
const WidgetEditor: React.FC<{
  widget: Widget | null;
  open: boolean;
  onClose: () => void;
  onSave: (widget: Widget) => void;
  storageLimit: number;
  storageUsed: number;
}> = ({ widget, open, onClose, onSave, storageLimit, storageUsed }) => {
  const [editedWidget, setEditedWidget] = useState<Widget | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useTheme();
  
  useEffect(() => {
    if (widget) {
      setEditedWidget({ ...widget });
    }
  }, [widget]);
  
  if (!editedWidget) return null;
  
  const handleContentChange = (field: string, value: any) => {
    setEditedWidget({
      ...editedWidget,
      content: { ...editedWidget.content, [field]: value }
    });
  };
  
  const handleChange = (field: string, value: any) => {
    setEditedWidget({
      ...editedWidget,
      [field]: value
    });
  };
  
  const handleSave = () => {
    onSave(editedWidget);
    onClose();
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Проверка на оставшееся доступное хранилище
      const fileSizeMB = file.size / (1024 * 1024);
      const remainingStorage = storageLimit - storageUsed;
      
      if (fileSizeMB > remainingStorage) {
        setFileSizeWarning(`Файл слишком большой (${fileSizeMB.toFixed(2)} МБ). Оставшееся место: ${remainingStorage.toFixed(2)} МБ`);
        return;
      }
      
      setFileSizeWarning(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (editedWidget) {
          const content = { ...editedWidget.content, url: reader.result as string };
          setEditedWidget({ ...editedWidget, content });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Определение полей редактирования в зависимости от типа виджета
  const renderContentEditor = () => {
    switch (editedWidget.type) {
      case WIDGET_TYPES.TEXT:
        return (
          <TextField
            fullWidth
            label="Текст"
            multiline
            rows={4}
            value={editedWidget.content.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
          />
        );
      
      case WIDGET_TYPES.IMAGE:
        return (
          <>
            <TextField
              fullWidth
              label="URL изображения"
              value={editedWidget.content.url || ''}
              onChange={(e) => handleContentChange('url', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
            <TextField
              fullWidth
              label="Подпись"
              value={editedWidget.content.caption || ''}
              onChange={(e) => handleContentChange('caption', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
          </>
        );
      
      case WIDGET_TYPES.SOCIAL:
        return (
          <>
            <TextField
              select
              fullWidth
              label="Тип социальной сети"
              value={editedWidget.content.type || 'custom'}
              onChange={(e) => handleContentChange('type', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            >
              <MenuItem value="instagram">Instagram</MenuItem>
              <MenuItem value="facebook">Facebook</MenuItem>
              <MenuItem value="twitter">Twitter</MenuItem>
              <MenuItem value="custom">Другое</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Имя пользователя"
              value={editedWidget.content.username || ''}
              onChange={(e) => handleContentChange('username', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
            <TextField
              fullWidth
              label="URL"
              value={editedWidget.content.url || ''}
              onChange={(e) => handleContentChange('url', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
          </>
        );
      
      case WIDGET_TYPES.YOUTUBE:
        return (
          <>
            <TextField
              fullWidth
              label="ID видео YouTube"
              value={editedWidget.content.videoId || ''}
              onChange={(e) => handleContentChange('videoId', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
              helperText="Например, dQw4w9WgXcQ из URL https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            />
            <TextField
              fullWidth
              label="Подпись"
              value={editedWidget.content.caption || ''}
              onChange={(e) => handleContentChange('caption', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
          </>
        );
      
      case WIDGET_TYPES.PROFILE_INFO:
        return (
          <>
            <TextField
              fullWidth
              label="Заголовок"
              value={editedWidget.content.title || ''}
              onChange={(e) => handleContentChange('title', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
            <TextField
              fullWidth
              label="Описание"
              multiline
              rows={3}
              value={editedWidget.content.description || ''}
              onChange={(e) => handleContentChange('description', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
          </>
        );
      
      default:
        return <Typography>Неизвестный тип виджета</Typography>;
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editedWidget.type === WIDGET_TYPES.TEXT && 'Текстовый блок'}
        {editedWidget.type === WIDGET_TYPES.IMAGE && 'Изображение'}
        {editedWidget.type === WIDGET_TYPES.SOCIAL && 'Социальная сеть'}
        {editedWidget.type === WIDGET_TYPES.YOUTUBE && 'YouTube видео'}
        {editedWidget.type === WIDGET_TYPES.PROFILE_INFO && 'Информация профиля'}
        {editedWidget.type === WIDGET_TYPES.FAMILY_TREE && 'Семейное древо'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
        {renderContentEditor()}
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>Внешний вид</Typography>
            <TextField
              fullWidth
              label="Ширина (px)"
              type="number"
              value={editedWidget.width}
              onChange={(e) => handleChange('width', parseInt(e.target.value) || 0)}
              margin="dense"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
            <TextField
              fullWidth
              label="Высота (px)"
              type="number"
              value={editedWidget.height}
              onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
              margin="dense"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Цвета</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2">Фон:</Typography>
              <Box 
                component="input" 
                type="color" 
                value={editedWidget.backgroundColor}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                sx={{ width: 40, height: 40, borderRadius: 1, border: 'none', cursor: 'pointer' }}
              />
              
              <Typography variant="body2" sx={{ ml: 2 }}>Текст:</Typography>
              <Box 
                component="input" 
                type="color" 
                value={editedWidget.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
                sx={{ width: 40, height: 40, borderRadius: 1, border: 'none', cursor: 'pointer' }}
                />
            </Box>
            
            {editedWidget.type === WIDGET_TYPES.IMAGE && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  <AlertTitle>Использование хранилища</AlertTitle>
                  {Math.round(storageUsed / 1024 / 1024)}MB из {Math.round(storageLimit / 1024 / 1024)}MB
                </Alert>
                <LinearProgress 
                  variant="determinate" 
                  value={(storageUsed / storageLimit) * 100} 
                  color={storageUsed > storageLimit * 0.8 ? "warning" : "primary"}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
};

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
    zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        zIndex: 1
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
        description: profileBio || 'Добро пожаловать в мой профиль! Здесь вы можете узнать больше обо мне.'
      },
      x: 50,
      y: 50,
      width: 400,
      height: 150,
      backgroundColor: '#e3f2fd',
      textColor: '#0d47a1',
      zIndex: 1
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
      zIndex: 1
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
      zIndex: 1
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
  
  // Основные состояния
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Состояния для UI
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isQRCodeDialogOpen, setIsQRCodeDialogOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Состояния для хранилища
  const [storageLimit] = useState<number>(100); // MB
  const [storageUsed, setStorageUsed] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<Profile>({
    id: '',
    name: '',
    bio: '',
    avatar: '',
      theme: 'light'
  });
  
  const isOwner = !id && isLoggedIn;
  const viewingId = id || (user?.username || '');

  // Определение типов виджетов
  const widgetTypes = [
    { type: WIDGET_TYPES.TEXT, label: 'Текст', icon: <TextFields /> },
    { type: WIDGET_TYPES.IMAGE, label: 'Изображение', icon: <Image /> },
    { type: WIDGET_TYPES.SOCIAL, label: 'Социальная сеть', icon: <Instagram /> },
    { type: WIDGET_TYPES.YOUTUBE, label: 'YouTube видео', icon: <YouTube /> },
    { type: WIDGET_TYPES.PROFILE_INFO, label: 'Информация профиля', icon: <AccountBox /> },
    { type: WIDGET_TYPES.FAMILY_TREE, label: 'Семейное древо', icon: <FamilyRestroom /> }
  ];

  // Обработчики
  const handlePaySubscription = useCallback(() => {
    navigate('/subscription');
  }, [navigate]);

  const formatLastSaved = useCallback(() => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSaved.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'только что';
    if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ч. назад`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн. назад`;
  }, [lastSaved]);

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

  const handleExportData = useCallback(() => {
    // TODO: Implement data export
    alert('Данные будут экспортированы в ZIP архив. Эта функция находится в разработке.');
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Перемещаем объявление calculateStorageUsed перед его использованием
  const calculateStorageUsed = useCallback((currentWidgets: Widget[]): number => {
    let totalSize = 0;
    
    currentWidgets.forEach(widget => {
      if (widget.type === WIDGET_TYPES.IMAGE) {
        totalSize += 2; // примерно 2 МБ на изображение
      } else if (widget.type === WIDGET_TYPES.YOUTUBE) {
        totalSize += 0.1; // метаданные занимают мало места
      }
    });
    
    return totalSize;
  }, []);

  const handleAddWidget = useCallback((type: string) => {
    const newWidget = createWidget(type);
    setWidgets(prev => [...prev, newWidget]);
    setSelectedWidgetId(newWidget.id);
    setAnchorEl(null);
    setIsEditorOpen(true);
    
    const updatedWidgets = [...widgets, newWidget];
    setStorageUsed(calculateStorageUsed(updatedWidgets));
  }, [widgets, calculateStorageUsed]);

  const handleWidgetSelect = useCallback((widgetId: string) => {
    setSelectedWidgetId(widgetId);
  }, []);

  const handleDeleteWidget = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const remainingWidgets = prev.filter(w => w.id !== widgetId);
      setStorageUsed(calculateStorageUsed(remainingWidgets));
      return remainingWidgets;
    });
    
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null);
    }
  }, [selectedWidgetId, calculateStorageUsed]);

  const handleEditWidget = useCallback((widgetId: string) => {
    setSelectedWidgetId(widgetId);
    setIsEditorOpen(true);
  }, []);

  const handleWidgetPositionChange = useCallback((widgetId: string, targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= widgets.length) return;
    
    setWidgets(prev => {
      const updatedWidgets = [...prev];
      const currentIndex = updatedWidgets.findIndex(w => w.id === widgetId);
      
      if (currentIndex === -1) return prev;
      
      // Извлекаем перемещаемый виджет
      const [movedWidget] = updatedWidgets.splice(currentIndex, 1);
      
      // Вставляем виджет в новую позицию
      updatedWidgets.splice(targetIndex, 0, movedWidget);
      
      return updatedWidgets;
    });
    
    // Используем вибрацию для обратной связи
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([20, 30, 20]); // Более короткая и плавная вибрация
    }
  }, [widgets.length]);

  const handleAddWidgetClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSaveWidget = useCallback((updatedWidget: Widget) => {
    setWidgets(prev => prev.map(w => w.id === updatedWidget.id ? updatedWidget : w));
    setIsEditorOpen(false);
  }, []);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Получаем ключи хранилища для текущего пользователя
  const getStorageKeys = (userId: string) => ({
    profile: `profile_${userId}`,
    widgets: `widgets_${userId}`,
    settings: `settings_${userId}`
  });
  
  // Загрузка профиля пользователя
  const loadUserProfile = useCallback(async (userId: string) => {
    const { profile: profileKey } = getStorageKeys(userId);
    try {
      const savedProfile = localStorage.getItem(profileKey);
      return savedProfile ? JSON.parse(savedProfile) : null;
      } catch (e) {
      console.error('Ошибка при загрузке профиля:', e);
      return null;
    }
  }, []);
  
  // Сохранение профиля пользователя
  const saveUserProfile = useCallback((userId: string, profile: Profile) => {
    const { profile: profileKey } = getStorageKeys(userId);
    try {
      localStorage.setItem(profileKey, JSON.stringify(profile));
      } catch (e) {
      console.error('Ошибка при сохранении профиля:', e);
    }
  }, []);
  
  // Эффект для загрузки профиля
  useEffect(() => {
    if (!user && !id) return; // Ждём появления user после входа
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Для демо-профилей
        if (!isOwner && id && demoProfiles[id]) {
          setProfile(demoProfiles[id]);
          setWidgets(getDemoWidgets(id, demoProfiles[id].name, demoProfiles[id].bio));
          setLoading(false);
          return;
        }
        const userId = id || (user?.username || '');
        const userProfile = await loadUserProfile(userId);
        if (userProfile) {
          if (!userProfile.name && user?.name) {
            userProfile.name = user.name;
            saveUserProfile(userId, userProfile);
          }
          setProfile(userProfile);
          const { widgets: widgetsKey } = getStorageKeys(userId);
          const savedWidgets = localStorage.getItem(widgetsKey);
          setWidgets(savedWidgets ? JSON.parse(savedWidgets) : []);
        } else {
          const newProfile: Profile = {
            id: userId,
            name: user?.name || '',
            bio: '',
            avatar: '',
            theme: 'light'
          };
          saveUserProfile(userId, newProfile);
          setProfile(newProfile);
          setWidgets([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке профиля:', error);
        setError('Не удалось загрузить данные профиля');
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [id, isOwner, user, isLoggedIn, loadUserProfile, saveUserProfile]);
  
  // Исправляем типы для обработчиков событий
  const handleSaveProfile = useCallback(async () => {
    try {
      if (!isOwner || !user?.username) return;
      
      setIsSaving(true);
      
      const userId = user.username;
      const finalProfile = {
        ...profile,
        id: userId,
        name: profile.name || user.name
      };
      
      saveUserProfile(userId, finalProfile);
      setProfile(finalProfile);
      
      // Сохраняем виджеты
      const { widgets: widgetsKey } = getStorageKeys(userId);
      localStorage.setItem(widgetsKey, JSON.stringify(widgets));
      
      const saveTime = new Date();
      setLastSaved(saveTime);
      
      setIsSaving(false);
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error);
      setIsSaving(false);
    }
  }, [isOwner, user, widgets, saveUserProfile, profile]);
  
  // Автосохранение при изменении виджетов
  useEffect(() => {
    let saveTimer: NodeJS.Timeout;
    
    if (isOwner && widgets.length > 0 && !isSaving) {
      saveTimer = setTimeout(() => {
        handleSaveProfile();
      }, 30000); // Автосохранение через 30 секунд после последнего изменения
    }
      
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [widgets, isOwner, handleSaveProfile, isSaving, profile]);
  
  // Функция рендера содержимого виджета
  const renderWidgetContent = (widget: Widget) => {
    switch (widget.type) {
      case WIDGET_TYPES.TEXT:
  return (
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-word',
              fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1.05rem' },
              lineHeight: 1.4
            }}
          >
            {widget.content.text}
          </Typography>
        );
      
      case WIDGET_TYPES.IMAGE:
        return (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Box sx={{
              width: '100%',
              height: 'auto',
              borderRadius: { xs: '6px', sm: '10px', md: '12px' },
              overflow: 'hidden',
              boxShadow: { xs: '0 2px 6px rgba(0, 0, 0, 0.06)', sm: '0 4px 10px rgba(0, 0, 0, 0.08)' },
              mb: { xs: 0.5, sm: 1 }
            }}>
              <img 
                src={widget.content.url} 
                alt={widget.content.caption || 'Изображение'} 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </Box>
            {widget.content.caption && (
              <Typography 
                variant="caption" 
                align="center" 
                sx={{ 
                  mt: { xs: 0.25, sm: 0.5 },
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                  opacity: 0.9
                }}
              >
                {widget.content.caption}
              </Typography>
            )}
          </Box>
        );
      
      case WIDGET_TYPES.SOCIAL:
        const SocialIcon = () => {
          switch (widget.content.type) {
            case 'instagram': return <Instagram sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
            case 'facebook': return <Facebook sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
            case 'twitter': return <Twitter sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
            default: return <LinkIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
          }
        };
        
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1.5 },
            flexWrap: 'wrap'
          }}>
            <SocialIcon />
            <Typography sx={{ 
              fontSize: { xs: '0.75rem', sm: '1rem' },
              wordBreak: 'break-all'
            }}>
              {widget.content.username || widget.content.url}
            </Typography>
          </Box>
        );
      
      case WIDGET_TYPES.YOUTUBE:
        return (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column'
          }}>
            <Box sx={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              overflow: 'hidden',
              borderRadius: { xs: '6px', sm: '10px', md: '12px' },
              boxShadow: { xs: '0 2px 6px rgba(0, 0, 0, 0.06)', sm: '0 4px 10px rgba(0, 0, 0, 0.08)' },
              mb: { xs: 0.5, sm: 1 }
            }}>
              <iframe 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                src={`https://www.youtube.com/embed/${widget.content.videoId}`} 
                title="YouTube video" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </Box>
            {widget.content.caption && (
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: { xs: 0.25, sm: 0.5 },
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                  opacity: 0.9
                }}
              >
                {widget.content.caption}
              </Typography>
            )}
          </Box>
        );
      
      case WIDGET_TYPES.PROFILE_INFO:
        return (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: { xs: 0.25, sm: 1 }
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                fontWeight: 600,
                mb: { xs: 0.25, sm: 0.5 }
              }}
            >
              {widget.content.title}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.95rem' },
                opacity: 0.9,
                lineHeight: { xs: 1.3, sm: 1.4 }
              }}
            >
              {widget.content.description}
            </Typography>
          </Box>
        );
      
      case WIDGET_TYPES.FAMILY_TREE:
        return (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            overflow: 'auto'
          }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                fontWeight: 600,
                mb: { xs: 0.25, sm: 0.5 }
              }}
            >
              {widget.content.title || 'Семейное древо'}
            </Typography>
            <Box sx={{ 
              flexGrow: 1,
              '& svg': {
                maxWidth: '100%',
                height: 'auto'
              }
            }}>
              <FamilyTreeWidget 
                initialMembers={widget.content.members || []}
                currentUserId={widget.content.userId || ''}
                onSave={() => {}}
                readOnly={true}
              />
            </Box>
          </Box>
        );
      
      default:
        return <Typography>Неизвестный тип виджета</Typography>;
    }
  };

  // Компонент для редактируемых виджетов - максимально простая реализация
  const DraggableWidgets = () => {
    return (
      <Reorder.Group 
        axis="y" 
        values={widgets} 
        onReorder={setWidgets}
        as="div"
        style={{ 
          width: '100%',
          maxWidth: '100%',
        }}
            >
        {widgets.map((widget) => (
          <Reorder.Item 
                  key={widget.id}
            value={widget}
            style={{ 
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: '16px',
            }}
            whileDrag={{ 
              scale: 1.02,
              zIndex: 50,
              boxShadow: "0 15px 35px rgba(0, 0, 0, 0.25)"
            }}
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 10 }}
            exit={{ opacity: 0, y: -10 }}
            layout
            transition={{
              duration: 0.3,
              ease: [0.25, 0.8, 0.25, 1]
            }}
          >
            <div 
              style={{ 
                background: widget.backgroundColor,
                color: widget.textColor,
                borderRadius: '12px',
                padding: '16px',
                boxShadow: widget.id === selectedWidgetId 
                  ? '0 5px 15px rgba(33, 150, 243, 0.35)' 
                  : '0 2px 10px rgba(0, 0, 0, 0.08)',
                border: widget.id === selectedWidgetId ? '3px solid #2196f3' : 'none',
                width: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                transition: 'box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), border 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                willChange: 'transform, box-shadow'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleWidgetSelect(widget.id);
              }}
            >
              <div style={{ 
                position: 'absolute',
                right: '16px',
                top: '16px',
                cursor: 'grab',
                transition: 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}>
                <DragIndicator color="action" />
            </div>
              <div style={{ 
                position: 'absolute',
                top: '8px',
                left: '8px',
                display: 'flex',
                gap: '4px',
                zIndex: 10,
                transition: 'opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}>
                <IconButton 
                  size="small" 
                  onClick={(e) => { e.stopPropagation(); handleEditWidget(widget.id); }}
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    '&:hover': { 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      transform: 'scale(1.1)' 
                    },
                    padding: '4px',
                    transition: 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={(e) => { e.stopPropagation(); handleDeleteWidget(widget.id); }}
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    '&:hover': { 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      transform: 'scale(1.1)' 
                    },
                    padding: '4px',
                    transition: 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </div>
              
              {renderWidgetContent(widget)}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    );
  };
  
  // Рендер виджетов на странице (в режиме просмотра)
  const renderViewWidgets = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {widgets.map((widget, index) => (
          <Box
            key={widget.id}
            sx={{
              backgroundColor: widget.backgroundColor,
              color: widget.textColor,
              borderRadius: 2,
              p: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
            }}
          >
            {renderWidgetContent(widget)}
          </Box>
        ))}
        
        {widgets.length === 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            У пользователя пока нет содержимого на странице
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 1, sm: 2, md: 3 } }}>
      {loading ? (
        <ProfileContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        </ProfileContainer>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {!id && (
            <ProfileContainer>
              <Box sx={{ 
                display: 'flex', 
              justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 4,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 }
            }}>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    Мой профиль
                  </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1, sm: 2 },
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  justifyContent: { xs: 'center', sm: 'flex-end' },
                  width: { xs: '100%', sm: 'auto' }
                }}>
                  <Button
                    variant="contained"
                            color="primary"
                    onClick={toggleSidebar}
                    startIcon={<Add />}
                    size="medium"
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      flex: { xs: '1 1 auto', sm: '0 0 auto' },
                      maxWidth: { xs: '100%', sm: 'none' },
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                    }}
                  >
                    Добавить блок
                  </Button>
                  
                  {isOwner && (
                      <Button
                      variant="contained"
                      color="success"
                        onClick={handleSaveProfile}
                        startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
                        disabled={isSaving}
                      size="medium"
                      sx={{ 
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        flex: { xs: '1 1 auto', sm: '0 0 auto' },
                        maxWidth: { xs: '100%', sm: 'none' },
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                      }}
                    >
                      {isSaving ? 'Сохранение...' : 'Сохранить профиль'}
                      </Button>
                  )}
                  
                  <IconButton 
                    onClick={handleOpenQRCodeDialog}
                    sx={{ 
                      width: { xs: '40px', sm: '48px' },
                      height: { xs: '40px', sm: '48px' },
                      transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <QrCode sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                      </IconButton>
                    </Box>
                  </Box>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ 
                  duration: 0.5, 
                  staggerChildren: 0.1 
                }}
              >
                <AnimatePresence>
                  <DraggableWidgets />
                </AnimatePresence>
              </motion.div>
        </ProfileContainer>
      )}
      {id && (
        <ProfileContainer>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                {profile.name}
              </Typography>
            <Typography variant="body1" color="text.secondary">
              {profile.bio}
            </Typography>
          </Box>
          
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.25, 0.8, 0.25, 1],
                  staggerChildren: 0.1
                }}
              >
              {renderViewWidgets()}
              </motion.div>
        </ProfileContainer>
      )}
        </motion.div>
      )}

      {selectedWidgetId && (
        <WidgetEditor 
          widget={widgets.find(w => w.id === selectedWidgetId) || null} 
          open={isEditorOpen} 
          onClose={() => setIsEditorOpen(false)} 
          onSave={handleSaveWidget}
          storageLimit={storageLimit}
          storageUsed={storageUsed}
        />
      )}
      
      <QRCodeDialog
        open={isQRCodeDialogOpen} 
        onClose={handleCloseQRCodeDialog}
        profileUrl={getProfileUrl()}
        onCopyLink={handleCopyProfileLink}
      />

      <WidgetPalettePanel 
        isOpen={sidebarOpen}
        onClose={toggleSidebar}
        onAddWidget={handleAddWidget}
        widgetTypes={widgetTypes}
      />
    </Container>
  );
};

export default SocialPage; 