import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Tab,
  Tabs,
  Grid,
  Paper,
  Button,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ShareIcon from '@mui/icons-material/Share';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PanoramaIcon from '@mui/icons-material/Panorama';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import SquareRoundedIcon from '@mui/icons-material/SquareRounded';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import PanoramaHorizontalIcon from '@mui/icons-material/PanoramaHorizontal';
import { BlockType, BlockTemplates } from '../types';

// Интерфейс для пропсов компонента
interface BlockSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: BlockType, template: string) => void;
}

const BlockSelector: React.FC<BlockSelectorProps> = ({ open, onClose, onSelect }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const theme = useTheme();

  // Получение типа блока на основе выбранной вкладки
  const getBlockTypeByTabIndex = (index: number): BlockType => {
    switch (index) {
      case 0:
        return BlockType.TEXT;
      case 1:
        return BlockType.PHOTO;
      case 2:
        return BlockType.VIDEO;
      case 3:
        return BlockType.SOCIAL;
      case 4:
        return BlockType.PROFILE;
      case 5:
        return BlockType.FAMILY_TREE;
      default:
        return BlockType.TEXT;
    }
  };

  // Получение иконки для типа блока
  const getBlockIcon = (type: BlockType): React.ReactNode => {
    switch (type) {
      case BlockType.TEXT:
        return <TextFieldsIcon />;
      case BlockType.PHOTO:
        return <InsertPhotoIcon />;
      case BlockType.VIDEO:
        return <VideoLibraryIcon />;
      case BlockType.SOCIAL:
        return <ShareIcon />;
      case BlockType.PROFILE:
        return <AccountBoxIcon />;
      case BlockType.FAMILY_TREE:
        return <AccountTreeIcon />;
      default:
        return null;
    }
  };

  // Получение иконки для шаблона блока
  const getTemplateIcon = (type: BlockType, template: string): React.ReactNode => {
    // Иконки для текстовых блоков
    if (type === BlockType.TEXT) {
      switch (template) {
        case 'rounded-square':
          return <SquareRoundedIcon sx={{ fontSize: 40 }} />;
        case 'circle':
          return <RadioButtonCheckedIcon sx={{ fontSize: 40 }} />;
        case 'rounded-rectangle':
          return <PanoramaHorizontalIcon sx={{ fontSize: 40 }} />;
        case 'semicircle':
          return <PanoramaIcon sx={{ fontSize: 40, transform: 'rotate(180deg)' }} />;
        default:
          return <TextFieldsIcon sx={{ fontSize: 40 }} />;
      }
    }

    // Иконки для фото блоков
    if (type === BlockType.PHOTO) {
      switch (template) {
        case 'gallery':
          return <PhotoLibraryIcon sx={{ fontSize: 40 }} />;
        case 'banner':
          return <PanoramaIcon sx={{ fontSize: 40 }} />;
        case 'rounded-square':
          return <SquareRoundedIcon sx={{ fontSize: 40 }} />;
        case 'circle':
          return <RadioButtonCheckedIcon sx={{ fontSize: 40 }} />;
        default:
          return <InsertPhotoIcon sx={{ fontSize: 40 }} />;
      }
    }

    // Иконки для видео блоков
    if (type === BlockType.VIDEO) {
      switch (template) {
        case 'gallery':
          return <PhotoLibraryIcon sx={{ fontSize: 40 }} />;
        case 'rounded-square':
          return <SquareRoundedIcon sx={{ fontSize: 40 }} />;
        default:
          return <VideoLibraryIcon sx={{ fontSize: 40 }} />;
      }
    }

    // Иконки для блоков соцсетей
    if (type === BlockType.SOCIAL) {
      switch (template) {
        case 'circle':
          return <RadioButtonCheckedIcon sx={{ fontSize: 40 }} />;
        case 'bar':
          return <PanoramaHorizontalIcon sx={{ fontSize: 40 }} />;
        case 'separate':
          return <CropSquareIcon sx={{ fontSize: 40 }} />;
        default:
          return <ShareIcon sx={{ fontSize: 40 }} />;
      }
    }

    // Иконки для блоков профиля
    if (type === BlockType.PROFILE) {
      switch (template) {
        case 'full-width':
          return <PanoramaHorizontalIcon sx={{ fontSize: 40 }} />;
        case 'square':
          return <SquareRoundedIcon sx={{ fontSize: 40 }} />;
        case 'rounded-rectangle':
          return <PanoramaHorizontalIcon sx={{ fontSize: 40 }} />;
        case 'tall-rectangle':
          return <CropSquareIcon sx={{ fontSize: 40, transform: 'rotate(90deg)' }} />;
        default:
          return <AccountBoxIcon sx={{ fontSize: 40 }} />;
      }
    }

    // Иконка для семейного древа
    if (type === BlockType.FAMILY_TREE) {
      return <AccountTreeIcon sx={{ fontSize: 40 }} />;
    }

    return null;
  };

  // Обработчик выбора вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Обработчик выбора шаблона блока
  const handleSelectTemplate = (template: string) => {
    const blockType = getBlockTypeByTabIndex(selectedTab);
    onSelect(blockType, template);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      BackdropProps={{
        style: { backgroundColor: 'transparent' }
      }}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          p: 2
        }}
      >
        <Typography variant="h6" component="div" fontWeight="bold">
          Выберите тип блока
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          size="large"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none'
            }
          }}
        >
          <Tab 
            label="Текст" 
            icon={<TextFieldsIcon />} 
            iconPosition="start"
            sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}
          />
          <Tab 
            label="Фото" 
            icon={<InsertPhotoIcon />} 
            iconPosition="start"
            sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}
          />
          <Tab 
            label="Видео" 
            icon={<VideoLibraryIcon />} 
            iconPosition="start"
            sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}
          />
          <Tab 
            label="Соцсети" 
            icon={<ShareIcon />} 
            iconPosition="start"
            sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}
          />
          <Tab 
            label="Страница памяти" 
            icon={<AccountBoxIcon />} 
            iconPosition="start"
            sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}
          />
          <Tab 
            label="Семейное древо" 
            icon={<AccountTreeIcon />} 
            iconPosition="start"
            sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {BlockTemplates[getBlockTypeByTabIndex(selectedTab)].map((template) => (
            <Grid item xs={12} sm={6} md={3} key={template.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 160,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  textAlign: 'center',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleSelectTemplate(template.id)}
              >
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    mb: 2,
                    color: 'primary.main'
                  }}
                >
                  {getTemplateIcon(getBlockTypeByTabIndex(selectedTab), template.id)}
                </Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {template.name}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default BlockSelector; 