import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Stack, IconButton } from '@mui/material';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { Delete as DeleteIcon } from '@mui/icons-material';
import PhotoWidget from '../components/widgets/PhotoWidget';
import TextWidget from '../components/widgets/TextWidget';
import FamilyTreeWidget from '../components/widgets/FamilyTreeWidget';
import VideoWidget from '../components/widgets/VideoWidget';
import LinksWidget from '../components/widgets/LinksWidget';
import ProfileInfoWidget from '../components/widgets/ProfileInfoWidget';
import PhotoCarouselWidget from '../components/widgets/PhotoCarouselWidget';

const WidgetContainer = styled(motion.div)`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
  height: 100%;
  width: 100%;
  
  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const WidgetContent = styled.div`
  padding: 20px;
  height: calc(100% - 60px); // Вычитаем высоту заголовка
  overflow: auto;
`;

const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 16px 16px 0 0;
  cursor: move;
`;

const RotateHandle = styled.div`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(-50%) scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  ${WidgetContainer}:hover & {
    opacity: 1;
  }
`;

const DeleteButton = styled(Button)`
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 36px;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  ${WidgetContainer}:hover & {
    opacity: 1;
  }
`;

const AddWidgetButton = styled(Button)`
  width: 100%;
  padding: 12px;
  text-align: left;
  justify-content: flex-start;
  border-radius: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(25, 118, 210, 0.08);
    transform: translateX(5px);
  }
`;

// Определение типов виджетов
type WidgetType = 'profile-info' | 'photo' | 'photo-carousel' | 'text' | 'family' | 'video' | 'links';

interface Widget {
  id: string;
  type: WidgetType;
  content: any;
  title: string;
  icon: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
}

// Конфигурация виджетов
const WIDGET_CONFIG: Record<WidgetType, {
  title: string;
  icon: string;
  component: React.ComponentType<any>;
  defaultContent: any;
}> = {
  'profile-info': {
    title: 'Информация о человеке',
    icon: 'person',
    component: ProfileInfoWidget,
    defaultContent: {
      name: '',
      dates: '',
      description: ''
    }
  },
  'photo': {
    title: 'Фотография',
    icon: 'photo',
    component: PhotoWidget,
    defaultContent: {
      url: '',
      caption: ''
    }
  },
  'photo-carousel': {
    title: 'Альбом фотографий',
    icon: 'collections',
    component: PhotoCarouselWidget,
    defaultContent: {
      photos: []
    }
  },
  'text': {
    title: 'Текстовый блок',
    icon: 'text_fields',
    component: TextWidget,
    defaultContent: {
      content: ''
    }
  },
  'family': {
    title: 'Семейное древо',
    icon: 'account_tree',
    component: FamilyTreeWidget,
    defaultContent: {
      members: []
    }
  },
  'video': {
    title: 'Видео',
    icon: 'videocam',
    component: VideoWidget,
    defaultContent: {
      url: '',
      caption: ''
    }
  },
  'links': {
    title: 'Полезные ссылки',
    icon: 'link',
    component: LinksWidget,
    defaultContent: {
      links: []
    }
  }
};

interface DragData {
  node: HTMLElement;
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  lastX: number;
  lastY: number;
}

interface Position {
  x: number;
  y: number;
}

const Widget: React.FC<{
  widget: Widget;
  isEditing: boolean;
  onUpdate: (newContent: any) => void;
  onDelete: () => void;
  onPositionChange: (position: Widget['position']) => void;
}> = ({ widget, isEditing, onUpdate, onDelete, onPositionChange }) => {
  const config = WIDGET_CONFIG[widget.type];
  const Component = config.component;
  const [rotation, setRotation] = useState(widget.position.rotation || 0);

  const handleRotate = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onMouseMove = (e: MouseEvent) => {
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const newRotation = angle * (180 / Math.PI);
      setRotation(newRotation);
      onPositionChange({ ...widget.position, rotation: newRotation });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <Draggable
      handle=".widget-header"
      disabled={!isEditing}
      bounds="parent"
      defaultPosition={{ x: widget.position.x, y: widget.position.y }}
      onStop={(e, data) => {
        onPositionChange({ ...widget.position, x: data.x, y: data.y });
      }}
    >
      <div style={{ 
        position: 'absolute',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: isEditing ? 1000 : 'auto',
        width: widget.position.width,
        height: widget.position.height
      }}>
        <WidgetContainer>
          {isEditing && (
            <>
              <RotateHandle
                onMouseDown={handleRotate}
              >
                <span className="material-icons" style={{ fontSize: 16 }}>rotate_right</span>
              </RotateHandle>
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 1000
                }}
              >
                <IconButton
                  size="small"
                  onClick={onDelete}
                  sx={{
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'error.dark',
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </>
          )}
          
          <WidgetHeader className="widget-header">
            <span className="material-icons" style={{ 
              marginRight: '10px',
              opacity: 0.7,
              fontSize: '20px'
            }}>
              {config.icon}
            </span>
            <Typography variant="h6" sx={{ 
              fontSize: '1.1rem',
              fontWeight: 500,
              color: '#1a1a1a'
            }}>
              {config.title}
            </Typography>
          </WidgetHeader>

          <WidgetContent>
            <Component
              content={widget.content}
              onUpdate={onUpdate}
              isEditing={isEditing}
              onDelete={onDelete}
            />
          </WidgetContent>
        </WidgetContainer>
      </div>
    </Draggable>
  );
};

const SocialProfile: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const addWidget = (type: WidgetType) => {
    const config = WIDGET_CONFIG[type];
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      content: config.defaultContent,
      title: config.title,
      icon: config.icon,
      position: {
        x: Math.random() * (window.innerWidth - 400),
        y: Math.random() * (window.innerHeight - 300),
        width: 400,
        height: 300,
        rotation: 0
      }
    };
    setWidgets([...widgets, newWidget]);
  };

  const updateWidget = (id: string, newContent: any) => {
    setWidgets(widgets.map(widget =>
      widget.id === id ? { ...widget, content: newContent } : widget
    ));
  };

  const updateWidgetPosition = (id: string, position: Widget['position']) => {
    setWidgets(widgets.map(widget =>
      widget.id === id ? { ...widget, position: { ...widget.position, ...position } } : widget
    ));
  };

  const deleteWidget = (id: string) => {
    setWidgets(widgets.filter(widget => widget.id !== id));
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '100vh',
      overflow: 'hidden',
      bgcolor: '#f5f5f5'
    }}>
      <Box sx={{ 
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1100
      }}>
        <Button
          variant="contained"
          onClick={() => setIsEditing(!isEditing)}
          sx={{
            bgcolor: isEditing ? 'success.main' : 'primary.main',
            '&:hover': {
              bgcolor: isEditing ? 'success.dark' : 'primary.dark',
            }
          }}
        >
          {isEditing ? 'Сохранить' : 'Редактировать'}
        </Button>
      </Box>

      {widgets.map(widget => (
        <Widget
          key={widget.id}
          widget={widget}
          isEditing={isEditing}
          onUpdate={(newContent) => updateWidget(widget.id, newContent)}
          onDelete={() => deleteWidget(widget.id)}
          onPositionChange={(position) => updateWidgetPosition(widget.id, position)}
        />
      ))}

      {isEditing && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 2,
            borderRadius: 2,
            display: 'flex',
            gap: 1,
            bgcolor: 'background.paper',
            zIndex: 1100
          }}
        >
          {Object.entries(WIDGET_CONFIG).map(([type, config]) => (
            <Button
              key={type}
              variant="outlined"
              onClick={() => addWidget(type as WidgetType)}
              startIcon={<span className="material-icons">{config.icon}</span>}
            >
              {config.title}
            </Button>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default SocialProfile; 