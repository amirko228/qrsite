import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Avatar, 
  Tooltip, 
  Button,
  TextField,
  Divider,
  Collapse,
  Fade
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveIcon from '@mui/icons-material/Save';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import PaletteIcon from '@mui/icons-material/Palette';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import { styled } from '@mui/material/styles';
import Draggable from 'react-draggable';

import NotionBlockWidget, { Block, BlockType } from './NotionBlockWidget';

// Стилизованные компоненты
const ProfileContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  position: 'relative',
  borderRadius: theme.spacing(1),
  boxShadow: 'rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 2px 4px',
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(3),
  overflow: 'hidden',
  '&:hover': {
    boxShadow: 'rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, rgba(15, 15, 15, 0.2) 0px 3px 6px',
  }
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  position: 'relative',
}));

const CoverImage = styled(Box)<{ bgimage?: string, bgcolor?: string }>(({ theme, bgimage, bgcolor }) => ({
  width: '100%',
  height: 200,
  position: 'relative',
  marginBottom: theme.spacing(8),
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  background: bgimage ? `url(${bgimage}) center/cover no-repeat` : bgcolor || '#f0f0f0',
}));

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  position: 'absolute',
  bottom: -60,
  left: '50%',
  transform: 'translateX(-50%)',
}));

const BlocksContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const AddBlockButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1),
  width: '100%',
  justifyContent: 'flex-start',
  borderStyle: 'dashed',
  borderWidth: 1,
  borderRadius: theme.spacing(1),
  color: theme.palette.text.secondary,
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(25, 118, 210, 0.04)',
  }
}));

const ColorPaletteContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const ColorSwatch = styled(Box)<{ color: string }>(({ theme, color }) => ({
  width: 36,
  height: 36,
  backgroundColor: color,
  borderRadius: theme.spacing(0.5),
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  }
}));

// Интерфейсы
interface ProfileContent {
  name: string;
  coverImage?: string;
  coverColor?: string;
  avatar?: string;
  blocks: Block[];
}

interface NotionProfileWidgetProps {
  content: ProfileContent;
  onUpdate: (content: ProfileContent) => void;
  isEditing: boolean;
  onDelete?: () => void;
  readOnly?: boolean;
}

// Цвета для фона
const backgroundColors = [
  '#F1F1EF', // Нежный серый
  '#F3F0FF', // Нежный фиолетовый
  '#FFEFD5', // Нежный персиковый
  '#E6F5FF', // Нежный голубой
  '#F0FFF0', // Нежный зеленый
  '#FFE4E1', // Нежный розовый
  '#F5F5DC', // Бежевый
  '#F0E6FF', // Лавандовый
  '#FFE4B5', // Светлый желтый
  '#F0F8FF', // Светлый синий
  '#E0FFFF', // Светлый циан
  '#E6E6FA', // Лавандовый
  '#FFFACD', // Светлый золотой
  '#E0FFFF', // Светлый синий
  '#FFF0F5', // Светлый розовый
];

const NotionProfileWidget: React.FC<NotionProfileWidgetProps> = ({
  content,
  onUpdate,
  isEditing,
  onDelete,
  readOnly = false,
}) => {
  // Состояния компонента
  const [profileName, setProfileName] = useState(content.name || 'Мой профиль');
  const [coverImage, setCoverImage] = useState(content.coverImage || '');
  const [coverColor, setCoverColor] = useState(content.coverColor || backgroundColors[0]);
  const [avatar, setAvatar] = useState(content.avatar || '');
  const [blocks, setBlocks] = useState<Block[]>(content.blocks || []);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [isLocalEditing, setIsLocalEditing] = useState(false);
  const [blockPositions, setBlockPositions] = useState<{[key: string]: {x: number, y: number}}>({});
  
  // Эффект синхронизации с пропсами
  useEffect(() => {
    setProfileName(content.name || 'Мой профиль');
    setCoverImage(content.coverImage || '');
    setCoverColor(content.coverColor || backgroundColors[0]);
    setAvatar(content.avatar || '');
    setBlocks(content.blocks || []);
  }, [content]);
  
  // Инициализация позиций
  useEffect(() => {
    const positions: {[key: string]: {x: number, y: number}} = {};
    content.blocks.forEach(block => {
      positions[block.id] = { x: 0, y: 0 };
    });
    setBlockPositions(positions);
  }, [content.blocks]);
  
  // Обновление профиля
  const handleSaveChanges = () => {
    onUpdate({
      name: profileName,
      coverImage,
      coverColor,
      avatar,
      blocks,
    });
    setIsLocalEditing(false);
  };
  
  // Начать редактирование
  const handleStartEditing = () => {
    setIsLocalEditing(true);
  };
  
  // Обработка изменения блока
  const handleBlockUpdate = (id: string, updatedBlock: Block) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id ? updatedBlock : block
      )
    );
  };
  
  // Удаление блока
  const handleDeleteBlock = (id: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
  };
  
  // Перемещение блока вверх
  const handleMoveBlockUp = (id: string) => {
    const index = blocks.findIndex(block => block.id === id);
    if (index <= 0) return;
    
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index - 1];
    newBlocks[index - 1] = temp;
    
    setBlocks(newBlocks);
  };
  
  // Перемещение блока вниз
  const handleMoveBlockDown = (id: string) => {
    const index = blocks.findIndex(block => block.id === id);
    if (index >= blocks.length - 1) return;
    
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + 1];
    newBlocks[index + 1] = temp;
    
    setBlocks(newBlocks);
  };
  
  // Дублирование блока
  const handleDuplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find(block => block.id === id);
    if (!blockToDuplicate) return;
    
    const duplicatedBlock = {
      ...blockToDuplicate,
      id: Date.now().toString(),
    };
    
    const index = blocks.findIndex(block => block.id === id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicatedBlock);
    
    setBlocks(newBlocks);
  };
  
  // Добавление нового блока
  const handleAddBlock = (type: BlockType = 'paragraph') => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: type === 'to-do' ? { text: '', checked: false } : '',
      format: {
        bold: false,
        italic: false,
        underline: false,
      }
    };
    
    setBlocks([...blocks, newBlock]);
  };
  
  // Добавление блока после определенного блока
  const handleAddBlockBelow = (id: string, type: BlockType) => {
    const index = blocks.findIndex(block => block.id === id);
    if (index === -1) return;
    
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: type === 'to-do' ? { text: '', checked: false } : '',
      format: {
        bold: false,
        italic: false,
        underline: false,
      }
    };
    
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    
    setBlocks(newBlocks);
  };
  
  // Обработка изменения аватара
  const handleAvatarChange = () => {
    const newAvatarUrl = prompt('Введите URL изображения для аватара:', avatar);
    if (newAvatarUrl !== null) {
      setAvatar(newAvatarUrl);
    }
  };
  
  // Обработка изменения фонового изображения
  const handleCoverImageChange = () => {
    const newCoverUrl = prompt('Введите URL изображения для фона:', coverImage);
    if (newCoverUrl !== null) {
      setCoverImage(newCoverUrl);
      setShowColorPalette(false);
    }
  };
  
  // Обработка клика по цвету
  const handleColorClick = (color: string) => {
    setCoverColor(color);
    setCoverImage('');
    setShowColorPalette(false);
  };
  
  // Генерация начальных блоков если их нет
  useEffect(() => {
    if (blocks.length === 0 && isEditing) {
      // Создаем начальные блоки
      const initialBlocks: Block[] = [
        {
          id: Date.now().toString(),
          type: 'heading-1',
          content: 'Добро пожаловать!',
          format: { bold: true }
        },
        {
          id: (Date.now() + 1).toString(),
          type: 'paragraph',
          content: 'Это ваш профиль в стиле Notion. Добавляйте и редактируйте блоки, чтобы создать уникальную страницу.',
          format: { }
        },
      ];
      
      setBlocks(initialBlocks);
    }
  }, [blocks.length, isEditing]);
  
  // Обработка остановки перетаскивания
  const handleDragStop = (id: string, data: {x: number, y: number}) => {
    setBlockPositions(prev => ({
      ...prev,
      [id]: { x: data.x, y: data.y }
    }));
    
    // Реорганизация блоков на основе вертикальной позиции
    const sortedBlocks = [...blocks].sort((a, b) => {
      const posA = blockPositions[a.id]?.y || 0;
      const posB = blockPositions[b.id]?.y || 0;
      return posA - posB;
    });
    
    if (JSON.stringify(sortedBlocks.map(b => b.id)) !== JSON.stringify(blocks.map(b => b.id))) {
      setBlocks(sortedBlocks);
    }
  };
  
  return (
    <ProfileContainer>
      <CoverImage 
        bgimage={coverImage} 
        bgcolor={coverColor}
      >
        {(isEditing || isLocalEditing) && (
          <Box sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            display: 'flex',
            gap: 1
          }}>
            <Tooltip title="Изменить фон">
              <IconButton 
                onClick={() => setShowColorPalette(!showColorPalette)}
                sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
              >
                <PaletteIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Установить изображение">
              <IconButton 
                onClick={handleCoverImageChange}
                sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
              >
                <FormatColorFillIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        
        <Collapse in={showColorPalette}>
          <Box sx={{ 
            position: 'absolute', 
            bottom: 8, 
            left: 8, 
            right: 8,
            backgroundColor: 'rgba(255,255,255,0.9)',
            p: 2,
            borderRadius: 1
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Выберите цвет фона:
            </Typography>
            <ColorPaletteContainer>
              {backgroundColors.map((color, index) => (
                <ColorSwatch 
                  key={index} 
                  color={color} 
                  onClick={() => handleColorClick(color)}
                  sx={{ border: color === coverColor ? '2px solid #1976d2' : 'none' }}
                />
              ))}
            </ColorPaletteContainer>
          </Box>
        </Collapse>
        
        <LargeAvatar 
          src={avatar || ''} 
          alt={profileName}
          onClick={isEditing || isLocalEditing ? handleAvatarChange : undefined}
          sx={{
            cursor: (isEditing || isLocalEditing) ? 'pointer' : 'default',
            '&:hover': {
              ...(isEditing || isLocalEditing ? { opacity: 0.8 } : {})
            }
          }}
        />
      </CoverImage>
      
      <ProfileHeader>
        {isLocalEditing ? (
          <TextField
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            variant="standard"
            inputProps={{
              style: { 
                textAlign: 'center',
                fontSize: '1.75rem',
                fontWeight: 'bold'
              }
            }}
            fullWidth
            sx={{ mb: 2 }}
          />
        ) : (
          <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
            {profileName}
          </Typography>
        )}
        
        {/* Кнопки управления профилем */}
        {isEditing && !readOnly && (
          <Box sx={{ mt: 1 }}>
            {isLocalEditing ? (
              <Button 
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveChanges}
              >
                Сохранить изменения
              </Button>
            ) : (
              <Button 
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleStartEditing}
              >
                Редактировать профиль
              </Button>
            )}
          </Box>
        )}
      </ProfileHeader>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Блоки контента */}
      <BlocksContainer>
        <Box sx={{ position: 'relative', minHeight: 100 }}>
          {blocks.map((block, index) => (
            <Draggable
              key={block.id}
              position={blockPositions[block.id] || {x: 0, y: 0}}
              onStop={(e, data) => handleDragStop(block.id, data)}
              disabled={!(isEditing || isLocalEditing) || readOnly}
              axis="y"
              bounds="parent"
              handle=".block-drag-handle"
            >
              <Box 
                sx={{ 
                  position: 'relative',
                  mb: 2,
                  '&:hover .block-drag-handle': {
                    opacity: isEditing ? 1 : 0
                  }
                }}
              >
                <Box 
                  className="block-drag-handle"
                  sx={{ 
                    position: 'absolute',
                    left: -30,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: 0,
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <DragIndicatorIcon fontSize="small" color="action" />
                </Box>
                <NotionBlockWidget
                  block={block}
                  index={index}
                  isEditing={isEditing || isLocalEditing}
                  onUpdate={handleBlockUpdate}
                  onDelete={handleDeleteBlock}
                  onMoveUp={handleMoveBlockUp}
                  onMoveDown={handleMoveBlockDown}
                  onDuplicate={handleDuplicateBlock}
                  onAddBlockBelow={handleAddBlockBelow}
                  readOnly={readOnly}
                />
              </Box>
            </Draggable>
          ))}
        </Box>
      
        {/* Кнопка добавления блока */}
        {(isEditing || isLocalEditing) && !readOnly && (
          <AddBlockButton
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => handleAddBlock('paragraph')}
          >
            Добавить блок
          </AddBlockButton>
        )}
      </BlocksContainer>
    </ProfileContainer>
  );
};

export default NotionProfileWidget; 