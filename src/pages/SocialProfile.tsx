import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, Stack, IconButton, Tooltip, Menu, MenuItem, Switch, FormControlLabel, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, InputAdornment, Divider, Container, CircularProgress, Tabs, Tab, useMediaQuery, useTheme, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import { Resizable, ResizeCallback } from 're-resizable';
import { Delete as DeleteIcon, Save as SaveIcon, ContentCopy as DuplicateIcon, Palette as PaletteIcon, GridOn as GridIcon, GridOff as GridOffIcon, OpenWith as MoveIcon, Download as DownloadIcon, FileUpload as UploadIcon, CodeRounded as CodeIcon, ColorLens as ThemeIcon, Edit as EditIcon, Share as ShareIcon, QrCode as QrCodeIcon } from '@mui/icons-material';
import FamilyTreeWidget from '../components/widgets/FamilyTreeWidget';
import ProfileInfoWidget from '../components/widgets/ProfileInfoWidget';
import SocialLinksWidget from '../components/widgets/SocialLinksWidget';

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
  defaultContent: any;
}> = {
  'text': {
    title: 'Текст',
    icon: 'text_fields',
    defaultContent: 'Новый текстовый блок'
  },
  'photo': {
    title: 'Фото',
    icon: 'photo',
    defaultContent: { url: '', caption: '' }
  },
  'video': {
    title: 'Видео',
    icon: 'videocam',
    defaultContent: { url: '', title: '' }
  },
  'links': {
    title: 'Ссылки',
    icon: 'link',
    defaultContent: { links: [] }
  },
  'profile-info': {
    title: 'Информация профиля',
    icon: 'person',
    defaultContent: {
      name: '', 
      occupation: '',
      description: ''
    }
  },
  'social-links': {
    title: 'Социальные сети',
    icon: 'share',
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
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const nodeRef = useRef(null);
  
  // Простой рендеринг виджета в зависимости от типа
  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'profile-info':
        return (
          <ProfileInfoWidget
            content={{
              name: widget.content.name || '',
              bio: widget.content.description || '',
              avatar: widget.content.photo || '',
              location: widget.content.location || ''
            }}
            onUpdate={onUpdate}
            isEditing={isEditing}
          />
        );
      
      case 'social-links':
        return (
          <SocialLinksWidget
            content={{
              networks: widget.content.links || []
            }}
            onContentChange={onUpdate}
            readOnly={!isEditing}
          />
        );
        
      // Заглушки для удаленных типов виджетов
      case 'text':
      case 'photo':
      case 'video':
      case 'links':
      default:
        return (
          <Box p={2}>
            <Typography variant="subtitle1">
              {widget.title || 'Виджет'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditing ? 'Этот тип виджета больше не поддерживается' : ''}
            </Typography>
          </Box>
        );
    }
  };
  
  // Остальной код виджета
  // ... существующий код виджета ...

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
      setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const snapToGridFunc = (pos: { x: number, y: number }) => {
    if (!snapToGrid) return pos;
      return {
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize
      };
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: widget.position.x, y: widget.position.y }}
      onStop={(e, data) => {
        if (isEditing) {
          const snappedPos = snapToGrid ? snapToGridFunc({ x: data.x, y: data.y }) : { x: data.x, y: data.y };
          onPositionChange({
            ...widget.position,
            x: snappedPos.x,
            y: snappedPos.y
          });
        }
      }}
      disabled={!isEditing}
    >
      <Box 
        ref={nodeRef}
        sx={{ 
        position: 'absolute',
          width: `${widget.position.width}px`,
          height: `${widget.position.height}px`,
          transform: `rotate(${widget.position.rotation}deg)`,
          zIndex: 10
        }}
      >
        <WidgetContainer
          theme={theme}
          whileHover={{ scale: isEditing ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {isEditing && (
            <DeleteButton
              color="error"
              onClick={onDelete}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </DeleteButton>
          )}
          
          <WidgetHeader theme={theme}>
            <Typography variant="subtitle1" fontWeight="medium">
              {widget.title}
            </Typography>
            
            {isEditing && (
                    <IconButton
                      size="small"
                sx={{ ml: 'auto' }}
                      onClick={handleOpenMenu}
              >
                      <MoveIcon fontSize="small" />
                    </IconButton>
            )}
          </WidgetHeader>
          
          <WidgetContent>
            {renderWidgetContent()}
          </WidgetContent>
        </WidgetContainer>

                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={handleCloseMenu}
                >
                  <MenuItem onClick={() => {
            handleCloseMenu();
                    onDuplicate();
                  }}>
                    <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
                    Дублировать
                  </MenuItem>
                </Menu>
      </Box>
    </Draggable>
  );
};

const SocialProfile: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [gridSize, setGridSize] = useState<number>(20);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [themeKey, setThemeKey] = useState<keyof typeof THEMES>('light');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [widgetMenuAnchor, setWidgetMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addWidgetMenuOpen, setAddWidgetMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = THEMES[themeKey];
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        // Здесь будет ваш реальный запрос к API
        await new Promise(resolve => setTimeout(resolve, 1500)); // Симуляция задержки загрузки
      
      // Тестовые виджеты
        const testWidgets: Widget[] = [
        {
          id: '1',
          type: 'profile-info',
          title: 'Профиль',
          content: {
              name: 'Иван Иванович Иванов',
              birthDate: '15.06.1945',
              deathDate: '23.04.2022',
              photo: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=1000&auto=format&fit=crop',
              description: 'Любящий отец, дедушка и друг. Ветеран труда. Посвятил свою жизнь семье и работе.'
            },
            icon: 'person',
            position: { x: 50, y: 50, width: 400, height: 300, rotation: 0 }
        },
        {
          id: '2',
            type: 'social-links',
            title: 'Социальные сети',
          content: {
              links: [
                { type: 'facebook', url: 'https://facebook.com', title: 'Facebook' },
                { type: 'instagram', url: 'https://instagram.com', title: 'Instagram' },
                { type: 'youtube', url: 'https://youtube.com', title: 'YouTube' }
              ]
            },
            icon: 'share',
            position: { x: 550, y: 50, width: 300, height: 200, rotation: 0 }
          }
        ];
        
        setWidgets(testWidgets);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      setLoading(false);
        setSnackbar({
          open: true,
          message: 'Ошибка при загрузке данных',
          severity: 'error'
        });
      }
    };
    
    loadData();
  }, []);
  
  // Добавление нового виджета
  const handleAddWidget = (type: WidgetType) => {
    // Логика добавления виджета
  };
  
  // Сохранение профиля
  const handleSaveProfile = () => {
    // Логика сохранения профиля
    setEditing(false);
    setSnackbar({
      open: true,
      message: 'Изменения сохранены',
      severity: 'success'
    });
  };
  
  // Обработчик обновления контента виджета
  const handleUpdateWidgetContent = (id: string, content: any) => {
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id ? { ...widget, content } : widget
      )
    );
  };
  
  // Обработчик удаления виджета
  const handleDeleteWidget = (id: string) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== id));
  };
  
  // Обработчик изменения позиции виджета
  const handlePositionChange = (id: string, position: Widget['position']) => {
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id ? { ...widget, position } : widget
      )
    );
  };
  
  // Обработчик дублирования виджета
  const handleDuplicateWidget = (id: string) => {
    const widgetToDuplicate = widgets.find(widget => widget.id === id);
    if (widgetToDuplicate) {
      const newWidget = {
        ...widgetToDuplicate,
        id: `${widgetToDuplicate.id}-copy-${Date.now()}`,
        position: {
          ...widgetToDuplicate.position,
          x: widgetToDuplicate.position.x + 20,
          y: widgetToDuplicate.position.y + 20
        }
      };
      setWidgets(prevWidgets => [...prevWidgets, newWidget]);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Основная информация о странице памяти */}
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
            Страница памяти
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
          
      {/* Основная область просмотра */}
      <Box sx={{ position: 'relative', minHeight: '600px' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Здесь будет просто просмотр виджетов, без вкладок */}
            <Box sx={{ position: 'relative', height: '100%' }} ref={containerRef}>
              {widgets.map(widget => (
                <Widget 
                  key={widget.id}
                  widget={widget}
                isEditing={editing}
                  onUpdate={(content) => handleUpdateWidgetContent(widget.id, content)}
                  onDelete={() => handleDeleteWidget(widget.id)}
                  onPositionChange={(position) => handlePositionChange(widget.id, position)}
                  onDuplicate={() => handleDuplicateWidget(widget.id)}
                  theme={theme}
                  gridSize={gridSize}
                  snapToGrid={snapToGrid}
                />
              ))}
              {showGrid && <Grid size={gridSize} visible={showGrid} theme={theme} />}
            </Box>
          </>
        )}
          </Box>
          
      {/* Снэкбар для уведомлений */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
        <Alert severity={snackbar.severity} variant="filled">
              {snackbar.message}
            </Alert>
          </Snackbar>
      </Container>
  );
};

export default SocialProfile; 