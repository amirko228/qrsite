import React, { useState } from 'react';
import {
  Paper,
  Box,
  Tabs,
  Tab,
  TextField,
  Typography,
  InputLabel,
  Button,
  Grid,
  Slider,
  Divider,
  IconButton,
  Stack,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  useTheme,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Switch
} from '@mui/material';
import { RgbaColorPicker } from 'react-colorful';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ShareIcon from '@mui/icons-material/Share';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import WidthNormalIcon from '@mui/icons-material/WidthNormal';
import HeightIcon from '@mui/icons-material/Height';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Block, BlockContent, FamilyMember } from '../types';

// Интерфейс для цвета в формате RGBA
interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

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

// Предустановленные цвета
const predefinedColors = {
  background: [
    { name: 'Белый', value: '#FFFFFF' },
    { name: 'Серый', value: '#CCCCCC' },
    { name: 'Бежевый', value: '#F5F5DC' },
    { name: 'Темно-синий', value: '#1A3C6E' },
    { name: 'Коричневый', value: '#8B4513' },
    { name: 'Красный', value: '#FF4B4B' },
    { name: 'Голубой', value: '#87CEFA' },
    { name: 'Черный', value: '#000000' }
  ],
  text: [
    { name: 'Черный', value: '#000000' },
    { name: 'Белый', value: '#FFFFFF' },
    { name: 'Серый', value: '#666666' },
    { name: 'Темно-синий', value: '#1A3C6E' },
    { name: 'Красный', value: '#FF4B4B' }
  ]
};

// Стили
const styles = {
  toolbar: {
    padding: 2,
    backgroundColor: '#f5f5f5',
    borderTop: '1px solid #e0e0e0',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8
  },
  formControl: {
    marginBottom: 2
  },
  colorBox: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    marginRight: '8px',
    border: '1px solid #ccc',
    cursor: 'pointer'
  },
  colorContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
    marginBottom: '16px'
  },
  colorOption: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid transparent',
    '&:hover': {
      transform: 'scale(1.1)'
    }
  },
  colorOptionSelected: {
    border: '2px solid #1976d2'
  },
  tabContent: {
    padding: 2
  },
  toggleButton: {
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '4px',
    minWidth: 'unset'
  },
  activeToggleButton: {
    backgroundColor: 'rgba(25, 118, 210, 0.08)'
  },
  colorPicker: {
    width: '200px',
    marginTop: '8px'
  },
  photoPreview: {
    width: '100%',
    height: '120px',
    objectFit: 'cover' as 'cover',
    borderRadius: '4px',
    marginBottom: 1
  },
  photoPlaceholder: {
    width: '100%',
    height: '120px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    border: '1px dashed #ccc',
    marginBottom: 1
  },
  saveButton: {
    marginTop: 2
  }
};

interface ToolbarPanelProps {
  block: Block;
  onUpdateBlock: (changes: Partial<Block>) => void;
  onClose: () => void;
}

const ToolbarPanel: React.FC<ToolbarPanelProps> = ({ block, onUpdateBlock, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importId, setImportId] = useState('');
  const [editMemberIndex, setEditMemberIndex] = useState<number | null>(null);
  const theme = useTheme();

  // Обработчик изменения содержимого блока
  const handleContentChange = (contentChanges: Partial<BlockContent>) => {
    onUpdateBlock({
      content: {
        ...block.content,
        ...contentChanges
      }
    });
  };

  // Обработчик изменения стиля блока
  const handleStyleChange = (styleChanges: Partial<Block['style']>) => {
    onUpdateBlock({
      style: {
        ...block.style,
        ...styleChanges
      }
    });
  };

  // Обработчик изменения размера блока
  const handleSizeChange = (sizeChanges: Partial<Block['size']>) => {
    onUpdateBlock({
      size: {
        ...block.size,
        ...sizeChanges
      }
    });
  };

  // Функция для изменения формы блока (изменяет шаблон)
  const handleTemplateChange = (template: string) => {
    onUpdateBlock({ template });
  };

  // Сохранение изменений и закрытие панели
  const handleSave = () => {
    onClose();
  };

  // Обработчик импорта члена семьи из сервиса
  const handleImportMember = () => {
    if (!importId.trim()) return;
    
    // Здесь должен быть запрос к API
    // Для демонстрации создаем заглушку
    const newMember: FamilyMember = {
      id: `imported-${Date.now()}`,
      fullName: `Импортированный (ID: ${importId})`,
      isApproved: false,
      birthDate: "2000-01-01"
    };
    
    handleContentChange({ 
      familyMembers: [...(block.content.familyMembers || []), newMember] 
    });
    
    setImportId('');
    setIsImportDialogOpen(false);
  };

  // Обработчик редактирования члена семьи
  const handleEditMember = (index: number, changes: Partial<FamilyMember>) => {
    if (!block.content.familyMembers) return;
    
    const updatedMembers = [...block.content.familyMembers];
    updatedMembers[index] = {
      ...updatedMembers[index],
      ...changes
    };
    
    handleContentChange({ familyMembers: updatedMembers });
  };

  // Отрисовка элементов управления в зависимости от типа блока
  const renderContentControls = () => {
    switch (block.type) {
      case 'text':
        return (
          <Box>
            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={6}
              label="Текст"
              value={block.content.text || ''}
              onChange={(e) => handleContentChange({ text: e.target.value })}
              sx={styles.formControl}
            />
          </Box>
        );
      case 'photo':
        return (
          <Box>
            {block.content.images && block.content.images.length > 0 ? (
              <Box sx={{ mb: 2 }}>
                <img 
                  src={block.content.images[0]} 
                  alt="Preview" 
                  style={styles.photoPreview} 
                />
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteIcon />}
                  size="small"
                  onClick={() => handleContentChange({ images: [] })}
                >
                  Удалить фото
                </Button>
              </Box>
            ) : (
              <Box sx={styles.photoPlaceholder}>
                <Button
                  variant="outlined"
                  startIcon={<AddPhotoAlternateIcon />}
                  onClick={() => {
                    // В реальном приложении здесь будет логика загрузки файла
                    // Для демонстрации используем заглушку с URL плейсхолдера
                    handleContentChange({ 
                      images: ['https://via.placeholder.com/300x200?text=Фото'] 
                    });
                  }}
                >
                  Добавить фото
                </Button>
              </Box>
            )}
            
            {block.template === 'grid' && (
              <FormControl fullWidth sx={styles.formControl}>
                <Select
                  value={2}
                  displayEmpty
                >
                  <MenuItem value={2}>2 колонки</MenuItem>
                  <MenuItem value={3}>3 колонки</MenuItem>
                  <MenuItem value={4}>4 колонки</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        );
      case 'video':
        return (
          <Box>
            <TextField
              fullWidth
              label="URL видео"
              placeholder="Вставьте ссылку на видео"
              value={block.content.videoUrl || ''}
              onChange={(e) => handleContentChange({ videoUrl: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon />
                  </InputAdornment>
                ),
              }}
              sx={styles.formControl}
            />
            <Typography variant="caption" color="textSecondary">
              Поддерживаются ссылки с YouTube, Vimeo, RuTube и других видеохостингов
            </Typography>
          </Box>
        );
      case 'social':
        return (
          <Box>
            <FormControl fullWidth sx={styles.formControl}>
              <Select
                value={block.template}
                onChange={(e) => onUpdateBlock({ template: e.target.value })}
                displayEmpty
              >
                <MenuItem value="vk">ВКонтакте</MenuItem>
                <MenuItem value="telegram">Телеграм</MenuItem>
                <MenuItem value="odnoklassniki">Одноклассники</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label={`Ссылка на ${
                block.template === 'vk' ? 'профиль ВКонтакте' :
                block.template === 'telegram' ? 'канал в Телеграм' :
                'профиль в Одноклассниках'
              }`}
              placeholder="https://"
              value={block.content.socialUrl || ''}
              onChange={(e) => handleContentChange({ socialUrl: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon />
                  </InputAdornment>
                ),
              }}
              sx={styles.formControl}
            />
          </Box>
        );
      case 'profile':
        return (
          <Box>
            <TextField
              fullWidth
              label="Полное имя"
              value={block.content.profileInfo?.fullName || ''}
              onChange={(e) => handleContentChange({ 
                profileInfo: { 
                  ...block.content.profileInfo,
                  fullName: e.target.value 
                } 
              })}
              sx={styles.formControl}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Дата рождения"
                  type="date"
                  value={block.content.profileInfo?.birthDate || ''}
                  onChange={(e) => handleContentChange({ 
                    profileInfo: { 
                      ...block.content.profileInfo,
                      birthDate: e.target.value 
                    } 
                  })}
                  InputLabelProps={{ shrink: true }}
                  sx={styles.formControl}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Дата смерти"
                  type="date"
                  value={block.content.profileInfo?.deathDate || ''}
                  onChange={(e) => handleContentChange({ 
                    profileInfo: { 
                      ...block.content.profileInfo,
                      deathDate: e.target.value 
                    } 
                  })}
                  InputLabelProps={{ shrink: true }}
                  sx={styles.formControl}
                />
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              label="Описание"
              value={block.content.profileInfo?.description || ''}
              onChange={(e) => handleContentChange({ 
                profileInfo: { 
                  ...block.content.profileInfo,
                  description: e.target.value 
                } 
              })}
              sx={styles.formControl}
            />
          </Box>
        );
      case 'familyTree':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Члены семьи
            </Typography>
            
            {(block.content.familyMembers || []).map((member, index) => (
              <Paper key={member.id} sx={{ p: 2, mb: 2, position: 'relative' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setEditMemberIndex(index)}
                    sx={{ mr: 1 }}
                  >
                    <TextFieldsIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const updatedMembers = [...(block.content.familyMembers || [])];
                      updatedMembers.splice(index, 1);
                      handleContentChange({ familyMembers: updatedMembers });
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    {member.photo ? (
                      <Box 
                        component="img" 
                        src={member.photo} 
                        alt={member.fullName}
                        sx={{ 
                          width: '100%', 
                          height: 'auto', 
                          aspectRatio: '1',
                          borderRadius: '50%',
                          objectFit: 'cover' 
                        }}
                      />
                    ) : (
                      <Box 
                        sx={{ 
                          width: '100%', 
                          aspectRatio: '1', 
                          backgroundColor: '#f0f0f0',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <AccountCircleIcon sx={{ fontSize: 40 }} />
                      </Box>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={<AddPhotoAlternateIcon />}
                      onClick={() => {
                        // В реальном приложении здесь будет логика загрузки файла
                        // Для демонстрации используем заглушку с URL плейсхолдера
                        handleEditMember(index, { 
                          photo: `https://via.placeholder.com/150?text=${encodeURIComponent(member.fullName)}` 
                        });
                      }}
                      sx={{ mt: 1 }}
                    >
                      Фото
                    </Button>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="subtitle1">{member.fullName}</Typography>
                    {member.birthDate && (
                      <Typography variant="body2">
                        {member.birthDate} {member.deathDate ? `- ${member.deathDate}` : ''}
                      </Typography>
                    )}
                    {!member.isApproved && (
                      <Typography variant="caption" color="error">
                        Ожидает подтверждения
                      </Typography>
                    )}
                    {member.socialLink && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <Link href={member.socialLink} target="_blank">
                          Профиль в соцсети
                        </Link>
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            ))}
            
            {/* Диалог редактирования члена семьи */}
            {editMemberIndex !== null && block.content.familyMembers && (
              <Dialog 
                open={editMemberIndex !== null} 
                onClose={() => setEditMemberIndex(null)}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>
                  Редактировать информацию
                </DialogTitle>
                <DialogContent>
                  <TextField
                    fullWidth
                    label="Полное имя"
                    value={block.content.familyMembers[editMemberIndex].fullName}
                    onChange={(e) => handleEditMember(editMemberIndex, { fullName: e.target.value })}
                    sx={{ mt: 2, mb: 2 }}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Дата рождения"
                        type="date"
                        value={block.content.familyMembers[editMemberIndex].birthDate || ''}
                        onChange={(e) => handleEditMember(editMemberIndex, { birthDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Дата смерти"
                        type="date"
                        value={block.content.familyMembers[editMemberIndex].deathDate || ''}
                        onChange={(e) => handleEditMember(editMemberIndex, { deathDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                  
                  <TextField
                    fullWidth
                    label="Ссылка на соцсеть"
                    value={block.content.familyMembers[editMemberIndex].socialLink || ''}
                    onChange={(e) => handleEditMember(editMemberIndex, { socialLink: e.target.value })}
                    sx={{ mt: 2 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={block.content.familyMembers[editMemberIndex].isApproved}
                        onChange={(e) => handleEditMember(editMemberIndex, { isApproved: e.target.checked })}
                      />
                    }
                    label="Подтверждено"
                    sx={{ mt: 2 }}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setEditMemberIndex(null)}>Отмена</Button>
                  <Button 
                    variant="contained" 
                    onClick={() => setEditMemberIndex(null)}
                  >
                    Сохранить
                  </Button>
                </DialogActions>
              </Dialog>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={() => {
                  // Добавление члена семьи вручную
                  const newMember: FamilyMember = {
                    id: `member-${Date.now()}`,
                    fullName: 'Новый член семьи',
                    isApproved: true
                  };
                  
                  handleContentChange({ 
                    familyMembers: [...(block.content.familyMembers || []), newMember] 
                  });
                  // Сразу открываем редактирование нового члена
                  const newIndex = (block.content.familyMembers || []).length;
                  setEditMemberIndex(newIndex);
                }}
              >
                Добавить вручную
              </Button>
              
              <Button 
                variant="outlined" 
                startIcon={<CloudDownloadIcon />}
                onClick={() => setIsImportDialogOpen(true)}
              >
                Импорт из сервиса
              </Button>
            </Box>
            
            {/* Диалог импорта */}
            <Dialog 
              open={isImportDialogOpen} 
              onClose={() => setIsImportDialogOpen(false)}
              maxWidth="xs"
              fullWidth
            >
              <DialogTitle>Импорт из сервиса</DialogTitle>
              <DialogContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Введите ID или имя пользователя для импорта данных. После импорта пользователю будет отправлен запрос на подтверждение.
                </Typography>
                <TextField
                  fullWidth
                  label="ID пользователя"
                  value={importId}
                  onChange={(e) => setImportId(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsImportDialogOpen(false)}>Отмена</Button>
                <Button 
                  variant="contained" 
                  onClick={handleImportMember}
                  disabled={!importId.trim()}
                >
                  Импортировать
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        );
      default:
        return null;
    }
  };

  // Отрисовка настроек внешнего вида
  const renderStyleControls = () => {
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Цвета
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          Цвет фона
        </Typography>
        <Box sx={styles.colorContainer}>
          {predefinedColors.background.map((color) => (
            <Box
              key={color.value}
              sx={{
                ...styles.colorOption,
                backgroundColor: color.value,
                ...(block.style.backgroundColor === color.value && styles.colorOptionSelected)
              }}
              onClick={() => handleStyleChange({ backgroundColor: color.value })}
              title={color.name}
            />
          ))}
          {/* Кнопка для выбора произвольного цвета */}
          <Box
            sx={{
              ...styles.colorOption,
              background: 'linear-gradient(135deg, #f00, #0f0, #00f)',
              border: '2px dashed #666',
            }}
            onClick={() => setShowColorPicker('background')}
            title="Выбрать произвольный цвет"
          />
        </Box>
        
        <Typography variant="body2" gutterBottom>
          Цвет текста
        </Typography>
        <Box sx={styles.colorContainer}>
          {predefinedColors.text.map((color) => (
            <Box
              key={color.value}
              sx={{
                ...styles.colorOption,
                backgroundColor: color.value,
                ...(block.style.color === color.value && styles.colorOptionSelected)
              }}
              onClick={() => handleStyleChange({ color: color.value })}
              title={color.name}
            />
          ))}
          {/* Кнопка для выбора произвольного цвета */}
          <Box
            sx={{
              ...styles.colorOption,
              background: 'linear-gradient(135deg, #f00, #0f0, #00f)',
              border: '2px dashed #666',
            }}
            onClick={() => setShowColorPicker('text')}
            title="Выбрать произвольный цвет"
          />
        </Box>
        
        {/* Диалог выбора произвольного цвета */}
        <Dialog
          open={!!showColorPicker}
          onClose={() => setShowColorPicker(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            Выберите цвет
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setShowColorPicker(null)}
              aria-label="close"
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2 }}>
              <input
                type="color"
                value={showColorPicker === 'background' ? block.style.backgroundColor : block.style.color}
                onChange={(e) => {
                  if (showColorPicker === 'background') {
                    handleStyleChange({ backgroundColor: e.target.value });
                  } else {
                    handleStyleChange({ color: e.target.value });
                  }
                }}
                style={{ width: '100%', height: '40px' }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowColorPicker(null)}>Отмена</Button>
            <Button 
              variant="contained" 
              onClick={() => setShowColorPicker(null)}
            >
              Применить
            </Button>
          </DialogActions>
        </Dialog>
        
        <Divider sx={{ my: 2 }} />
            
        <Typography variant="subtitle2" gutterBottom>
          Границы
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Скругление углов
          </Typography>
          <Slider
            value={parseInt(block.style.borderRadius) || 0}
            min={0}
            max={50}
            step={1}
            onChange={(_, value) => handleStyleChange({ borderRadius: `${value}px` })}
            valueLabelDisplay="auto"
            disabled={block.type === 'text' && (block.template === 'circle' || block.template === 'semicircle')}
          />
        </Box>
      </Box>
    );
  };

  // Получение иконки для типа блока
  const getBlockTypeIcon = () => {
    switch (block.type) {
      case 'text':
        return <TextFieldsIcon />;
      case 'photo':
        return <ImageIcon />;
      case 'video':
        return <VideoLibraryIcon />;
      case 'social':
        return <ShareIcon />;
      case 'profile':
        return <AccountBoxIcon />;
      case 'familyTree':
        return <AccountTreeIcon />;
      default:
        return null;
    }
  };

  // Получение названия типа блока
  const getBlockTypeName = () => {
    switch (block.type) {
      case 'text':
        return 'Текстовый блок';
      case 'photo':
        return 'Фото';
      case 'video':
        return 'Видео';
      case 'social':
        return 'Социальные сети';
      case 'profile':
        return 'Информация профиля';
      case 'familyTree':
        return 'Семейное древо';
      default:
        return '';
    }
  };

  return (
    <Paper sx={styles.toolbar}>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={styles.closeButton}
      >
        <CloseIcon />
      </IconButton>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {getBlockTypeIcon()}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {getBlockTypeName()}
        </Typography>
      </Box>
      
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="Содержимое" />
        <Tab label="Внешний вид" />
      </Tabs>
      
      <Box sx={styles.tabContent}>
        {activeTab === 0 ? renderContentControls() : renderStyleControls()}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={styles.saveButton}
        >
          Сохранить
        </Button>
      </Box>
    </Paper>
  );
};

export default ToolbarPanel; 