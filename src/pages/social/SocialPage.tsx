import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Container, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Menu, MenuItem, FormControlLabel, Switch, Alert, AlertTitle, LinearProgress, Tooltip, Snackbar, useTheme, ListItemIcon, ListItemText, CircularProgress, Fab } from '@mui/material';
import { Add, Delete, Edit, Image, TextFields, Link as LinkIcon, YouTube, Instagram, Facebook, Twitter, AccountBox, CloudDownload, CreditCard, FamilyRestroom, QrCode, Share, Save } from '@mui/icons-material';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FamilyTreeWidget from '../../components/widgets/FamilyTreeWidget';
import QRCode from 'react-qr-code';
import { useAuth } from '../../contexts/AuthContext';
import WidgetPalettePanel from '../../components/WidgetPalettePanel';

// Типы виджетов
const WIDGET_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  SOCIAL: 'social',
  YOUTUBE: 'youtube',
  PROFILE_INFO: 'profile_info',
  FAMILY_TREE: 'family_tree'
};

// Тип Social для социальных сетей
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SocialData {
  type: 'instagram' | 'facebook' | 'twitter' | 'custom';
  url: string;
  username?: string;
}

// Интерфейс виджета
interface Widget {
  id: string;
  type: string;
  content: any;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  zIndex: number;
}

// Интерфейс профиля
interface Profile {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  theme: string;
  isPublic?: boolean;
}

// Стили для основного контейнера профиля
const ProfileContainer = styled.div`
  width: 100%;
  min-height: min(800px, 90vh);
  background-color: #fafbfd;
  border-radius: clamp(16px, 2.5vw, 24px);
  position: relative;
  padding: clamp(22px, 3.5vw, 36px);
  margin-bottom: clamp(24px, 5vh, 48px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.02);
  background-image: linear-gradient(rgba(0, 0, 0, 0.01) 1px, transparent 1px), 
                   linear-gradient(90deg, rgba(0, 0, 0, 0.01) 1px, transparent 1px);
  background-size: 25px 25px;
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 2.5vw, 28px);
  max-width: min(850px, 95%);
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
  align-items: flex-start; /* Выравнивание блоков по левому краю */
  
  @media (max-width: 992px) {
    min-height: min(700px, 85vh);
    padding: clamp(18px, 3vw, 30px);
    gap: 24px;
  }
  
  @media (max-width: 768px) {
    min-height: min(600px, 80vh);
    padding: 16px;
    gap: 16px;
    background-size: 18px 18px;
    border-radius: 14px;
    max-width: 100%;
    margin: 0 6px 24px;
    width: calc(100% - 12px);
  }
  
  @media (max-width: 480px) {
    min-height: min(500px, 75vh);
    padding: 12px;
    gap: 14px;
    border-radius: 10px;
    background-size: 12px 12px;
    margin: 0 4px 16px;
    width: calc(100% - 8px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02);
  }
`;

// Контейнер для виджета с поддержкой перетаскивания
const WidgetContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  margin-bottom: clamp(12px, 2vw, 24px);
  align-self: flex-start; /* Выравнивание по левому краю */
  max-width: 100%; /* Максимальная ширина контейнера */
  
  @media (max-width: 480px) {
    margin-bottom: 10px;
  }
`;

// Анимация для плавного перемещения виджетов
const widgetContainerVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.96
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 1
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.96,
    transition: {
      duration: 0.2
    }
  }
};

// Стиль для виджета
const WidgetElement = styled(motion.div)<{
  $backgroundColor: string;
  $textColor: string;
  $isSelected: boolean;
  $isDragging?: boolean;
}>`
  border-radius: clamp(14px, 2vw, 20px);
  background-color: ${props => props.$backgroundColor};
  color: ${props => props.$textColor};
  padding: clamp(18px, 3vw, 26px);
  box-shadow: ${props => {
    if (props.$isDragging) return '0 18px 35px rgba(0, 0, 0, 0.25)';
    if (props.$isSelected) return '0 0 0 2px #2196f3, 0 10px 25px rgba(0, 0, 0, 0.15)';
    return '0 8px 24px rgba(0, 0, 0, 0.11)';
  }};
  overflow: hidden;
  position: relative;
  width: 100%;
  min-height: clamp(90px, 14vh, 140px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: move;
  transform: ${props => props.$isDragging ? 'scale(1.03)' : 'none'};
  z-index: ${props => props.$isDragging ? 10 : 1};
  border: 1px solid rgba(0, 0, 0, 0.03);
  backdrop-filter: blur(3px);
  
  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
    transform: ${props => props.$isDragging ? 'scale(1.03)' : 'translateY(-5px)'};
  }
  
  &:hover .widget-controls {
    opacity: 1;
  }
  
  @media (max-width: 992px) {
    padding: clamp(16px, 2.5vw, 22px);
    min-height: clamp(85px, 12vh, 130px);
    border-radius: 14px;
  }
  
  @media (max-width: 768px) {
    border-radius: 12px;
    min-height: clamp(70px, 10vh, 100px);
    padding: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    border-radius: 8px;
    min-height: clamp(50px, 8vh, 80px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
  }
  
  @media (hover: none) {
    &:hover {
      transform: none;
    }
    
    .widget-controls {
      opacity: 1;
    }
  }
`;

// Контролы виджета
const WidgetControls = styled.div`
  position: absolute;
  top: 12px;
  right: 12px; /* Возвращаем кнопки управления вправо */
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  
  @media (max-width: 992px) {
    top: 10px;
    right: 10px;
    opacity: 0.9;
    padding: 4px;
    gap: 6px;
  }
  
  @media (max-width: 768px) {
    opacity: 0.95;
    top: 8px;
    right: 8px;
    padding: 3px;
    gap: 5px;
  }
  
  @media (max-width: 480px) {
    opacity: 1;
    top: 4px;
    right: 4px;
  padding: 2px;
    gap: 2px;
  }
  
  @media (hover: none) {
    opacity: 0.95;
  }
`;

const DragHandle = styled(motion.div)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 6px;
  width: clamp(60px, 10%, 80px);
  height: 6px;
  border-radius: 3px;
  background-color: rgba(0, 0, 0, 0.1);
  cursor: grab;
  opacity: 0;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(33, 150, 243, 0.3);
    height: 8px;
  }

  ${WidgetElement}:hover & {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
    background-color: rgba(33, 150, 243, 0.6);
    height: 8px;
  }
  
  @media (max-width: 768px) {
    width: 60px;
    height: 5px;
  }
  
  @media (max-width: 480px) {
    width: 50px;
    opacity: 0.5;
    top: 4px;
  }
  
  @media (hover: none) {
    opacity: 0.5;
    width: 60px;
  }
`;

// Визуальный индикатор места перетаскивания
const DropZone = styled(motion.div)<{ $isActive?: boolean }>`
  width: 100%;
  height: 18px;
  background-color: ${props => props.$isActive ? 'rgba(33, 150, 243, 0.2)' : 'transparent'};
  border-radius: 9px;
  margin: 8px 0;
  transition: all 0.2s ease;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 100%;
    height: 2px;
    background-color: ${props => props.$isActive ? 'rgba(33, 150, 243, 0.7)' : 'transparent'};
    opacity: ${props => props.$isActive ? 1 : 0};
    transition: all 0.2s ease;
  }
  
  &:hover {
    background-color: rgba(33, 150, 243, 0.15);
    height: 24px;
    
    &::before {
      opacity: 1;
      background-color: rgba(33, 150, 243, 0.6);
      height: 3px;
    }
  }
  
  @media (max-width: 768px) {
    height: 15px;
    margin: 5px 0;
    
    &:hover {
      height: 18px;
    }
  }
  
  @media (max-width: 480px) {
    height: 12px;
    margin: 4px 0;
    
    &:hover {
      height: 15px;
    }
  }
`;

// Панель инструментов
const ToolbarContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.97);
  padding: clamp(14px, 2vw, 20px);
  border-radius: clamp(14px, 1.5vw, 20px);
  margin-bottom: clamp(24px, 3.5vh, 32px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(10px, 1.2vw, 16px);
  max-width: min(850px, 95%);
  margin: 0 auto clamp(24px, 3.5vh, 32px) auto;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.03);
  
  @media (max-width: 992px) {
    padding: 14px;
    gap: 10px;
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    flex-wrap: wrap;
    gap: 8px;
    border-radius: 12px;
    margin-bottom: 16px;
    max-width: 100%;
    margin: 0 6px 16px;
    width: calc(100% - 12px);
  }
  
  @media (max-width: 480px) {
    padding: 8px;
    flex-direction: column;
    align-items: stretch;
    border-radius: 10px;
    gap: 8px;
    margin: 0 4px 12px;
    width: calc(100% - 8px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: 360px) {
    padding: 6px;
    gap: 6px;
  }
`;

// Панель блоков-виджетов слева
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LeftSidePanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  left: ${props => props.$isOpen ? "0" : "-280px"};
  top: 0;
  height: 100vh;
  width: 280px;
  background-color: white;
  box-shadow: ${props => props.$isOpen ? "0 0 15px rgba(0, 0, 0, 0.1)" : "none"};
  transition: all 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px 0;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SidePanelHeader = styled.div`
  padding: 0 16px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PanelToggleButton = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  left: ${props => props.$isOpen ? "280px" : "0"};
  top: 50%;
  transform: translateY(-50%);
  background-color: white;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  transition: all 0.3s ease;
  
  button {
    padding: 12px 8px;
    min-width: 40px;
    height: 80px;
  }
`;

// Компонент виджета с содержимым
const WidgetContent: React.FC<{
  widget: Widget;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPositionChange?: (id: string, targetIndex: number) => void;
  index: number;
  total: number;
}> = ({ widget, isSelected, onSelect, onDelete, onEdit, onPositionChange, index, total }) => {
  const [isDragging, setIsDragging] = useState(false);
  const constraints = useRef<HTMLDivElement>(null);
  const [posY, setPosY] = useState(0);
  
  // Функция для рендера контента виджета в зависимости от его типа
  const renderWidgetContent = () => {
    switch (widget.type) {
      case WIDGET_TYPES.TEXT:
        return (
          <Typography variant="body1" sx={{ 
            wordBreak: 'break-word',
            fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1.05rem' },
            lineHeight: 1.4
          }}>
            {widget.content.text}
          </Typography>
        );
      
      case WIDGET_TYPES.IMAGE:
        return (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Box sx={{
              width: '100%',
              height: 'auto',
              borderRadius: { xs: '6px', sm: '10px', md: '12px' },
              overflow: 'hidden',
              boxShadow: { xs: '0 2px 6px rgba(0, 0, 0, 0.06)', sm: '0 4px 10px rgba(0, 0, 0, 0.08)' },
              mb: { xs: 0.5, sm: 1 }
            }}>
              <img 
                src={widget.content.url} 
                alt={widget.content.caption || 'Изображение'} 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </Box>
            {widget.content.caption && (
              <Typography 
                variant="caption" 
                align="center" 
                sx={{ 
                  mt: { xs: 0.25, sm: 0.5 },
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                  opacity: 0.9
                }}
              >
                {widget.content.caption}
              </Typography>
            )}
          </Box>
        );
      
      case WIDGET_TYPES.SOCIAL:
        const SocialIcon = () => {
          switch (widget.content.type) {
            case 'instagram': return <Instagram sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
            case 'facebook': return <Facebook sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
            case 'twitter': return <Twitter sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
            default: return <LinkIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
          }
        };
        
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1.5 },
            flexWrap: 'wrap'
          }}>
            <SocialIcon />
            <Typography sx={{ 
              fontSize: { xs: '0.75rem', sm: '1rem' },
              wordBreak: 'break-all'
            }}>
              {widget.content.username || widget.content.url}
            </Typography>
          </Box>
        );
      
      case WIDGET_TYPES.YOUTUBE:
        return (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column'
          }}>
            <Box sx={{
              position: 'relative',
              paddingBottom: '56.25%', // соотношение сторон 16:9
              height: 0,
              overflow: 'hidden',
              borderRadius: { xs: '6px', sm: '10px', md: '12px' },
              boxShadow: { xs: '0 2px 6px rgba(0, 0, 0, 0.06)', sm: '0 4px 10px rgba(0, 0, 0, 0.08)' },
              mb: { xs: 0.5, sm: 1 }
            }}>
            <iframe 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              src={`https://www.youtube.com/embed/${widget.content.videoId}`} 
              title="YouTube video" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
            </Box>
            {widget.content.caption && (
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: { xs: 0.25, sm: 0.5 },
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                  opacity: 0.9
                }}
              >
                {widget.content.caption}
              </Typography>
            )}
          </Box>
        );
      
      case WIDGET_TYPES.PROFILE_INFO:
        return (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: { xs: 0.25, sm: 1 }
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                fontWeight: 600,
                mb: { xs: 0.25, sm: 0.5 }
              }}
            >
              {widget.content.title}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.95rem' },
                opacity: 0.9,
                lineHeight: { xs: 1.3, sm: 1.4 }
              }}
            >
              {widget.content.description}
            </Typography>
          </Box>
        );
      
      case WIDGET_TYPES.FAMILY_TREE:
        return (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            overflow: 'auto'
          }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                fontWeight: 600,
                mb: { xs: 0.25, sm: 0.5 }
              }}
            >
              {widget.content.title || 'Семейное древо'}
            </Typography>
            <Box sx={{ 
              flexGrow: 1,
              '& svg': {
                maxWidth: '100%',
                height: 'auto'
              }
            }}>
              <FamilyTreeWidget 
                initialMembers={widget.content.members || []}
                currentUserId={widget.content.userId || ''}
                onSave={() => {}}
                readOnly={true}
              />
            </Box>
          </Box>
        );
      
      default:
        return <Typography>Неизвестный тип виджета</Typography>;
    }
  };

  return (
    <WidgetContainer 
      ref={constraints}
      variants={widgetContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      layoutId={`widget-container-${widget.id}`}
      transition={{
        layout: { 
          type: "spring", 
          stiffness: 80, 
          damping: 20,
          mass: 1.2
        }
      }}
    >
      {index === 0 && 
        <DropZone 
          layout
          id={`dropzone-top-${widget.id}`}
          data-index={index}
          $isActive={isDragging}
          whileHover={{ height: 20, backgroundColor: 'rgba(33, 150, 243, 0.15)' }}
        />
      }
      
    <WidgetElement
      $backgroundColor={widget.backgroundColor}
      $textColor={widget.textColor}
      $isSelected={isSelected}
        $isDragging={isDragging}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ 
          opacity: 1, 
          scale: isDragging ? 1.02 : 1,
          y: posY,
          transition: {
            scale: { type: "spring", stiffness: 300, damping: 20 },
            opacity: { duration: 0.2 }
          }
        }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ 
          duration: 0.2,
          y: { type: "spring", stiffness: 300, damping: 25 }
        }}
        drag="y"
        dragConstraints={constraints}
        dragElastic={0.02}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDrag={(e, info) => {
          setPosY(info.offset.y);
        }}
        onDragEnd={(e, info) => {
          setPosY(0);
          setIsDragging(false);
          
          // Находим ближайшую зону и перемещаем виджет туда
          if (onPositionChange) {
            const draggedElement = e.target as HTMLElement;
            const draggedRect = draggedElement.getBoundingClientRect();
            const draggedCenter = draggedRect.top + draggedRect.height / 2;
            
            // Найдем все зоны перетаскивания
            const dropzones = document.querySelectorAll('[id^="dropzone-"]');
            let closestZone = null;
            let minDistance = Infinity;
            let targetIndex = index;
            
            dropzones.forEach(zone => {
              const zoneRect = zone.getBoundingClientRect();
              const zoneCenter = zoneRect.top + zoneRect.height / 2;
              const distance = Math.abs(draggedCenter - zoneCenter);
              
              if (distance < minDistance) {
                minDistance = distance;
                closestZone = zone;
                targetIndex = parseInt(zone.getAttribute('data-index') || `${index}`, 10);
              }
            });
            
            if (closestZone && targetIndex !== index) {
              onPositionChange(widget.id, targetIndex);
            }
          }
        }}
      >
        <DragHandle 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
      <WidgetControls className="widget-controls">
          <IconButton 
            size="small" 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.8)', 
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
              padding: { xs: '2px', sm: '4px' },
              '& .MuiSvgIcon-root': { 
                fontSize: { xs: '0.9rem', sm: '1.25rem' } 
              }
            }}
          >
          <Edit fontSize="small" />
        </IconButton>
          <IconButton 
            size="small" 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.8)', 
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
              padding: { xs: '2px', sm: '4px' },
              '& .MuiSvgIcon-root': { 
                fontSize: { xs: '0.9rem', sm: '1.25rem' } 
              }
            }}
          >
          <Delete fontSize="small" />
        </IconButton>
      </WidgetControls>
      
      {renderWidgetContent()}
    </WidgetElement>
      
      <DropZone 
        layout
        id={`dropzone-bottom-${widget.id}`}
        data-index={index + 1}
        $isActive={isDragging}
        whileHover={{ height: 20, backgroundColor: 'rgba(33, 150, 243, 0.15)' }}
      />
    </WidgetContainer>
  );
};

// Компонент для редактирования виджета
const WidgetEditor: React.FC<{
  widget: Widget | null;
  open: boolean;
  onClose: () => void;
  onSave: (widget: Widget) => void;
  storageLimit: number;
  storageUsed: number;
}> = ({ widget, open, onClose, onSave, storageLimit, storageUsed }) => {
  const [editedWidget, setEditedWidget] = useState<Widget | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useTheme();
  
  useEffect(() => {
    if (widget) {
      setEditedWidget({ ...widget });
    }
  }, [widget]);
  
  if (!editedWidget) return null;
  
  const handleContentChange = (field: string, value: any) => {
    setEditedWidget({
      ...editedWidget,
      content: { ...editedWidget.content, [field]: value }
    });
  };
  
  const handleChange = (field: string, value: any) => {
    setEditedWidget({
      ...editedWidget,
      [field]: value
    });
  };
  
  const handleSave = () => {
    onSave(editedWidget);
    onClose();
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Проверка на оставшееся доступное хранилище
      const fileSizeMB = file.size / (1024 * 1024);
      const remainingStorage = storageLimit - storageUsed;
      
      if (fileSizeMB > remainingStorage) {
        setFileSizeWarning(`Файл слишком большой (${fileSizeMB.toFixed(2)} МБ). Оставшееся место: ${remainingStorage.toFixed(2)} МБ`);
        return;
      }
      
      setFileSizeWarning(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (editedWidget) {
          const content = { ...editedWidget.content, url: reader.result as string };
          setEditedWidget({ ...editedWidget, content });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Определение полей редактирования в зависимости от типа виджета
  const renderContentEditor = () => {
    switch (editedWidget.type) {
      case WIDGET_TYPES.TEXT:
        return (
          <TextField
            fullWidth
            label="Текст"
            multiline
            rows={4}
            value={editedWidget.content.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
          />
        );
      
      case WIDGET_TYPES.IMAGE:
        return (
          <>
            <TextField
              fullWidth
              label="URL изображения"
              value={editedWidget.content.url || ''}
              onChange={(e) => handleContentChange('url', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
            <TextField
              fullWidth
              label="Подпись"
              value={editedWidget.content.caption || ''}
              onChange={(e) => handleContentChange('caption', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
          </>
        );
      
      case WIDGET_TYPES.SOCIAL:
        return (
          <>
            <TextField
              select
              fullWidth
              label="Тип социальной сети"
              value={editedWidget.content.type || 'custom'}
              onChange={(e) => handleContentChange('type', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            >
              <MenuItem value="instagram">Instagram</MenuItem>
              <MenuItem value="facebook">Facebook</MenuItem>
              <MenuItem value="twitter">Twitter</MenuItem>
              <MenuItem value="custom">Другое</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Имя пользователя"
              value={editedWidget.content.username || ''}
              onChange={(e) => handleContentChange('username', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
            <TextField
              fullWidth
              label="URL"
              value={editedWidget.content.url || ''}
              onChange={(e) => handleContentChange('url', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
          </>
        );
      
      case WIDGET_TYPES.YOUTUBE:
        return (
          <>
            <TextField
              fullWidth
              label="ID видео YouTube"
              value={editedWidget.content.videoId || ''}
              onChange={(e) => handleContentChange('videoId', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
              helperText="Например, dQw4w9WgXcQ из URL https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            />
            <TextField
              fullWidth
              label="Подпись"
              value={editedWidget.content.caption || ''}
              onChange={(e) => handleContentChange('caption', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
          </>
        );
      
      case WIDGET_TYPES.PROFILE_INFO:
        return (
          <>
            <TextField
              fullWidth
              label="Заголовок"
              value={editedWidget.content.title || ''}
              onChange={(e) => handleContentChange('title', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
            <TextField
              fullWidth
              label="Описание"
              multiline
              rows={3}
              value={editedWidget.content.description || ''}
              onChange={(e) => handleContentChange('description', e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
          </>
        );
      
      default:
        return <Typography>Неизвестный тип виджета</Typography>;
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editedWidget.type === WIDGET_TYPES.TEXT && 'Текстовый блок'}
        {editedWidget.type === WIDGET_TYPES.IMAGE && 'Изображение'}
        {editedWidget.type === WIDGET_TYPES.SOCIAL && 'Социальная сеть'}
        {editedWidget.type === WIDGET_TYPES.YOUTUBE && 'YouTube видео'}
        {editedWidget.type === WIDGET_TYPES.PROFILE_INFO && 'Информация профиля'}
        {editedWidget.type === WIDGET_TYPES.FAMILY_TREE && 'Семейное древо'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
        {renderContentEditor()}
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>Внешний вид</Typography>
            <TextField
              fullWidth
              label="Ширина (px)"
              type="number"
              value={editedWidget.width}
              onChange={(e) => handleChange('width', parseInt(e.target.value) || 0)}
              margin="dense"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
            <TextField
              fullWidth
              label="Высота (px)"
              type="number"
              value={editedWidget.height}
              onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
              margin="dense"
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: '10px' } }}
            />
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Цвета</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2">Фон:</Typography>
              <Box 
                component="input" 
                type="color" 
                value={editedWidget.backgroundColor}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                sx={{ width: 40, height: 40, borderRadius: 1, border: 'none', cursor: 'pointer' }}
              />
              
              <Typography variant="body2" sx={{ ml: 2 }}>Текст:</Typography>
              <Box 
                component="input" 
                type="color" 
                value={editedWidget.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
                sx={{ width: 40, height: 40, borderRadius: 1, border: 'none', cursor: 'pointer' }}
                />
            </Box>
            
            {editedWidget.type === WIDGET_TYPES.IMAGE && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  <AlertTitle>Использование хранилища</AlertTitle>
                  {Math.round(storageUsed / 1024 / 1024)}MB из {Math.round(storageLimit / 1024 / 1024)}MB
                </Alert>
                <LinearProgress 
                  variant="determinate" 
                  value={(storageUsed / storageLimit) * 100} 
                  color={storageUsed > storageLimit * 0.8 ? "warning" : "primary"}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
};

// Создание нового виджета
const createWidget = (type: string): Widget => {
  let content = {};
  let width = 200;
  let height = 100;
  let backgroundColor = '#ffffff';
  let textColor = '#212529';
  
  switch (type) {
    case WIDGET_TYPES.TEXT:
      content = { text: 'Нажмите для редактирования текста' };
      width = 300;
      height = 150;
      backgroundColor = '#f8f9ff';
      textColor = '#333744';
      break;
    case WIDGET_TYPES.IMAGE:
      content = { url: 'https://source.unsplash.com/random/300x200', caption: 'Подпись к изображению' };
      width = 320;
      height = 250;
      backgroundColor = '#f0f7ff';
      textColor = '#2c3e50';
      break;
    case WIDGET_TYPES.SOCIAL:
      content = { type: 'instagram', username: 'username', url: 'https://instagram.com/username' };
      width = 250;
      height = 80;
      backgroundColor = '#f6f5ff';
      textColor = '#4527a0';
      break;
    case WIDGET_TYPES.YOUTUBE:
      content = { videoId: 'dQw4w9WgXcQ', caption: 'Видео с YouTube' };
      width = 400;
      height = 300;
      backgroundColor = '#fff7f7';
      textColor = '#b71c1c';
      break;
    case WIDGET_TYPES.PROFILE_INFO:
      content = { title: 'Обо мне', description: 'Расскажите о себе' };
      width = 350;
      height = 150;
      backgroundColor = '#e8f5e9';
      textColor = '#1b5e20';
      break;
    case WIDGET_TYPES.FAMILY_TREE:
      content = { 
        title: 'Семейное древо', 
        members: [],
        userId: 'user123' 
      };
      width = 600;
      height = 400;
      backgroundColor = '#e3f2fd';
      textColor = '#0d47a1';
      break;
  }
  
  return {
    id: Date.now().toString(),
    type,
    content,
    x: 0, // Не используется в новом макете
    y: 0, // Не используется в новом макете
    width, // Будет использоваться для указания макс. ширины
    height, // Минимальная высота
    backgroundColor, // Используем улучшенные цвета фона
    textColor, // Улучшенные цвета текста для контраста
    zIndex: 1
  };
};

// Стили для страницы с блюром (для неоплаченной подписки)
const BlurredPage = styled.div`
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SubscriptionWarning = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  z-index: 1000;
  text-align: center;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StorageIndicator = styled(Box)`
  margin: 16px 0;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
`;

// Демо-данные для профилей пользователей
const demoProfiles: Record<string, Profile> = {
  'ivan': {
    id: 'ivan',
    name: 'Иван Петров',
    bio: 'Историк, люблю путешествовать и изучать новые места. Моя страница посвящена памяти моей семьи.',
    avatar: 'https://source.unsplash.com/random/300x300/?man',
    theme: 'light'
  },
  'anna': {
    id: 'anna',
    name: 'Анна Смирнова',
    bio: 'Фотограф, снимаю природу и города. Храню воспоминания о близких через фотографии и истории.',
    avatar: 'https://source.unsplash.com/random/300x300/?woman',
    theme: 'light'
  },
  'mikhail': {
    id: 'mikhail',
    name: 'Михаил Козлов',
    bio: 'Инженер, люблю горы и велосипеды. Создал эту страницу в память о моих родителях.',
    avatar: 'https://source.unsplash.com/random/300x300/?man2',
    theme: 'light'
  },
  'elena': {
    id: 'elena',
    name: 'Елена Морозова',
    bio: 'Художник, живу у моря. Делюсь воспоминаниями о моих предках и их историями.',
    avatar: 'https://source.unsplash.com/random/300x300/?woman2',
    theme: 'light'
  },
  'user123': {
    id: 'user123',
    name: 'Текущий пользователь',
    bio: 'Память о близком человеке',
    avatar: 'https://source.unsplash.com/random/300x300/?portrait',
    theme: 'light'
  }
};

// Демо-данные виджетов для разных профилей
const getDemoWidgets = (profileId: string, profileName: string, profileBio: string): Widget[] => {
  const widgetsByProfile: Record<string, Widget[]> = {
    'ivan': [
      {
        id: '1',
        type: WIDGET_TYPES.PROFILE_INFO,
        content: { 
          title: 'Привет, я Иван Петров', 
          description: 'Историк, люблю путешествовать и изучать новые места. Моя страница посвящена памяти моей семьи.'
        },
        x: 50,
        y: 50,
        width: 400,
        height: 150,
        backgroundColor: '#e3f2fd',
        textColor: '#0d47a1',
        zIndex: 1
      },
      {
        id: '2',
        type: WIDGET_TYPES.IMAGE,
        content: {
          url: 'https://source.unsplash.com/random/300x200/?history',
          caption: 'Исторические места, которые я посетил'
        },
        x: 50,
        y: 220,
        width: 300,
        height: 240,
        backgroundColor: '#fff',
        textColor: '#212529',
        zIndex: 1
      },
      {
        id: '3',
        type: WIDGET_TYPES.FAMILY_TREE,
        content: {
          title: 'Моя семья', 
          members: [],
          userId: 'ivan'
        },
        x: 370,
        y: 220,
        width: 500,
        height: 300,
        backgroundColor: '#f5f5f5',
        textColor: '#333',
        zIndex: 1
      }
    ],
    'anna': [
      {
        id: '1',
        type: WIDGET_TYPES.PROFILE_INFO,
        content: { 
          title: 'Фотограф Анна Смирнова', 
          description: 'Фотограф, снимаю природу и города. Храню воспоминания о близких через фотографии и истории.'
        },
        x: 50,
        y: 50,
        width: 400,
        height: 150,
        backgroundColor: '#fff3e0',
        textColor: '#e65100',
        zIndex: 1
      },
      {
        id: '2',
        type: WIDGET_TYPES.IMAGE,
        content: {
          url: 'https://source.unsplash.com/random/300x200/?camera',
          caption: 'Моя любимая камера'
        },
        x: 50,
        y: 220,
        width: 300,
        height: 240,
        backgroundColor: '#fff',
        textColor: '#212529',
        zIndex: 1
      },
      {
        id: '3',
        type: WIDGET_TYPES.SOCIAL,
        content: {
          type: 'instagram',
          username: 'annaphoto',
          url: 'https://instagram.com/annaphoto'
        },
        x: 370,
        y: 220,
        width: 250,
        height: 80,
        backgroundColor: '#fce4ec',
        textColor: '#c2185b',
        zIndex: 1
      }
    ],
    'mikhail': [
      {
        id: '1',
        type: WIDGET_TYPES.PROFILE_INFO,
        content: { 
          title: 'Михаил Козлов - инженер и путешественник', 
          description: 'Инженер, люблю горы и велосипеды. Создал эту страницу в память о моих родителях.'
        },
        x: 50,
        y: 50,
        width: 400,
        height: 150,
        backgroundColor: '#e8f5e9',
        textColor: '#2e7d32',
        zIndex: 1
      },
      {
        id: '2',
        type: WIDGET_TYPES.IMAGE,
        content: {
          url: 'https://source.unsplash.com/random/300x200/?mountains',
          caption: 'Мои походы в горы'
        },
        x: 50,
        y: 220,
        width: 300,
        height: 240,
        backgroundColor: '#fff',
        textColor: '#212529',
        zIndex: 1
      },
      {
        id: '3',
        type: WIDGET_TYPES.YOUTUBE,
        content: {
          videoId: '3ZiMvhIO-d4',
          caption: 'Мое велопутешествие'
        },
        x: 370,
        y: 220,
        width: 400,
        height: 300,
        backgroundColor: '#f5f5f5',
        textColor: '#333',
        zIndex: 1
      }
    ],
    'elena': [
      {
        id: '1',
        type: WIDGET_TYPES.PROFILE_INFO,
        content: { 
          title: 'Елена Морозова - художник', 
          description: 'Художник, живу у моря. Делюсь воспоминаниями о моих предках и их историями.'
        },
        x: 50,
        y: 50,
        width: 400,
        height: 150,
        backgroundColor: '#e0f7fa',
        textColor: '#006064',
        zIndex: 1
      },
      {
        id: '2',
        type: WIDGET_TYPES.IMAGE,
        content: {
          url: 'https://source.unsplash.com/random/300x200/?art',
          caption: 'Мои работы'
        },
        x: 50,
        y: 220,
        width: 300,
        height: 240,
        backgroundColor: '#fff',
        textColor: '#212529',
        zIndex: 1
      },
      {
        id: '3',
        type: WIDGET_TYPES.TEXT,
        content: {
          text: 'Искусство для меня - это способ сохранить память о моих близких. Через свои картины я передаю истории их жизни и наследие, которое они оставили.'
        },
        x: 370,
        y: 220,
        width: 350,
        height: 200,
        backgroundColor: '#f5f5f5',
        textColor: '#333',
        zIndex: 1
      }
    ]
  };

  // Возвращаем виджеты для конкретного профиля или дефолтные виджеты
  if (widgetsByProfile[profileId]) {
    return widgetsByProfile[profileId];
  }

  // Дефолтные виджеты, если для id нет готовых
  return [
    {
      id: '1',
      type: WIDGET_TYPES.PROFILE_INFO,
      content: { 
        title: 'Привет, я ' + profileName, 
        description: profileBio || 'Добро пожаловать в мой профиль! Здесь вы можете узнать больше обо мне.'
      },
      x: 50,
      y: 50,
      width: 400,
      height: 150,
      backgroundColor: '#e3f2fd',
      textColor: '#0d47a1',
      zIndex: 1
    },
    {
      id: '2',
      type: WIDGET_TYPES.IMAGE,
      content: {
        url: 'https://source.unsplash.com/random/300x200/?nature',
        caption: 'Люблю природу и путешествия'
      },
      x: 50,
      y: 220,
      width: 300,
      height: 240,
      backgroundColor: '#fff',
      textColor: '#212529',
      zIndex: 1
    },
    {
      id: '3',
      type: WIDGET_TYPES.TEXT,
      content: {
        text: 'Это текстовый блок, где вы можете рассказать о своих увлечениях, хобби или поделиться мыслями.'
      },
      x: 370,
      y: 220,
      width: 350,
      height: 200,
      backgroundColor: '#f5f5f5',
      textColor: '#333',
      zIndex: 1
    }
  ];
};

// Стили для плавающей кнопки - устанавливаем display: none всегда
const FloatingActionButton = styled(Fab)`
  display: none !important; // Полностью скрываем кнопку для всех устройств
`;

// В верхней части файла, где импорты
// Добавим определение production-режима
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const MOCK_API = isProduction; // Всегда используем мок-данные в продакшн

// Главный компонент страницы
const SocialPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useTheme();
  
  const isOwner = !id && isLoggedIn;
  const viewingId = id || (user?.username || '');
  
  // Ключи для localStorage - ВАЖНО: теперь уникальные для каждого пользователя
  const getUserStorageKey = (key: string) => {
    if (!isLoggedIn || !user?.username) {
      return key; // Если пользователь не залогинен, используем базовый ключ
    }
    return `${key}_${user.username}`; // Добавляем имя пользователя к ключу
  };
  
  const PROFILE_STORAGE_KEY = getUserStorageKey('socialqr_profile_data');
  const WIDGETS_STORAGE_KEY = getUserStorageKey('socialqr_widgets_data');
  const LAST_SAVED_KEY = getUserStorageKey('socialqr_last_saved');
  
  const [profile, setProfile] = useState<Profile>(() => {
    // Попытка загрузить профиль из localStorage
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    
    if (isOwner && savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch (e) {
        console.error('Ошибка при загрузке профиля из localStorage:', e);
      }
    }
    
    if (isOwner && user?.username) {
      // Если профиль не найден, создаем дефолтный профиль для текущего пользователя
      return {
        id: user.username,
        name: user.username || 'Текущий пользователь',
        bio: 'Память о близком человеке',
        avatar: 'https://source.unsplash.com/random/300x300/?portrait',
        theme: 'light'
      };
    }
    
    if (id && demoProfiles[id]) {
      return demoProfiles[id];
    }
    
    return {
      id: id || 'user123',
      name: 'Текущий пользователь',
      bio: 'Память о близком человеке',
      avatar: 'https://source.unsplash.com/random/300x300/?portrait',
      theme: 'light'
    };
  });
  
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    // Попытка загрузить виджеты из localStorage
    const savedWidgets = localStorage.getItem(WIDGETS_STORAGE_KEY);
    
    if (isOwner && savedWidgets) {
      try {
        return JSON.parse(savedWidgets);
      } catch (e) {
        console.error('Ошибка при загрузке виджетов из localStorage:', e);
        return [];
      }
    }
    
    return [];
  });
  
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const [isPublic, setIsPublic] = useState(() => {
    // Загрузка настройки публичности из localStorage
    const savedProfileData = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfileData) {
      try {
        const parsedData = JSON.parse(savedProfileData);
        return parsedData.isPublic !== undefined ? parsedData.isPublic : true;
      } catch (e) {
        return true;
      }
    }
    return true;
  });
  
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [storageLimit] = useState(5120); // 5 ГБ в МБ
  const [storageUsed, setStorageUsed] = useState(128); // Начальное значение в МБ
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showSubscriptionWarning, setShowSubscriptionWarning] = useState(false);
  const [isQRCodeDialogOpen, setIsQRCodeDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    // Загрузка времени последнего сохранения из localStorage
    const savedTime = localStorage.getItem(LAST_SAVED_KEY);
    return savedTime ? new Date(savedTime) : null;
  });
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  
  // Обновлено с добавлением всех нужных зависимостей
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Если данные уже загружены из localStorage, не делаем запрос
        if (isOwner && widgets.length > 0) {
          setLoading(false);
          return;
        }
        
        let widgetsData = null;
        
        // Всегда используем данные из localStorage или демо-данные в продакшн
        if (isOwner || MOCK_API) {
          // Проверяем, сохранены ли виджеты в localStorage
          const savedWidgets = localStorage.getItem(`widgets_${profile.id}`);
          const savedProfile = localStorage.getItem(`profile_${profile.id}`);
          
          if (savedWidgets) {
            widgetsData = JSON.parse(savedWidgets);
          }
          
          if (savedProfile) {
            const parsedProfile = JSON.parse(savedProfile);
            setProfile(parsedProfile);
            setIsPublic(parsedProfile.isPublic !== false); // по умолчанию публичный
          }
          
          // Если нет сохраненных виджетов, используем демо-данные
          if (!widgetsData || widgetsData.length === 0) {
            widgetsData = getDemoWidgets(
              viewingId, 
              profile.name, 
              profile.bio
            );
            setWidgets(widgetsData);
          }
        } else if (viewingId) {
          // Если просматриваем чужой профиль
          try {
            // Проверяем, сохранены ли виджеты в localStorage
            const savedWidgets = localStorage.getItem(`widgets_${viewingId}`);
            const savedProfile = localStorage.getItem(`profile_${viewingId}`);
            
            if (savedWidgets) {
              widgetsData = JSON.parse(savedWidgets);
            }
            
            if (savedProfile) {
              setProfile(JSON.parse(savedProfile));
            } else if (demoProfiles[viewingId]) {
              // Используем демо-профиль если нет сохраненного
              setProfile(demoProfiles[viewingId]);
            }
            
            // Если нет сохраненных виджетов, используем демо-данные
            if (!widgetsData || widgetsData.length === 0) {
              // Для демо используем демо-данные
              widgetsData = getDemoWidgets(
                viewingId, 
                demoProfiles[viewingId]?.name || 'Пользователь', 
                demoProfiles[viewingId]?.bio || ''
              );
            }
          } catch (err) {
            console.error('Failed to fetch profile:', err);
            setError('Не удалось загрузить данные профиля');
          }
        }
        
        if (widgetsData) {
          setWidgets(widgetsData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Не удалось загрузить данные профиля');
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [isOwner, viewingId, profile.bio, profile.name, widgets.length]);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkSubscriptionStatus = () => {
    // В реальном приложении здесь будет API-запрос
    const mockSubscriptionData = {
      active: Math.random() > 0.3, // 70% шанс активной подписки для демо
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    };
    
    setIsSubscriptionActive(mockSubscriptionData.active);
    
    if (!mockSubscriptionData.active) {
      setShowSubscriptionWarning(true);
    }
  };

  const calculateStorageUsed = (currentWidgets: Widget[]): number => {
    let totalSize = 0;
    
    currentWidgets.forEach(widget => {
      if (widget.type === WIDGET_TYPES.IMAGE) {
        // Примерный расчет для демо (в реальном приложении будем знать точный размер)
        totalSize += 2; // примерно 2 МБ на изображение
      } else if (widget.type === WIDGET_TYPES.YOUTUBE) {
        totalSize += 0.1; // метаданные занимают мало места
      }
    });
    
    return totalSize;
  };
  
  const handlePaySubscription = () => {
    navigate('/subscription');
  };
  
  const handleExportData = () => {
    // В реальном приложении здесь будет логика для создания ZIP архива
    alert('Данные будут экспортированы в ZIP архив. Эта функция находится в разработке.');
  };
  
  const handlePrivacyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIsPublic = event.target.checked;
    setIsPublic(newIsPublic);
    
    // Удаляем прямое обновление профиля здесь, так как оно вызывает ошибку типизации
    // Настройка isPublic будет использоваться при сохранении профиля в handleSaveProfile
  };
  
  const handleWidgetSelect = (id: string) => {
    setSelectedWidgetId(id);
  };
  
  const handleAddWidgetClose = () => {
    setAnchorEl(null);
  };
  
  const handleAddWidget = (type: string) => {
    const newWidget = createWidget(type);
    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    setSelectedWidgetId(newWidget.id);
    setAnchorEl(null);
    setIsEditorOpen(true);
    
    const potentialNewUsage = calculateStorageUsed(updatedWidgets);
    setStorageUsed(potentialNewUsage);
  };
  
  const handleDeleteWidget = (id: string) => {
    const remainingWidgets = widgets.filter(w => w.id !== id);
    setWidgets(remainingWidgets);
    
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null);
    }
    
    setStorageUsed(calculateStorageUsed(remainingWidgets));
  };
  
  const handleEditWidget = (id: string) => {
    setSelectedWidgetId(id);
    setIsEditorOpen(true);
  };
  
  const handleSaveWidget = (updatedWidget: Widget) => {
    const updatedWidgets = widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w);
    setWidgets(updatedWidgets);
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBackgroundClick = () => {
    setSelectedWidgetId(null);
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const selectedWidget = widgets.find(w => w.id === selectedWidgetId);
  
  const getProfileUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/social/${profile.id}`;
  };

  const handleOpenQRCodeDialog = () => {
    setIsQRCodeDialogOpen(true);
  };

  const handleCloseQRCodeDialog = () => {
    setIsQRCodeDialogOpen(false);
  };

  const handleCopyProfileLink = () => {
    const profileUrl = getProfileUrl();
    navigator.clipboard.writeText(profileUrl).then(() => {
      alert('Ссылка скопирована в буфер обмена!');
    }).catch(err => {
      console.error('Не удалось скопировать ссылку: ', err);
    });
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Виджеты для панели
  const widgetTypes = [
    { type: WIDGET_TYPES.TEXT, label: 'Текст', icon: <TextFields /> },
    { type: WIDGET_TYPES.IMAGE, label: 'Изображение', icon: <Image /> },
    { type: WIDGET_TYPES.SOCIAL, label: 'Социальная сеть', icon: <Instagram /> },
    { type: WIDGET_TYPES.YOUTUBE, label: 'YouTube видео', icon: <YouTube /> },
    { type: WIDGET_TYPES.PROFILE_INFO, label: 'Информация профиля', icon: <AccountBox /> },
    { type: WIDGET_TYPES.FAMILY_TREE, label: 'Семейное древо', icon: <FamilyRestroom /> }
  ];

  const handleWidgetPositionChange = (id: string, targetIndex: number) => {
    if (targetIndex < 0 || targetIndex > widgets.length) return;
    
    const updatedWidgets = [...widgets];
    const currentIndex = updatedWidgets.findIndex(w => w.id === id);
    
    if (currentIndex === targetIndex) return;
    
    const [movedWidget] = updatedWidgets.splice(currentIndex, 1);
    
    // Если перетаскиваем вниз, индекс нужно скорректировать
    const adjustedTargetIndex = currentIndex < targetIndex ? targetIndex - 1 : targetIndex;
    updatedWidgets.splice(adjustedTargetIndex, 0, movedWidget);
    
    // Плавное обновление списка
    setWidgets(updatedWidgets);
  };

  // Функция сохранения профиля, обернутая в useCallback
  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Обновляем состояние профиля
      const updatedProfile = {
        ...profile,
        isPublic
      };
      
      // Сохраняем в localStorage для демо/мок режима
      localStorage.setItem(`profile_${profile.id}`, JSON.stringify(updatedProfile));
      
      if (!MOCK_API && !isProduction) {
        // В реальном приложении здесь будет запрос к API
        // const response = await axios.post('/api/profile/save', profileData);
      }
      
      // Сохраняем виджеты
      localStorage.setItem(`widgets_${profile.id}`, JSON.stringify(widgets));
      
      setLastSaved(new Date());
      setIsSaving(false);
      setShowSaveNotification(true);
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setShowSaveNotification(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('Не удалось сохранить профиль');
      setIsSaving(false);
    }
  }, [profile, isPublic, widgets]);

  // Форматирование времени последнего сохранения
  const formatLastSaved = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSaved.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'только что';
    if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ч. назад`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн. назад`;
  };
  
  // Автосохранение при изменении виджетов
  // Обновлено с добавлением handleSaveProfile и isSaving в зависимости
  useEffect(() => {
    let saveTimer: NodeJS.Timeout;
    
    if (isOwner && widgets.length > 0 && !isSaving) {
      saveTimer = setTimeout(() => {
        handleSaveProfile();
      }, 30000); // Автосохранение через 30 секунд после последнего изменения
    }
      
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [widgets, isOwner, handleSaveProfile, isSaving]);
  
  // Функция рендера содержимого виджета
  const renderWidgetContent = (widget: Widget) => {
    switch (widget.type) {
      case WIDGET_TYPES.TEXT:
  return (
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-word',
              fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1.05rem' },
              lineHeight: 1.4
            }}
          >
            {widget.content.text}
          </Typography>
        );
      
      case WIDGET_TYPES.IMAGE:
        return (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Box sx={{
              width: '100%',
              height: 'auto',
              borderRadius: { xs: '6px', sm: '10px', md: '12px' },
              overflow: 'hidden',
              boxShadow: { xs: '0 2px 6px rgba(0, 0, 0, 0.06)', sm: '0 4px 10px rgba(0, 0, 0, 0.08)' },
              mb: { xs: 0.5, sm: 1 }
            }}>
              <img 
                src={widget.content.url} 
                alt={widget.content.caption || 'Изображение'} 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </Box>
            {widget.content.caption && (
              <Typography 
                variant="caption" 
                align="center" 
                sx={{ 
                  mt: { xs: 0.25, sm: 0.5 },
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                  opacity: 0.9
                }}
              >
                {widget.content.caption}
              </Typography>
            )}
          </Box>
        );
      
      case WIDGET_TYPES.SOCIAL:
        const SocialIcon = () => {
          switch (widget.content.type) {
            case 'instagram': return <Instagram sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
            case 'facebook': return <Facebook sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
            case 'twitter': return <Twitter sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
            default: return <LinkIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.5rem' } }} />;
          }
        };
        
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1.5 },
            flexWrap: 'wrap'
          }}>
            <SocialIcon />
            <Typography sx={{ 
              fontSize: { xs: '0.75rem', sm: '1rem' },
              wordBreak: 'break-all'
            }}>
              {widget.content.username || widget.content.url}
            </Typography>
          </Box>
        );
      
      case WIDGET_TYPES.YOUTUBE:
        return (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column'
          }}>
            <Box sx={{
              position: 'relative',
              paddingBottom: '56.25%', // соотношение сторон 16:9
              height: 0,
              overflow: 'hidden',
              borderRadius: { xs: '6px', sm: '10px', md: '12px' },
              boxShadow: { xs: '0 2px 6px rgba(0, 0, 0, 0.06)', sm: '0 4px 10px rgba(0, 0, 0, 0.08)' },
              mb: { xs: 0.5, sm: 1 }
            }}>
              <iframe 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                src={`https://www.youtube.com/embed/${widget.content.videoId}`} 
                title="YouTube video" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </Box>
            {widget.content.caption && (
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: { xs: 0.25, sm: 0.5 },
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                  opacity: 0.9
                }}
              >
                {widget.content.caption}
              </Typography>
            )}
          </Box>
        );
      
      case WIDGET_TYPES.PROFILE_INFO:
        return (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: { xs: 0.25, sm: 1 }
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                fontWeight: 600,
                mb: { xs: 0.25, sm: 0.5 }
              }}
            >
              {widget.content.title}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.95rem' },
                opacity: 0.9,
                lineHeight: { xs: 1.3, sm: 1.4 }
              }}
            >
              {widget.content.description}
            </Typography>
          </Box>
        );
      
      case WIDGET_TYPES.FAMILY_TREE:
        return (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            overflow: 'auto'
          }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                fontWeight: 600,
                mb: { xs: 0.25, sm: 0.5 }
              }}
            >
              {widget.content.title || 'Семейное древо'}
            </Typography>
            <Box sx={{ 
              flexGrow: 1,
              '& svg': {
                maxWidth: '100%',
                height: 'auto'
              }
            }}>
              <FamilyTreeWidget 
                initialMembers={widget.content.members || []}
                currentUserId={widget.content.userId || ''}
                onSave={() => {}}
                readOnly={true}
              />
            </Box>
          </Box>
        );
      
      default:
        return <Typography>Неизвестный тип виджета</Typography>;
    }
  };

  // Обновляем секцию просмотра публичного профиля
  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        pt: { xs: 2, sm: 4, md: 6, lg: 8 }, 
        pb: { xs: 2, sm: 4, md: 6, lg: 8 },
        px: { xs: 0, sm: 1, md: 2 },
        position: 'relative'
      }}
    >
      {!isSubscriptionActive && !id && (
        <>
          <BlurredPage>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                {profile.name}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {profile.bio}
              </Typography>
            </Box>
            
            <Alert severity="warning" sx={{ mb: 3 }}>
              У вас не активирована подписка. Для публикации профиля необходимо оформить подписку.
            </Alert>
            
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handlePaySubscription}
              startIcon={<CreditCard />}
              sx={{ mb: 4 }}
                >
              Оформить подписку
                </Button>
          </BlurredPage>
          
          <Alert severity="info">
            <AlertTitle>Рекомендация</AlertTitle>
            После оформления подписки все изменения будут доступны публично.
          </Alert>
        </>
      )}
      
      {isSubscriptionActive && !id && (
        <>
          <ToolbarContainer>
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 0.5, sm: 1, md: 2 }, 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              width: { xs: '100%', sm: 'auto' } 
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'primary.main', 
                  mr: { xs: 0.5, sm: 1 }, 
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                  whiteSpace: 'nowrap'
                }}
              >
                Мой профиль
              </Typography>
            
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={isPublic} 
                        onChange={handlePrivacyChange} 
                        color="primary"
                    size={window.innerWidth < 600 ? "small" : "medium"}
                      />
                    }
                label={isPublic ? "Публичный" : "Приватный"}
                sx={{ 
                  m: 0, 
                  '& .MuiFormControlLabel-label': { 
                    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } 
                  } 
                }}
              />
              
              {lastSaved && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    display: { xs: 'none', sm: 'none', md: 'block' }
                  }}
                >
                  Сохранено: {formatLastSaved()}
                        </Typography>
              )}
                      </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 0.5, sm: 1 }, 
              width: { xs: '100%', sm: 'auto' }, 
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
              mt: { xs: 0.5, sm: 0 },
              flexWrap: 'wrap'
            }}>
              <Tooltip title="Сохранить профиль">
                <span>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleSaveProfile}
                    startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
                    disabled={isSaving}
                    size="small"
                    sx={{ 
                      mr: { xs: 0.25, sm: 1 },
                      display: { xs: 'none', sm: 'flex' },
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      py: { xs: 0.3, sm: 0.75 },
                      px: { xs: 0.8, sm: 1.5 },
                      minWidth: { xs: 0, sm: '80px', md: '100px' },
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </span>
              </Tooltip>
              
              <Tooltip title="Сохранить профиль">
                <span>
                  <IconButton 
                    color="primary" 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    size="small"
                    sx={{ 
                      display: { xs: 'flex', sm: 'none' },
                      padding: { xs: '3px' },
                      '& .MuiSvgIcon-root': { fontSize: '1rem' }
                    }}
                  >
                    {isSaving ? <CircularProgress size={16} /> : <Save fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
              
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 0.25, sm: 1 }
              }}>
                <Tooltip title="Поделиться QR-кодом">
                  <IconButton 
                    onClick={handleOpenQRCodeDialog} 
                    color="primary" 
                    size="small"
                    sx={{ 
                      padding: { xs: '3px', sm: '6px', md: '8px' },
                      '& .MuiSvgIcon-root': { 
                        fontSize: { xs: '1rem', sm: '1.35rem', md: '1.5rem' }
                      }
                    }}
                  >
                    <QrCode />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Экспортировать данные">
                  <IconButton 
                    onClick={handleExportData} 
                    color="primary" 
                    size="small"
                    sx={{ 
                      padding: { xs: '3px', sm: '6px', md: '8px' },
                      '& .MuiSvgIcon-root': { 
                        fontSize: { xs: '1rem', sm: '1.35rem', md: '1.5rem' }
                      }
                    }}
                  >
                    <CloudDownload />
                    </IconButton>
                  </Tooltip>
                </Box>
              
              <Button
                variant="contained" 
                color="primary" 
                onClick={toggleSidebar}
                startIcon={<Add />}
                sx={{ 
                  display: { xs: 'none', sm: 'flex' },
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  py: { xs: 0.3, sm: 0.75 },
                  px: { xs: 0.8, sm: 1.5, md: 2 },
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  minWidth: { xs: 0, sm: 'auto' }
                }}
              >
                Добавить блок
              </Button>
              
              <IconButton 
                color="primary" 
                onClick={toggleSidebar}
                sx={{ 
                  display: { xs: 'flex', sm: 'none' },
                  padding: { xs: '3px', sm: '6px' },
                  '& .MuiSvgIcon-root': { fontSize: '1rem' }
                }}
                size="small"
              >
                <Add />
              </IconButton>
              </Box>
          </ToolbarContainer>
          
          {/* Используем новый компонент WidgetPalettePanel */}
          <WidgetPalettePanel 
            isOpen={sidebarOpen}
            onClose={toggleSidebar}
            onAddWidget={handleAddWidget}
            widgetTypes={widgetTypes}
              />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            <ProfileContainer>
              <AnimatePresence mode="popLayout">
                {widgets.map((widget, index) => (
              <WidgetContent
                key={widget.id}
                widget={widget}
                isSelected={widget.id === selectedWidgetId}
                onSelect={() => handleWidgetSelect(widget.id)}
                onDelete={() => handleDeleteWidget(widget.id)}
                    onEdit={() => handleEditWidget(widget.id)}
                    onPositionChange={handleWidgetPositionChange}
                    index={index}
                    total={widgets.length}
              />
            ))}
              </AnimatePresence>
              {widgets.length === 0 && (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: { xs: 3, sm: 4 }, 
                    color: 'text.secondary',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 }
                  }}
                >
                  <Add sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.5 }} />
                  <Typography 
                    variant="body1"
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      px: 2
                    }}
                  >
                    Нажмите "Добавить блок" чтобы начать создание профиля
                  </Typography>
                </Box>
              )}
            </ProfileContainer>
          </Box>
        </>
      )}

      {id && (
        <Box sx={{ px: { xs: 0.5, sm: 2, md: 3 } }}>
              <Box sx={{ 
            mb: { xs: 1, sm: 2, md: 4 },
            textAlign: { xs: 'left', sm: 'left' },
            px: { xs: 0.5, sm: 1, md: 0 }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              position: 'relative',
              width: '100%',
              mb: { xs: 0.5, sm: 1 }
            }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.75rem', md: '2.2rem' },
                  fontWeight: { xs: 500, md: 600 },
                  lineHeight: 1.2,
                  mt: { xs: 0, sm: 1 },
                  textAlign: 'left',
                  pr: 5
                }}
              >
                {profile.name}
              </Typography>
              {profile.id && profile.id !== 'user123' && (
                <IconButton 
                  size="small"
                  sx={{ 
                position: 'absolute', 
                    right: 0, 
                top: '50%', 
                    transform: 'translateY(-50%)',
                    padding: { xs: '2px', sm: '8px' }
                  }}
                >
                  <Edit sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }} />
                </IconButton>
              )}
            </Box>
            <Typography 
              variant="body1" 
              color="textSecondary"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' },
                mt: { xs: 0.25, sm: 1 },
                opacity: 0.85,
                mx: { xs: '0', sm: 0 },
                maxWidth: { xs: '100%', sm: 'none' },
                textAlign: 'left',
                lineHeight: 1.3
              }}
            >
              {profile.bio}
            </Typography>
          </Box>
          
          <ProfileContainer>
            {widgets.map((widget, index) => (
              <Box
                key={widget.id}
                component={motion.div}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.35,
                  delay: index * 0.06,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                sx={{
                  backgroundColor: widget.backgroundColor,
                  color: widget.textColor,
                  borderRadius: { xs: '8px', sm: '12px', md: '16px' },
                  p: { xs: 1.25, sm: 2, md: 2.5 },
                  overflow: 'hidden',
                  boxShadow: { 
                    xs: '0 2px 6px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)', 
                    sm: '0 3px 10px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)', 
                    md: '0 4px 14px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.03)'
                  },
                  mb: { xs: 1.5, sm: 2, md: 2.5 },
                  transition: 'all 0.25s ease',
                  border: '1px solid rgba(0, 0, 0, 0.03)',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-3px)' },
                    boxShadow: { 
                      xs: '0 3px 8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)', 
                      sm: '0 6px 14px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.03)', 
                      md: '0 8px 18px rgba(0, 0, 0, 0.08), 0 2px 5px rgba(0, 0, 0, 0.04)' 
                    },
                    '& .controls-box': {
                      opacity: 1
                    }
                  },
                  position: 'relative',
                  alignSelf: 'flex-start',
                  width: '100%',
                  maxWidth: '100%',
                  marginLeft: 0,
                  marginRight: 'auto'
                }}
              >
                {/* Показываем кнопки управления только если это публичный профиль текущего пользователя */}
                {id === viewingId && (
                  <Box 
                    className="controls-box"
                    sx={{ 
                      position: 'absolute',
                      top: { xs: 6, sm: 10 },
                      right: { xs: 6, sm: 10 },
                      display: 'flex',
                      gap: { xs: 0.5, sm: 1 },
                      zIndex: 10,
                      opacity: { xs: 1, sm: 0.7 },
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    <IconButton 
                      size="small"
                      onClick={() => handleEditWidget(widget.id)}
                      sx={{ 
                        padding: { xs: '2px', sm: '4px' },
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
                        '& .MuiSvgIcon-root': { fontSize: { xs: '0.9rem', sm: '1.1rem' } }
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={() => handleDeleteWidget(widget.id)}
                      sx={{ 
                        padding: { xs: '2px', sm: '4px' },
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
                        '& .MuiSvgIcon-root': { fontSize: { xs: '0.9rem', sm: '1.1rem' } }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                )}
                
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  {renderWidgetContent(widget)}
                </Box>
              </Box>
            ))}
            
            {widgets.length === 0 && (
              <Box sx={{ 
                textAlign: 'left',
                py: { xs: 2, sm: 4 }, 
                color: 'text.secondary',
                width: '100%'
              }}>
                <Typography 
                  variant="body1"
                  sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                >
                  У пользователя пока нет содержимого на странице
                </Typography>
              </Box>
            )}
          </ProfileContainer>
        </Box>
      )}

      {/* QR код диалог */}
      <Dialog 
        open={isQRCodeDialogOpen} 
        onClose={handleCloseQRCodeDialog}
        fullWidth
        maxWidth="xs"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: '10px', sm: '16px' },
            p: { xs: 0.5, sm: 1.5 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
            m: { xs: '8px', sm: '32px' }
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontSize: { xs: '0.95rem', sm: '1.25rem' },
            pt: { xs: 1, sm: 2 },
            pb: { xs: 0.5, sm: 1 },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          QR-код вашего профиля
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            py: { xs: 0.5, sm: 1.5 }
          }}>
            <Box 
              sx={{ 
                padding: { xs: 0.5, sm: 2 },
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}
            >
              <QRCode 
                value={getProfileUrl()} 
                size={Math.min(window.innerWidth * 0.4, 180)}
              />
            </Box>
            <Typography 
              variant="body2"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                wordBreak: 'break-all',
                textAlign: 'center',
                px: { xs: 0.5, sm: 2 }
              }}
            >
              {getProfileUrl()}
            </Typography>
              <Button 
              variant="outlined" 
              startIcon={<Share sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }} />}
              onClick={handleCopyProfileLink}
              size={window.innerWidth < 600 ? "small" : "medium"}
              sx={{ 
                mt: { xs: 0.5, sm: 1 }, 
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                borderRadius: '8px',
                py: { xs: 0.3, sm: 'auto' },
                px: { xs: 1, sm: 'auto' },
              }}
              >
              Копировать ссылку
              </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: { xs: 'center', sm: 'flex-end' }, p: { xs: 1, sm: 2 } }}>
          <Button 
            onClick={handleCloseQRCodeDialog}
            size={window.innerWidth < 600 ? "small" : "medium"}
            sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.875rem' },
              borderRadius: '8px',
              py: { xs: 0.3, sm: 'auto' },
              px: { xs: 1, sm: 'auto' },
            }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Меню добавления виджетов */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleAddWidgetClose}
        PaperProps={{
          style: {
            borderRadius: '12px',
            padding: '4px'
          }
        }}
        sx={{
          '& .MuiList-root': {
            padding: { xs: '2px', sm: '8px' }
          },
          '& .MuiMenuItem-root': {
            borderRadius: '8px',
            margin: { xs: '1px 0', sm: '2px 0' },
            padding: { xs: '6px 8px', sm: '10px 16px' }
          }
        }}
              >
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.TEXT)}>
          <ListItemIcon>
            <TextFields sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }} />
          </ListItemIcon>
          <ListItemText 
            primary="Текст"
            primaryTypographyProps={{
              style: { fontSize: window.innerWidth < 480 ? '0.8rem' : '1rem' }
            }}
          />
                </MenuItem>
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.IMAGE)}>
          <ListItemIcon>
            <Image sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }} />
          </ListItemIcon>
          <ListItemText 
            primary="Изображение"
            primaryTypographyProps={{
              style: { fontSize: window.innerWidth < 480 ? '0.8rem' : '1rem' }
            }}
          />
                </MenuItem>
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.SOCIAL)}>
          <ListItemIcon>
            <Instagram sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }} />
          </ListItemIcon>
          <ListItemText 
            primary="Социальная сеть"
            primaryTypographyProps={{
              style: { fontSize: window.innerWidth < 480 ? '0.8rem' : '1rem' }
            }}
          />
        </MenuItem>
        <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.YOUTUBE)}>
          <ListItemIcon>
            <YouTube sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }} />
          </ListItemIcon>
          <ListItemText 
            primary="YouTube видео"
            primaryTypographyProps={{
              style: { fontSize: window.innerWidth < 480 ? '0.8rem' : '1rem' }
            }}
          />
                </MenuItem>
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.PROFILE_INFO)}>
          <ListItemIcon>
            <AccountBox sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }} />
          </ListItemIcon>
          <ListItemText 
            primary="Информация профиля"
            primaryTypographyProps={{
              style: { fontSize: window.innerWidth < 480 ? '0.8rem' : '1rem' }
            }}
          />
                </MenuItem>
                <MenuItem onClick={() => handleAddWidget(WIDGET_TYPES.FAMILY_TREE)}>
          <ListItemIcon>
            <FamilyRestroom sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }} />
          </ListItemIcon>
          <ListItemText 
            primary="Семейное древо"
            primaryTypographyProps={{
              style: { fontSize: window.innerWidth < 480 ? '0.8rem' : '1rem' }
            }}
          />
                </MenuItem>
              </Menu>

            <WidgetEditor 
        widget={selectedWidgetId ? widgets.find(w => w.id === selectedWidgetId) || null : null} 
              open={isEditorOpen} 
              onClose={() => setIsEditorOpen(false)} 
              onSave={handleSaveWidget}
              storageLimit={storageLimit}
              storageUsed={storageUsed}
            />
      
      <Snackbar
        open={showStorageWarning}
        autoHideDuration={6000}
        onClose={() => setShowStorageWarning(false)}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: window.innerWidth < 600 ? 'center' : 'center'
        }}
        sx={{ 
          mb: { xs: 1, sm: 2 },
          maxWidth: { xs: '95%', sm: '450px' }
        }}
      >
        <Alert 
          onClose={() => setShowStorageWarning(false)} 
          severity="warning"
          sx={{ width: '100%', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Превышен лимит хранилища (5 ГБ). Удалите существующие файлы перед добавлением новых.
        </Alert>
      </Snackbar>
      
      {/* Уведомление о сохранении */}
      <Snackbar
        anchorOrigin={{ 
          vertical: window.innerWidth < 600 ? 'bottom' : 'bottom', 
          horizontal: window.innerWidth < 600 ? 'center' : 'right'
        }}
        open={showSaveNotification}
        autoHideDuration={3000}
        onClose={() => setShowSaveNotification(false)}
        sx={{ 
          mb: { xs: 1, sm: 2 },
          mr: { xs: 1, sm: 2 },
          maxWidth: { xs: '95%', sm: '400px' }
        }}
      >
        <Alert 
          onClose={() => setShowSaveNotification(false)} 
          severity={saveSuccess ? "success" : "error"}
          variant="filled"
          sx={{ 
            width: '100%', 
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {saveSuccess 
            ? "Профиль успешно сохранен!" 
            : saveError || "Ошибка при сохранении профиля"
          }
        </Alert>
      </Snackbar>
      
      {/* ВАЖНО: Скрываем плавающую кнопку действия, убираем здесь кнопку + из нижней части экрана */}
      {/* Если есть плавающая кнопка, используем стиль display: none */}
      <FloatingActionButton
        color="primary"
        aria-label="Добавить блок"
        onClick={toggleSidebar}
        sx={{ display: 'none !important' }} // Дополнительно скрываем в inline стилях
      >
        <Add />
      </FloatingActionButton>
    </Container>
  );
};

export default SocialPage; 