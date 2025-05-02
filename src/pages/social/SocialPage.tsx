import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Avatar, TextField, Paper, Menu, MenuItem, Slider, FormControlLabel, Switch, Divider, Alert, AlertTitle, LinearProgress, Tooltip, Backdrop, Snackbar, useTheme } from '@mui/material';
import { Add, Delete, Edit, Image, TextFields, Link as LinkIcon, YouTube, Instagram, Facebook, Twitter, FormatColorFill, AccountBox, VisibilityOff, Visibility, CloudDownload, CreditCard, Warning, Info, FamilyRestroom, QrCode, Share } from '@mui/icons-material';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FamilyTreeWidget from '../../components/widgets/FamilyTreeWidget';
import QRCode from 'react-qr-code';

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
}

// Стили для основного контейнера профиля
const ProfileContainer = styled.div`
  width: 100%;
  min-height: 800px;
  background-color: #f5f7fa;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  padding: 24px;
  margin-bottom: 48px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
`;

// Стиль для виджета
const WidgetElement = styled(motion.div)<{
  $backgroundColor: string;
  $textColor: string;
  $isSelected: boolean;
}>`
  position: absolute;
  border-radius: 8px;
  background-color: ${props => props.$backgroundColor};
  color: ${props => props.$textColor};
  padding: 16px;
  cursor: move;
  box-shadow: ${props => props.$isSelected 
    ? '0 0 0 2px #2196f3, 0 8px 20px rgba(0, 0, 0, 0.15)' 
    : '0 4px 12px rgba(0, 0, 0, 0.1)'};
  overflow: hidden;
  
  &:hover .widget-controls {
    opacity: 1;
  }
`;

// Контролы виджета
const WidgetControls = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 2px;
`;

// Компонент виджета с содержимым
const Widget: React.FC<{
  widget: Widget;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPositionChange: (x: number, y: number) => void;
}> = ({ widget, isSelected, onSelect, onDelete, onEdit, onPositionChange }) => {
  
  // Функция для рендера контента виджета в зависимости от его типа
  const renderWidgetContent = () => {
    switch (widget.type) {
      case WIDGET_TYPES.TEXT:
        return (
          <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
            {widget.content.text}
          </Typography>
        );
      
      case WIDGET_TYPES.IMAGE:
        return (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <img 
              src={widget.content.url} 
              alt={widget.content.caption || 'Изображение'} 
              style={{ maxWidth: '100%', maxHeight: '80%', objectFit: 'contain' }}
            />
            {widget.content.caption && (
              <Typography variant="caption" align="center" sx={{ mt: 1 }}>
                {widget.content.caption}
              </Typography>
            )}
          </Box>
        );
      
      case WIDGET_TYPES.SOCIAL:
        const SocialIcon = () => {
          switch (widget.content.type) {
            case 'instagram': return <Instagram />;
            case 'facebook': return <Facebook />;
            case 'twitter': return <Twitter />;
            default: return <LinkIcon />;
          }
        };
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SocialIcon />
            <Typography>
              {widget.content.username || widget.content.url}
            </Typography>
          </Box>
        );
      
      case WIDGET_TYPES.YOUTUBE:
        return (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <iframe 
              width="100%" 
              height={widget.height - 50} 
              src={`https://www.youtube.com/embed/${widget.content.videoId}`} 
              title="YouTube video" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
            {widget.content.caption && (
              <Typography variant="caption" sx={{ mt: 1 }}>
                {widget.content.caption}
              </Typography>
            )}
          </Box>
        );
      
      case WIDGET_TYPES.PROFILE_INFO:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="h6">{widget.content.title}</Typography>
            <Typography variant="body2">{widget.content.description}</Typography>
          </Box>
        );
      
      case WIDGET_TYPES.FAMILY_TREE:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>{widget.content.title || 'Семейное древо'}</Typography>
            <Box sx={{ flexGrow: 1 }}>
              <FamilyTreeWidget 
                initialMembers={widget.content.members || []}
                currentUserId={widget.content.userId || ''}
                onSave={(members) => console.log('Сохранение древа:', members)}
                readOnly={false}
              />
            </Box>
          </Box>
        );
      
      default:
        return <Typography>Неизвестный тип виджета</Typography>;
    }
  };

  return (
    <WidgetElement
      $backgroundColor={widget.backgroundColor}
      $textColor={widget.textColor}
      $isSelected={isSelected}
      drag
      dragMomentum={false}
      onDragEnd={(_e, info) => {
        onPositionChange(widget.x + info.offset.x, widget.y + info.offset.y);
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        width: widget.width,
        height: widget.height,
        x: widget.x,
        y: widget.y,
        zIndex: widget.zIndex
      }}
    >
      <WidgetControls className="widget-controls">
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Delete fontSize="small" />
        </IconButton>
      </WidgetControls>
      
      {renderWidgetContent()}
    </WidgetElement>
  );
};

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
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null);
  
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
            />
            <TextField
              fullWidth
              label="Подпись"
              value={editedWidget.content.caption || ''}
              onChange={(e) => handleContentChange('caption', e.target.value)}
              margin="normal"
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
            />
            <TextField
              fullWidth
              label="URL"
              value={editedWidget.content.url || ''}
              onChange={(e) => handleContentChange('url', e.target.value)}
              margin="normal"
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
              helperText="Например, dQw4w9WgXcQ из URL https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            />
            <TextField
              fullWidth
              label="Подпись"
              value={editedWidget.content.caption || ''}
              onChange={(e) => handleContentChange('caption', e.target.value)}
              margin="normal"
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
            />
            <TextField
              fullWidth
              label="Описание"
              multiline
              rows={3}
              value={editedWidget.content.description || ''}
              onChange={(e) => handleContentChange('description', e.target.value)}
              margin="normal"
            />
          </>
        );
      
      default:
        return <Typography>Неизвестный тип виджета</Typography>;
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editedWidget.id ? 'Редактировать виджет' : 'Новый виджет'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ mt: 2 }}>Контент</Typography>
        {renderContentEditor()}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2">Внешний вид</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="body2">Ширина</Typography>
            <Slider
              value={editedWidget.width}
              min={100}
              max={600}
              step={10}
              onChange={(_e, value) => handleChange('width', value as number)}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">Высота</Typography>
            <Slider
              value={editedWidget.height}
              min={50}
              max={400}
              step={10}
              onChange={(_e, value) => handleChange('height', value as number)}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2">Цвет фона</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#bbdefb', '#b3e5fc', '#b2dfdb', '#c8e6c9', '#f0f4c3'].map(color => (
                <Box
                  key={color}
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: editedWidget.backgroundColor === color ? '2px solid #2196f3' : '1px solid #ddd'
                  }}
                  onClick={() => handleChange('backgroundColor', color)}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2">Цвет текста</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {['#000000', '#212529', '#343a40', '#495057', '#6c757d', '#1976d2', '#0d47a1', '#388e3c', '#1b5e20', '#e53935', '#b71c1c'].map(color => (
                <Box
                  key={color}
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: editedWidget.textColor === color ? '2px solid #2196f3' : '1px solid #ddd'
                  }}
                  onClick={() => handleChange('textColor', color)}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleSave}>Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
};

// Создание нового виджета
const createWidget = (type: string, x: number = 50, y: number = 50): Widget => {
  let content = {};
  let width = 200;
  let height = 100;
  
  switch (type) {
    case WIDGET_TYPES.TEXT:
      content = { text: 'Нажмите для редактирования текста' };
      width = 300;
      height = 150;
      break;
    case WIDGET_TYPES.IMAGE:
      content = { url: 'https://source.unsplash.com/random/300x200', caption: 'Подпись к изображению' };
      width = 320;
      height = 250;
      break;
    case WIDGET_TYPES.SOCIAL:
      content = { type: 'instagram', username: 'username', url: 'https://instagram.com/username' };
      width = 250;
      height = 80;
      break;
    case WIDGET_TYPES.YOUTUBE:
      content = { videoId: 'dQw4w9WgXcQ', caption: 'Видео с YouTube' };
      width = 400;
      height = 300;
      break;
    case WIDGET_TYPES.PROFILE_INFO:
      content = { title: 'Обо мне', description: 'Расскажите о себе' };
      width = 350;
      height = 150;
      break;
    case WIDGET_TYPES.FAMILY_TREE:
      content = { 
        title: 'Семейное древо', 
        members: [],
        userId: 'user123' 
      };
      width = 600;
      height = 400;
      break;
  }
  
  return {
    id: Date.now().toString(),
    type,
    content,
    x,
    y,
    width,
    height,
    backgroundColor: '#ffffff',
    textColor: '#212529',
    zIndex: 1
  };
};

// Стили для страницы с блюром (для неоплаченной подписки)
const BlurredPage = styled.div`
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
`;

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
    bio: 'Художник, живу у моря. Делюсь воспоминаниями о моих предках и их историями.',
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
          description: 'Художник, живу у моря. Делюсь воспоминаниями о моих предках и их историями.'
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

// Главный компонент страницы
const SocialPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Загружаем соответствующий профиль на основе id
  const [profile, setProfile] = useState<Profile>(() => {
    // Если есть id и для него есть демо-профиль, используем его
    if (id && demoProfiles[id]) {
      return demoProfiles[id];
    }
    // Иначе возвращаем профиль текущего пользователя
    return {
      id: id || 'user123',
      name: 'Текущий пользователь',
      bio: 'Память о близком человеке',
      avatar: 'https://source.unsplash.com/random/300x300/?portrait',
      theme: 'light'
    };
  });
  
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Новые состояния для функциональности подписки и приватности
  const [isPublic, setIsPublic] = useState(true);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [storageLimit] = useState(5120); // 5 ГБ в МБ
  const [storageUsed, setStorageUsed] = useState(128); // Начальное значение в МБ
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showSubscriptionWarning, setShowSubscriptionWarning] = useState(false);
  const [isQRCodeDialogOpen, setIsQRCodeDialogOpen] = useState(false);
  
  useEffect(() => {
    // Имитация загрузки данных
    const loadDemoData = () => {
      // Загружаем демо-виджеты для конкретного профиля
      const demoWidgets = getDemoWidgets(profile.id, profile.name, profile.bio);
      setWidgets(demoWidgets);
      
      // Проверка статуса подписки (в реальном приложении здесь будет запрос к API)
      if (!id) {
        // Если это страница владельца (не просмотр чужой страницы)
        checkSubscriptionStatus();
      }
    };
    
    loadDemoData();
  }, [id, profile.id, profile.name, profile.bio]);
  
  // Функция для проверки статуса подписки
  const checkSubscriptionStatus = () => {
    // В реальном приложении здесь будет API-запрос
    const mockSubscriptionData = {
      active: Math.random() > 0.3, // 70% шанс активной подписки для демо
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    };
    
    setIsSubscriptionActive(mockSubscriptionData.active);
    
    // Если подписка неактивна, показываем предупреждение
    if (!mockSubscriptionData.active) {
      setShowSubscriptionWarning(true);
    }
  };

  // Функция для расчета используемого хранилища
  const calculateStorageUsed = (currentWidgets: Widget[]): number => {
    // В реальном приложении здесь будет сложная логика для расчета
    // размера всех медиафайлов. Здесь упрощенная версия для демо
    let totalSize = 0;
    
    currentWidgets.forEach(widget => {
      if (widget.type === WIDGET_TYPES.IMAGE) {
        // Примерный расчет для демо (в реальном приложении будем знать точный размер)
        totalSize += 2; // примерно 2 МБ на изображение
      } else if (widget.type === WIDGET_TYPES.YOUTUBE) {
        totalSize += 0.1; // метаданные занимают мало места
      }
    });
    
    return totalSize;
  };
  
  const handlePaySubscription = () => {
    navigate('/subscription');
  };
  
  const handleExportData = () => {
    // В реальном приложении здесь будет логика для создания ZIP архива
    alert('Данные будут экспортированы в ZIP архив. Эта функция находится в разработке.');
  };
  
  const handlePrivacyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsPublic(event.target.checked);
  };
  
  // Добавляем недостающие обработчики
  const handleWidgetSelect = (id: string) => {
    setSelectedWidgetId(id);
  };
  
  const handleAddWidgetClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleAddWidgetClose = () => {
    setAnchorEl(null);
  };
  
  const handleAddWidget = (type: string) => {
    const newWidget = createWidget(type);
    
    // Проверяем, не превысит ли добавление нового виджета лимит хранилища
    const potentialNewUsage = calculateStorageUsed([...widgets, newWidget]);
    if (potentialNewUsage > storageLimit) {
      setShowStorageWarning(true);
      return;
    }
    
    setWidgets([...widgets, newWidget]);
    setSelectedWidgetId(newWidget.id);
    setAnchorEl(null);
    setIsEditorOpen(true);
    
    // Обновляем использованное хранилище
    setStorageUsed(potentialNewUsage);
  };
  
  const handleDeleteWidget = (id: string) => {
    // Обновляем использованное хранилище перед удалением
    const widgetToDelete = widgets.find(w => w.id === id);
    const remainingWidgets = widgets.filter(w => w.id !== id);
    setWidgets(remainingWidgets);
    
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null);
    }
    
    // Пересчитываем хранилище
    setStorageUsed(calculateStorageUsed(remainingWidgets));
  };
  
  const handleEditWidget = () => {
    if (selectedWidget) {
      // Логика сохранения виджета из редактора
      handleSaveWidget(selectedWidget);
      setIsEditorOpen(false);
    }
  };
  
  const handleSaveWidget = (updatedWidget: Widget) => {
    setWidgets(widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w));
  };
  
  const handleWidgetPositionChange = (id: string, x: number, y: number) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, x, y } : w));
  };
  
  const handleBackgroundClick = () => {
    setSelectedWidgetId(null);
  };
  
  const selectedWidget = widgets.find(w => w.id === selectedWidgetId);
  
  // Функция для получения полного URL профиля (абсолютная ссылка)
  const getProfileUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/social/${profile.id}`;
  };

  // Функция для открытия диалога с QR-кодом
  const handleOpenQRCodeDialog = () => {
    setIsQRCodeDialogOpen(true);
  };

  // Функция для закрытия диалога с QR-кодом
  const handleCloseQRCodeDialog = () => {
    setIsQRCodeDialogOpen(false);
  };

  // Функция для копирования ссылки в буфер обмена
  const handleCopyProfileLink = () => {
    const profileUrl = getProfileUrl();
    navigator.clipboard.writeText(profileUrl).then(() => {
      alert('Ссылка скопирована в буфер обмена!');
    }).catch(err => {
      console.error('Не удалось скопировать ссылку: ', err);
    });
  };
  
  return (
    <Container maxWidth="lg" sx={{ pt: 10, pb: 10 }}>
      {!isSubscriptionActive && !id && (
        <>
          <BlurredPage>
            {/* Содержимое страницы в режиме блюра */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                {profile.name}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {profile.bio}
              </Typography>
            </Box>
            
            <ProfileContainer>
              {widgets.map(widget => (
                <Widget
                  key={widget.id}
                  widget={widget}
                  isSelected={widget.id === selectedWidgetId}
                  onSelect={() => handleWidgetSelect(widget.id)}
                  onDelete={() => handleDeleteWidget(widget.id)}
                  onEdit={() => { setSelectedWidgetId(widget.id); setIsEditorOpen(true); }}
                  onPositionChange={(x, y) => handleWidgetPositionChange(widget.id, x, y)}
                />
              ))}
            </ProfileContainer>
          </BlurredPage>
          
          <Backdrop
            sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}
            open={showSubscriptionWarning}
          >
            <SubscriptionWarning>
              <Warning color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Подписка не активна
              </Typography>
              <Typography paragraph>
                Ваша страница скрыта от посетителей. Для восстановления доступа необходимо оплатить подписку.
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Вы также можете экспортировать все ваши данные в виде архива.
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<CreditCard />}
                  onClick={handlePaySubscription}
                >
                  Оплатить подписку
                </Button>
                <Button 
                  variant="outlined"
                  startIcon={<CloudDownload />}
                  onClick={handleExportData}
                >
                  Скачать данные
                </Button>
              </Box>
            </SubscriptionWarning>
          </Backdrop>
        </>
      )}
      
      {(isSubscriptionActive || id) && (
        <>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {profile.name}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {profile.bio}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {!id && (
                <Box sx={{ mt: { xs: 2, md: 0 } }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={isPublic} 
                        onChange={handlePrivacyChange} 
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isPublic ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                        <Typography variant="body2">
                          {isPublic ? "Публичная страница" : "Скрытая страница"}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <Tooltip title={isPublic ? 
                    "Страница видна в общем каталоге и доступна по прямой ссылке" : 
                    "Страница скрыта из общего каталога, но доступна по QR-коду и прямой ссылке"
                  }>
                    <IconButton size="small">
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              
              <Button
                variant="outlined"
                startIcon={<QrCode />}
                onClick={handleOpenQRCodeDialog}
                sx={{ mt: { xs: 2, md: 0 } }}
              >
                QR-код профиля
              </Button>
            </Box>
          </Box>
          
          {!id && (
            <StorageIndicator>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Использовано {storageUsed.toFixed(1)} МБ из {storageLimit} МБ
                </Typography>
                <Typography variant="body2" color={storageUsed > storageLimit * 0.9 ? "error" : "textSecondary"}>
                  {Math.round((storageUsed / storageLimit) * 100)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(storageUsed / storageLimit) * 100} 
                color={storageUsed > storageLimit * 0.9 ? "error" : "primary"}
              />
            </StorageIndicator>
          )}
          
          <ProfileContainer onClick={handleBackgroundClick}>
            {widgets.map(widget => (
              <Widget
                key={widget.id}
                widget={widget}
                isSelected={widget.id === selectedWidgetId}
                onSelect={() => handleWidgetSelect(widget.id)}
                onDelete={() => handleDeleteWidget(widget.id)}
                onEdit={() => { setSelectedWidgetId(widget.id); setIsEditorOpen(true); }}
                onPositionChange={(x, y) => handleWidgetPositionChange(widget.id, x, y)}
              />
            ))}
            
            {!id && widgets.length === 0 && (
              <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: 'rgba(0,0,0,0.3)'
              }}>
                <Typography variant="h6">
                  Нажмите "+" чтобы добавить блок
                </Typography>
              </Box>
            )}
          </ProfileContainer>
          
          {!id && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<Add />}
                onClick={handleAddWidgetClick}
              >
                Добавить блок
              </Button>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleAddWidgetClose}
              >
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.TEXT)}>
                  <TextFields sx={{ mr: 1 }} /> Текст
                </MenuItem>
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.IMAGE)}>
                  <Image sx={{ mr: 1 }} /> Изображение
                </MenuItem>
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.YOUTUBE)}>
                  <YouTube sx={{ mr: 1 }} /> Видео
                </MenuItem>
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.SOCIAL)}>
                  <LinkIcon sx={{ mr: 1 }} /> Соцсети
                </MenuItem>
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.PROFILE_INFO)}>
                  <AccountBox sx={{ mr: 1 }} /> Биография
                </MenuItem>
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.FAMILY_TREE)}>
                  <FamilyRestroom sx={{ mr: 1 }} /> Семейное древо
                </MenuItem>
              </Menu>
            </Box>
          )}
        </>
      )}
      
      <Dialog 
        open={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Редактирование блока
        </DialogTitle>
        <DialogContent>
          {selectedWidget && (
            <WidgetEditor 
              widget={selectedWidget} 
              open={isEditorOpen} 
              onClose={() => setIsEditorOpen(false)} 
              onSave={handleSaveWidget}
              storageLimit={storageLimit}
              storageUsed={storageUsed}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditorOpen(false)}>
            Отмена
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleEditWidget}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={showStorageWarning}
        autoHideDuration={6000}
        onClose={() => setShowStorageWarning(false)}
      >
        <Alert 
          onClose={() => setShowStorageWarning(false)} 
          severity="warning"
          variant="filled"
        >
          <AlertTitle>Предупреждение</AlertTitle>
          Превышен лимит хранилища (5 ГБ). Удалите существующие файлы перед добавлением новых.
        </Alert>
      </Snackbar>
      
      {/* Диалоговое окно с QR-кодом */}
      <Dialog 
        open={isQRCodeDialogOpen} 
        onClose={handleCloseQRCodeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          QR-код вашего профиля
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
            <Box sx={{ 
              background: 'white', 
              p: 3, 
              borderRadius: 2, 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              mb: 3
            }}>
              <QRCode 
                value={getProfileUrl()} 
                size={250}
              />
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2, textAlign: 'center' }}>
              Отсканируйте этот QR-код для доступа к профилю или поделитесь ссылкой:
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={getProfileUrl()}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton onClick={handleCopyProfileLink} size="small">
                    <Share fontSize="small" />
                  </IconButton>
                ),
              }}
              size="small"
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Вы можете разместить этот QR-код на памятнике, в памятных местах или 
              поделиться им с близкими для быстрого доступа к странице.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            variant="contained" 
            onClick={handleCloseQRCodeDialog}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SocialPage; 