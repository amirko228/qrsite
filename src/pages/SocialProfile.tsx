import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, Stack, IconButton, Tooltip, Menu, MenuItem, Switch, FormControlLabel, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, InputAdornment, Divider, Container, CircularProgress, Tabs, Tab, useMediaQuery, useTheme, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import { Resizable, ResizeCallback } from 're-resizable';
import { Delete as DeleteIcon, Save as SaveIcon, ContentCopy as DuplicateIcon, Palette as PaletteIcon, GridOn as GridIcon, GridOff as GridOffIcon, OpenWith as MoveIcon, Download as DownloadIcon, FileUpload as UploadIcon, CodeRounded as CodeIcon, ColorLens as ThemeIcon, Edit as EditIcon, Share as ShareIcon, QrCode as QrCodeIcon } from '@mui/icons-material';
import PhotoWidget from '../components/widgets/PhotoWidget';
import TextWidget from '../components/widgets/TextWidget';
import FamilyTreeWidget from '../components/widgets/FamilyTreeWidget';
import VideoWidget from '../components/widgets/VideoWidget';
import LinksWidget from '../components/widgets/LinksWidget';
import ProfileInfoWidget from '../components/widgets/ProfileInfoWidget';
import PhotoCarouselWidget from '../components/widgets/PhotoCarouselWidget';
import SocialLinksWidget from '../components/widgets/SocialLinksWidget';
import WidgetEditor, { Widget as EditorWidget, WidgetType as EditorWidgetType } from '../components/WidgetEditor';

// Темы оформления
const THEMES = {
  light: {
    background: '#f5f5f5',
    widgetBg: '#ffffff',
    headerBg: 'rgba(0, 0, 0, 0.02)',
    text: '#1a1a1a',
    shadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    shadowHover: '0 8px 25px rgba(0, 0, 0, 0.15)',
    border: '#eee'
  },
  dark: {
    background: '#121212',
    widgetBg: '#1e1e1e',
    headerBg: 'rgba(255, 255, 255, 0.05)',
    text: '#f5f5f5',
    shadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    shadowHover: '0 8px 25px rgba(0, 0, 0, 0.4)',
    border: '#333'
  },
  pastel: {
    background: '#f0f4f8',
    widgetBg: '#ffffff',
    headerBg: 'rgba(108, 99, 255, 0.05)',
    text: '#2d3748',
    shadow: '0 4px 15px rgba(108, 99, 255, 0.1)',
    shadowHover: '0 8px 25px rgba(108, 99, 255, 0.2)',
    border: '#e2e8f0'
  },
  vintage: {
    background: '#f5f0e5',
    widgetBg: '#fffaf0',
    headerBg: 'rgba(128, 90, 60, 0.05)',
    text: '#4a3f35',
    shadow: '0 4px 15px rgba(128, 90, 60, 0.1)',
    shadowHover: '0 8px 25px rgba(128, 90, 60, 0.2)',
    border: '#e6ddd0'
  },
  modern: {
    background: '#ffffff',
    widgetBg: '#ffffff',
    headerBg: 'rgba(0, 0, 0, 0.02)',
    text: '#333333',
    shadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    shadowHover: '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: '#f0f0f0'
  }
};

const WidgetContainer = styled(motion.div)<{ theme: any }>`
  background: ${props => props.theme.widgetBg};
  border-radius: 16px;
  box-shadow: ${props => props.theme.shadow};
  transition: box-shadow 0.3s ease;
  height: 100%;
  width: 100%;
  
  &:hover {
    box-shadow: ${props => props.theme.shadowHover};
  }
`;

const WidgetContent = styled.div`
  padding: 20px;
  height: calc(100% - 60px);
  overflow: auto;
`;

const WidgetHeader = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.headerBg};
  border-radius: 16px 16px 0 0;
  cursor: move;
  color: ${props => props.theme.text};
`;

const RotateHandle = styled.div`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(-50%) scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  ${WidgetContainer}:hover & {
    opacity: 1;
  }
`;

const DeleteButton = styled(Button)`
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 36px;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  ${WidgetContainer}:hover & {
    opacity: 1;
  }
`;

const AddWidgetButton = styled(Button)`
  width: 100%;
  padding: 12px;
  text-align: left;
  justify-content: flex-start;
  border-radius: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(25, 118, 210, 0.08);
    transform: translateX(5px);
  }
`;

const WidgetMenuButton = styled(Button)<{ active?: boolean }>`
  padding: 10px 15px;
  border-radius: 12px;
  text-transform: none;
  justify-content: flex-start;
  transition: all 0.2s ease;
  background: ${props => props.active ? 'rgba(25, 118, 210, 0.08)' : 'transparent'};
  
  &:hover {
    background: rgba(25, 118, 210, 0.08);
    transform: translateX(5px);
  }
`;

// Сетка для выравнивания
const Grid = styled.div<{ size: number, visible: boolean, theme: any }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: ${props => props.visible ? 
    `linear-gradient(to right, ${props.theme.border} 1px, transparent 1px),
     linear-gradient(to bottom, ${props.theme.border} 1px, transparent 1px)` : 'none'};
  background-size: ${props => `${props.size}px ${props.size}px`};
  pointer-events: none;
  z-index: 1;
  opacity: 0.2;
`;

// Типы виджетов
export type WidgetType = 
  | 'text'
  | 'photo'
  | 'video'
  | 'links'
  | 'profile-info'
  | 'social-links';

// Полная позиция виджета
interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

// Интерфейс для виджета
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  content: any;
  icon: string;
  position: WidgetPosition;
}

// Типы доступных виджетов
const WIDGET_TYPES: Record<WidgetType, {
  title: string;
  icon: string;
  component: React.ComponentType<any>;
  defaultContent: any;
}> = {
  'text': {
    title: 'Текст',
    icon: 'text_fields',
    component: TextWidget,
    defaultContent: 'Новый текстовый блок'
  },
  'photo': {
    title: 'Фото',
    icon: 'photo',
    component: PhotoWidget,
    defaultContent: { url: '', caption: '' }
  },
  'video': {
    title: 'Видео',
    icon: 'videocam',
    component: VideoWidget,
    defaultContent: { url: '', title: '' }
  },
  'links': {
    title: 'Ссылки',
    icon: 'link',
    component: LinksWidget,
    defaultContent: { links: [] }
  },
  'profile-info': {
    title: 'Информация профиля',
    icon: 'person',
    component: ProfileInfoWidget,
    defaultContent: {
      name: '', 
      occupation: '',
      description: ''
    }
  },
  'social-links': {
    title: 'Социальные сети',
    icon: 'share',
    component: SocialLinksWidget,
    defaultContent: { links: [] }
  }
};

interface DragData {
  node: HTMLElement;
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  lastX: number;
  lastY: number;
}

interface Position {
  x: number;
  y: number;
}

const Widget: React.FC<{
  widget: Widget;
  isEditing: boolean;
  onUpdate: (newContent: any) => void;
  onDelete: () => void;
  onPositionChange: (position: Widget['position']) => void;
  onDuplicate: () => void;
  theme: any;
  gridSize: number;
  snapToGrid: boolean;
}> = ({ widget, isEditing, onUpdate, onDelete, onPositionChange, onDuplicate, theme, gridSize, snapToGrid }) => {
  const config = WIDGET_TYPES[widget.type];
  const Component = config.component;
  const [rotation, setRotation] = useState(widget.position.rotation || 0);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleRotate = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onMouseMove = (e: MouseEvent) => {
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const newRotation = angle * (180 / Math.PI);
      setRotation(newRotation);
      onPositionChange({ ...widget.position, rotation: newRotation });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (isEditing) {
      setMenuAnchor(event.currentTarget);
    }
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  // Функция для привязки к сетке
  const snapToGridFunc = (pos: { x: number, y: number }) => {
    if (snapToGrid) {
      return {
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize
      };
    }
    return pos;
  };

  const handleResizeStop: ResizeCallback = (event, direction, ref, delta) => {
    const width = parseInt(ref.style.width);
    const height = parseInt(ref.style.height);
    
    const snappedSize = {
      width: snapToGrid ? Math.round(width / gridSize) * gridSize : width,
      height: snapToGrid ? Math.round(height / gridSize) * gridSize : height
    };
    
    onPositionChange({ 
      ...widget.position, 
      width: snappedSize.width, 
      height: snappedSize.height 
    });
  };

  return (
    <Draggable
      handle=".widget-header"
      disabled={!isEditing}
      bounds="parent"
      defaultPosition={{ x: widget.position.x, y: widget.position.y }}
      grid={snapToGrid ? [gridSize, gridSize] : undefined}
      onStop={(e, data) => {
        const pos = snapToGridFunc({ x: data.x, y: data.y });
        onPositionChange({ ...widget.position, x: pos.x, y: pos.y });
      }}
    >
      <div style={{ 
        position: 'absolute',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: isEditing ? 1000 : 'auto',
        width: widget.position.width,
        height: widget.position.height
      }}>
        <Resizable
          size={{ width: widget.position.width, height: widget.position.height }}
          minWidth={200}
          minHeight={100}
          grid={snapToGrid ? [gridSize, gridSize] : undefined}
          enable={{ top: isEditing, right: isEditing, bottom: isEditing, left: isEditing, topRight: isEditing, bottomRight: isEditing, bottomLeft: isEditing, topLeft: isEditing }}
          onResizeStop={handleResizeStop}
        >
          <WidgetContainer theme={theme}>
          {isEditing && (
            <>
              <RotateHandle
                onMouseDown={handleRotate}
              >
                <span className="material-icons" style={{ fontSize: 16 }}>rotate_right</span>
              </RotateHandle>

              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 8,
                  right: 8,
                    zIndex: 1000,
                    display: 'flex',
                    gap: 1
                  }}
                >
                  <Tooltip title="Опции виджета">
                    <IconButton
                      size="small"
                      onClick={handleOpenMenu}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                }}
              >
                      <MoveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Удалить виджет">
                <IconButton
                  size="small"
                  onClick={onDelete}
                  sx={{
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'error.dark',
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                  </Tooltip>
              </Box>

                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={handleCloseMenu}
                >
                  <MenuItem onClick={() => {
                    onDuplicate();
                    handleCloseMenu();
                  }}>
                    <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
                    Дублировать
                  </MenuItem>
                  <MenuItem onClick={() => {
                    onPositionChange({ ...widget.position, rotation: 0 });
                    setRotation(0);
                    handleCloseMenu();
                  }}>
                    <span className="material-icons" style={{ fontSize: 20, marginRight: 8 }}>rotate_left</span>
                    Сбросить поворот
                  </MenuItem>
                </Menu>
            </>
          )}
          
            <WidgetHeader className="widget-header" theme={theme}>
            <span className="material-icons" style={{ 
              marginRight: '10px',
              opacity: 0.7,
              fontSize: '20px'
            }}>
              {config.icon}
            </span>
            <Typography variant="h6" sx={{ 
              fontSize: '1.1rem',
              fontWeight: 500,
                color: theme.text
            }}>
              {config.title}
            </Typography>
          </WidgetHeader>

          <WidgetContent>
            <Component
              content={widget.content}
              onUpdate={onUpdate}
              isEditing={isEditing}
              onDelete={onDelete}
            />
          </WidgetContent>
        </WidgetContainer>
        </Resizable>
      </div>
    </Draggable>
  );
};

// Преобразование виджетов SocialProfile в формат EditorWidget
const convertWidgetsForEditor = (widgets: Widget[]): EditorWidget[] => {
  return widgets.map(widget => {
    // Преобразуем тип WidgetType в EditorWidgetType
    let editorType: EditorWidgetType;
    
    switch (widget.type) {
      case 'text':
        editorType = 'notion-block';
        break;
      case 'photo':
        editorType = 'photo-carousel';
        break;
      case 'video':
        editorType = 'notion-block'; // Fallback для видео
        break;
      case 'profile-info':
        editorType = 'notion-profile';
        break;
      case 'social-links':
        editorType = 'gallery-database';
        break;
      case 'links':
        editorType = 'gallery-database';
        break;
      default:
        editorType = 'notion-block';
    }
    
    return {
      id: widget.id,
      type: editorType,
      content: widget.content
    };
  });
};

// Преобразование виджетов EditorWidget обратно в формат SocialProfile
const convertEditorWidgets = (editorWidgets: EditorWidget[]): Widget[] => {
  return editorWidgets.map(editorWidget => {
    // Преобразуем тип EditorWidgetType в WidgetType
    let widgetType: WidgetType;
    
    switch (editorWidget.type) {
      case 'notion-block':
        widgetType = 'text';
        break;
      case 'photo-carousel':
        widgetType = 'photo';
        break;
      case 'notion-profile':
        widgetType = 'profile-info';
        break;
      case 'gallery-database':
        widgetType = 'links';
        break;
      default:
        widgetType = 'text';
    }
    
    return {
      id: editorWidget.id,
      type: widgetType,
      title: editorWidget.id, // Используем id как временный заголовок
      content: editorWidget.content,
      icon: 'default',
      position: {
        x: 0, 
        y: 0,
        width: 1,
        height: 1,
        rotation: 0
      }
    };
  });
};

const SocialProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Загрузка исходных данных
  useEffect(() => {
    // Имитация загрузки данных
    const loadData = async () => {
      setLoading(true);
      
      // Задержка для имитации загрузки
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Тестовые виджеты
      const sampleWidgets: Widget[] = [
        {
          id: '1',
          type: 'profile-info',
          title: 'Профиль',
          icon: 'person',
          position: { x: 0, y: 0, width: 1, height: 1, rotation: 0 },
          content: {
            name: 'Александр Иванов',
            coverColor: '#F0F5FF',
            avatar: 'https://i.pravatar.cc/300?img=8',
            blocks: [
              {
                id: '101',
                type: 'paragraph',
                content: 'Профессиональный фотограф и дизайнер. Работаю над проектами в сфере цифрового искусства и визуальных коммуникаций.',
                format: {}
              },
              {
                id: '102',
                type: 'heading-2',
                content: 'Обо мне',
                format: { bold: true }
              },
              {
                id: '103',
                type: 'paragraph',
                content: 'Более 5 лет опыта в создании визуального контента для брендов и компаний разного масштаба. Специализируюсь на минималистичной эстетике и продуманных композициях.',
                format: {}
              }
            ]
          }
        },
        {
          id: '2',
          type: 'photo',
          title: 'Фотографии',
          icon: 'photo',
          position: { x: 0, y: 1, width: 1, height: 1, rotation: 0 },
          content: {
            title: 'Мои работы',
            photos: [
              {
                id: '201',
                url: 'https://source.unsplash.com/random/800x600?nature',
                caption: 'Природные пейзажи',
                location: 'Карелия'
              },
              {
                id: '202',
                url: 'https://source.unsplash.com/random/800x600?city',
                caption: 'Городская архитектура',
                location: 'Москва'
              },
              {
                id: '203',
                url: 'https://source.unsplash.com/random/800x600?portrait',
                caption: 'Портретная съемка',
                location: 'Студия'
              }
            ]
          }
        },
        {
          id: '3',
          type: 'links',
          title: 'Проекты',
          icon: 'link',
          position: { x: 0, y: 2, width: 1, height: 1, rotation: 0 },
          content: {
            title: 'Мои проекты',
            items: [
              {
                id: '301',
                imageUrl: 'https://source.unsplash.com/random/300x200?web',
                title: 'Редизайн личного сайта',
                description: 'Обновление дизайна и функциональности моего портфолио',
                date: '2023-05-15',
                tags: ['Дизайн', 'Веб'],
                properties: {
                  'Категория': 'Веб-дизайн',
                  'Рейтинг': '5'
                }
              },
              {
                id: '302',
                imageUrl: 'https://source.unsplash.com/random/300x200?photography',
                title: 'Фотовыставка "Минимализм"',
                description: 'Серия работ на тему минимализма в городской среде',
                date: '2023-03-10',
                tags: ['Фото', 'Выставка'],
                properties: {
                  'Категория': 'Фотография',
                  'Рейтинг': '4'
                }
              },
              {
                id: '303',
                imageUrl: 'https://source.unsplash.com/random/300x200?branding',
                title: 'Брендинг для стартапа',
                description: 'Разработка визуальной идентичности IT-стартапа',
                date: '2023-01-05',
                tags: ['Брендинг', 'Логотип'],
                properties: {
                  'Категория': 'Брендинг',
                  'Рейтинг': '5'
                }
              }
            ],
            properties: [
              { name: 'Категория', type: 'select', options: ['Веб-дизайн', 'Фотография', 'Брендинг', 'UI/UX', 'Разное'] },
              { name: 'Рейтинг', type: 'number' }
            ]
          }
        },
        {
          id: '4',
          type: 'text',
          title: 'Навыки',
          icon: 'format_list_bulleted',
          position: { x: 0, y: 3, width: 1, height: 1, rotation: 0 },
          content: {
            blocks: [
              {
                id: '401',
                type: 'heading-1',
                content: 'Мои навыки',
                format: { bold: true }
              }
            ]
          }
        }
      ];
      
      setWidgets(sampleWidgets);
      setLoading(false);
    };
    
    loadData();
  }, []);
  
  // Обработка переключения вкладок
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Обработка обновления виджетов из редактора
  const handleUpdateWidgets = (updatedEditorWidgets: EditorWidget[]) => {
    const convertedWidgets = convertEditorWidgets(updatedEditorWidgets);
    setWidgets(convertedWidgets);
    
    // В реальном приложении здесь будет сохранение на сервер
    setSnackbar({
      open: true,
      message: 'Изменения сохранены',
      severity: 'success'
    });
  };
  
  // Добавление нового виджета
  const handleAddWidget = (type: WidgetType) => {
    // Реализация добавления виджета
  };
  
  // Сохранение профиля
  const handleSaveProfile = () => {
    // Имитация сохранения
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setEditing(false);
      
      setSnackbar({
        open: true,
        message: 'Профиль успешно сохранен',
        severity: 'success'
      });
    }, 1000);
  };
  
  if (loading) {
  return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 'calc(100vh - 64px)' 
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
          {/* Верхняя панель */}
        <Paper
            elevation={1} 
          sx={{
            p: 2,
              mb: 3, 
            display: 'flex',
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Мой профиль
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Персональная страница в стиле Notion
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {editing ? (
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  Сохранить
                </Button>
              ) : (
                <Button 
                  variant="outlined" 
                  startIcon={<EditIcon />} 
                  onClick={() => setEditing(true)}
                >
                  Редактировать
                </Button>
              )}
              
            <Button
              variant="outlined"
                startIcon={<ShareIcon />}
              >
                Поделиться
              </Button>
              
              {!isMobile && (
                <IconButton>
                  <QrCodeIcon />
                </IconButton>
              )}
            </Box>
          </Paper>
          
          {/* Вкладки */}
          <Paper sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Профиль" />
              <Tab label="Проекты" />
              <Tab label="Контакты" />
              <Tab label="Аналитика" />
            </Tabs>
          </Paper>
          
          {/* Основной контент */}
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
              <WidgetEditor
                widgets={convertWidgetsForEditor(widgets)}
                onUpdateWidgets={handleUpdateWidgets}
                isEditing={editing}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                Проекты
              </Typography>
              <Typography>
                Здесь будет список проектов (находится в разработке)
              </Typography>
            </Paper>
          </Box>
          
          <Box sx={{ display: tabValue === 2 ? 'block' : 'none' }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                Контакты
              </Typography>
              <Typography>
                Здесь будут контактные данные (находится в разработке)
              </Typography>
            </Paper>
          </Box>
          
          <Box sx={{ display: tabValue === 3 ? 'block' : 'none' }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                Аналитика
              </Typography>
              <Typography>
                Здесь будет аналитика профиля (находится в разработке)
              </Typography>
            </Paper>
          </Box>
          
          {/* Уведомления */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSnackbar({ ...snackbar, open: false })} 
              severity={snackbar.severity}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default SocialProfile; 