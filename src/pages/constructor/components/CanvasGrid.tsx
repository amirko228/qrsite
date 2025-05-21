import React from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ShareIcon from '@mui/icons-material/Share';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AddIcon from '@mui/icons-material/Add';
import { Block, BlockType } from '../types';

// Стили для сетки и блоков
const styles = {
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '16px',
    padding: '24px',
    minHeight: '500px'
  },
  blockContainer: {
    position: 'relative',
    transition: 'all 0.2s',
    '&:hover .controls': {
      opacity: 1
    }
  },
  block: {
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative'
  },
  blockSelected: {
    boxShadow: '0 0 0 2px #1976d2 !important',
    zIndex: 1
  },
  blockControls: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    display: 'flex',
    opacity: 0,
    transition: 'opacity 0.2s',
    zIndex: 2
  },
  dragHandle: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    opacity: 0,
    transition: 'opacity 0.2s',
    zIndex: 2
  },
  photoBlock: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    color: '#999',
    borderRadius: '8px'
  },
  blockIcon: {
    fontSize: '2rem',
    marginBottom: '8px'
  },
  placeholder: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '8px',
    border: '2px dashed #ccc',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: '100px'
  }
};

// Получение иконки для типа блока
const getBlockIcon = (type: BlockType) => {
  switch (type) {
    case 'text':
      return <TextFieldsIcon sx={styles.blockIcon} />;
    case 'photo':
      return <ImageIcon sx={styles.blockIcon} />;
    case 'video':
      return <VideoLibraryIcon sx={styles.blockIcon} />;
    case 'social':
      return <ShareIcon sx={styles.blockIcon} />;
    case 'profile':
      return <AccountBoxIcon sx={styles.blockIcon} />;
    default:
      return null;
  }
};

// Получение русского названия типа блока
const getBlockTypeName = (type: BlockType): string => {
  switch (type) {
    case 'text':
      return 'Текстовый блок';
    case 'photo':
      return 'Фото';
    case 'video':
      return 'Видео';
    case 'social':
      return 'Соц. сети';
    case 'profile':
      return 'Информация профиля';
    default:
      return '';
  }
};

interface CanvasGridProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onUpdateBlock: (id: string, changes: Partial<Block>) => void;
  onDeleteBlock: (id: string) => void;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock
}) => {
  const renderBlockContent = (block: Block) => {
    switch (block.type) {
      case 'text':
        return (
          <Box sx={{ textAlign: 'center' }}>
            {getBlockIcon(block.type)}
            <Typography variant="body1">
              {block.content.text || 'Добавьте текст'}
            </Typography>
          </Box>
        );
      case 'photo':
        if (block.content.images && block.content.images.length > 0) {
          // Отображение изображений
          return (
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <img 
                src={block.content.images[0]} 
                alt="Uploaded" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: block.style.borderRadius 
                }} 
              />
            </Box>
          );
        } else {
          // Placeholder для загрузки фото
          return (
            <Box sx={styles.photoBlock}>
              {getBlockIcon(block.type)}
              <Typography variant="body2">Нажмите, чтобы добавить фото</Typography>
            </Box>
          );
        }
      case 'video':
        return (
          <Box sx={{ textAlign: 'center' }}>
            {getBlockIcon(block.type)}
            <Typography variant="body1">
              {block.content.videoUrl ? 'Видео добавлено' : 'Добавьте ссылку на видео'}
            </Typography>
          </Box>
        );
      case 'social':
        return (
          <Box sx={{ textAlign: 'center' }}>
            {getBlockIcon(block.type)}
            <Typography variant="body1">
              {block.template === 'vk' ? 'ВКонтакте' : 
               block.template === 'telegram' ? 'Телеграм' : 'Одноклассники'}
            </Typography>
          </Box>
        );
      case 'profile':
        return (
          <Box sx={{ textAlign: 'center' }}>
            {getBlockIcon(block.type)}
            <Typography variant="body1">
              {block.content.profileInfo?.fullName || 'Информация профиля'}
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={styles.gridContainer}>
      {blocks.map((block) => (
        <Box
          key={block.id}
          sx={{
            ...styles.blockContainer,
            gridColumn: `span ${block.size.width}`,
            gridRow: `span ${block.size.height}`,
          }}
        >
          <Box
            sx={{
              ...styles.dragHandle,
              opacity: selectedBlockId === block.id ? 1 : 0
            }}
            className="controls"
          >
            <IconButton size="small">
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Paper
            sx={{
              ...styles.block,
              ...(selectedBlockId === block.id && styles.blockSelected),
              ...block.style,
              ...(block.type === 'text' && block.template === 'circle' && {
                borderRadius: '50%',
                aspectRatio: '1 / 1'
              }),
              ...(block.type === 'text' && block.template === 'semicircle' && {
                borderRadius: '100px 100px 0 0'
              })
            }}
            elevation={2}
            onClick={() => onSelectBlock(block.id)}
          >
            {renderBlockContent(block)}
          </Paper>
          
          <Box
            sx={styles.blockControls}
            className="controls"
          >
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBlock(block.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ))}
      
      {/* Заполнитель для визуализации пустого холста */}
      {blocks.length === 0 && (
        <Box
          sx={{
            ...styles.placeholder,
            gridColumn: 'span 12'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <AddIcon sx={{ fontSize: '3rem', color: '#999', mb: 1 }} />
            <Typography variant="body1" color="textSecondary">
              Нажмите "Добавить блок", чтобы начать создание страницы памяти
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CanvasGrid; 