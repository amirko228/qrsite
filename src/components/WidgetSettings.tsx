import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Grid,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  FormatColorFill as ColorIcon,
  FormatSize as SizeIcon,
  Straighten as DimensionsIcon,
  Palette as ThemeIcon,
  Opacity as OpacityIcon,
  BorderAll as BorderIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { SketchPicker } from '../utils/reactColorTypes';

// Интерфейс для виджета, который мы настраиваем
interface WidgetWithLayout {
  id: string;
  type: 'notion-block' | 'notion-profile' | 'photo-carousel' | 'gallery-database';
  content: any;
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

interface WidgetSettingsProps {
  open: boolean;
  onClose: () => void;
  widget: WidgetWithLayout | null;
  onUpdate: (updatedWidget: WidgetWithLayout) => void;
}

/**
 * Компонент для настройки параметров виджета
 */
const WidgetSettings: React.FC<WidgetSettingsProps> = ({
  open,
  onClose,
  widget,
  onUpdate
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorTarget, setColorTarget] = useState<'background' | 'text' | 'border'>('background');
  
  // Если виджет не выбран, не показываем ничего
  if (!widget) return null;
  
  // Инициализируем style, если его нет
  const widgetStyle = widget.style || {};
  
  // Обработчик изменения вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  
  // Обработчик изменения размера (для вкладки размеров)
  const handleSizeChange = (property: 'w' | 'h', value: number) => {
    if (!widget.layout) return;
    
    const updatedLayout = {
      ...widget.layout,
      [property]: value
    };
    
    onUpdate({
      ...widget,
      layout: updatedLayout
    });
  };
  
  // Обработчик изменения минимального размера
  const handleMinSizeChange = (property: 'minW' | 'minH', value: number) => {
    if (!widget.layout) return;
    
    const updatedLayout = {
      ...widget.layout,
      [property]: value
    };
    
    onUpdate({
      ...widget,
      layout: updatedLayout
    });
  };
  
  // Обработчик изменения стиля
  const handleStyleChange = (property: keyof typeof widgetStyle, value: any) => {
    const updatedStyle = {
      ...widgetStyle,
      [property]: value
    };
    
    onUpdate({
      ...widget,
      style: updatedStyle
    });
  };
  
  // Обработчик изменения цвета
  const handleColorChange = (color: any) => {
    switch (colorTarget) {
      case 'background':
        handleStyleChange('backgroundColor', color.hex);
        break;
      case 'text':
        handleStyleChange('color', color.hex);
        break;
      case 'border':
        handleStyleChange('borderColor', color.hex);
        break;
    }
  };
  
  // Открытие выбора цвета
  const openColorPicker = (target: 'background' | 'text' | 'border') => {
    setColorTarget(target);
    setShowColorPicker(true);
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Настройки виджета
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab icon={<DimensionsIcon />} label="Размеры" />
            <Tab icon={<ThemeIcon />} label="Внешний вид" />
            <Tab icon={<BorderIcon />} label="Границы" />
          </Tabs>
        </Box>
        
        {/* Вкладка размеров */}
        {currentTab === 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>Размеры виджета</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography id="width-slider" gutterBottom>
                  Ширина: {widget.layout?.w || 4} колонок
                </Typography>
                <Slider
                  value={widget.layout?.w || 4}
                  onChange={(_, value) => handleSizeChange('w', value as number)}
                  aria-labelledby="width-slider"
                  step={1}
                  marks
                  min={1}
                  max={12}
                />
                
                <Typography id="min-width-slider" gutterBottom sx={{ mt: 2 }}>
                  Минимальная ширина: {widget.layout?.minW || 1} колонок
                </Typography>
                <Slider
                  value={widget.layout?.minW || 1}
                  onChange={(_, value) => handleMinSizeChange('minW', value as number)}
                  aria-labelledby="min-width-slider"
                  step={1}
                  marks
                  min={1}
                  max={6}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography id="height-slider" gutterBottom>
                  Высота: {widget.layout?.h || 4} строк
                </Typography>
                <Slider
                  value={widget.layout?.h || 4}
                  onChange={(_, value) => handleSizeChange('h', value as number)}
                  aria-labelledby="height-slider"
                  step={1}
                  marks
                  min={1}
                  max={12}
                />
                
                <Typography id="min-height-slider" gutterBottom sx={{ mt: 2 }}>
                  Минимальная высота: {widget.layout?.minH || 1} строк
                </Typography>
                <Slider
                  value={widget.layout?.minH || 1}
                  onChange={(_, value) => handleMinSizeChange('minH', value as number)}
                  aria-labelledby="min-height-slider"
                  step={1}
                  marks
                  min={1}
                  max={6}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={widget.layout?.isDraggable !== false}
                    onChange={(e) => {
                      if (!widget.layout) return;
                      const updatedLayout = {
                        ...widget.layout,
                        isDraggable: e.target.checked
                      };
                      onUpdate({
                        ...widget,
                        layout: updatedLayout
                      });
                    }}
                  />
                }
                label="Разрешить перетаскивание"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={widget.layout?.isResizable !== false}
                    onChange={(e) => {
                      if (!widget.layout) return;
                      const updatedLayout = {
                        ...widget.layout,
                        isResizable: e.target.checked
                      };
                      onUpdate({
                        ...widget,
                        layout: updatedLayout
                      });
                    }}
                  />
                }
                label="Разрешить изменение размера"
              />
            </Box>
          </Box>
        )}
        
        {/* Вкладка внешнего вида */}
        {currentTab === 1 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>Внешний вид</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="body2">Цвет фона:</Typography>
                    <Box 
                      sx={{ 
                        ml: 2, 
                        width: 36, 
                        height: 36, 
                        borderRadius: 1, 
                        bgcolor: widgetStyle.backgroundColor || '#ffffff',
                        border: '1px solid #ddd',
                        cursor: 'pointer'
                      }} 
                      onClick={() => openColorPicker('background')}
                    />
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2">Цвет текста:</Typography>
                    <Box 
                      sx={{ 
                        ml: 2, 
                        width: 36, 
                        height: 36, 
                        borderRadius: 1, 
                        bgcolor: widgetStyle.color || '#000000',
                        border: '1px solid #ddd',
                        cursor: 'pointer'
                      }} 
                      onClick={() => openColorPicker('text')}
                    />
                  </Box>
                </Box>
                
                <Typography id="opacity-slider" gutterBottom>
                  Прозрачность: {widgetStyle.opacity || 1}
                </Typography>
                <Slider
                  value={widgetStyle.opacity || 1}
                  onChange={(_, value) => handleStyleChange('opacity', value as number)}
                  aria-labelledby="opacity-slider"
                  step={0.05}
                  min={0.1}
                  max={1}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography id="padding-slider" gutterBottom>
                  Внутренний отступ: {widgetStyle.padding || 16}px
                </Typography>
                <Slider
                  value={widgetStyle.padding || 16}
                  onChange={(_, value) => handleStyleChange('padding', value as number)}
                  aria-labelledby="padding-slider"
                  step={2}
                  min={0}
                  max={32}
                />
                
                <Typography id="radius-slider" gutterBottom sx={{ mt: 2 }}>
                  Скругление углов: {widgetStyle.borderRadius || 4}px
                </Typography>
                <Slider
                  value={widgetStyle.borderRadius || 4}
                  onChange={(_, value) => handleStyleChange('borderRadius', value as number)}
                  aria-labelledby="radius-slider"
                  step={2}
                  min={0}
                  max={32}
                />
              </Grid>
            </Grid>
            
            {showColorPicker && (
              <Box sx={{ mt: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">
                    {colorTarget === 'background' && 'Выберите цвет фона'}
                    {colorTarget === 'text' && 'Выберите цвет текста'}
                    {colorTarget === 'border' && 'Выберите цвет границы'}
                  </Typography>
                  <Button size="small" onClick={() => setShowColorPicker(false)}>
                    Закрыть
                  </Button>
                </Box>
                <SketchPicker
                  color={
                    colorTarget === 'background' 
                      ? widgetStyle.backgroundColor || '#ffffff' 
                      : colorTarget === 'text' 
                        ? widgetStyle.color || '#000000'
                        : widgetStyle.borderColor || '#000000'
                  }
                  onChange={handleColorChange}
                  width="100%"
                />
              </Box>
            )}
          </Box>
        )}
        
        {/* Вкладка границ */}
        {currentTab === 2 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>Границы</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography id="border-width-slider" gutterBottom>
                  Толщина границы: {widgetStyle.borderWidth || 0}px
                </Typography>
                <Slider
                  value={widgetStyle.borderWidth || 0}
                  onChange={(_, value) => handleStyleChange('borderWidth', value as number)}
                  aria-labelledby="border-width-slider"
                  step={1}
                  min={0}
                  max={10}
                />
                
                <Box display="flex" alignItems="center" mt={2}>
                  <Typography variant="body2">Цвет границы:</Typography>
                  <Box 
                    sx={{ 
                      ml: 2, 
                      width: 36, 
                      height: 36, 
                      borderRadius: 1, 
                      bgcolor: widgetStyle.borderColor || '#000000',
                      border: '1px solid #ddd',
                      cursor: 'pointer'
                    }} 
                    onClick={() => openColorPicker('border')}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="border-style-label">Стиль границы</InputLabel>
                  <Select
                    labelId="border-style-label"
                    value={widgetStyle.borderStyle || 'solid'}
                    label="Стиль границы"
                    onChange={(e) => handleStyleChange('borderStyle', e.target.value)}
                  >
                    <MenuItem value="solid">Сплошная</MenuItem>
                    <MenuItem value="dashed">Пунктирная</MenuItem>
                    <MenuItem value="dotted">Точечная</MenuItem>
                    <MenuItem value="double">Двойная</MenuItem>
                    <MenuItem value="none">Без границы</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="box-shadow-label">Тень</InputLabel>
                  <Select
                    labelId="box-shadow-label"
                    value={widgetStyle.boxShadow || 'none'}
                    label="Тень"
                    onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
                  >
                    <MenuItem value="none">Без тени</MenuItem>
                    <MenuItem value="0 2px 5px rgba(0,0,0,0.1)">Легкая</MenuItem>
                    <MenuItem value="0 4px 8px rgba(0,0,0,0.15)">Средняя</MenuItem>
                    <MenuItem value="0 8px 16px rgba(0,0,0,0.2)">Сильная</MenuItem>
                    <MenuItem value="0 12px 24px rgba(0,0,0,0.3)">Очень сильная</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onClose}
        >
          Применить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WidgetSettings; 