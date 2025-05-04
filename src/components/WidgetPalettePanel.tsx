import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography, IconButton, Paper, Divider } from '@mui/material';
import { VisibilityOff, Add, TextFields, Image, Instagram, YouTube, AccountBox, FamilyRestroom } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Интерфейс для типа виджета
interface WidgetType {
  type: string;
  icon: React.ReactNode;
  label: string;
  category?: string;
}

// Интерфейс для компонента
interface WidgetPalettePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: string) => void;
  widgetTypes: WidgetType[];
}

// Стили для панели виджетов
const PaletteContainer = styled(motion.div)<{ $isOpen: boolean }>(({ theme, $isOpen }) => ({
  position: 'fixed',
  left: 0,
  top: 0,
  height: '100vh',
  width: 280,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 0 20px rgba(0, 0, 0, 0.15)',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const PanelHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '& .MuiTypography-root': {
    fontWeight: 600,
  },
  '& .MuiIconButton-root': {
    color: theme.palette.primary.contrastText,
  }
}));

const WidgetList = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.default,
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: theme.palette.grey[500],
  }
}));

const WidgetItem = styled(motion.div)<{ $bgColor?: string }>(({ theme, $bgColor = theme.palette.background.default }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.75, 2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: $bgColor,
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  '&:hover': {
    transform: 'translateX(5px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
  },
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1.5),
    color: theme.palette.primary.main,
    fontSize: '1.4rem',
  },
  '& .MuiTypography-root': {
    fontWeight: 500,
  }
}));

const ToggleButton = styled(IconButton)<{ $isOpen?: boolean }>(({ theme, $isOpen }) => ({
  position: 'fixed',
  left: $isOpen ? '280px' : '10px',
  top: '100px',
  zIndex: 1001,
  backgroundColor: theme.palette.primary.main,
  borderRadius: $isOpen ? '0 4px 4px 0' : '50%',
  boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.2)',
  padding: theme.spacing(1),
  height: 40,
  width: 40,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  [theme.breakpoints.down('sm')]: {
    top: 'auto',
    bottom: '20px',
    right: '20px',
    left: 'auto',
    height: 48,
    width: 48,
    borderRadius: '50%',
  }
}));

// Массив цветов для различных типов виджетов
const widgetColors: Record<string, string> = {
  text: '#f5f5f5',
  photo: '#e3f2fd',
  social: '#e0f7fa',
  youtube: '#fff8e1',
  profile: '#f1f8e9',
  family: '#fbe9e7',
};

// Компонент палитры виджетов
const WidgetPalettePanel: React.FC<WidgetPalettePanelProps> = ({ 
  isOpen, 
  onClose, 
  onAddWidget,
  widgetTypes
}) => {
  // Получение цвета фона для виджета
  const getWidgetColor = (type: string): string => {
    const baseType = type.split('_')[0];
    return widgetColors[baseType] || '#ffffff';
  };

  // Варианты анимации для панели
  const panelVariants = {
    open: { 
      x: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        staggerChildren: 0.07
      } 
    },
    closed: { 
      x: -280, 
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        staggerChildren: 0.05,
        staggerDirection: -1
      } 
    }
  };

  // Варианты анимации для элементов
  const itemVariants = {
    open: { 
      opacity: 1, 
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    },
    closed: { 
      opacity: 0, 
      x: -20,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <PaletteContainer 
            $isOpen={isOpen}
            initial="closed"
            animate="open"
            exit="closed"
            variants={panelVariants}
          >
            <PanelHeader>
              <Typography variant="subtitle1">
                Библиотека блоков
              </Typography>
              <IconButton size="small" onClick={onClose}>
                <VisibilityOff fontSize="small" />
              </IconButton>
            </PanelHeader>
            
            <Divider />
            
            <WidgetList>
              {widgetTypes.map((widget, index) => (
                <WidgetItem
                  key={widget.type}
                  $bgColor={getWidgetColor(widget.type)}
                  onClick={() => onAddWidget(widget.type)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  variants={itemVariants}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.1}
                >
                  {widget.icon}
                  <Typography variant="body2">{widget.label}</Typography>
                </WidgetItem>
              ))}
            </WidgetList>
          </PaletteContainer>
        )}
      </AnimatePresence>
      
      <ToggleButton 
        $isOpen={isOpen}
        onClick={onClose}
        aria-label={isOpen ? "Скрыть панель" : "Показать панель"}
      >
        {isOpen ? <VisibilityOff /> : <Add />}
      </ToggleButton>
    </>
  );
};

export default WidgetPalettePanel; 