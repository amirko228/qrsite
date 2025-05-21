import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Tooltip, 
  Switch, 
  FormControlLabel,
  Divider,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Drawer,
  Checkbox,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  ColorLens as ColorLensIcon,
  ViewQuilt as TemplateIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Map as MapIcon,
  AccountCircle as AccountCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PushPin as PushPinIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import Draggable from 'react-draggable';
import BlockSelector from './components/BlockSelector';
import BlockSettingsDialog from './components/BlockSettingsDialog';
import FamilyTreeBlock from './components/FamilyTreeBlock';
import { Block, BlockType, BlockPositionType, BlockSizeType, BlockStyle, SocialNetworkType } from './types';

// Интерфейс для цвета в формате RGBA
interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Константы сетки
const GRID_COLUMNS = 12;
const CELL_SIZE = 80; // px
const GAP_SIZE = 16; // px

// Предустановленные цвета фона
const predefinedColors = [
  { name: 'Белый', value: '#FFFFFF' },
  { name: 'Серый', value: '#EEEEEE' },
  { name: 'Бежевый', value: '#F5F5DC' },
  { name: 'Темно-синий', value: '#1A3C6E' },
  { name: 'Коричневый', value: '#8B4513' },
  { name: 'Красный', value: '#FF4B4B' },
  { name: 'Голубой', value: '#87CEFA' },
  { name: 'Черный', value: '#333333' }
];

// Стандартные размеры блоков
const blockSizes = {
  [BlockSizeType.SQUARE]: { width: 4, height: 4 },       // Квадрат или круг
  [BlockSizeType.MEDIUM]: { width: 6, height: 4 },       // Средний прямоугольник
  [BlockSizeType.THIN_FULL]: { width: 12, height: 3 },   // Тонкий на всю ширину
  [BlockSizeType.WIDE_FULL]: { width: 12, height: 6 },   // Широкий на всю ширину
  [BlockSizeType.TALL]: { width: 4, height: 6 },         // Высокий прямоугольник
  [BlockSizeType.BANNER]: { width: 12, height: 4 },      // Баннер на всю ширину
  [BlockSizeType.GALLERY]: { width: 12, height: 5 }      // Галерея на всю ширину
};

// Функция для преобразования строки rgba в объект
const parseRgba = (rgba: string): RgbaColor => {
  const defaultColor = { r: 255, g: 255, b: 255, a: 1 };
  
  try {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] ? parseFloat(match[4]) : 1
      };
    }
    return defaultColor;
  } catch (e) {
    return defaultColor;
  }
};

// Функция для преобразования объекта RGBA в строку
const rgbaToString = (rgba: RgbaColor): string => {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
};

// Стили для компонентов
const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '600px',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  appBar: {
    backgroundColor: '#fff',
    color: '#333',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    minHeight: '56px'
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center'
  },
  toolbarButton: {
    marginRight: 1,
    borderRadius: '8px',
    textTransform: 'none',
    fontSize: '0.85rem',
    padding: '4px 10px'
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },
  canvas: {
    flex: 1,
    padding: 3,
    overflow: 'auto',
    backgroundColor: '#f8f9fa',
    transition: 'margin-right 0.3s ease'
  },
  canvasInner: {
    width: '100%',
    minHeight: '100%',
    borderRadius: '8px',
    position: 'relative',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden'
  },
  colorPicker: {
    marginBottom: '16px'
  },
  colorContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '16px',
    marginBottom: '16px',
    justifyContent: 'center'
  },
  colorOption: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'transform 0.2s ease, border 0.2s ease',
    '&:hover': {
      transform: 'scale(1.1)'
    }
  },
  colorOptionSelected: {
    border: '2px solid #1976d2'
  },
  draggableBlock: {
    position: 'absolute',
    cursor: 'move',
    userSelect: 'none',
    boxSizing: 'border-box',
    transition: 'box-shadow 0.2s ease, transform 0.1s ease',
    '&:hover': {
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-2px)'
    }
  },
  blockContent: {
    width: '100%',
    height: '100%',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    overflow: 'hidden'
  },
  blockControls: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    display: 'flex',
    gap: '4px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    background: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '4px',
    padding: '2px',
    zIndex: 10
  },
  blockWrapper: {
    position: 'relative',
    '&:hover .blockControls': {
      opacity: 1
    }
  },
  familyTreeContainer: {
    width: '100%',
    padding: '24px',
    backgroundColor: '#f9f9f9',
    borderRadius: '16px',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '20px'
  },
  familyMember: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '120px',
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
    }
  },
  memberPhoto: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover' as 'cover',
    marginBottom: '10px',
    border: '4px solid #fff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  },
  memberPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '10px',
    border: '4px solid #fff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  },
  memberName: {
    fontWeight: 600,
    textAlign: 'center',
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  memberDates: {
    fontSize: '0.8rem',
    color: '#666',
    textAlign: 'center'
  },
  pendingApproval: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ff4b4b',
    color: '#fff',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '0.7rem',
    fontWeight: 'bold'
  },
  sidePanel: {
    width: 350,
    padding: 0,
    overflow: 'hidden',
    borderRight: '1px solid rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease'
  },
  previewWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden'
  }
};

// Расширение стилей для включения стилей ручек изменения размера
const resizeHandleStyles = {
  position: 'absolute',
  width: '14px',
  height: '14px',
  backgroundColor: '#ffffff',
  border: '2px solid #1976d2',
  boxSizing: 'border-box',
  borderRadius: '50%',
  zIndex: 2,
  opacity: 0, // По умолчанию скрыто
  transition: 'opacity 0.2s ease',
  cursor: 'pointer',
  boxShadow: '0 0 4px rgba(0,0,0,0.3)',
};

// Определение пропсов для конструктора
interface ConstructorProps {
  handleBack?: () => void;
  savedData?: {
    blocks?: Block[];
    backgroundColor?: string;
    showOnMap?: boolean;
  };
  userId?: string; // ID текущего пользователя
}

// Отдельный компонент для фотогалереи
const PhotoGalleryBlock: React.FC<{ 
  block: Block; 
  handleAddPhoto: (blockId: string) => void;
  isPreviewMode: boolean;
}> = ({ block, handleAddPhoto, isPreviewMode }) => {
  // Состояние для хранения текущей выбранной фотографии
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  
  // Обработчик выбора фотографии
  const handleSelectPhoto = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIndex(index);
  };
  
  const mediaItems = block.content.mediaItems || [];
  
  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {mediaItems.length > 0 ? (
        <>
          {/* Большая фотография сверху */}
          <Box
            sx={{
              width: '100%',
              height: '70%', // Большая фотография занимает 70% высоты
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              backgroundColor: '#f0f0f0'
            }}
          >
            <img
              src={mediaItems[selectedPhotoIndex].url}
              alt={mediaItems[selectedPhotoIndex].title || `Фото ${selectedPhotoIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
            
            {mediaItems[selectedPhotoIndex].title && (
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '4px 8px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {mediaItems[selectedPhotoIndex].title}
              </Typography>
            )}
          </Box>
          
          {/* Сетка миниатюр внизу */}
          <Box
            sx={{
              width: '100%',
              height: '30%', // Миниатюры занимают 30% высоты
              display: 'flex',
              flexWrap: 'wrap',
              padding: '4px',
              gap: '2px',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
                height: '6px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '3px'
              }
            }}
          >
            {mediaItems.map((item, index) => (
              <Box
                key={item.id || index}
                onClick={(e) => handleSelectPhoto(index, e)}
                sx={{
                  width: 'calc(25% - 2px)', // 4 миниатюры в ряд с учетом отступов
                  height: '80px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  border: index === selectedPhotoIndex ? '2px solid #4a76a8' : '2px solid transparent',
                  boxSizing: 'border-box',
                  borderRadius: '2px',
                  '&:hover': {
                    opacity: 0.9
                  }
                }}
              >
                <img
                  src={item.url}
                  alt={item.title || `Миниатюра ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>
            ))}
            
            {/* Кнопка добавления фото */}
            {!isPreviewMode && (
              <Box
                sx={{
                  width: 'calc(25% - 2px)', // Такой же размер как у миниатюры
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed rgba(0,0,0,0.2)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.05)'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddPhoto(block.id);
                }}
              >
                <AddIcon sx={{ fontSize: '32px', opacity: 0.6 }} />
              </Box>
            )}
          </Box>
        </>
      ) : (
        <Box 
          sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer'
          }}
          onClick={() => handleAddPhoto(block.id)}
        >
          <Box sx={{ textAlign: 'center' }}>
            <ImageIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.7, mb: 2 }} />
            <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 'medium' }}>
              Добавьте фотографии в галерею
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              Вы можете добавить сразу несколько фотографий
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Плавающая кнопка добавления при непустой галерее */}
      {mediaItems.length > 0 && !isPreviewMode && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleAddPhoto(block.id);
          }}
          sx={{
            position: 'absolute',
            right: '10px',
            bottom: '10px',
            backgroundColor: 'rgba(255,255,255,0.8)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.95)'
            },
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10
          }}
        >
          <AddIcon />
        </IconButton>
      )}
    </Box>
  );
};

// Функция для извлечения ID видео из URL YouTube
const extractYouTubeId = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

const Constructor: React.FC<ConstructorProps> = ({ handleBack, savedData, userId }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null); // Track visually selected block
  const [isBlockSelectorOpen, setIsBlockSelectorOpen] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [showOnMap, setShowOnMap] = useState(true);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [customColor, setCustomColor] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Состояния для отслеживания редактирования блоков
  const [originalBlockState, setOriginalBlockState] = useState<Block[] | null>(null); // Сохраняем полное состояние всех блоков
  const [isNewBlock, setIsNewBlock] = useState<boolean>(false); // Флаг для отслеживания новых блоков
  
  // Create refs map for draggable blocks
  const draggableRefs = useRef<{[key: string]: React.RefObject<HTMLDivElement>}>({});
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Получаем ключ для localStorage с учетом ID пользователя
  const getStorageKey = () => {
    return userId ? `pageMemoryData_${userId}` : 'pageMemoryData';
  };
  
  // Функция для определения типа размера блока на основе шаблона
  const getBlockSizeType = (type: BlockType, template: string): BlockSizeType => {
    // Для семейного древа всегда возвращаем широкий блок
    if (type === BlockType.FAMILY_TREE) {
      return BlockSizeType.WIDE_FULL;
    }
    
    // Для текстовых блоков
    if (type === BlockType.TEXT) {
      switch (template) {
        case 'circle':
          return BlockSizeType.SQUARE; // Круг имеет квадратную форму
        case 'rounded-square':
          return BlockSizeType.SQUARE; // Квадрат
        case 'rounded-rectangle':
          return BlockSizeType.MEDIUM; // Прямоугольник
        case 'semicircle':
          return BlockSizeType.THIN_FULL; // Полукруг на всю ширину
        default:
          return BlockSizeType.MEDIUM;
      }
    }
    
    // Для фото блоков
    if (type === BlockType.PHOTO) {
      switch (template) {
        case 'gallery':
          return BlockSizeType.GALLERY; // Галерея на всю ширину
        case 'banner':
          return BlockSizeType.BANNER; // Баннер на всю ширину
        case 'rounded-square':
          return BlockSizeType.SQUARE; // Квадрат со скошенными углами
        case 'circle':
          return BlockSizeType.SQUARE; // Круг
        default:
          return BlockSizeType.MEDIUM;
      }
    }
    
    // Для видео блоков
    if (type === BlockType.VIDEO) {
      switch (template) {
        case 'gallery':
          return BlockSizeType.GALLERY; // Галерея на всю ширину
        case 'rounded-square':
          return BlockSizeType.SQUARE; // Квадрат со скошенными углами
        default:
          return BlockSizeType.MEDIUM;
      }
    }
    
    // Для блоков соцсетей
    if (type === BlockType.SOCIAL) {
      switch (template) {
        case 'circle':
          return BlockSizeType.SQUARE; // Круглая иконка
        case 'bar':
          return BlockSizeType.THIN_FULL; // Панель с иконками на всю ширину
        case 'separate':
          return BlockSizeType.MEDIUM; // Отдельные иконки
        default:
          return BlockSizeType.MEDIUM;
      }
    }
    
    // Для блоков профиля
    if (type === BlockType.PROFILE) {
      switch (template) {
        case 'full-width':
          return BlockSizeType.WIDE_FULL; // На всю ширину
        case 'square':
          return BlockSizeType.SQUARE; // Квадрат со скошенными углами
        case 'form':
          return BlockSizeType.MEDIUM; // Форма с полями
        default:
          return BlockSizeType.MEDIUM;
      }
    }
    
    return BlockSizeType.MEDIUM; // По умолчанию средний размер
  };
  
  // Функция для определения типа позиции блока на основе типа и шаблона
  const getBlockPositionType = (type: BlockType, template: string): BlockPositionType => {
    // Блоки с полной шириной всегда позиционируются как FULL
    if (type === 'familyTree' || template === 'semicircle') {
      return BlockPositionType.FULL;
    }
    
    // Профиль и фото лучше по центру
    if (type === 'profile' || (type === 'photo' && template === 'single')) {
      return BlockPositionType.CENTER;
    }
    
    // Видео блоки по правому краю
    if (type === 'video') {
      return BlockPositionType.RIGHT;
    }
    
    // Социальные блоки слева
    if (type === 'social') {
      return BlockPositionType.LEFT;
    }
    
    // Текстовые блоки зависят от шаблона
    if (type === 'text') {
      if (template === 'circle') {
        return BlockPositionType.LEFT;
      } else if (template === 'square') {
        return BlockPositionType.RIGHT;
      } else {
        return BlockPositionType.CENTER;
      }
    }
    
    // По умолчанию слева
    return BlockPositionType.LEFT;
  };
  
  // Функция для поиска свободной позиции для блока
  const findAvailablePosition = (size: { width: number, height: number }, positionType: BlockPositionType) => {
    // Calculate exact column position based on positionType
    let startCol = 0;
    
    if (positionType === BlockPositionType.FULL || size.width >= GRID_COLUMNS) {
      // Full width blocks start at column 0
      startCol = 0;
    } else if (positionType === BlockPositionType.CENTER) {
      // Center alignment - calculate the middle position
      startCol = Math.floor((GRID_COLUMNS - size.width) / 2);
    } else if (positionType === BlockPositionType.RIGHT) {
      // Right alignment
      startCol = GRID_COLUMNS - size.width;
    } 
    // LEFT alignment is already 0
    
    // Check with top position
    let row = 0;
    let found = false;
    
    while (!found) {
      // Check for conflicts with existing blocks
      const conflicts = blocks.some(block => {
        // При размещении нового блока проверяем конфликты со ВСЕМИ блоками,
        // особенно с закрепленными
        const blockEndRow = block.position.row + block.size.height;
        const blockEndCol = block.position.column + block.size.width;
        
        // Проверка пересечения
        const isOverlapping = !(
          row >= blockEndRow || // Новый блок ниже существующего
          row + size.height <= block.position.row || // Новый блок выше существующего
          startCol >= blockEndCol || // Новый блок правее существующего
          startCol + size.width <= block.position.column // Новый блок левее существующего
        );
        
        return isOverlapping;
      });
      
      if (!conflicts) {
        found = true;
      } else {
        row++; // Try next row
      }
    }
    
    return { row, column: startCol };
  };
  
  // Добавление нового блока на холст
  const handleAddBlock = (type: BlockType, template: string) => {
    console.log(`Adding new block: ${type}, template: ${template}`);
    
    // Определяем размер блока
    const sizeType = getBlockSizeType(type, template);
    let size = { width: 2, height: 2 }; // Значения по умолчанию для маленького блока
    
    switch (sizeType) {
      case BlockSizeType.SQUARE:
        size = { width: 3, height: 3 };
        break;
      case BlockSizeType.MEDIUM:
        size = { width: 4, height: 4 };
        break;
      case BlockSizeType.THIN_FULL:
        size = { width: GRID_COLUMNS, height: 2 };
        break;
      case BlockSizeType.WIDE_FULL:
        size = { width: GRID_COLUMNS, height: 4 };
        break;
      case BlockSizeType.TALL:
        size = { width: 3, height: 5 };
        break;
      case BlockSizeType.BANNER:
        size = { width: GRID_COLUMNS, height: 6 };
        break;
      case BlockSizeType.GALLERY:
        size = { width: GRID_COLUMNS, height: 8 };
        break;
    }
    
    // Определяем тип позиционирования для блока
    const positionType = getBlockPositionType(type, template);
    
    // Находим доступную позицию
    const position = findAvailablePosition(size, positionType);
    
    // Создаем уникальный ID для блока
    const blockId = `block-${Date.now()}`;
    
    // Создаем блок с дефолтными стилями
    const newBlock: Block = {
      id: blockId,
      type,
      template,
      content: {},
      position,
      size,
      style: {
        backgroundColor: '#ffffff',
        color: '#000000',
        borderColor: '#e0e0e0',
        borderRadius: '8px',
        borderWidth: '1px',
        shadowIntensity: 'light',
        opacity: 1
      },
      isFixed: false
    };
    
    // Устанавливаем начальное содержимое в зависимости от типа
    if (type === BlockType.TEXT) {
      if (template === 'rounded-rectangle' || template === 'rounded-square') {
        newBlock.content.title = 'Заголовок';
        newBlock.content.text = 'Текст блока. Нажмите, чтобы отредактировать.';
      } else if (template === 'circle') {
        newBlock.content.text = 'Текстовый блок. Нажмите для редактирования.';
      } else if (template === 'semicircle') {
        newBlock.content.text = 'Текст в полукруге';
      }
    } else if (type === BlockType.PROFILE) {
      newBlock.content.profileInfo = {
        fullName: 'Имя Фамилия Отчество',
        birthDate: '01.01.1970',
        deathDate: '01.01.2023',
        description: 'Краткое описание жизни человека'
      };
    } else if (type === BlockType.FAMILY_TREE) {
      newBlock.content.familyMembers = [];
      newBlock.content.pendingConnections = [];
    } else if (type === BlockType.SOCIAL) {
      if (template === 'circle') {
        newBlock.content.socialType = SocialNetworkType.VK;
        newBlock.content.socialUrl = '';
      } else {
        newBlock.content.socialNetworks = [
          { type: SocialNetworkType.VK, url: '' },
          { type: SocialNetworkType.TELEGRAM, url: '' },
          { type: SocialNetworkType.ODNOKLASSNIKI, url: '' }
        ];
      }
    }
    
    // Проверяем, не перекрывается ли новый блок с существующими
    let adjustedBlocks = [...blocks, newBlock];
    adjustedBlocks = handleAutoAdjustBlockPositions(adjustedBlocks, newBlock.id);
    
    // Сохраняем текущее состояние блоков ДО добавления нового блока
    const currentBlocksState = JSON.parse(JSON.stringify(blocks));
    setOriginalBlockState(currentBlocksState);
    
    // Добавляем новый блок с учетом автоматических корректировок
    setBlocks(adjustedBlocks);
    
    // Сразу открываем панель настроек для нового блока
    setSelectedBlockId(newBlock.id);
    setActiveBlockId(newBlock.id);
    setIsBlockSelectorOpen(false);
    
    // Устанавливаем флаг, что это новый блок
    setIsNewBlock(true);
  };
  
  // Удаление блока
  const handleDeleteBlock = (id: string) => {
    const deletedBlock = blocks.find((block: Block) => block.id === id);
    if (!deletedBlock) return;
    
    // Удаляем блок из списка
    let filteredBlocks = blocks.filter(block => block.id !== id);
    
    // Создаем карту занятых ячеек после удаления блока
    const gridAfterDeletion: boolean[][] = [];
    for (let r = 0; r < 100; r++) {
      gridAfterDeletion[r] = [];
      for (let c = 0; c < GRID_COLUMNS; c++) {
        gridAfterDeletion[r][c] = false;
      }
    }
    
    // Отмечаем ячейки, занятые закрепленными блоками (они не смещаются)
    for (const block of filteredBlocks) {
      if (block.isFixed) {
        for (let r = block.position.row; r < block.position.row + block.size.height; r++) {
          for (let c = block.position.column; c < block.position.column + block.size.width; c++) {
            if (r >= 0 && c >= 0 && r < 100 && c < GRID_COLUMNS) {
              gridAfterDeletion[r][c] = true;
            }
          }
        }
      }
    }
    
    // Находим блоки, которые могут быть перемещены вверх после удаления
    const candidateBlocks = filteredBlocks.filter(block => 
      !block.isFixed && // Не закрепленные
      block.position.row > deletedBlock.position.row && // Ниже удаленного блока
      block.position.column === deletedBlock.position.column && // В той же колонке
      block.size.width === deletedBlock.size.width // С такой же шириной
    );
    
    // Сортируем их по вертикальной позиции (сверху вниз)
    candidateBlocks.sort((a: Block, b: Block) => a.position.row - b.position.row);
    
    // Перемещаем каждый подходящий блок вверх
    for (const block of candidateBlocks as Block[]) {
      // Рассчитываем, насколько можно сместить блок вверх
      const maxShift = block.position.row - deletedBlock.position.row;
      if (maxShift <= 0) continue;
      
      let canShift = true;
      let optimalShift = maxShift;
      
      // Проверяем каждую позицию сдвига, начиная с максимальной
      for (let shift = maxShift; shift > 0; shift--) {
        const newRow = block.position.row - shift;
        
        // Проверяем, свободны ли ячейки для нового положения блока
        let cellsFree = true;
        for (let r = newRow; r < newRow + block.size.height; r++) {
          for (let c = block.position.column; c < block.position.column + block.size.width; c++) {
            if (gridAfterDeletion[r][c]) {
              cellsFree = false;
              break;
            }
          }
          if (!cellsFree) break;
        }
        
        if (cellsFree) {
          optimalShift = shift;
          break;
        }
      }
      
      if (canShift && optimalShift > 0) {
        // Обновляем позицию блока
        const newRow = block.position.row - optimalShift;
        
        // Находим блок в filteredBlocks и обновляем его позицию
        const blockIndex = filteredBlocks.findIndex(b => b.id === block.id);
        if (blockIndex !== -1) {
          filteredBlocks[blockIndex] = {
            ...filteredBlocks[blockIndex],
            position: {
              ...filteredBlocks[blockIndex].position,
              row: newRow
            }
          };
          
          // Отмечаем занятые новым положением блока ячейки
          for (let r = newRow; r < newRow + block.size.height; r++) {
            for (let c = block.position.column; c < block.position.column + block.size.width; c++) {
              gridAfterDeletion[r][c] = true;
            }
          }
          
          console.log(`Shifted block ${block.id} up by ${optimalShift} rows`);
        }
      }
    }
    
    // Обновляем состояние блоков
    setBlocks(filteredBlocks);
    
    // Если удаленный блок был выбран, сбрасываем выделение
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
    if (activeBlockId === id) {
      setActiveBlockId(null);
    }
  };
  
  // Выбор блока для редактирования - меняю логику, чтобы не открывать панель автоматически
  const handleSelectBlock = (id: string) => {
    // НЕ открываем панель автоматически, только визуально выделяем блок
    setActiveBlockId(id);
  };
  
  // Открытие панели настроек блока
  const handleOpenSettings = (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    console.log('Открываем настройки блока:', id);
    
    // Находим блок для редактирования
    const blockToEdit = blocks.find((block: Block) => block.id === id);
    if (blockToEdit) {
      // Сохраняем копию всего текущего состояния блоков
      // для возможности полного отката при отмене
      setOriginalBlockState(JSON.parse(JSON.stringify(blocks)));
      
      console.log('Сохранено исходное состояние всех блоков для возможной отмены');
      
      // Это не новый блок
      setIsNewBlock(false);
    }
    
    setSelectedBlockId(id);
    setActiveBlockId(id);
  };
  
  // Закрытие панели редактирования блока
  const handleCloseBlockEditor = () => {
    setSelectedBlockId(null);
    setOriginalBlockState(null);
    // Оставляем activeBlockId чтобы сохранить визуальное выделение
  };

  // Просто выбираем блок визуально без открытия панели
  const handleSelectBlockVisually = (id: string) => {
    setActiveBlockId(id);
  };
  
  // Обновление свойств блока
  const handleUpdateBlock = (id: string, changes: Partial<Block>) => {
    // Находим текущее состояние блока
    const currentBlock = blocks.find(b => b.id === id);
    if (!currentBlock) return;
    
    // Обновляем блок с новыми изменениями
    const updatedBlock = {
      ...currentBlock,
      ...changes
    };
    
    console.log('Обновляем блок:', id, changes);
    
    // Обновляем блок в списке
    setBlocks(prev => prev.map(block => 
      block.id === id ? updatedBlock : block
    ));
  };
  
  // Обработка начала перетаскивания блока
  const handleDragStart = () => {
    // Закрываем панель редактирования при начале перетаскивания
    setSelectedBlockId(null);
    setIsDragging(true);
  };

  // Обработка окончания перетаскивания блока
  const handleDragStop = (id: string, data: { x: number, y: number }) => {
    const currentBlock = blocks.find((block: Block) => block.id === id);
    if (!currentBlock) return;
    
    // Устанавливаем флаг окончания перетаскивания
    setIsDragging(false);
    
    // Если блок закреплен, не обрабатываем перетаскивание
    if (currentBlock.isFixed) {
      console.log(`Block ${id} is fixed, ignoring drag`);
      setActiveBlockId(id);
      return;
    }
    
    console.log(`Drag stop for block ${id} at position x:${data.x}, y:${data.y}`);
    
    // Calculate row position (vertical snapping)
    const row = Math.max(0, Math.round(data.y / CELL_SIZE));
    
    // Определяем стартовую колонку на основе типа блока
    let column = Math.max(0, Math.min(GRID_COLUMNS - currentBlock.size.width, Math.round(data.x / CELL_SIZE)));
    
    // Проверяем выравнивание для полноширинных блоков или блоков с особыми требованиями
    const isFullWidth = currentBlock.size.width >= GRID_COLUMNS || 
                         currentBlock.type === BlockType.FAMILY_TREE || 
                         currentBlock.template === 'semicircle';
                       
    if (isFullWidth) {
      // Полноширинные блоки всегда начинаются с колонки 0
      column = 0;
    } else {
      // Определяем тип позиционирования блока
      const positionType = getBlockPositionType(currentBlock.type, currentBlock.template);
      
      if (positionType === BlockPositionType.CENTER) {
        // Центрированные блоки выравниваем по центру сетки
        column = Math.floor((GRID_COLUMNS - currentBlock.size.width) / 2);
      } else if (positionType === BlockPositionType.RIGHT) {
        // Блоки с правым выравниванием располагаем у правого края
        column = Math.max(0, GRID_COLUMNS - currentBlock.size.width);
      }
      // Для BlockPositionType.LEFT оставляем текущий расчет column
    }
    
    console.log(`Block ${id} will snap to grid position row:${row}, column:${column}`);
    
    // Проверяем, изменилась ли позиция блока
    if (currentBlock.position.row === row && currentBlock.position.column === column) {
      // Позиция не изменилась, просто выделяем блок
      console.log(`Block ${id} position unchanged, skipping adjustment`);
      setActiveBlockId(id);
      return;
    }
    
    // Создаем копию блоков с глубоким клонированием
    const updatedBlocks = JSON.parse(JSON.stringify(blocks));
    const blockIndex = updatedBlocks.findIndex((b: Block) => b.id === id);
    
    if (blockIndex !== -1) {
      // Обновляем позицию блока
      updatedBlocks[blockIndex].position = { row, column };
      
      // Проверяем наложения с другими блоками
      const hasOverlaps = updatedBlocks.some((otherBlock: Block) => {
        if (otherBlock.id === id) return false; // Пропускаем сам блок
        return checkBlocksOverlap(updatedBlocks[blockIndex], otherBlock);
      });
      
      console.log(`Block ${id} has overlaps after drag: ${hasOverlaps}`);
      
      // Выполняем автокорректировку, если есть наложения или блок имеет особые требования к позиционированию
      if (hasOverlaps || isFullWidth) {
        console.log(`Starting auto-adjustment for blocks after moving ${id}`);
        const adjustedBlocks = handleAutoAdjustBlockPositions(updatedBlocks, id);
        setBlocks(adjustedBlocks);
      } else {
        // Если наложений нет, просто обновляем состояние
        setBlocks(updatedBlocks);
      }
    }

    // Визуально выделяем перетащенный блок
    setActiveBlockId(id);
  };
  
  // Функция для автоматической корректировки позиций блоков, чтобы избежать наложений
  const handleAutoAdjustBlockPositions = (blocks: Block[], movedBlockId: string, recursionDepth: number = 0): Block[] => {
    // Ограничиваем глубину рекурсии для предотвращения зацикливания
    if (recursionDepth > 10) {
      console.warn('Reached maximum recursion depth in block adjustment');
      return blocks;
    }
    
    console.log(`Auto-adjust blocks, moved block: ${movedBlockId}, recursion depth: ${recursionDepth}`);
    
    // Клонируем блоки, чтобы не изменять оригинальный массив напрямую
    let adjustedBlocks = JSON.parse(JSON.stringify(blocks));
    const movedBlock = adjustedBlocks.find((block: Block) => block.id === movedBlockId);
    
    if (!movedBlock) return adjustedBlocks;
    
    // Сортируем блоки по их приоритету и позиции
    // 1. Закрепленные блоки имеют наивысший приоритет
    // 2. Затем сортируем по позиции сверху вниз, слева направо
    adjustedBlocks.sort((a: Block, b: Block) => {
      // Закрепленные блоки имеют наивысший приоритет
      if (a.isFixed && !b.isFixed) return -1;
      if (!a.isFixed && b.isFixed) return 1;
      
      // Сначала по ряду (сверху вниз)
      if (a.position.row !== b.position.row) {
        return a.position.row - b.position.row;
      }
      // Потом по колонке (слева направо)
      return a.position.column - b.position.column;
    });
    
    // Создаем двумерный массив, представляющий сетку
    // true = ячейка занята, false = ячейка свободна
    const grid: boolean[][] = [];
    for (let r = 0; r < 100; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID_COLUMNS; c++) {
        grid[r][c] = false;
      }
    }
    
    // Добавляем все закрепленные блоки в сетку (их позиции неизменяемы)
    adjustedBlocks.forEach((block: Block) => {
      if (block.isFixed) {
        for (let r = block.position.row; r < block.position.row + block.size.height; r++) {
          for (let c = block.position.column; c < block.position.column + block.size.width; c++) {
            if (r >= 0 && c >= 0 && r < 100 && c < GRID_COLUMNS) {
              grid[r][c] = true;
            }
          }
        }
      }
    });
    
    // Добавляем все незакрепленные блоки, кроме перемещаемого, в сетку
    adjustedBlocks.forEach((block: Block) => {
      if (!block.isFixed && block.id !== movedBlockId) {
        for (let r = block.position.row; r < block.position.row + block.size.height; r++) {
          for (let c = block.position.column; c < block.position.column + block.size.width; c++) {
            if (r >= 0 && c >= 0 && r < 100 && c < GRID_COLUMNS) {
              grid[r][c] = true;
            }
          }
        }
      }
    });
    
    // Проверяем, есть ли конфликты с текущей позицией movedBlock
    let hasConflict = false;
    for (let r = movedBlock.position.row; r < movedBlock.position.row + movedBlock.size.height; r++) {
      for (let c = movedBlock.position.column; c < movedBlock.position.column + movedBlock.size.width; c++) {
        if (r >= 0 && c >= 0 && r < 100 && c < GRID_COLUMNS && grid[r][c]) {
          hasConflict = true;
          break;
        }
      }
      if (hasConflict) break;
    }
    
    // Также проверяем явное перекрытие с другими блоками
    if (!hasConflict) {
      for (const block of adjustedBlocks) {
        if (block.id !== movedBlockId) {
          if (checkBlocksOverlap(movedBlock, block)) {
            hasConflict = true;
            break;
          }
        }
      }
    }
    
    if (!hasConflict) {
      console.log(`No conflicts for block ${movedBlockId} at current position`);
      return adjustedBlocks;
    }
    
    // Если есть конфликт, ищем ближайшую свободную позицию для movedBlock
    const findNearestFreePosition = (block: Block, grid: boolean[][]) => {
      const originalRow = block.position.row;
      const originalColumn = block.position.column;
      const width = block.size.width;
      const height = block.size.height;
      
      // Для блоков определенных типов сохраняем горизонтальное выравнивание
      let fixedColumn = originalColumn;
      if (block.type === BlockType.FAMILY_TREE || 
          block.template === 'semicircle' ||
          (block.size.width === GRID_COLUMNS)) {
        fixedColumn = 0; // Полноширинные блоки всегда начинаются с левого края
      }
      
      // Сначала пытаемся найти позицию с сохранением текущего столбца
      // Это важно для сохранения расположения, выбранного пользователем
      for (let r = originalRow; r < originalRow + 20; r++) {
        let positionAvailable = true;
        for (let rr = r; rr < r + height; rr++) {
          for (let cc = fixedColumn; cc < fixedColumn + width; cc++) {
            if (rr >= 0 && cc >= 0 && rr < 100 && cc < GRID_COLUMNS) {
              if (grid[rr][cc]) {
                positionAvailable = false;
                break;
              }
            }
          }
          if (!positionAvailable) break;
        }
        if (positionAvailable) {
          return { row: r, column: fixedColumn };
        }
      }
      
      // Если не удалось найти позицию с тем же столбцом,
      // проверяем доступные позиции в порядке увеличения расстояния
      const maxSearchDistance = 20; // Ограничиваем область поиска
      
      for (let distance = 1; distance <= maxSearchDistance; distance++) {
        // Проверяем позиции ниже оригинальной со смещением влево/вправо
        for (let offsetCol = -distance; offsetCol <= distance; offsetCol++) {
          const c = originalColumn + offsetCol;
          if (c < 0 || c + width > GRID_COLUMNS) continue; // Пропускаем позиции за границами сетки
          
          const r = originalRow + distance;
          let positionAvailable = true;
          
          for (let rr = r; rr < r + height; rr++) {
            for (let cc = c; cc < c + width; cc++) {
              if (rr >= 0 && cc >= 0 && rr < 100 && cc < GRID_COLUMNS) {
                if (grid[rr][cc]) {
                  positionAvailable = false;
                  break;
                }
              }
            }
            if (!positionAvailable) break;
          }
          
          if (positionAvailable) {
            return { row: r, column: c };
          }
        }
      }
      
      // Если ничего не нашли выше, ищем место внизу страницы
      let lastRow = 0;
      adjustedBlocks.forEach((b: Block) => {
        const blockBottom = b.position.row + b.size.height;
        if (blockBottom > lastRow) {
          lastRow = blockBottom;
        }
      });
      
      // Возвращаем позицию внизу с сохранением колонки, если возможно
      return { row: lastRow + 1, column: Math.min(originalColumn, GRID_COLUMNS - width) };
    };
    
    // Находим новую позицию для перемещаемого блока
    const newPosition = findNearestFreePosition(movedBlock, grid);
    movedBlock.position.row = newPosition.row;
    movedBlock.position.column = newPosition.column;
    
    console.log(`Found new position for block ${movedBlockId} at row: ${newPosition.row}, column: ${newPosition.column}`);
    
    // Повторно проверяем, нет ли конфликтов после перемещения
    // Это дополнительная проверка для надежности
    let stillHasConflict = false;
    for (const block of adjustedBlocks) {
      if (block.id !== movedBlockId) {
        if (checkBlocksOverlap(movedBlock, block)) {
          stillHasConflict = true;
          break;
        }
      }
    }
    
    // Если после корректировки все еще есть конфликт, рекурсивно вызываем функцию
    if (stillHasConflict) {
      console.log(`Block ${movedBlockId} still has conflicts, trying again with recursion`);
      return handleAutoAdjustBlockPositions(adjustedBlocks, movedBlockId, recursionDepth + 1);
    }
    
    return adjustedBlocks;
  };
  
  // Функция для проверки пересечения двух блоков
  const checkBlocksOverlap = (block1: Block, block2: Block): boolean => {
    // Вычисляем границы блоков
    const block1Right = block1.position.column + block1.size.width;
    const block1Bottom = block1.position.row + block1.size.height;
    const block2Right = block2.position.column + block2.size.width;
    const block2Bottom = block2.position.row + block2.size.height;
    
    // Проверяем пересечение с небольшим запасом для надежности
    return !(
      block1.position.column >= block2Right || // block1 справа от block2
      block1Right <= block2.position.column || // block1 слева от block2
      block1.position.row >= block2Bottom || // block1 ниже block2
      block1Bottom <= block2.position.row // block1 выше block2
    );
  };
  
  // Обработчик закрепления/открепления блока
  const handleToggleFixBlock = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Предотвращаем выбор блока
    
    setBlocks(blocks.map(block => 
      block.id === id ? { 
        ...block, 
        isFixed: !block.isFixed 
      } : block
    ));
  };
  
  // Обработчик изменения видимости на карте
  const handleMapVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnMap(event.target.checked);
  };
  
  // Функция для проверки валидности HEX цвета
  const isValidHex = (color: string): boolean => {
    return /^#([0-9A-F]{3}){1,2}$/i.test(color);
  };

  // Обработчик изменения пользовательского цвета
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomColor(value);
    
    // Если введен валидный HEX цвет, обновляем фон
    if (isValidHex(value)) {
      setBackgroundColor(value);
    }
  };

  // Обработчик применения пользовательского цвета
  const handleApplyCustomColor = () => {
    if (isValidHex(customColor)) {
      setBackgroundColor(customColor);
    }
  };

  // Изменение цвета фона из предустановленных
  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    setCustomColor(color);
  };

  // Предпросмотр страницы
  const handlePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // Обработчик отмены добавления нового блока
  const handleCancelNewBlock = () => {
    if (selectedBlockId) {
      // Удаляем последний добавленный блок
      setBlocks(blocks.filter(block => block.id !== selectedBlockId));
      setSelectedBlockId(null);
    }
  };

  // Загрузка сохраненных данных при первой загрузке
  useEffect(() => {
    if (savedData) {
      if (savedData.blocks) setBlocks(savedData.blocks);
      if (savedData.backgroundColor) setBackgroundColor(savedData.backgroundColor);
      if (savedData.showOnMap !== undefined) setShowOnMap(savedData.showOnMap);
    } else {
      const storageKey = getStorageKey();
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setBlocks(parsedData.blocks || []);
          setBackgroundColor(parsedData.backgroundColor || '#ffffff');
          setShowOnMap(parsedData.showOnMap !== undefined ? parsedData.showOnMap : true);
        } catch (e) {
          console.error('Ошибка при загрузке сохраненных данных:', e);
        }
      }
    }
  }, [savedData, userId]); // Добавляем userId в зависимости
  
  // Make sure we have a ref for each block
  useEffect(() => {
    blocks.forEach(block => {
      if (!draggableRefs.current[block.id]) {
        draggableRefs.current[block.id] = React.createRef();
      }
    });
  }, [blocks]);
  
  // Функция рендеринга содержимого текстового блока
  const renderTextBlockContent = (block: Block) => {
    // Если это полукруг, рендерим только текст без заголовка
    if (block.template === 'semicircle') {
      return (
        <Box 
          sx={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => handleSelectBlockVisually(block.id)}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-word', 
              textAlign: 'center',
              fontWeight: 'medium'
            }}
          >
            {block.content.text || 'Добавьте текст. Нажмите для редактирования.'}
          </Typography>
        </Box>
      );
    }
    
    // Для других типов текстовых блоков рендерим заголовок и текст
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '100%',
          cursor: 'pointer'
        }}
        onClick={() => handleSelectBlockVisually(block.id)}
      >
        {block.content.title && (
          <Typography 
            variant="h6" 
            fontWeight="bold" 
            gutterBottom
            sx={{ wordBreak: 'break-word' }}
          >
            {block.content.title}
          </Typography>
        )}
        
        <Typography 
          variant="body1" 
          sx={{ wordBreak: 'break-word' }}
        >
          {block.content.text || 'Добавьте текст о человеке или его достижениях. Нажмите для редактирования.'}
        </Typography>
      </Box>
    );
  };

  // Функция рендеринга содержимого фото блока
  const renderPhotoBlockContent = (block: Block) => {
    // Если это галерея фотографий
    if (block.template === 'gallery') {
      return <PhotoGalleryBlock block={block} handleAddPhoto={handleAddPhoto} isPreviewMode={isPreviewMode} />;
    }
    
    // Если это баннер на всю ширину
    if (block.template === 'banner') {
      return (
        <Box 
          sx={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative'
          }}
        >
          {block.content.images && block.content.images.length > 0 ? (
            <img 
              src={block.content.images[0]} 
              alt="Баннер" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover'
              }} 
            />
          ) : (
            <Box 
              sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer'
              }}
              onClick={() => handleAddPhoto(block.id)}
            >
              <IconButton 
                color="primary"
                sx={{ mb: 1, opacity: 0.7 }}
              >
                <AddIcon fontSize="large" />
              </IconButton>
              <Typography variant="body2" color="textSecondary">
                Добавьте фото-баннер
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    
    // Для отдельных фото (квадрат со скошенными углами или круг)
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative'
        }}
      >
        {block.content.images && block.content.images.length > 0 ? (
          <img 
            src={block.content.images[0]} 
            alt="Фото" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              borderRadius: block.style.borderRadius
            }} 
          />
        ) : (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              backgroundColor: '#f5f5f5',
              borderRadius: block.style.borderRadius,
              cursor: 'pointer'
            }}
            onClick={() => handleAddPhoto(block.id)}
          >
            <IconButton 
              color="primary"
              sx={{ mb: 1, opacity: 0.7 }}
            >
              <AddIcon fontSize="large" />
            </IconButton>
            <Typography variant="body2" color="textSecondary">
              Добавьте фотографию
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Функция рендеринга содержимого видео блока
  const renderVideoBlockContent = (block: Block) => {
    // Функция для определения, является ли URL локальным или YouTube
    const isLocalVideo = (url: string): boolean => {
      return url.startsWith('blob:') || url.startsWith('file:');
    };
    
    // Если это галерея видео
    if (block.template === 'gallery') {
      return (
        <Box 
          sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {block.content.mediaItems && block.content.mediaItems.length > 0 ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                overflowX: 'auto',
                gap: 1,
                p: 1,
                '&::-webkit-scrollbar': {
                  height: '8px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px'
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '4px'
                }
              }}
            >
              {block.content.mediaItems.map((item, index) => {
                const isLocal = isLocalVideo(item.url);
                
                return (
                  <Box
                    key={item.id || index}
                    sx={{
                      minWidth: '280px',
                      height: '100%',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      position: 'relative',
                      cursor: isLocal ? 'default' : 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => !isLocal && window.open(item.url, '_blank')}
                  >
                    {isLocal ? (
                      // Рендерим локальное видео с контролами
                      <video
                        src={item.url}
                        controls
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      // Рендерим thumbnail для YouTube видео
                      <>
                        <img
                          src={item.thumbnail || `https://img.youtube.com/vi/${extractYouTubeId(item.url)}/0.jpg`}
                          alt={item.title || `Видео ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Box
                            sx={{
                              width: 0,
                              height: 0,
                              borderStyle: 'solid',
                              borderWidth: '10px 0 10px 20px',
                              borderColor: 'transparent transparent transparent white'
                            }}
                          />
                        </Box>
                      </>
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.title || `Видео ${index + 1}`}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box 
              sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer'
              }}
              onClick={() => handleAddVideo(block.id)}
            >
              <IconButton 
                color="primary"
                sx={{ mb: 1, opacity: 0.7 }}
              >
                <AddIcon fontSize="large" />
              </IconButton>
              <Typography variant="body2" color="textSecondary">
                Добавьте видео в галерею
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    
    // Для квадратного видео
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative'
        }}
      >
        {block.content.videoUrl ? (
          isLocalVideo(block.content.videoUrl) ? (
            // Рендерим локальное видео с контролами
            <video
              src={block.content.videoUrl}
              controls
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                borderRadius: block.style.borderRadius
              }}
            />
          ) : (
            // Рендерим YouTube видео с кнопкой воспроизведения
            <Box 
              sx={{ 
                position: 'relative', 
                width: '100%', 
                height: '100%', 
                cursor: 'pointer' 
              }}
              onClick={() => window.open(block.content.videoUrl, '_blank')}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: block.style.borderRadius
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Box
                    sx={{
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '15px 0 15px 30px',
                      borderColor: 'transparent transparent transparent white'
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )
        ) : (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              backgroundColor: '#f5f5f5',
              borderRadius: block.style.borderRadius,
              cursor: 'pointer'
            }}
            onClick={() => handleAddVideo(block.id)}
          >
            <IconButton 
              color="primary"
              sx={{ mb: 1, opacity: 0.7 }}
            >
              <AddIcon fontSize="large" />
            </IconButton>
            <Typography variant="body2" color="textSecondary">
              Добавьте видео
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Функция рендеринга содержимого социальных сетей
  const renderSocialBlockContent = (block: Block) => {
    // Для круглой иконки с одной соцсетью
    if (block.template === 'circle') {
      let iconColor = '#4a76a8'; // VK по умолчанию
      let socialName = 'ВКонтакте';
      
      if (block.content.socialType === SocialNetworkType.TELEGRAM) {
        iconColor = '#0088cc';
        socialName = 'Телеграм';
      } else if (block.content.socialType === SocialNetworkType.ODNOKLASSNIKI) {
        iconColor = '#ee8208';
        socialName = 'Одноклассники';
      }
      
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: iconColor,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            cursor: block.content.socialUrl ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (block.content.socialUrl) {
              window.open(block.content.socialUrl, '_blank');
            } else {
              handleAddSocialNetwork(block.id, block.content.socialType || SocialNetworkType.VK);
            }
          }}
        >
          <Typography variant="h6">{socialName}</Typography>
        </Box>
      );
    }
    
    // Для панели с иконками всех соцсетей на всю ширину
    if (block.template === 'bar') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5',
            borderRadius: block.style.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            p: 1
          }}
        >
          {block.content.socialNetworks && block.content.socialNetworks.length > 0 ? (
            block.content.socialNetworks.map((social, index) => {
              let iconColor = '#4a76a8'; // VK по умолчанию
              let socialName = 'VK';
              
              if (social.type === SocialNetworkType.TELEGRAM) {
                iconColor = '#0088cc';
                socialName = 'TG';
              } else if (social.type === SocialNetworkType.ODNOKLASSNIKI) {
                iconColor = '#ee8208';
                socialName = 'OK';
              }
              
              return (
                <Box
                  key={index}
                  sx={{
                    width: 50,
                    height: 50,
                    backgroundColor: iconColor,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(social.url, '_blank')}
                >
                  <Typography variant="body1">{socialName}</Typography>
                </Box>
              );
            })
          ) : (
            <Box 
              sx={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'space-around', 
                alignItems: 'center',
                cursor: 'pointer' 
              }}
              onClick={() => handleAddSocialNetwork(block.id)}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  backgroundColor: '#4a76a8',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                <Typography variant="body1">VK</Typography>
              </Box>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  backgroundColor: '#0088cc',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                <Typography variant="body1">TG</Typography>
              </Box>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  backgroundColor: '#ee8208',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                <Typography variant="body1">OK</Typography>
              </Box>
            </Box>
          )}
        </Box>
      );
    }
    
    // Для отдельных иконок соцсетей
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          gap: 2,
          p: 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: block.style.backgroundColor,
          cursor: 'pointer'
        }}
        onClick={() => handleAddSocialNetwork(block.id)}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            backgroundColor: '#4a76a8',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          <Typography variant="body1">VK</Typography>
        </Box>
        <Box
          sx={{
            width: 60,
            height: 60,
            backgroundColor: '#0088cc',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          <Typography variant="body1">TG</Typography>
        </Box>
        <Box
          sx={{
            width: 60,
            height: 60,
            backgroundColor: '#ee8208',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          <Typography variant="body1">OK</Typography>
        </Box>
      </Box>
    );
  };

  // Функция рендеринга содержимого профиля
  const renderProfileBlockContent = (block: Block) => {
    // Для профиля на всю ширину (первый вариант)
    if (block.template === 'full-width') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => handleSelectBlockVisually(block.id)}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            textAlign="center"
            gutterBottom
          >
            {block.content.profileInfo?.fullName || 'ИМЯ ФАМИЛИЯ ОТЧЕСТВО'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="text.secondary">
              {block.content.profileInfo?.birthDate || '17 июня 1969'}
              {' — '}
              {block.content.profileInfo?.deathDate || '28 декабря 2013'}
            </Typography>
          </Box>
          
          {block.content.profileInfo?.description && (
            <Typography
              variant="body1"
              textAlign="center"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {block.content.profileInfo.description}
            </Typography>
          )}
          
          {block.content.profileInfo?.religion && (
            <Typography
              variant="body2"
              textAlign="center"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {block.content.profileInfo.religion}
            </Typography>
          )}
        </Box>
      );
    }
    
    // Для квадратного профиля со скошенными углами (второй вариант)
    if (block.template === 'square') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            padding: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '16px',
            cursor: 'pointer'
          }}
          onClick={() => handleSelectBlockVisually(block.id)}
        >
          {block.content.profileInfo?.photo ? (
            <Box 
              component="img"
              src={block.content.profileInfo.photo}
              alt={block.content.profileInfo?.fullName || 'Фото'} 
              sx={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                mb: 2,
                border: '3px solid white',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }} 
            />
          ) : (
            <AccountCircleIcon 
              sx={{ 
                fontSize: 100, 
                color: '#bbb',
                mb: 2
              }} 
            />
          )}
          
          <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>
            {block.content.profileInfo?.fullName || 'ИМЯ ФАМИЛИЯ'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center">
            {block.content.profileInfo?.birthDate || '1969'} 
            {' — '} 
            {block.content.profileInfo?.deathDate || '2013'}
          </Typography>
        </Box>
      );
    }
    
    // Третий вариант - форма профиля как на скриншоте
    if (block.template === 'form') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            padding: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            cursor: 'pointer'
          }}
          onClick={() => handleSelectBlockVisually(block.id)}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="caption" fontWeight="medium">
                Фамилия
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1, 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" noWrap>
                  {block.content.profileInfo?.lastName || 'Введите фамилию'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="caption" fontWeight="medium">
                Имя
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1, 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" noWrap>
                  {block.content.profileInfo?.firstName || 'Введите имя'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="caption" fontWeight="medium">
                Отчество
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1, 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" noWrap>
                  {block.content.profileInfo?.middleName || 'Введите отчество'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="caption" fontWeight="medium">
                Описание
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1, 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  height: '60px',
                  overflow: 'hidden'
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {block.content.profileInfo?.description || 'Введите описание'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="caption" fontWeight="medium">
                Дата рождения
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1, 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" noWrap>
                  {block.content.profileInfo?.birthDate || 'Дата рождения'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="caption" fontWeight="medium">
                Дата смерти
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1, 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" noWrap>
                  {block.content.profileInfo?.deathDate || 'Дата смерти'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="caption" fontWeight="medium">
                Религия
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1, 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" noWrap>
                  {block.content.profileInfo?.religion || 'Религия'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      );
    }
    
    // По умолчанию
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onClick={() => handleSelectBlockVisually(block.id)}
      >
        <Typography>Выберите шаблон профиля</Typography>
      </Box>
    );
  };

  // Функция рендеринга содержимого семейного древа
  const renderFamilyTreeBlockContent = (block: Block) => {
    return (
      <div onClick={() => handleSelectBlockVisually(block.id)}>
        <FamilyTreeBlock 
          block={block}
          onUpdateBlock={(changes) => handleUpdateBlock(block.id, changes)}
          isEditable={!isPreviewMode}
        />
      </div>
    );
  };

  // Функция рендеринга содержимого блока
  const renderBlockContent = (block: Block) => {
    switch (block.type) {
      case BlockType.TEXT:
        return renderTextBlockContent(block);
      case BlockType.PHOTO:
        return renderPhotoBlockContent(block);
      case BlockType.VIDEO:
        return renderVideoBlockContent(block);
      case BlockType.SOCIAL:
        return renderSocialBlockContent(block);
      case BlockType.PROFILE:
        return renderProfileBlockContent(block);
      case BlockType.FAMILY_TREE:
        return renderFamilyTreeBlockContent(block);
      default:
        return null;
    }
  };

  // Сохранение страницы
  const handleSave = () => {
    console.log('Сохраняем страницу', { blocks, backgroundColor, showOnMap });
    
    // Выполняем финальную проверку и корректировку позиций блоков перед сохранением
    const finalizedBlocks = [...blocks];
    
    // Сортируем блоки по позиции для более предсказуемой обработки
    finalizedBlocks.sort((a, b) => {
      if (a.position.row !== b.position.row) {
        return a.position.row - b.position.row;
      }
      return a.position.column - b.position.column;
    });
    
    // Выполняем последнюю проверку на наложения
    for (let i = 0; i < finalizedBlocks.length; i++) {
      const currentBlock = finalizedBlocks[i];
      let hasOverlap = false;
      
      // Проверяем наложение с предыдущими блоками
      for (let j = 0; j < i; j++) {
        if (checkBlocksOverlap(currentBlock, finalizedBlocks[j])) {
          hasOverlap = true;
          break;
        }
      }
      
      // Если есть наложение, применяем автокорректировку
      if (hasOverlap) {
        console.log(`Block ${currentBlock.id} has overlaps before saving, adjusting...`);
        const adjustedBlocks = handleAutoAdjustBlockPositions([...finalizedBlocks], currentBlock.id);
        // Обновляем только позицию текущего блока
        const adjustedBlock = adjustedBlocks.find(b => b.id === currentBlock.id);
        if (adjustedBlock) {
          currentBlock.position = adjustedBlock.position;
        }
      }
    }
    
    // Перед сохранением, обработаем содержимое блоков для более удобного использования на странице памяти
    const processedBlocks = finalizedBlocks.map(block => {
      const processedBlock = { ...block };
      
      // Обработка содержимого для текстовых блоков
      if (block.type === 'text' && !block.content.text) {
        processedBlock.content = { 
          ...block.content,
          text: 'Текстовый блок без содержания'
        };
      }
      
      // Обработка содержимого для фото блоков
      if (block.type === 'photo' && (!block.content.images || block.content.images.length === 0)) {
        processedBlock.content = { 
          ...block.content,
          images: ['https://via.placeholder.com/300x200?text=Placeholder+Image']
        };
      }
      
      // Обработка содержимого для профиля
      if (block.type === 'profile') {
        // Убеждаемся что profileInfo существует
        if (!processedBlock.content.profileInfo) {
          processedBlock.content.profileInfo = {};
        }
        
        // Устанавливаем значения по умолчанию, если они отсутствуют
        if (!processedBlock.content.profileInfo.fullName) {
          processedBlock.content.profileInfo.fullName = 'Имя и Фамилия';
        }
        
        if (!processedBlock.content.profileInfo.description) {
          processedBlock.content.profileInfo.description = 'Описание профиля';
        }
      }
      
      return processedBlock;
    });
    
    // Сохраняем данные в localStorage с учетом ID пользователя
    const pageData = {
      blocks: processedBlocks,
      backgroundColor,
      showOnMap,
      timestamp: new Date().toISOString(),
      userId // Сохраняем ID пользователя вместе с данными
    };
    
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(pageData));
      console.log(`Данные успешно сохранены в localStorage с ключом ${storageKey}`);
      
      // Обновляем состояние блоков с финальными позициями
      setBlocks(processedBlocks);
      
      // Показываем уведомление об успешном сохранении
      alert('Страница успешно сохранена');
      
      // Вернуться в режим просмотра, если есть обработчик
      if (handleBack) {
        handleBack();
      }
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
      alert('Произошла ошибка при сохранении. Пожалуйста, попробуйте еще раз.');
    }
  };

  // Обработчик добавления фото
  const handleAddPhoto = (blockId: string) => {
    // Находим блок, в который нужно добавить фото
    const targetBlock = blocks.find(b => b.id === blockId);
    if (!targetBlock) return;
    
    // Создаем input элемент для загрузки файла
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    // Разрешаем множественный выбор только для галереи
    input.multiple = targetBlock.template === 'gallery';
    input.style.display = 'none';
    
    // Добавляем обработчик события выбора файла
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      
      // Создаем URL для каждого файла
      const imageUrls = Array.from(files).map(file => URL.createObjectURL(file));
      
      if (targetBlock.template === 'gallery') {
        // Для галереи создаем массив mediaItems
        const mediaItems = imageUrls.map((url, index) => ({
          id: `photo-${Date.now()}-${index}`,
          url,
          title: `Фото ${index + 1}`
        }));
        
        const currentMediaItems = targetBlock.content.mediaItems || [];
        const updatedMediaItems = [...currentMediaItems, ...mediaItems];
        
        // Обновляем блок
        handleUpdateBlock(blockId, {
          content: {
            ...targetBlock.content,
            mediaItems: updatedMediaItems
          }
        });
        
        console.log(`Added ${mediaItems.length} photos to gallery. Total now: ${updatedMediaItems.length}`);
      } else {
        // Для одиночного фото просто берем первый файл
        handleUpdateBlock(blockId, {
          content: {
            ...targetBlock.content,
            images: [imageUrls[0]]
          }
        });
      }
    };
    
    // Симулируем клик на input для открытия диалога выбора файла
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  // Обработчик добавления видео
  const handleAddVideo = (blockId: string) => {
    // Находим блок, в который нужно добавить видео
    const targetBlock = blocks.find(b => b.id === blockId);
    if (!targetBlock) return;
    
    // Создаем диалоговое окно для выбора способа добавления видео
    const videoType = window.confirm(
      'Выберите способ добавления видео:\n\n' +
      'OK - Загрузить видео с устройства\n' +
      'Отмена - Добавить ссылку на YouTube'
    );
    
    if (videoType) {
      // Загрузка видео с устройства
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.multiple = targetBlock.template === 'gallery'; // Разрешаем выбор нескольких файлов для галереи
      input.style.display = 'none';
      
      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) return;
        
        // Создаем URL для каждого файла и добавляем в блок
        const videoUrls = Array.from(files).map(file => URL.createObjectURL(file));
        
        if (targetBlock.template === 'gallery') {
          // Для галереи создаем массив mediaItems
          const mediaItems = videoUrls.map((url, index) => ({
            id: `video-${Date.now()}-${index}`,
            url,
            title: `Видео ${index + 1}`,
            thumbnail: '' // Для локальных видео thumbnail генерировать сложнее
          }));
          
          const currentMediaItems = targetBlock.content.mediaItems || [];
          const updatedMediaItems = [...currentMediaItems, ...mediaItems];
          
          handleUpdateBlock(blockId, {
            content: {
              ...targetBlock.content,
              mediaItems: updatedMediaItems
            }
          });
          
          console.log(`Added ${mediaItems.length} videos to gallery. Total now: ${updatedMediaItems.length}`);
        } else {
          // Для одиночного видео просто берем первый файл
          handleUpdateBlock(blockId, {
            content: {
              ...targetBlock.content,
              videoUrl: videoUrls[0]
            }
          });
        }
      };
      
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } else {
      // Добавление видео с YouTube по ссылке
      const videoUrl = prompt('Введите URL видео с YouTube:');
      if (!videoUrl) return;
      
      if (targetBlock.template === 'gallery') {
        // Для галереи добавляем в массив mediaItems
        const newMediaItem = {
          id: `video-${Date.now()}`,
          url: videoUrl,
          thumbnail: `https://img.youtube.com/vi/${extractYouTubeId(videoUrl)}/0.jpg`,
          title: 'Видео YouTube'
        };
        
        const currentMediaItems = targetBlock.content.mediaItems || [];
        const updatedMediaItems = [...currentMediaItems, newMediaItem];
        
        handleUpdateBlock(blockId, {
          content: {
            ...targetBlock.content,
            mediaItems: updatedMediaItems
          }
        });
      } else {
        // Для одиночного видео
        handleUpdateBlock(blockId, {
          content: {
            ...targetBlock.content,
            videoUrl
          }
        });
      }
    }
  };

  // Функция для извлечения ID видео из URL YouTube
const extractYouTubeId = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

  // Обработчик добавления/изменения соц. сетей
  const handleAddSocialNetwork = (blockId: string, type?: SocialNetworkType) => {
    // Находим блок
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    // Если тип передан, добавляем одну соц. сеть
    if (type) {
      const url = prompt(`Введите ссылку на профиль в ${type === SocialNetworkType.VK ? 'ВКонтакте' : type === SocialNetworkType.TELEGRAM ? 'Телеграм' : 'Одноклассниках'}:`);
      if (!url) return;
      
      handleUpdateBlock(blockId, {
        content: {
          ...block.content,
          socialType: type,
          socialUrl: url
        }
      });
    } else {
      // Иначе добавляем массив соц. сетей
      // Сначала VK
      const vkUrl = prompt('Введите ссылку на профиль в ВКонтакте:');
      
      // Затем Telegram
      const telegramUrl = prompt('Введите ссылку на профиль в Телеграм:');
      
      // И наконец OK
      const okUrl = prompt('Введите ссылку на профиль в Одноклассниках:');
      
      // Создаем массив социальных сетей, исключая пустые URL
      const socialNetworks = [];
      
      if (vkUrl) socialNetworks.push({ type: SocialNetworkType.VK, url: vkUrl });
      if (telegramUrl) socialNetworks.push({ type: SocialNetworkType.TELEGRAM, url: telegramUrl });
      if (okUrl) socialNetworks.push({ type: SocialNetworkType.ODNOKLASSNIKI, url: okUrl });
      
      if (socialNetworks.length > 0) {
        handleUpdateBlock(blockId, {
          content: {
            ...block.content,
            socialNetworks
          }
        });
      }
    }
  };

  // Добавление функции для обработки изменения размера блока
  const handleResize = (id: string, direction: string, deltaWidth: number, deltaHeight: number) => {
    // Находим блок, размер которого изменяется
    const currentBlock = blocks.find((block: Block) => block.id === id);
    if (!currentBlock) return;

    // Минимальный размер блока
    const minWidth = 1;
    const minHeight = 1;
    
    // Исходный размер
    const originalWidth = currentBlock.size.width;
    const originalHeight = currentBlock.size.height;
    
    // Вычисляем новый размер с ограничениями
    let newWidth = Math.max(minWidth, originalWidth + deltaWidth);
    let newHeight = Math.max(minHeight, originalHeight + deltaHeight);
    
    // Для круглых блоков делаем ширину и высоту одинаковыми
    if (currentBlock.template === 'circle') {
      const max = Math.max(newWidth, newHeight);
      newWidth = max;
      newHeight = max;
    }
    
    // Проверяем, не выходит ли блок за границы сетки
    if (currentBlock.position.column + newWidth > GRID_COLUMNS) {
      newWidth = GRID_COLUMNS - currentBlock.position.column;
    }
    
    // Создаем карту занятых ячеек
    const grid: boolean[][] = [];
    for (let r = 0; r < 100; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID_COLUMNS; c++) {
        grid[r][c] = false;
      }
    }
    
    // Отмечаем ячейки, занятые другими блоками (кроме изменяемого)
    for (const block of blocks) {
      if (block.id === id) continue;
      
      for (let r = block.position.row; r < block.position.row + block.size.height; r++) {
        for (let c = block.position.column; c < block.position.column + block.size.width; c++) {
          if (r >= 0 && c >= 0 && r < 100 && c < GRID_COLUMNS) {
            grid[r][c] = true;
          }
        }
      }
    }
    
    // Проверяем, не перекрывает ли новый размер другие блоки
    let hasOverlap = false;
    
    // Создаем список блоков, которые потенциально перекрываются с изменяемым блоком
    const conflictingBlocks: Block[] = [];
    
    // Проверяем только область увеличения (если увеличиваем размер)
    if (newWidth > originalWidth || newHeight > originalHeight) {
      // Проверяем новую область блока
      for (let r = currentBlock.position.row; r < currentBlock.position.row + newHeight; r++) {
        for (let c = currentBlock.position.column; c < currentBlock.position.column + newWidth; c++) {
          if (r >= 0 && c >= 0 && r < 100 && c < GRID_COLUMNS) {
            // Пропускаем ячейки, которые блок уже занимал ранее
            if (r < currentBlock.position.row + originalHeight && 
                c < currentBlock.position.column + originalWidth) {
              continue;
            }
            
            // Если ячейка занята, значит есть перекрытие
            if (grid[r][c]) {
              hasOverlap = true;
              
              // Находим, какие именно блоки перекрываются
              for (const block of blocks) {
                if (block.id === id) continue;
                
                // Проверяем, содержит ли блок эту ячейку
                if (r >= block.position.row && r < block.position.row + block.size.height &&
                    c >= block.position.column && c < block.position.column + block.size.width) {
                  if (!conflictingBlocks.find(b => b.id === block.id)) {
                    conflictingBlocks.push(block);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Если обнаружены конфликты, смещаем мешающие блоки
    if (hasOverlap && conflictingBlocks.length > 0) {
      console.log(`Found ${conflictingBlocks.length} conflicting blocks when resizing block ${id}`);
      
      // Готовим копию блоков для модификации
      let adjustedBlocks = [...blocks];
      
      // Обновляем размер текущего блока
      adjustedBlocks = adjustedBlocks.map(block => {
        if (block.id === id) {
          return {
            ...block,
            size: {
              width: newWidth,
              height: newHeight
            }
          };
        }
        return block;
      });
      
      // Сортируем конфликтующие блоки сверху вниз
      conflictingBlocks.sort((a: Block, b: Block) => a.position.row - b.position.row);
      
      // Смещаем каждый конфликтующий блок
      for (const block of conflictingBlocks) {
        // Определяем, находится ли блок справа, снизу или пересекается в углу
        const isRightSide = block.position.column >= currentBlock.position.column + originalWidth;
        const isBottom = block.position.row >= currentBlock.position.row + originalHeight;
        
        if (isBottom) {
          // Смещаем блок вниз
          const shiftDown = (currentBlock.position.row + newHeight) - block.position.row;
          const blockIndex = adjustedBlocks.findIndex(b => b.id === block.id);
          
          if (blockIndex !== -1) {
            adjustedBlocks[blockIndex] = {
              ...adjustedBlocks[blockIndex],
              position: {
                ...adjustedBlocks[blockIndex].position,
                row: block.position.row + shiftDown
              }
            };
          }
        } else if (isRightSide) {
          // Смещаем блок вправо
          const shiftRight = (currentBlock.position.column + newWidth) - block.position.column;
          const blockIndex = adjustedBlocks.findIndex(b => b.id === block.id);
          
          // Проверяем, не выйдет ли блок за границы сетки после смещения
          if (blockIndex !== -1 && block.position.column + shiftRight + block.size.width <= GRID_COLUMNS) {
            adjustedBlocks[blockIndex] = {
              ...adjustedBlocks[blockIndex],
              position: {
                ...adjustedBlocks[blockIndex].position,
                column: block.position.column + shiftRight
              }
            };
          } else {
            // Если блок выходит за границу, смещаем его вниз вместо вправо
            adjustedBlocks[blockIndex] = {
              ...adjustedBlocks[blockIndex],
              position: {
                ...adjustedBlocks[blockIndex].position,
                row: currentBlock.position.row + newHeight
              }
            };
          }
        } else {
          // Если блок находится и не справа, и не снизу, смещаем вниз
          const blockIndex = adjustedBlocks.findIndex(b => b.id === block.id);
          
          if (blockIndex !== -1) {
            adjustedBlocks[blockIndex] = {
              ...adjustedBlocks[blockIndex],
              position: {
                ...adjustedBlocks[blockIndex].position,
                row: currentBlock.position.row + newHeight
              }
            };
          }
        }
      }
      
      // Применяем изменения
      setBlocks(adjustedBlocks);
    } else {
      // Если нет конфликтов, просто изменяем размер блока
      const updatedBlocks = blocks.map(block => {
        if (block.id === id) {
          return {
            ...block,
            size: {
              width: newWidth,
              height: newHeight
            }
          };
        }
        return block;
      });
      
      setBlocks(updatedBlocks);
    }
    
    // После изменения размера убеждаемся, что все блоки расположены без наложений
    setTimeout(() => {
      setBlocks(prevBlocks => {
        // Сортируем блоки по позиции сверху вниз
        const sortedBlocks = [...prevBlocks].sort((a: Block, b: Block) => {
          if (a.position.row !== b.position.row) {
            return a.position.row - b.position.row;
          }
          return a.position.column - b.position.column;
        });
        
        // Проверяем и корректируем позиции всех блоков
        let adjustedBlocks = [...sortedBlocks];
        for (const block of sortedBlocks) {
          if (block.id !== id && !block.isFixed) {
            adjustedBlocks = handleAutoAdjustBlockPositions(adjustedBlocks, block.id);
          }
        }
        
        return adjustedBlocks;
      });
    }, 50);
  };

  // Обработчик применения изменений блока
  const handleApplyBlockChanges = () => {
    if (selectedBlockId) {
      console.log('Применяем изменения блока:', selectedBlockId);
      
      // Блок уже обновлен в реальном времени, принимаем изменения,
      // сбрасываем состояния редактирования и закрываем панель
      
      // Сбрасываем состояния
      setSelectedBlockId(null);
      setOriginalBlockState(null);
      setIsNewBlock(false);
      
      console.log('Изменения применены');
    }
  };

  // Обработчик отмены добавления/редактирования блока
  const handleCancelBlockEdit = () => {
    if (selectedBlockId) {
      console.log('ОТМЕНА: Начинаем отмену редактирования блока:', selectedBlockId);
      console.log('ОТМЕНА: isNewBlock =', isNewBlock);
      console.log('ОТМЕНА: Есть сохраненное состояние =', !!originalBlockState);
      
      if (isNewBlock) {
        // Если это новый блок - удаляем его
        console.log('ОТМЕНА: Удаляем новый блок', selectedBlockId);
        setBlocks(prev => prev.filter(block => block.id !== selectedBlockId));
        console.log('ОТМЕНА: Новый блок удален:', selectedBlockId);
      } else if (originalBlockState) {
        // Восстанавливаем все блоки к оригинальному состоянию
        console.log('ОТМЕНА: Восстанавливаем оригинальное состояние блоков');
        // Делаем глубокую копию, чтобы гарантировать полное обновление
        const restoredState = JSON.parse(JSON.stringify(originalBlockState));
        console.log('ОТМЕНА: Текущее состояние:', blocks);
        console.log('ОТМЕНА: Будет восстановлено:', restoredState);
        
        // Важно: используем функцию обновления состояния, чтобы гарантировать 
        // использование последнего состояния
        setBlocks(restoredState);
      } else {
        console.log('ОТМЕНА: ОШИБКА! Нет сохраненного состояния для восстановления!');
      }
      
      // Сбрасываем состояния редактирования
      setSelectedBlockId(null);
      setOriginalBlockState(null);
      setIsNewBlock(false);
      console.log('ОТМЕНА: Завершена');
    }
  };
  
  // Этот блок уже объявлен выше

  return (
    <Box sx={styles.root}>
      {/* Верхняя панель */}
      <AppBar position="static" sx={styles.appBar} elevation={0}>
        <Toolbar sx={styles.toolbar}>
          <Box sx={styles.toolbarLeft}>
            <Typography variant="h6" component="div" sx={{ mr: 3, fontWeight: 'bold', fontSize: '1.1rem' }}>
              Конструктор страницы
            </Typography>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setIsBlockSelectorOpen(true)}
              sx={{ 
                ...styles.toolbarButton, 
                backgroundColor: theme.palette.primary.main,
                fontWeight: 500
              }}
            >
              Добавить блок
            </Button>
            
            <Button
              variant={isPreviewMode ? "contained" : "outlined"}
              startIcon={<VisibilityIcon />}
              onClick={handlePreview}
              sx={{
                ...styles.toolbarButton,
                backgroundColor: isPreviewMode ? theme.palette.success.light : 'transparent'
              }}
            >
              {isPreviewMode ? "Выйти из предпросмотра" : "Предпросмотр"}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ColorLensIcon />}
              onClick={() => setIsColorPickerOpen(true)}
              sx={styles.toolbarButton}
            >
              Цвет фона
            </Button>
          </Box>
          
          <Box sx={styles.toolbarRight}>
            <FormControlLabel
              control={
                <Switch
                  checked={showOnMap}
                  onChange={handleMapVisibilityChange}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MapIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    Отображать на карте
                  </Typography>
                </Box>
              }
              sx={{ mr: 2 }}
            />
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              size="small"
            >
              Сохранить
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Основное содержимое */}
      <Box sx={styles.mainContent}>
        {/* Left side toolbar panel */}
        <Drawer
          variant="temporary"
          anchor="left"
          open={selectedBlockId !== null && !isDragging}
          sx={{
            width: 350,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              ...styles.sidePanel,
              zIndex: 1200
            }
          }}
          ModalProps={{
            keepMounted: true,
          }}
          // Добавляем hideBackdrop, чтобы убрать затемнение фона
          hideBackdrop={true}
        >
          {/* Диалог настройки блока */}
          <BlockSettingsDialog 
            open={!!selectedBlockId && !isDragging}
            onClose={handleCloseBlockEditor}
            block={selectedBlockId ? blocks.find(b => b.id === selectedBlockId)! : null} 
            onUpdateBlock={(changes: Partial<Block>) => selectedBlockId && handleUpdateBlock(selectedBlockId, changes)}
            isNewBlock={isNewBlock}
            onCancelChanges={handleCancelBlockEdit}
            onApplyChanges={handleApplyBlockChanges}
          />
        </Drawer>
        
        {/* Editing area */}
        <Box 
          sx={{ 
            ...styles.canvas,
            width: '100%'
          }}
        >
          <Paper 
            sx={{ 
              ...styles.canvasInner, 
              backgroundColor,
              backgroundImage: gridVisible && !isPreviewMode ? `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), 
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(rgba(100,100,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(100,100,255,0.1) 1px, transparent 1px)
              ` : 'none',
              backgroundSize: gridVisible && !isPreviewMode ? `${CELL_SIZE}px ${CELL_SIZE}px, ${CELL_SIZE}px ${CELL_SIZE}px, ${CELL_SIZE * 4}px ${CELL_SIZE * 4}px, ${CELL_SIZE * 4}px ${CELL_SIZE * 4}px` : 'auto',
              minHeight: '1000px',
              padding: 1,
              position: 'relative'
            }}
          >
            {/* Индикаторы позиций колонок */}
            {gridVisible && !isPreviewMode && (
              <Box sx={{ position: 'absolute', top: '4px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', px: 2 }}>
                {/* Левая позиция */}
                <Tooltip title="Левая позиция" arrow>
                  <Box sx={{ 
                    height: '20px', 
                    width: '60px', 
                    backgroundColor: 'rgba(255,100,100,0.2)',
                    borderBottom: '2px solid rgba(255,100,100,0.5)',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: 'rgba(0,0,0,0.6)',
                    fontWeight: 'bold'
                  }}>
                    СЛЕВА
                  </Box>
                </Tooltip>
                
                {/* Центральная позиция */}
                <Tooltip title="Центральная позиция" arrow>
                  <Box sx={{ 
                    height: '20px', 
                    width: '60px', 
                    backgroundColor: 'rgba(100,255,100,0.2)',
                    borderBottom: '2px solid rgba(100,255,100,0.5)',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: 'rgba(0,0,0,0.6)',
                    fontWeight: 'bold'
                  }}>
                    ЦЕНТР
                  </Box>
                </Tooltip>
                
                {/* Правая позиция */}
                <Tooltip title="Правая позиция" arrow>
                  <Box sx={{ 
                    height: '20px', 
                    width: '60px', 
                    backgroundColor: 'rgba(100,100,255,0.2)',
                    borderBottom: '2px solid rgba(100,100,255,0.5)',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: 'rgba(0,0,0,0.6)',
                    fontWeight: 'bold'
                  }}>
                    СПРАВА
                  </Box>
                </Tooltip>
              </Box>
            )}
            
            {/* Блоки с возможностью перетаскивания */}
            {blocks.map((block) => {
              // Make sure we have a ref for this block
              if (!draggableRefs.current[block.id]) {
                draggableRefs.current[block.id] = React.createRef();
              }
              
              return (
                <Draggable
                  key={block.id}
                  defaultPosition={{ 
                    x: block.position.column * CELL_SIZE, 
                    y: block.position.row * CELL_SIZE 
                  }}
                  grid={[CELL_SIZE, CELL_SIZE]}
                  bounds="parent"
                  onStart={handleDragStart}
                  onStop={(e, data) => handleDragStop(block.id, data)}
                  disabled={selectedBlockId === block.id || block.isFixed || isPreviewMode}
                  nodeRef={draggableRefs.current[block.id]}
                >
                  <Box
                    ref={draggableRefs.current[block.id]}
                    data-block-id={block.id}
                    sx={{
                      ...styles.draggableBlock,
                      width: `${block.size.width * CELL_SIZE}px`,
                      height: `${block.size.height * CELL_SIZE}px`,
                      border: selectedBlockId === block.id 
                        ? `2px solid ${theme.palette.primary.main}` 
                        : activeBlockId === block.id
                        ? `2px dashed ${theme.palette.secondary.main}`
                        : block.isFixed ? `2px dashed #4caf50` : 'none',
                      boxShadow: block.isFixed 
                        ? '0 0 0 2px rgba(76, 175, 80, 0.3), 0 4px 8px rgba(0, 0, 0, 0.1)' 
                        : 'none',
                      zIndex: selectedBlockId === block.id || activeBlockId === block.id ? 10 : block.isFixed ? 5 : 1,
                      boxSizing: 'border-box',
                      cursor: block.isFixed || isPreviewMode ? 'default' : 'move',
                      opacity: block.isFixed ? 0.95 : 1,
                      position: 'absolute',
                      '&:hover': {
                        boxShadow: block.isFixed
                          ? '0 0 0 2px rgba(76, 175, 80, 0.5), 0 6px 12px rgba(0, 0, 0, 0.15)'
                          : '0 5px 15px rgba(0, 0, 0, 0.15)',
                        transform: block.isFixed ? 'translateY(-1px)' : 'translateY(-2px)'
                      },
                      '&:hover .resize-handle': {
                        opacity: isPreviewMode ? 0 : 0.8,
                      }
                    }}
                  >
                    {/* Ручки изменения размера */}
                    {!isPreviewMode && !block.isFixed && (
                      <>
                        {/* Угловые ручки */}
                        <Box
                          className="resize-handle resize-handle-se"
                          sx={{
                            ...resizeHandleStyles,
                            bottom: '-7px',
                            right: '-7px',
                            cursor: 'nwse-resize',
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startWidth = block.size.width;
                            const startHeight = block.size.height;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const deltaY = moveEvent.clientY - startY;
                              
                              // Изменяем размер на основе шага сетки
                              const deltaWidth = Math.round(deltaX / CELL_SIZE);
                              const deltaHeight = Math.round(deltaY / CELL_SIZE);
                              
                              handleResize(block.id, 'se', deltaWidth, deltaHeight);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                              setActiveBlockId(block.id); // Выделяем блок после изменения размера
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        />
                        {/* Боковые ручки */}
                        <Box
                          className="resize-handle resize-handle-e"
                          sx={{
                            ...resizeHandleStyles,
                            top: '50%',
                            right: '-7px',
                            transform: 'translateY(-50%)',
                            cursor: 'ew-resize',
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startWidth = block.size.width;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const deltaWidth = Math.round(deltaX / CELL_SIZE);
                              
                              handleResize(block.id, 'e', deltaWidth, 0);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                              setActiveBlockId(block.id);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        />
                        <Box
                          className="resize-handle resize-handle-s"
                          sx={{
                            ...resizeHandleStyles,
                            bottom: '-7px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            cursor: 'ns-resize',
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const startY = e.clientY;
                            const startHeight = block.size.height;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaY = moveEvent.clientY - startY;
                              const deltaHeight = Math.round(deltaY / CELL_SIZE);
                              
                              handleResize(block.id, 's', 0, deltaHeight);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                              setActiveBlockId(block.id);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        />
                      </>
                    )}
                    
                    <Box sx={{
                      ...styles.blockWrapper,
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      boxSizing: 'border-box'
                    }}
                      onClick={(e) => {
                        if (!isPreviewMode && !isDragging) {
                          e.stopPropagation();
                          handleSelectBlockVisually(block.id); // Только визуально выделяем блок
                        }
                      }}
                    >
                      {!isPreviewMode && (activeBlockId === block.id || block.id === selectedBlockId) && (
                        <Box 
                          className="blockControls"
                          sx={{
                            ...styles.blockControls,
                            opacity: 1, // Всегда показываем controls для активного блока
                          }}
                        >
                          <Tooltip title={block.isFixed ? "Открепить блок" : "Закрепить блок"}>
                            <IconButton 
                              size="small"
                              onClick={(e) => handleToggleFixBlock(block.id, e)}
                              color={block.isFixed ? "success" : "default"}
                            >
                              <PushPinIcon 
                                fontSize="small" 
                                sx={{ 
                                  transform: block.isFixed ? 'rotate(45deg)' : 'rotate(-45deg)',
                                  transition: 'transform 0.2s ease'
                                }} 
                              />
                            </IconButton>
                          </Tooltip>
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Используем новую функцию для открытия панели настроек
                              handleOpenSettings(block.id, e);
                            }}
                            color={selectedBlockId === block.id ? "primary" : "default"}
                          >
                            <SettingsIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBlock(block.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                      <Paper
                        sx={{
                          ...styles.blockContent,
                          backgroundColor: block.style.backgroundColor,
                          color: block.style.color,
                          borderRadius: block.template === 'circle' ? '50%' : block.style.borderRadius,
                          height: '100%',
                          width: '100%',
                          boxShadow: block.isFixed 
                            ? '0 2px 8px rgba(0,100,0,0.15)' 
                            : activeBlockId === block.id 
                            ? '0 6px 16px rgba(0,0,0,0.15)'
                            : '0 4px 12px rgba(0,0,0,0.08)',
                          aspectRatio: block.template === 'circle' ? '1/1' : 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          boxSizing: 'border-box',
                          margin: 0,
                          padding: block.type === 'profile' && block.template === 'detailed' ? '8px' : '16px'
                        }}
                        elevation={activeBlockId === block.id ? 3 : block.isFixed ? 1 : 2}
                      >
                        {renderBlockContent(block)}
                      </Paper>
                    </Box>
                  </Box>
                </Draggable>
              );
            })}
          </Paper>
        </Box>
      </Box>
      
      {/* Селектор блоков */}
      <BlockSelector 
        open={isBlockSelectorOpen}
        onClose={() => setIsBlockSelectorOpen(false)}
        onSelect={handleAddBlock}
      />
      
      {/* Диалог выбора цвета фона */}
      <Dialog 
        open={isColorPickerOpen} 
        onClose={() => setIsColorPickerOpen(false)}
        maxWidth="xs"
        fullWidth
        BackdropProps={{
          style: { backgroundColor: 'transparent' }
        }}
      >
        <DialogTitle>
          Выберите цвет фона
          <IconButton
            aria-label="close"
            onClick={() => setIsColorPickerOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Предустановленные цвета:
          </Typography>
          <Box sx={styles.colorContainer}>
            {predefinedColors.map((color) => (
              <Box
                key={color.value}
                sx={{
                  ...styles.colorOption,
                  backgroundColor: color.value,
                  ...(backgroundColor === color.value && styles.colorOptionSelected)
                }}
                onClick={() => handleBackgroundColorChange(color.value)}
                title={color.name}
              />
            ))}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Выбрать произвольный цвет:
          </Typography>
          <TextField
            fullWidth
            placeholder="#RRGGBB"
            value={customColor}
            onChange={handleCustomColorChange}
            helperText="Введите код цвета в формате HEX"
            sx={{ mt: 1, mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '4px', 
                      backgroundColor: isValidHex(customColor) ? customColor : '#ccc',
                      border: '1px solid rgba(0,0,0,0.2)'
                    }} 
                  />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleApplyCustomColor}
            disabled={!isValidHex(customColor)}
            fullWidth
          >
            Применить
          </Button>
        </DialogContent>
      </Dialog>
      
      {/* Интерфейс для режима предпросмотра */}
      {isPreviewMode && (
        <Box sx={{ 
          ...styles.previewWrapper,
          backgroundColor,
          position: 'relative',
          // Ensure the preview container has enough height to contain all blocks
          minHeight: '600px',
          height: 'auto'
        }}>
          {blocks.map((block) => (
            <Box 
              key={block.id}
              sx={{
                position: 'absolute',
                left: `${block.position.column * CELL_SIZE}px`,
                top: `${block.position.row * CELL_SIZE}px`,
                width: `${block.size.width * CELL_SIZE}px`,
                height: `${block.size.height * CELL_SIZE}px`,
                zIndex: block.isFixed ? 2 : 1,
                '& ul, & ol, & li': {
                  listStyle: 'none',
                  margin: 0,
                  padding: 0
                }
              }}
            >
              <Paper
                sx={{
                  backgroundColor: block.style.backgroundColor,
                  color: block.style.color,
                  borderRadius: block.template === 'circle' ? '50%' : block.style.borderRadius,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  p: 2,
                  height: '100%',
                  width: '100%',
                  boxSizing: 'border-box',
                  overflow: 'auto'
                }}
              >
                {renderBlockContent(block)}
              </Paper>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Constructor;