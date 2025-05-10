import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import AddIcon from '@mui/icons-material/Add';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import CodeIcon from '@mui/icons-material/Code';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ResizeIcon from '@mui/icons-material/OpenWith';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { styled } from '@mui/material/styles';

// Импортируем компоненты виджетов
import NotionBlockWidget from './widgets/NotionBlockWidget';
import NotionProfileWidget from './widgets/NotionProfileWidget';
import PhotoCarouselWidget from './widgets/PhotoCarouselWidget';
import GalleryDatabaseWidget from './widgets/GalleryDatabaseWidget';
import WidgetSettings from './WidgetSettings';

// Стилизованные компоненты
const EditorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  maxWidth: 1200,
  margin: '0 auto',
}));

const PageContainer = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  position: 'relative',
  minHeight: 300,
}));

const WidgetContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    zIndex: 10
  },
}));

const WidgetControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: -30,
  left: 0,
  display: 'flex',
  alignItems: 'center',
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(0.5),
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
  zIndex: 100,
  padding: theme.spacing(0.5, 1),
}));

const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  marginBottom: theme.spacing(2),
}));

const WidgetTypeButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
  textTransform: 'none',
}));

// Экспортируем тип виджета для использования в других компонентах
export type WidgetType = 'notion-block' | 'notion-profile' | 'photo-carousel' | 'gallery-database';

// Интерфейс виджета
export interface Widget {
  id: string;
  type: WidgetType;
  content: any; // Динамический контент, зависит от типа виджета
  layout?: {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
  };
  style?: {
    backgroundColor?: string;
    color?: string;
    borderRadius?: number;
    opacity?: number;
    padding?: number;
    boxShadow?: string;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: string;
  };
}

interface WidgetEditorProps {
  widgets: Widget[];
  onUpdateWidgets: (widgets: Widget[]) => void;
  isEditing: boolean;
}

const WidgetEditor: React.FC<WidgetEditorProps> = ({
  widgets: initialWidgets,
  onUpdateWidgets,
  isEditing
}) => {
  // Состояния
  const [localWidgets, setLocalWidgets] = useState<any[]>([]);
  const [layout, setLayout] = useState<any[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [containerWidth, setContainerWidth] = useState(1200);
  
  // Добавляем состояние для диалога настроек виджета
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Настройки сетки для GridLayout
  const gridProps = {
    className: "layout",
    cols: 12, // 12 колонок в сетке
    rowHeight: 30, // высота одной строки в пикселях
    width: containerWidth, // ширина контейнера
    compactType: null as null, // отключаем автоматическое перемещение виджетов
    preventCollision: true, // предотвращаем наложение виджетов
    isResizable: isEditing, // разрешаем изменение размера только в режиме редактирования
    isDraggable: isEditing, // разрешаем перетаскивание только в режиме редактирования
    margin: [10, 10] as [number, number], // отступы между элементами
  };

  // При изменении входящих виджетов, обновляем локальное состояние и макет
  useEffect(() => {
    // Преобразуем виджеты в формат для react-grid-layout
    const widgetsWithLayout = initialWidgets.map((widget, index) => {
      // Если у виджета нет layout, создаем его
      if (!widget.layout) {
        widget.layout = {
          i: widget.id,
          x: index % 2 * 6, // Чередуем виджеты в 2 колонки
          y: Math.floor(index / 2) * 6, // Каждые 2 виджета - новая строка
          w: 6, // Ширина по умолчанию - половина экрана
          h: 6, // Высота по умолчанию - 6 ячеек
          minW: 3, // Минимальная ширина
          minH: 3, // Минимальная высота
          isDraggable: isEditing,
          isResizable: isEditing
        };
      }
      return widget;
    });
    
    setLocalWidgets(widgetsWithLayout);
    
    // Создаем макет для GridLayout
    const newLayout = widgetsWithLayout.map(widget => widget.layout);
    setLayout(newLayout);
  }, [initialWidgets, isEditing]);

  // Измеряем ширину контейнера
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.editor-container');
      if (container) {
        setContainerWidth(container.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Обновление виджета
  const handleUpdateWidget = (id: string, newContent: any) => {
    const updatedWidgets = localWidgets.map(widget => {
      if (widget.id === id) {
        return { ...widget, content: newContent };
      }
      return widget;
    });
    
    setLocalWidgets(updatedWidgets);
    onUpdateWidgets(updatedWidgets);
  };

  // Обработчик изменения макета
  const handleLayoutChange = (newLayout: any[]) => {
    // Обновляем макет
    setLayout(newLayout);
    
    // Обновляем локальные виджеты с новыми layout
    const updatedWidgets = localWidgets.map(widget => {
      const widgetLayout = newLayout.find(item => item.i === widget.id);
      if (widgetLayout) {
        return {
          ...widget,
          layout: {
            ...widgetLayout,
            w: widgetLayout.w || 4, // Добавляем значение по умолчанию если w отсутствует
            h: widgetLayout.h || 4, // Добавляем значение по умолчанию если h отсутствует
          }
        } as any;
      }
      return widget;
    }) as any;
    
    // @ts-ignore
    setLocalWidgets(updatedWidgets);
    // @ts-ignore
    onUpdateWidgets(updatedWidgets);
  };

  // Открытие меню виджета
  const handleOpenWidgetMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedWidgetId(id);
  };
  
  // Закрытие меню виджета
  const handleCloseWidgetMenu = () => {
    setMenuAnchor(null);
    setSelectedWidgetId(null);
  };
  
  // Удаление виджета
  const handleDeleteWidget = () => {
    if (!selectedWidgetId) return;
    
    const updatedWidgets = localWidgets.filter(widget => widget.id !== selectedWidgetId);
    setLocalWidgets(updatedWidgets);
    onUpdateWidgets(updatedWidgets);
    handleCloseWidgetMenu();
    
    setSnackbar({
      open: true,
      message: 'Виджет успешно удален',
      severity: 'success'
    });
  };
  
  // Дублирование виджета
  const handleDuplicateWidget = () => {
    if (!selectedWidgetId) return;
    
    const widgetToDuplicate = localWidgets.find(widget => widget.id === selectedWidgetId);
    if (!widgetToDuplicate) return;
    
    const duplicatedWidget = {
      ...widgetToDuplicate,
      id: Date.now().toString(),
      layout: {
        ...widgetToDuplicate.layout,
        i: Date.now().toString(),
        x: (widgetToDuplicate.layout?.x || 0) + 1,
        y: (widgetToDuplicate.layout?.y || 0) + 1,
      }
    };
    
    const newWidgets = [...localWidgets, duplicatedWidget];
    setLocalWidgets(newWidgets);
    onUpdateWidgets(newWidgets);
    handleCloseWidgetMenu();
    
    setSnackbar({
      open: true,
      message: 'Виджет успешно дублирован',
      severity: 'success'
    });
  };
  
  // Перемещение виджета вверх
  const handleMoveUp = () => {
    if (!selectedWidgetId) return;
    
    // Ищем индекс выбранного виджета
    const index = localWidgets.findIndex(widget => widget.id === selectedWidgetId);
    if (index <= 0) return; // Уже в начале, нельзя переместить выше
    
    // Если в виджете есть layout, обновляем позицию Y
    const updatedWidgets = [...localWidgets];
    const temp = { ...updatedWidgets[index] };
    
    // Обновляем layout для перемещения вверх
    if (temp.layout && updatedWidgets[index - 1].layout) {
      const prevY = updatedWidgets[index - 1].layout?.y || 0;
      temp.layout = { ...temp.layout, y: prevY - 1 };
    }
    
    // Меняем местами с предыдущим виджетом
    updatedWidgets[index] = updatedWidgets[index - 1];
    updatedWidgets[index - 1] = temp;
    
    setLocalWidgets(updatedWidgets);
    onUpdateWidgets(updatedWidgets);
    handleCloseWidgetMenu();
  };
  
  // Перемещение виджета вниз
  const handleMoveDown = () => {
    if (!selectedWidgetId) return;
    
    // Ищем индекс выбранного виджета
    const index = localWidgets.findIndex(widget => widget.id === selectedWidgetId);
    if (index >= localWidgets.length - 1) return; // Уже в конце, нельзя переместить ниже
    
    // Если в виджете есть layout, обновляем позицию Y
    const updatedWidgets = [...localWidgets];
    const temp = { ...updatedWidgets[index] };
    
    // Обновляем layout для перемещения вниз
    if (temp.layout && updatedWidgets[index + 1].layout) {
      const nextY = updatedWidgets[index + 1].layout?.y || 0;
      temp.layout = { ...temp.layout, y: nextY + 1 };
    }
    
    // Меняем местами со следующим виджетом
    updatedWidgets[index] = updatedWidgets[index + 1];
    updatedWidgets[index + 1] = temp;
    
    setLocalWidgets(updatedWidgets);
    onUpdateWidgets(updatedWidgets);
    handleCloseWidgetMenu();
  };
  
  // Изменение заголовка виджета
  const handleEditTitle = () => {
    if (!selectedWidgetId) return;
    
    const selectedWidget = localWidgets.find(widget => widget.id === selectedWidgetId);
    if (!selectedWidget) return;
    
    setTitleInput(selectedWidget.content?.title || '');
    setTitleDialogOpen(true);
  };
  
  // Сохранение нового заголовка
  const handleSaveTitle = () => {
    if (!selectedWidgetId) return;
    
    const updatedWidgets = localWidgets.map(widget => {
      if (widget.id === selectedWidgetId) {
        return {
          ...widget,
          content: {
            ...widget.content,
            title: titleInput
          }
        };
      }
      return widget;
    });
    
    setLocalWidgets(updatedWidgets);
    onUpdateWidgets(updatedWidgets);
    setTitleDialogOpen(false);
    handleCloseWidgetMenu();
    
    setSnackbar({
      open: true,
      message: 'Заголовок успешно изменен',
      severity: 'success'
    });
  };
  
  // Закрытие снэкбара
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Получаем выбранный виджет
  const selectedWidget = selectedWidgetId 
    ? localWidgets.find(widget => widget.id === selectedWidgetId) 
    : null;
  
  // Обработчик открытия настроек виджета
  const handleOpenSettings = () => {
    setSettingsOpen(true);
    handleCloseWidgetMenu();
  };
  
  // Обработчик обновления настроек виджета
  const handleUpdateWidgetSettings = (updatedWidget: Widget) => {
    const updatedWidgets = localWidgets.map(widget => 
      widget.id === updatedWidget.id ? updatedWidget : widget
    );
    
    setLocalWidgets(updatedWidgets);
    onUpdateWidgets(updatedWidgets);
  };
  
  // Получение названия типа виджета
  const getWidgetTypeName = (type: string) => {
    switch(type) {
      case 'notion-block':
        return 'Текстовый блок';
      case 'notion-profile':
        return 'Профиль';
      case 'photo-carousel':
        return 'Фотогалерея';
      case 'gallery-database':
        return 'База данных';
      default:
        return 'Виджет';
    }
  };
  
  // Рендеринг виджета
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'notion-block':
        return (
          <NotionBlockWidget
            block={{
              id: widget.id,
              type: 'paragraph',
              content: widget.content?.content || 'Пустой блок',
              format: widget.content?.format || {}
            }}
            index={0}
            isEditing={isEditing}
            onUpdate={(id, updatedBlock) => {
              const updatedContent = {
                content: updatedBlock.content,
                format: updatedBlock.format
              };
              handleUpdateWidget(widget.id, updatedContent);
            }}
            onDelete={() => {}}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            onDuplicate={() => {}}
            onAddBlockBelow={() => {}}
          />
        );
      case 'notion-profile':
        return (
          <NotionProfileWidget
            content={widget.content}
            onUpdate={(content) => handleUpdateWidget(widget.id, content)}
            isEditing={isEditing}
          />
        );
      case 'photo-carousel':
        return (
          <PhotoCarouselWidget
            content={widget.content}
            onUpdate={(content) => handleUpdateWidget(widget.id, content)}
            isEditing={isEditing}
            onDelete={() => {}}
          />
        );
      case 'gallery-database':
        return (
          <GalleryDatabaseWidget
            content={widget.content}
            onUpdate={(content) => handleUpdateWidget(widget.id, content)}
            isEditing={isEditing}
          />
        );
      default:
        return <Typography>Неизвестный тип виджета</Typography>;
    }
  };
  
  // Функция для применения стилей к элементу GridLayout
  const applyWidgetStyles = (widget: Widget): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      overflow: 'hidden'
    };
    
    if (!widget.style) return baseStyles;
    
    return {
      ...baseStyles,
      backgroundColor: widget.style.backgroundColor,
      color: widget.style.color,
      borderRadius: widget.style.borderRadius,
      opacity: widget.style.opacity,
      padding: widget.style.padding,
      boxShadow: widget.style.boxShadow,
      borderWidth: widget.style.borderWidth,
      borderStyle: widget.style.borderStyle,
      borderColor: widget.style.borderColor
    };
  };
  
  return (
    <EditorContainer className="editor-container" id="widget-editor">
      <PageContainer>
        {/* Сетка для виджетов с использованием react-grid-layout */}
        <GridLayout 
          {...gridProps}
          layout={layout}
          onLayoutChange={handleLayoutChange}
        >
          {localWidgets.map((widget) => (
            <div key={widget.id} style={applyWidgetStyles(widget)}>
              <WidgetContainer>
                {isEditing && (
                  <WidgetControls className="widget-controls">
                    <Typography variant="caption" sx={{ mx: 1 }}>
                      {getWidgetTypeName(widget.type)}
                    </Typography>
                    
                    <Tooltip title="Настройки виджета">
                      <IconButton 
                        size="small"
                        onClick={(e) => handleOpenWidgetMenu(e, widget.id)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </WidgetControls>
                )}
                
                {renderWidget(widget)}
              </WidgetContainer>
            </div>
          ))}
        </GridLayout>
      </PageContainer>
      
      {/* Меню виджета */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseWidgetMenu}
      >
        <MenuItem onClick={handleEditTitle}>
          <TextFieldsIcon fontSize="small" sx={{ mr: 1 }} />
          Изменить заголовок
        </MenuItem>
        <MenuItem onClick={handleDuplicateWidget}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Дублировать
        </MenuItem>
        <MenuItem onClick={handleMoveUp}>
          <ArrowUpwardIcon fontSize="small" sx={{ mr: 1 }} />
          Переместить вверх
        </MenuItem>
        <MenuItem onClick={handleMoveDown}>
          <ArrowDownwardIcon fontSize="small" sx={{ mr: 1 }} />
          Переместить вниз
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleOpenSettings}>
          <SettingsBackupRestoreIcon fontSize="small" sx={{ mr: 1 }} />
          Настройки виджета
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteWidget} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>
      
      {/* Диалог изменения заголовка */}
      <Dialog open={titleDialogOpen} onClose={() => setTitleDialogOpen(false)}>
        <DialogTitle>Изменить заголовок</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Заголовок"
            fullWidth
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTitleDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveTitle} color="primary">Сохранить</Button>
        </DialogActions>
      </Dialog>
      
      {/* Компонент настроек виджета */}
      {selectedWidget && (
        <WidgetSettings 
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          widget={selectedWidget}
          onUpdate={handleUpdateWidgetSettings}
        />
      )}
      
      {/* Уведомление */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </EditorContainer>
  );
};

export default WidgetEditor; 