import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Grid,
  useTheme,
  Tooltip,
  Paper,
  Tab,
  Tabs,
  Slider,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import { SketchPicker } from 'react-color';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import BorderStyleIcon from '@mui/icons-material/BorderStyle';
import { Block, BlockSizeType, BlockType, SocialNetworkType } from '../types';

// Предустановленные цвета
const predefinedColors = {
  background: [
    '#FFFFFF', // белый
    '#F5F5F5', // светло-серый
    '#EEEEEE', // серый
    '#F5F5DC', // бежевый
    '#1A3C6E', // темно-синий
    '#8B4513', // коричневый
    '#FF4B4B', // красный
    '#87CEFA', // голубой
    '#333333'  // черный
  ],
  text: [
    '#000000', // черный
    '#FFFFFF', // белый
    '#666666', // серый
    '#1A3C6E', // темно-синий
    '#FF4B4B', // красный
  ]
};

// Типы размеров для разных шаблонов блоков
const getSizeOptions = (blockType: BlockType, blockTemplate: string) => {
  // Для круглых блоков
  if (blockTemplate === 'circle') {
    return [
      {
        type: 'small-circle',
        label: 'Маленький',
        description: 'круг',
        width: 1,
        height: 1,
        icon: (isSelected: boolean) => (
          <Paper 
            elevation={0} 
            sx={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : '#ddd',
              borderRadius: '50%'
            }} 
          />
        )
      },
      {
        type: 'medium-circle',
        label: 'Средний',
        description: 'круг',
        width: 2,
        height: 2,
        icon: (isSelected: boolean) => (
          <Paper 
            elevation={0} 
            sx={{ 
              width: '60px', 
              height: '60px', 
              backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : '#ddd',
              borderRadius: '50%'
            }} 
          />
        )
      },
      {
        type: 'large-circle',
        label: 'Большой',
        description: 'круг',
        width: 3,
        height: 3,
        icon: (isSelected: boolean) => (
          <Paper 
            elevation={0} 
            sx={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : '#ddd',
              borderRadius: '50%'
            }} 
          />
        )
      }
    ];
  }
  
  // Для полукруглых блоков
  if (blockTemplate === 'semicircle') {
    return [
      {
        type: 'small-semicircle',
        label: 'Маленький',
        description: 'полукруг',
        width: 2,
        height: 1,
        icon: (isSelected: boolean) => (
          <Paper 
            elevation={0} 
            sx={{ 
              width: '80px', 
              height: '40px', 
              backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : '#ddd',
              borderRadius: '40px 40px 0 0'
            }} 
          />
        )
      },
      {
        type: 'medium-semicircle',
        label: 'Средний',
        description: 'полукруг',
        width: 3,
        height: 1.5,
        icon: (isSelected: boolean) => (
          <Paper 
            elevation={0} 
            sx={{ 
              width: '100px', 
              height: '50px', 
              backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : '#ddd',
              borderRadius: '50px 50px 0 0'
            }} 
          />
        )
      },
      {
        type: 'large-semicircle',
        label: 'Большой',
        description: 'полукруг',
        width: 3,
        height: 2,
        icon: (isSelected: boolean) => (
          <Paper 
            elevation={0} 
            sx={{ 
              width: '120px', 
              height: '60px', 
              backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : '#ddd',
              borderRadius: '60px 60px 0 0'
            }} 
          />
        )
      }
    ];
  }
  
  // Для квадратных блоков
  if (blockTemplate === 'square') {
    return [
      {
        type: 'small-square',
        label: 'Маленький',
        description: 'квадрат',
        width: 1,
        height: 1,
        icon: (isSelected: boolean) => (
          <Paper 
            elevation={0} 
            sx={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : '#ddd',
              borderRadius: '4px'
            }} 
          />
        )
      },
      {
        type: 'medium-square',
        label: 'Средний',
        description: 'квадрат',
        width: 2,
        height: 2,
        icon: (isSelected: boolean) => (
          <Paper 
            elevation={0} 
            sx={{ 
              width: '60px', 
              height: '60px', 
              backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : '#ddd',
              borderRadius: '4px'
            }} 
          />
        )
      },
      {
        type: 'large-square',
        label: 'Большой',
        description: 'квадрат',
        width: 3,
        height: 3,
        icon: (isSelected: boolean) => (
          <Paper 
            elevation={0} 
            sx={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : '#ddd',
              borderRadius: '4px'
            }} 
          />
        )
      }
    ];
  }

  // Для прямоугольных блоков и блоков по умолчанию
  return [
    {
      type: BlockSizeType.SQUARE,
      label: 'Квадрат',
      description: '1x1',
      width: 1,
      height: 1,
      icon: (isSelected: boolean) => (
        <Paper 
          elevation={0} 
          sx={{ 
            width: '50px', 
            height: '50px', 
            backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
            border: isSelected ? '2px solid' : '1px solid',
            borderColor: isSelected ? 'primary.main' : '#ddd',
            borderRadius: 1
          }} 
        />
      )
    },
    {
      type: BlockSizeType.MEDIUM,
      label: 'Средний',
      description: '2x1',
      width: 2,
      height: 1,
      icon: (isSelected: boolean) => (
        <Paper 
          elevation={0} 
          sx={{ 
            width: '80px', 
            height: '50px', 
            backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
            border: isSelected ? '2px solid' : '1px solid',
            borderColor: isSelected ? 'primary.main' : '#ddd',
            borderRadius: 1
          }} 
        />
      )
    },
    {
      type: BlockSizeType.THIN_FULL,
      label: 'Тонкий',
      description: '3x1',
      width: 3,
      height: 1,
      icon: (isSelected: boolean) => (
        <Paper 
          elevation={0} 
          sx={{ 
            width: '120px', 
            height: '50px', 
            backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
            border: isSelected ? '2px solid' : '1px solid',
            borderColor: isSelected ? 'primary.main' : '#ddd',
            borderRadius: 1
          }} 
        />
      )
    },
    {
      type: BlockSizeType.WIDE_FULL,
      label: 'Широкий',
      description: '3x2',
      width: 3,
      height: 2,
      icon: (isSelected: boolean) => (
        <Paper 
          elevation={0} 
          sx={{ 
            width: '120px', 
            height: '80px', 
            backgroundColor: isSelected ? 'primary.light' : '#f0f0f0',
            border: isSelected ? '2px solid' : '1px solid',
            borderColor: isSelected ? 'primary.main' : '#ddd',
            borderRadius: 1
          }} 
        />
      )
    }
  ];
};

interface BlockSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  block: Block | null;
  onUpdateBlock: (changes: Partial<Block>) => void;
  isNewBlock?: boolean;
  onCancelChanges?: () => void; // переименовали для ясности
  onApplyChanges?: () => void;
}

const BlockSettingsDialog: React.FC<BlockSettingsDialogProps> = ({
  open,
  onClose,
  block,
  onUpdateBlock,
  isNewBlock,
  onCancelChanges,
  onApplyChanges
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showBgColorPicker, setShowBgColorPicker] = useState<boolean>(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState<boolean>(false);
  
  // Локальное состояние для редактируемого блока
  const [localBlock, setLocalBlock] = useState<Block | null>(null);
  
  // Инициализируем локальное состояние при открытии диалога
  useEffect(() => {
    if (open && block) {
      // Создаем глубокую копию блока для локального редактирования
      setLocalBlock(JSON.parse(JSON.stringify(block)));
    }
  }, [open, block]);
  
  // Отдельный эффект для сброса вкладки ТОЛЬКО при открытии/закрытии диалога, 
  // но не при изменении блока
  useEffect(() => {
    if (open) {
      // Сбрасываем активную вкладку только при первом открытии
      setActiveTab(0);
    }
  }, [open]);
  
  // Если блок null или локальный блок не инициализирован, не рендерим ничего
  if (!block || !localBlock) return null;
  
  // Обработчик изменения стиля блока - только локально
  const handleStyleChange = (styleChanges: Partial<Block['style']>) => {
    if (!localBlock) return;
    
    // Обновляем локальное состояние
    const updatedStyle = {
      ...localBlock.style,
      ...styleChanges
    };
    
    setLocalBlock(prev => {
      if (!prev) return null;
      return {
        ...prev,
        style: updatedStyle
      };
    });
    
    // Применяем изменения сразу к блоку для отображения в реальном времени
    onUpdateBlock({
      style: updatedStyle
    });
  };

  // Обработчик изменения содержимого блока - только локально
  const handleContentChange = (contentChanges: Partial<Block['content']>) => {
    if (!localBlock) return;
    
    // Обновляем локальное состояние
    const updatedContent = {
      ...localBlock.content,
      ...contentChanges
    };
    
    setLocalBlock(prev => {
      if (!prev) return null;
      return {
        ...prev,
        content: updatedContent
      };
    });
    
    // Применяем изменения сразу к блоку для отображения в реальном времени  
    onUpdateBlock({
      content: updatedContent
    });
  };

  // Обработчик для текстовых полей
  const handleTextFieldChange = (field: string, value: string) => {
    if (field === 'title' || field === 'text') {
      handleContentChange({ [field]: value });
    } else if (field.startsWith('profileInfo.')) {
      const profileField = field.split('.')[1];
      const updatedProfileInfo = {
        ...localBlock.content.profileInfo,
        [profileField]: value
      };
      handleContentChange({ profileInfo: updatedProfileInfo });
    }
  };

  // Обработчик изменения социальной сети
  const handleSocialNetworkChange = (index: number, field: string, value: string) => {
    if (localBlock.content.socialNetworks) {
      const updatedNetworks = [...localBlock.content.socialNetworks];
      updatedNetworks[index] = {
        ...updatedNetworks[index],
        [field]: value
      };
      handleContentChange({ socialNetworks: updatedNetworks });
    }
  };

  // Обработчик кнопки применения изменений 
  const handleApply = () => {
    console.log('Нажата кнопка Применить');
    if (onApplyChanges) {
      console.log('Вызываем обработчик применения изменений');
      onApplyChanges();
    } else {
      console.log('ОШИБКА: Обработчик применения изменений не передан!');
    }
    onClose();
  };

  // Обработчик кнопки отмены
  const handleCancel = () => {
    console.log('Нажата кнопка Отмена');
    
    // Вызываем функцию отмены, чтобы восстановить предыдущее состояние
    if (onCancelChanges) {
      console.log('Вызываем обработчик отмены');
      onCancelChanges();
    } else {
      console.log('ОШИБКА: Обработчик отмены не передан!');
    }
    
    // Закрываем панель настроек
    onClose();
  };

  // Функция для рендеринга редактора текстового блока
  const renderTextBlockEditor = () => {
    return (
      <Box sx={{ mt: 2 }}>
        {localBlock.template !== 'semicircle' && (
          <TextField
            fullWidth
            label="Заголовок"
            variant="outlined"
            value={localBlock.content.title || ''}
            onChange={(e) => handleTextFieldChange('title', e.target.value)}
            sx={{ mb: 2 }}
          />
        )}
        <TextField
          fullWidth
          label="Текст"
          variant="outlined"
          multiline
          rows={4}
          value={localBlock.content.text || ''}
          onChange={(e) => handleTextFieldChange('text', e.target.value)}
        />
      </Box>
    );
  };

  // Функция для рендеринга редактора блока профиля
  const renderProfileBlockEditor = () => {
    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Полное имя"
              variant="outlined"
              value={localBlock.content.profileInfo?.fullName || ''}
              onChange={(e) => handleTextFieldChange('profileInfo.fullName', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Дата рождения"
              variant="outlined"
              value={localBlock.content.profileInfo?.birthDate || ''}
              onChange={(e) => handleTextFieldChange('profileInfo.birthDate', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Дата смерти"
              variant="outlined"
              value={localBlock.content.profileInfo?.deathDate || ''}
              onChange={(e) => handleTextFieldChange('profileInfo.deathDate', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Описание"
              variant="outlined"
              multiline
              rows={3}
              value={localBlock.content.profileInfo?.description || ''}
              onChange={(e) => handleTextFieldChange('profileInfo.description', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Религия"
              variant="outlined"
              value={localBlock.content.profileInfo?.religion || ''}
              onChange={(e) => handleTextFieldChange('profileInfo.religion', e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Функция для рендеринга редактора блока семейного древа
  const renderFamilyTreeBlockEditor = () => {
    const familyMembers = localBlock.content.familyMembers || [];
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" gutterBottom>
          В блоке семейного древа вы можете добавлять членов семьи и указывать их родственные связи.
        </Typography>
        
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mt: 2, 
            mb: 3, 
            borderRadius: 1, 
            backgroundColor: '#f8f9fa',
            border: '1px solid #e0e0e0'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Как пользоваться семейным древом:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Нажмите на сам блок, чтобы добавить первого человека
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Для добавления связей используйте кнопки на карточках людей
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Для быстрого добавления используйте кнопки по краям блока
            </Typography>
            <Typography component="li" variant="body2">
              Ожидающие подтверждения связи отмечены красным
            </Typography>
          </Box>
        </Paper>
        
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          Добавленные люди ({familyMembers.length})
        </Typography>
        
        {familyMembers.length > 0 ? (
          <Box sx={{ 
            maxHeight: '250px', 
            overflowY: 'auto', 
            border: '1px solid #eee', 
            borderRadius: 1,
            p: 1
          }}>
            {familyMembers.map((member, index) => (
              <Box 
                key={member.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 1,
                  borderBottom: index < familyMembers.length - 1 ? '1px solid #eee' : 'none'
                }}
              >
                <Box 
                  component="img" 
                  src={member.photo || '/placeholder-person.png'} 
                  alt={member.fullName}
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    mr: 2,
                    objectFit: 'cover'
                  }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {member.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {member.relationshipType && member.relationshipType === 'parent' ? 'Родитель' : 
                     member.relationshipType === 'child' ? 'Ребенок' : 
                     member.relationshipType === 'spouse' ? 'Супруг(а)' : 
                     member.relationshipType === 'sibling' ? 'Брат/Сестра' : 'Не указано'}
                  </Typography>
                </Box>
                {!member.isApproved && (
                  <Chip 
                    label="Ожидает" 
                    size="small" 
                    color="warning"
                    sx={{ mr: 1 }}
                  />
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary" align="center" sx={{ p: 2, borderRadius: 1, bgcolor: '#f5f5f5' }}>
            Пока не добавлено ни одного человека
          </Typography>
        )}
        
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
          onClick={() => {
            // Закрываем диалог настроек
            onClose();
            // После закрытия диалога пользователь сможет кликнуть на блок,
            // чтобы начать редактирование
          }}
        >
          Редактировать семейное древо
        </Button>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Для настройки связей и добавления людей нажмите на блок семейного древа
        </Typography>
      </Box>
    );
  };

  // Функция для рендеринга редактора блока социальных сетей
  const renderSocialBlockEditor = () => {
    if (localBlock.template === 'circle') {
      // Для одиночной соцсети
      return (
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Социальная сеть</InputLabel>
            <Select
              value={localBlock.content.socialType || SocialNetworkType.VK}
              onChange={(e) => handleContentChange({ socialType: e.target.value as SocialNetworkType })}
              label="Социальная сеть"
            >
              <MenuItem value={SocialNetworkType.VK}>ВКонтакте</MenuItem>
              <MenuItem value={SocialNetworkType.TELEGRAM}>Телеграм</MenuItem>
              <MenuItem value={SocialNetworkType.ODNOKLASSNIKI}>Одноклассники</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Ссылка на профиль"
            variant="outlined"
            value={localBlock.content.socialUrl || ''}
            onChange={(e) => handleContentChange({ socialUrl: e.target.value })}
          />
        </Box>
      );
    } else {
      // Для нескольких соцсетей
      const networks = localBlock.content.socialNetworks || [];
      
      return (
        <Box sx={{ mt: 2 }}>
          {networks.map((network, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Соцсеть {index + 1}</Typography>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel>Тип</InputLabel>
                <Select
                  value={network.type}
                  onChange={(e) => handleSocialNetworkChange(index, 'type', e.target.value as SocialNetworkType)}
                  label="Тип"
                >
                  <MenuItem value={SocialNetworkType.VK}>ВКонтакте</MenuItem>
                  <MenuItem value={SocialNetworkType.TELEGRAM}>Телеграм</MenuItem>
                  <MenuItem value={SocialNetworkType.ODNOKLASSNIKI}>Одноклассники</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Ссылка"
                variant="outlined"
                value={network.url}
                onChange={(e) => handleSocialNetworkChange(index, 'url', e.target.value)}
              />
            </Box>
          ))}
        </Box>
      );
    }
  };

  // Функция для рендеринга контента в зависимости от типа блока
  const renderBlockContentEditor = () => {
    switch (localBlock.type) {
      case BlockType.TEXT:
        return renderTextBlockEditor();
      case BlockType.PROFILE:
        return renderProfileBlockEditor();
      case BlockType.SOCIAL:
        return renderSocialBlockEditor();
      case BlockType.FAMILY_TREE:
        return renderFamilyTreeBlockEditor();
      // Для других типов блоков можно добавить свои редакторы
      default:
        return (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Настройте внешний вид блока с помощью параметров оформления
          </Typography>
        );
    }
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={handleCancel}
      sx={{
        '& .MuiDrawer-paper': {
          width: 360,
          boxSizing: 'border-box',
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'white'
        }
      }}
      hideBackdrop={true}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%' 
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          p: 2
        }}>
          <Typography variant="h6">Оформление блока</Typography>
          <IconButton aria-label="close" onClick={handleCancel} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Оформление" />
          <Tab label="Содержимое" />
        </Tabs>
        
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 3
        }}>
          {activeTab === 0 ? (
            // Вкладка оформления
            <>
              {/* Секция цвета фона */}
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                Цвет фона
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  {predefinedColors.background.map((color) => (
                    <Grid item key={color}>
                      <Tooltip title={color}>
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            backgroundColor: color,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            border: localBlock.style.backgroundColor === color 
                              ? `2px solid ${theme.palette.primary.main}` 
                              : '1px solid #e0e0e0',
                            '&:hover': {
                              boxShadow: '0 0 0 2px rgba(0,0,0,0.1)'
                            }
                          }}
                          onClick={() => handleStyleChange({ backgroundColor: color })}
                        />
                      </Tooltip>
                    </Grid>
                  ))}
                  <Grid item>
                    <Tooltip title="Выбрать произвольный цвет">
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: '1px solid #e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                          '&:hover': {
                            boxShadow: '0 0 0 2px rgba(0,0,0,0.1)'
                          }
                        }}
                        onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                      >
                        <FormatColorFillIcon sx={{ fontSize: 16, color: 'white' }} />
                      </Box>
                    </Tooltip>
                  </Grid>
                </Grid>
                
                {/* Произвольный выбор цвета фона */}
                {showBgColorPicker && (
                  <Box sx={{ mt: 2, mb: 2, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 2 }}>
                      <IconButton size="small" onClick={() => setShowBgColorPicker(false)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <SketchPicker
                      color={localBlock.style.backgroundColor}
                      onChange={(color) => handleStyleChange({ backgroundColor: color.hex })}
                      disableAlpha={false}
                      presetColors={predefinedColors.background}
                      width="100%"
                    />
                  </Box>
                )}
              </Box>
              
              {/* Секция цвета текста */}
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                Цвет текста
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  {predefinedColors.text.map((color) => (
                    <Grid item key={color}>
                      <Tooltip title={color}>
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            backgroundColor: color,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            border: localBlock.style.color === color 
                              ? `2px solid ${theme.palette.primary.main}` 
                              : '1px solid #e0e0e0',
                            '&:hover': {
                              boxShadow: '0 0 0 2px rgba(0,0,0,0.1)'
                            }
                          }}
                          onClick={() => handleStyleChange({ color })}
                        />
                      </Tooltip>
                    </Grid>
                  ))}
                  <Grid item>
                    <Tooltip title="Выбрать произвольный цвет">
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: '1px solid #e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                          '&:hover': {
                            boxShadow: '0 0 0 2px rgba(0,0,0,0.1)'
                          }
                        }}
                        onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                      >
                        <TextFormatIcon sx={{ fontSize: 16, color: 'white' }} />
                      </Box>
                    </Tooltip>
                  </Grid>
                </Grid>
                
                {/* Произвольный выбор цвета текста */}
                {showTextColorPicker && (
                  <Box sx={{ mt: 2, mb: 2, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 2 }}>
                      <IconButton size="small" onClick={() => setShowTextColorPicker(false)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <SketchPicker
                      color={localBlock.style.color}
                      onChange={(color) => handleStyleChange({ color: color.hex })}
                      disableAlpha={false}
                      presetColors={predefinedColors.text}
                      width="100%"
                    />
                  </Box>
                )}
              </Box>
              
              {/* Секция интенсивности тени */}
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                Интенсивность тени
              </Typography>
              <Box sx={{ px: 1, mb: 3 }}>
                <Slider
                  value={
                    localBlock.style.shadowIntensity === 'none' ? 0 :
                    localBlock.style.shadowIntensity === 'light' ? 1 :
                    localBlock.style.shadowIntensity === 'medium' ? 2 : 3
                  }
                  step={1}
                  marks
                  min={0}
                  max={3}
                  valueLabelDisplay="off"
                  onChange={(_, value) => {
                    const intensity = 
                      value === 0 ? 'none' :
                      value === 1 ? 'light' :
                      value === 2 ? 'medium' : 'strong';
                    handleStyleChange({ shadowIntensity: intensity });
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">Нет</Typography>
                  <Typography variant="caption">Максимальная</Typography>
                </Box>
              </Box>
            </>
          ) : (
            // Вкладка содержимого
            renderBlockContentEditor()
          )}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          p: 2, 
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button onClick={handleCancel}>
            Отмена
          </Button>
          <Button 
            variant="contained" 
            startIcon={<CheckIcon />}
            onClick={handleApply}
          >
            Применить
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default BlockSettingsDialog; 