import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem, CircularProgress, Snackbar, Alert, Tabs, Tab, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import Draggable, { DraggableBounds } from 'react-draggable';
import { Resizable } from 're-resizable';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import LinkIcon from '@mui/icons-material/Link';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import TabletIcon from '@mui/icons-material/Tablet';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import { Add, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import WidgetPalettePanel from '../../components/WidgetPalettePanel';

// Импорт компонентов виджетов
import TextWidget from '../../components/widgets/TextWidget';
import PhotoWidget from '../../components/widgets/PhotoWidget';
import VideoWidget from '../../components/widgets/VideoWidget';
import LinksWidget from '../../components/widgets/LinksWidget';
import ProfileInfoWidget from '../../components/widgets/ProfileInfoWidget';
import SocialLinksWidget from '../../components/widgets/SocialLinksWidget';

// Стили для компонентов
const EditorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 64px)',
  overflow: 'hidden',
}));

const Toolbar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  zIndex: 10,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
  },
}));

const EditorMainContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
}));

const WidgetPanel = styled(Box)<{ $isOpen?: boolean }>(({ theme, $isOpen = true }) => ({
  position: 'absolute',
  left: $isOpen ? 0 : '-280px',
  top: 0,
  height: '100%',
  width: 280,
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  zIndex: 100,
  boxShadow: $isOpen ? '0 0 15px rgba(0, 0, 0, 0.1)' : 'none',
  [theme.breakpoints.down('md')]: {
    position: 'fixed',
    width: '280px',
    height: '100vh',
  },
}));

const PanelToggleButton = styled(Box)<{ $isOpen?: boolean }>(({ theme, $isOpen = true }) => ({
  position: 'fixed',
  left: $isOpen ? "280px" : "0",
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: theme.palette.background.paper,
  borderTopRightRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
  boxShadow: '4px 0 8px rgba(0, 0, 0, 0.1)',
  zIndex: 101,
  transition: 'all 0.3s ease',
  '& button': {
    padding: '12px 8px',
    minWidth: '40px',
    height: '80px',
  }
}));

const WidgetCategoryList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1),
  gap: theme.spacing(1),
}));

const WidgetCategoryItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': {
    transform: 'translateX(5px)',
    boxShadow: theme.shadows[3],
    backgroundColor: theme.palette.action.hover,
  },
  '& svg': {
    marginRight: theme.spacing(1),
  }
}));

const WidgetLibrary = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const WidgetPreview = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateX(5px)',
    boxShadow: theme.shadows[3],
  },
  '&:hover .widget-actions': {
    opacity: 1,
  },
  '& svg': {
    marginRight: theme.spacing(1.5),
  }
}));

const WidgetPreviewActions = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(0.5),
  opacity: 0,
  transition: 'opacity 0.2s',
}));

const WorkArea = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  overflow: 'auto',
  backgroundColor: theme.palette.grey[100],
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
}));

const Canvas = styled(Paper, { shouldForwardProp: (prop) => prop !== 'viewMode' })<{ viewMode: string }>(({ theme, viewMode }) => ({
  width: viewMode === 'mobile' ? 360 : viewMode === 'tablet' ? 768 : 1024,
  height: viewMode === 'mobile' ? 640 : viewMode === 'tablet' ? 1024 : 768,
  position: 'relative', 
  overflow: 'hidden',
  boxShadow: theme.shadows[3],
  transition: 'width 0.3s ease-in-out, height 0.3s ease-in-out',
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px), 
                   linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
  backgroundSize: '20px 20px',
  [theme.breakpoints.down('lg')]: {
    transform: viewMode === 'desktop' ? 'scale(0.8)' : 'none',
    transformOrigin: 'top center',
  },
  [theme.breakpoints.down('md')]: {
    transform: viewMode === 'desktop' ? 'scale(0.6)' : viewMode === 'tablet' ? 'scale(0.8)' : 'none',
    transformOrigin: 'top center',
  },
  [theme.breakpoints.down('sm')]: {
    transform: viewMode === 'desktop' ? 'scale(0.5)' : viewMode === 'tablet' ? 'scale(0.6)' : 'scale(0.8)',
    transformOrigin: 'top center',
  },
}));

const PreviewCanvas = styled(Paper)(({ theme }) => ({
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'auto',
  backgroundColor: theme.palette.background.paper,
}));

const WidgetWrapper = styled(Box)(({ theme }) => ({
  position: 'absolute',
  cursor: 'move',
  '&:hover': {
    outline: `2px dashed ${theme.palette.primary.main}`,
  },
}));

const ViewModeToggle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  overflow: 'hidden',
  '& .MuiIconButton-root': {
    borderRadius: 0,
    padding: theme.spacing(1),
  },
  '& .active': {
    backgroundColor: theme.palette.action.selected,
    color: theme.palette.primary.main,
  }
}));

// Типы для виджетов
interface Widget {
  id: string;
  type: string;
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  anchor: string;
  zIndex: number;
}

// Интерфейсы для props компонентов виджетов
interface TextWidgetProps {
  content: any;
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

interface PhotoWidgetProps {
  content: any;
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

interface VideoWidgetProps {
  content: any;
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

interface LinksWidgetProps {
  content: any;
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

interface ProfileInfoWidgetProps {
  content: any;
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

interface SocialLinksWidgetProps {
  content: any;
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

// Определяем, находимся ли мы в production среде (netlify и другие хостинги)
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Включаем мок-режим для продакшн
const MOCK_API = isProduction;

// Мок-функции для работы с виджетами
const mockGetWidgets = async () => {
  // Имитируем задержку сети
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Возвращаем примеры виджетов
  return [
    {
      id: '1',
      type: 'text',
      content: { text: 'Пример текстового виджета', align: 'left' },
      position_x: 50,
      position_y: 50,
      width: 200,
      height: 100,
      z_index: 1,
      anchor: 'center'
    },
    {
      id: '2',
      type: 'photo',
      content: { url: 'https://via.placeholder.com/200x100', caption: 'Пример фото' },
      position_x: 300,
      position_y: 50,
      width: 200,
      height: 150,
      z_index: 2,
      anchor: 'center'
    },
    {
      id: '3',
      type: 'links',
      content: { links: [{ title: 'Мой сайт', url: 'https://example.com' }] },
      position_x: 50,
      position_y: 200,
      width: 200,
      height: 100,
      z_index: 3,
      anchor: 'center'
    }
  ];
};

const mockSaveWidgets = async (widgets: any[]) => {
  // Имитируем задержку сети
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Просто возвращаем успех
  return { success: true };
};

// Компонент редактора
const Editor: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState(window.innerWidth < 960);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [viewMode, setViewMode] = useState('mobile');
  const [editorMode, setEditorMode] = useState('edit'); // 'edit' или 'preview'
  const [selectedAnchor, setSelectedAnchor] = useState('center');
  const [currentTab, setCurrentTab] = useState(0);
  const [widgetPanelOpen, setWidgetPanelOpen] = useState(!mobileView);
  const [widgetCategory, setWidgetCategory] = useState('all');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasBounds, setCanvasBounds] = useState<DraggableBounds | undefined>(undefined);
  const navigate = useNavigate();

  // Категории виджетов
  const widgetCategories = useMemo(() => [
    { id: 'all', label: 'Все', icon: <FormatAlignLeftIcon /> },
    { id: 'basic', label: 'Базовые', icon: <FormatAlignLeftIcon /> },
    { id: 'media', label: 'Медиа', icon: <InsertPhotoIcon /> },
    { id: 'social', label: 'Социальные', icon: <QrCodeIcon /> },
  ], []);

  // Мемоизированный список виджетов с категориями
  const widgetsList = useMemo(() => [
    { type: 'text', icon: <TextFieldsIcon />, label: 'Текст', category: 'basic' },
    { type: 'photo', icon: <InsertPhotoIcon />, label: 'Фото', category: 'media' },
    { type: 'video', icon: <VideoLibraryIcon />, label: 'Видео', category: 'media' },
    { type: 'links', icon: <LinkIcon />, label: 'Ссылки', category: 'basic' },
    { type: 'profile', icon: <AccountCircleIcon />, label: 'Профиль', category: 'basic' },
    { type: 'social', icon: <QrCodeIcon />, label: 'Соц. сети', category: 'social' },
  ], []);

  // Фильтрованный список виджетов по выбранной категории
  const filteredWidgets = useMemo(() => {
    if (widgetCategory === 'all') return widgetsList;
    return widgetsList.filter(widget => widget.category === widgetCategory);
  }, [widgetsList, widgetCategory]);

  // Виджеты для панели инструментов
  const widgetTypesForPanel = useMemo(() => 
    widgetsList.map(widget => ({
      type: widget.type,
      icon: widget.icon,
      label: widget.label,
      category: widget.category
    })), [widgetsList]);

  // Обработка изменения размера окна
  useEffect(() => {
    const handleResize = debounce(() => {
      setMobileView(window.innerWidth < 960);
    }, 200);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, []);

  // Установка границ для перемещения виджетов
  useEffect(() => {
    if (canvasRef.current) {
      setCanvasBounds({
        left: 0,
        top: 0,
        right: canvasRef.current.offsetWidth,
        bottom: canvasRef.current.offsetHeight,
      });
    }
  }, [canvasRef, viewMode]);

  // Загрузка виджетов пользователя
  useEffect(() => {
    const loadUserWidgets = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }

        if (MOCK_API) {
          // Используем мок-данные в продакшн
          const mockData = await mockGetWidgets();
          
          const loadedWidgets = mockData.map((widget: any) => ({
            id: widget.id.toString(),
            type: widget.type,
            content: widget.content,
            position: { x: widget.position_x, y: widget.position_y },
            size: { width: widget.width, height: widget.height },
            anchor: widget.anchor || 'center',
            zIndex: widget.z_index || 1,
          }));
          
          setWidgets(loadedWidgets);
        } else {
          const response = await axios.get('/api/widgets', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data) {
            const loadedWidgets = response.data.map((widget: any) => ({
              id: widget.id.toString(),
              type: widget.type,
              content: widget.content,
              position: { x: widget.position_x, y: widget.position_y },
              size: { width: widget.width, height: widget.height },
              anchor: widget.anchor || 'center',
              zIndex: widget.z_index || 1,
            }));
            
            setWidgets(loadedWidgets);
          }
        }
      } catch (error) {
        console.error('Failed to load widgets:', error);
        setSnackbar({
          open: true,
          message: 'Не удалось загрузить виджеты',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserWidgets();
  }, [navigate]);

  // Добавление нового виджета
  const addWidget = (type: string) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      content: {},
      position: { x: 50, y: 50 },
      size: { width: 200, height: 100 },
      anchor: selectedAnchor,
      zIndex: Math.max(0, ...widgets.map(w => w.zIndex)) + 1
    };

    // Настройка начального содержимого в зависимости от типа виджета
    switch (type) {
      case 'text':
        newWidget.content = { text: 'Двойной клик для редактирования', align: 'left' };
        break;
      case 'photo':
        newWidget.content = { url: 'https://via.placeholder.com/200x100', caption: '' };
        break;
      case 'video':
        newWidget.content = { url: '', title: 'Видео' };
        break;
      case 'links':
        newWidget.content = { links: [{ title: 'Пример ссылки', url: 'https://example.com' }] };
        break;
      case 'profile':
        newWidget.content = { name: 'Имя Фамилия', bio: 'Краткая информация о себе', avatar: '' };
        break;
      case 'social':
        newWidget.content = { networks: [] };
        break;
      default:
        break;
    }

    // Оптимизированный алгоритм поиска позиции без пересечений
    let positionX = 50;
    let positionY = 50;
    const grid = 20; // Шаг сетки для размещения
    
    const usedPositions = new Set();
    widgets.forEach(widget => {
      // Добавляем занятые позиции в пределах виджета
      for (let x = widget.position.x; x < widget.position.x + widget.size.width; x += grid) {
        for (let y = widget.position.y; y < widget.position.y + widget.size.height; y += grid) {
          usedPositions.add(`${Math.floor(x/grid)},${Math.floor(y/grid)}`);
        }
      }
    });
    
    // Ищем свободную позицию
    let found = false;
    const maxX = (canvasBounds?.right || 300) - newWidget.size.width;
    const maxY = (canvasBounds?.bottom || 500) - newWidget.size.height;
    
    for (let y = 50; y <= maxY && !found; y += grid) {
      for (let x = 50; x <= maxX && !found; x += grid) {
        const key = `${Math.floor(x/grid)},${Math.floor(y/grid)}`;
        if (!usedPositions.has(key)) {
          positionX = x;
          positionY = y;
          found = true;
          break;
        }
      }
    }
    
    newWidget.position = { x: positionX, y: positionY };
    setWidgets([...widgets, newWidget]);
    setActiveWidget(newWidget.id);
  };

  // Обработка перемещения виджета с оптимизацией обновлений
  const handleDrag = (id: string, data: { x: number; y: number }) => {
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id 
          ? { ...widget, position: { x: data.x, y: data.y } } 
          : widget
      )
    );
  };

  // Обработка изменения размера виджета с оптимизацией обновлений
  const handleResize = (id: string, size: { width: number; height: number }) => {
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id 
          ? { ...widget, size } 
          : widget
      )
    );
  };

  // Оптимизированное обновление содержимого виджета
  const updateWidgetContent = (id: string, content: any) => {
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id 
          ? { ...widget, content: { ...widget.content, ...content } } 
          : widget
      )
    );
  };

  // Удаление виджета
  const deleteWidget = (id: string) => {
    setWidgets(widgets.filter(widget => widget.id !== id));
    if (activeWidget === id) {
      setActiveWidget(null);
    }
  };

  // Изменение z-index виджета
  const bringToFront = (id: string) => {
    const maxZIndex = Math.max(...widgets.map(w => w.zIndex)) + 1;
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id 
          ? { ...widget, zIndex: maxZIndex } 
          : widget
      )
    );
  };

  // Сохранение всех виджетов с оптимизацией
  const saveWidgets = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      if (MOCK_API) {
        // Используем мок-функцию в продакшн
        const widgetsData = widgets.map(widget => ({
          id: widget.id.length <= 10 ? widget.id : undefined, // Если ID длинный - это новый виджет
          type: widget.type,
          content: widget.content,
          position_x: widget.position.x,
          position_y: widget.position.y,
          width: widget.size.width,
          height: widget.size.height,
          anchor: widget.anchor,
          z_index: widget.zIndex
        }));
        
        await mockSaveWidgets(widgetsData);
      } else {
        // Оптимизация: отправляем все виджеты одним запросом
        await axios.post('/api/widgets/batch', { widgets: widgets.map(widget => ({
          id: widget.id.length <= 10 ? widget.id : undefined, // Если ID длинный - это новый виджет
          type: widget.type,
          content: widget.content,
          position_x: widget.position.x,
          position_y: widget.position.y,
          width: widget.size.width,
          height: widget.size.height,
          anchor: widget.anchor,
          z_index: widget.zIndex
        }))}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setSnackbar({
        open: true,
        message: 'Изменения сохранены успешно!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save widgets:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось сохранить изменения',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Обработка переключения вкладок
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Рендеринг виджета в режиме редактирования
  const renderEditableWidget = (widget: Widget) => {
    const isActive = activeWidget === widget.id;
    
    // Общие настройки для Draggable и Resizable
    const draggableProps = {
      position: { x: widget.position.x, y: widget.position.y },
      onDrag: (_e: any, data: any) => handleDrag(widget.id, { x: data.x, y: data.y }),
      onStart: () => {
        setActiveWidget(widget.id);
        bringToFront(widget.id);
      },
      bounds: canvasBounds,
      scale: 1,
    };
    
    const resizableProps = {
      size: { width: widget.size.width, height: widget.size.height },
      onResizeStop: (_e: any, _direction: any, ref: any) => {
        handleResize(widget.id, { 
          width: parseInt(ref.style.width), 
          height: parseInt(ref.style.height) 
        });
      },
      minWidth: 100,
      minHeight: 50,
      grid: [10, 10] as [number, number],
    };
    
    // Дополнительные инструменты для виджета
    const widgetTools = (
      <Box 
        sx={{ 
          position: 'absolute', 
          top: -30, 
          right: 0, 
          display: isActive ? 'flex' : 'none',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '4px',
          boxShadow: 1,
          zIndex: 100
        }}
      >
        <Tooltip title="Удалить">
          <IconButton size="small" onClick={() => deleteWidget(widget.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {widget.type === 'text' && (
          <>
            <Tooltip title="По левому краю">
              <IconButton 
                size="small" 
                onClick={() => updateWidgetContent(widget.id, { align: 'left' })}
              >
                <FormatAlignLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="По центру">
              <IconButton 
                size="small" 
                onClick={() => updateWidgetContent(widget.id, { align: 'center' })}
              >
                <FormatAlignCenterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="По правому краю">
              <IconButton 
                size="small" 
                onClick={() => updateWidgetContent(widget.id, { align: 'right' })}
              >
                <FormatAlignRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    );
    
    return (
      <Draggable key={widget.id} {...draggableProps}>
        <WidgetWrapper style={{ zIndex: widget.zIndex }}>
          <Resizable {...resizableProps}>
            <Paper 
              elevation={isActive ? 3 : 1} 
              sx={{ 
                height: '100%', 
                position: 'relative',
                outline: isActive ? `2px solid ${(theme: any) => theme.palette.primary.main}` : 'none' 
              }}
              onClick={() => setActiveWidget(widget.id)}
            >
              {widgetTools}
              <Box sx={{ p: 1, height: '100%', overflow: 'hidden' }}>
                {widget.type === 'text' && (
                  <TextWidget 
                    content={widget.content} 
                    onContentChange={(content) => updateWidgetContent(widget.id, content)} 
                  />
                )}
                {widget.type === 'photo' && (
                  <PhotoWidget 
                    content={widget.content} 
                    onContentChange={(content) => updateWidgetContent(widget.id, content)} 
                  />
                )}
                {widget.type === 'video' && (
                  <VideoWidget 
                    content={widget.content} 
                    onContentChange={(content) => updateWidgetContent(widget.id, content)} 
                  />
                )}
                {widget.type === 'links' && (
                  <LinksWidget 
                    content={widget.content} 
                    onContentChange={(content) => updateWidgetContent(widget.id, content)} 
                  />
                )}
                {widget.type === 'profile' && (
                  <ProfileInfoWidget 
                    content={widget.content} 
                    onContentChange={(content) => updateWidgetContent(widget.id, content)} 
                  />
                )}
                {widget.type === 'social' && (
                  <SocialLinksWidget 
                    content={widget.content} 
                    onContentChange={(content) => updateWidgetContent(widget.id, content)} 
                  />
                )}
              </Box>
            </Paper>
          </Resizable>
        </WidgetWrapper>
      </Draggable>
    );
  };

  // Рендеринг виджета в режиме предпросмотра
  const renderPreviewWidget = (widget: Widget) => {
    return (
      <Box
        key={widget.id}
        sx={{
          position: 'absolute',
          left: widget.position.x,
          top: widget.position.y,
          width: widget.size.width,
          height: widget.size.height,
          zIndex: widget.zIndex,
        }}
      >
        <Paper 
          elevation={1} 
          sx={{ height: '100%', overflow: 'hidden' }}
        >
          <Box sx={{ p: 1, height: '100%', overflow: 'hidden' }}>
            {widget.type === 'text' && (
              <TextWidget 
                content={widget.content}
                onContentChange={() => {}} 
                readOnly 
              />
            )}
            {widget.type === 'photo' && (
              <PhotoWidget 
                content={widget.content}
                onContentChange={() => {}} 
                readOnly
              />
            )}
            {widget.type === 'video' && (
              <VideoWidget 
                content={widget.content}
                onContentChange={() => {}} 
                readOnly
              />
            )}
            {widget.type === 'links' && (
              <LinksWidget 
                content={widget.content}
                onContentChange={() => {}} 
                readOnly
              />
            )}
            {widget.type === 'profile' && (
              <ProfileInfoWidget 
                content={widget.content}
                onContentChange={() => {}} 
                readOnly
              />
            )}
            {widget.type === 'social' && (
              <SocialLinksWidget 
                content={widget.content}
                onContentChange={() => {}} 
                readOnly
              />
            )}
          </Box>
        </Paper>
      </Box>
    );
  };

  // Обработчик изменения категории виджетов
  const handleCategoryChange = (category: string) => {
    setWidgetCategory(category);
  };

  // Переключение видимости панели виджетов
  const toggleWidgetPanel = () => {
    setWidgetPanelOpen(!widgetPanelOpen);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <EditorContainer>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="div" sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>
            Редактор профиля
          </Typography>
          <ViewModeToggle>
            <Tooltip title="Мобильный">
              <IconButton 
                onClick={() => setViewMode('mobile')} 
                className={viewMode === 'mobile' ? 'active' : ''}
              >
                <PhoneIphoneIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Планшет">
              <IconButton 
                onClick={() => setViewMode('tablet')} 
                className={viewMode === 'tablet' ? 'active' : ''}
              >
                <TabletIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Компьютер">
              <IconButton 
                onClick={() => setViewMode('desktop')} 
                className={viewMode === 'desktop' ? 'active' : ''}
              >
                <DesktopWindowsIcon />
              </IconButton>
            </Tooltip>
          </ViewModeToggle>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Предпросмотр">
            <IconButton 
              onClick={() => setEditorMode(editorMode === 'edit' ? 'preview' : 'edit')} 
              color={editorMode === 'preview' ? 'primary' : 'default'}
            >
              {editorMode === 'edit' ? <VisibilityIcon /> : <ModeEditIcon />}
            </IconButton>
          </Tooltip>
          
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />} 
            onClick={saveWidgets}
            disabled={saving}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<PublishIcon />} 
            onClick={() => navigate('/social')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            На главную
          </Button>
          
          <IconButton 
            color="primary" 
            onClick={saveWidgets}
            sx={{ display: { xs: 'flex', sm: 'none' } }}
          >
            <SaveIcon />
          </IconButton>
        </Box>
      </Toolbar>
      
      <EditorMainContent>
        {/* Используем компонент WidgetPalettePanel */}
        <WidgetPalettePanel 
          isOpen={widgetPanelOpen}
          onClose={toggleWidgetPanel}
          onAddWidget={addWidget}
          widgetTypes={widgetTypesForPanel}
        />
        
        <WorkArea>
          <Canvas ref={canvasRef} viewMode={viewMode}>
            {editorMode === 'edit' ? (
              widgets.map((widget) => renderEditableWidget(widget))
            ) : (
              <PreviewCanvas>
                {widgets.map((widget) => renderPreviewWidget(widget))}
              </PreviewCanvas>
            )}
          </Canvas>
        </WorkArea>
      </EditorMainContent>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </EditorContainer>
  );
};

export default Editor; 