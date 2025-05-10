import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  Menu, 
  MenuItem, 
  Divider,
  ButtonBase,
  Tooltip,
  Fade,
  Collapse
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import { styled } from '@mui/material/styles';

// Пользовательские стили
const BlockContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginBottom: theme.spacing(1),
  transition: 'all 0.2s ease',
  '&:hover .block-handle': {
    opacity: 1,
  }
}));

const BlockHandle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: -40,
  top: '50%',
  transform: 'translateY(-50%)',
  opacity: 0,
  display: 'flex',
  alignItems: 'center',
  transition: 'opacity 0.2s ease',
  padding: theme.spacing(0.5),
}));

const BlockContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  width: '100%',
  borderRadius: theme.shape.borderRadius,
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const BlockTypeButton = styled(ButtonBase)(({ theme }) => ({
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const BlockTypeMenu = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 0,
  top: '100%',
  width: 280,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  zIndex: 1000,
  overflowY: 'auto',
  maxHeight: 400,
}));

const BlockTypeMenuItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  },
  '& .icon': {
    marginRight: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  '& .label': {
    flexGrow: 1,
  },
  '& .shortcut': {
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
  }
}));

const FormatToolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.5),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  marginBottom: theme.spacing(1),
}));

// Типы блоков
export type BlockType = 
  | 'paragraph' 
  | 'heading-1' 
  | 'heading-2' 
  | 'heading-3' 
  | 'bulleted-list' 
  | 'numbered-list'
  | 'to-do' 
  | 'image' 
  | 'code' 
  | 'quote'
  | 'callout'
  | 'divider'
  | 'table';

// Интерфейс для блока
export interface Block {
  id: string;
  type: BlockType;
  content: any; // Содержимое зависит от типа блока
  format?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    backgroundColor?: string;
  };
}

interface NotionBlockWidgetProps {
  block: Block;
  index: number;
  isEditing: boolean;
  onUpdate: (id: string, updatedBlock: Block) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddBlockBelow: (id: string, type: BlockType) => void;
  readOnly?: boolean;
}

const NotionBlockWidget: React.FC<NotionBlockWidgetProps> = ({
  block,
  index,
  isEditing,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onAddBlockBelow,
  readOnly = false
}) => {
  // Состояния компонента
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [typeMenuOpen, setTypeMenuOpen] = useState<boolean>(false);
  const [formatMenuOpen, setFormatMenuOpen] = useState<boolean>(false);
  const [showToolbar, setShowToolbar] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string>('');
  
  const contentRef = useRef<HTMLDivElement>(null);
  const typeButtonRef = useRef<HTMLDivElement>(null);
  
  // Открытие меню опций
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (readOnly) return;
    setMenuAnchor(event.currentTarget);
  };
  
  // Закрытие меню опций
  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };
  
  // Переключение меню типов блоков
  const toggleTypeMenu = () => {
    if (readOnly) return;
    setTypeMenuOpen(!typeMenuOpen);
  };
  
  // Изменение типа блока
  const changeBlockType = (newType: BlockType) => {
    if (readOnly) return;
    
    let newContent = block.content;
    
    // Конвертация контента в зависимости от нового типа блока
    if (newType === 'to-do' && typeof block.content === 'string') {
      newContent = { text: block.content, checked: false };
    } else if ((newType === 'paragraph' || newType.startsWith('heading')) && 
               typeof block.content !== 'string' && block.content.text) {
      newContent = block.content.text;
    }
    
    onUpdate(block.id, {
      ...block,
      type: newType,
      content: newContent
    });
    
    setTypeMenuOpen(false);
  };
  
  // Обновление содержимого текстового блока
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (readOnly) return;
    
    if (block.type === 'to-do') {
      onUpdate(block.id, {
        ...block,
        content: {
          ...block.content,
          text: e.target.value
        }
      });
    } else {
      onUpdate(block.id, {
        ...block,
        content: e.target.value
      });
    }
  };
  
  // Обработка изменения статуса чекбокса
  const handleCheckboxChange = () => {
    if (readOnly || block.type !== 'to-do') return;
    
    onUpdate(block.id, {
      ...block,
      content: {
        ...block.content,
        checked: !block.content.checked
      }
    });
  };
  
  // Применение форматирования к тексту
  const applyFormat = (formatType: 'bold' | 'italic' | 'underline' | 'color') => {
    if (readOnly || !block.format) return;
    
    onUpdate(block.id, {
      ...block,
      format: {
        ...block.format,
        [formatType]: !block.format[formatType]
      }
    });
  };
  
  // Иконка для типа блока
  const getBlockTypeIcon = () => {
    switch (block.type) {
      case 'paragraph':
        return <TextFieldsIcon fontSize="small" />;
      case 'heading-1':
        return <Typography variant="subtitle2">H1</Typography>;
      case 'heading-2':
        return <Typography variant="subtitle2">H2</Typography>;
      case 'heading-3':
        return <Typography variant="subtitle2">H3</Typography>;
      case 'bulleted-list':
        return <FormatListBulletedIcon fontSize="small" />;
      case 'numbered-list':
        return <FormatListNumberedIcon fontSize="small" />;
      case 'to-do':
        return <CheckBoxOutlinedIcon fontSize="small" />;
      case 'image':
        return <ImageIcon fontSize="small" />;
      case 'code':
        return <CodeIcon fontSize="small" />;
      case 'table':
        return <TableChartIcon fontSize="small" />;
      default:
        return <TextFieldsIcon fontSize="small" />;
    }
  };
  
  // Название типа блока
  const getBlockTypeName = () => {
    switch (block.type) {
      case 'paragraph':
        return 'Текст';
      case 'heading-1':
        return 'Заголовок 1';
      case 'heading-2':
        return 'Заголовок 2';
      case 'heading-3':
        return 'Заголовок 3';
      case 'bulleted-list':
        return 'Маркированный список';
      case 'numbered-list':
        return 'Нумерованный список';
      case 'to-do':
        return 'Список задач';
      case 'image':
        return 'Изображение';
      case 'code':
        return 'Код';
      case 'table':
        return 'Таблица';
      default:
        return 'Текст';
    }
  };
  
  // Рендеринг содержимого блока в зависимости от типа
  const renderBlockContent = () => {
    if (readOnly) {
      // Режим только для чтения
      switch (block.type) {
        case 'paragraph':
          return <Typography>{block.content}</Typography>;
        case 'heading-1':
          return <Typography variant="h4">{block.content}</Typography>;
        case 'heading-2':
          return <Typography variant="h5">{block.content}</Typography>;
        case 'heading-3':
          return <Typography variant="h6">{block.content}</Typography>;
        case 'bulleted-list':
          return (
            <Box sx={{ pl: 2 }}>
              <Typography component="ul">
                <li>{block.content}</li>
              </Typography>
            </Box>
          );
        case 'numbered-list':
          return (
            <Box sx={{ pl: 2 }}>
              <Typography component="ol">
                <li>{block.content}</li>
              </Typography>
            </Box>
          );
        case 'to-do':
          return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckBoxOutlinedIcon 
                sx={{ mr: 1, color: block.content.checked ? 'success.main' : 'text.secondary' }} 
              />
              <Typography
                sx={{ textDecoration: block.content.checked ? 'line-through' : 'none' }}
              >
                {block.content.text}
              </Typography>
            </Box>
          );
        default:
          return <Typography>{JSON.stringify(block.content)}</Typography>;
      }
    } else {
      // Режим редактирования
      switch (block.type) {
        case 'paragraph':
          return (
            <TextField
              fullWidth
              multiline
              variant="standard"
              InputProps={{ disableUnderline: true }}
              value={block.content || ''}
              onChange={handleTextChange}
              placeholder="Введите текст..."
              sx={{ fontSize: '1rem' }}
            />
          );
        case 'heading-1':
          return (
            <TextField
              fullWidth
              variant="standard"
              InputProps={{ 
                disableUnderline: true,
                sx: { fontSize: '2rem', fontWeight: 'bold' }
              }}
              value={block.content || ''}
              onChange={handleTextChange}
              placeholder="Заголовок 1"
            />
          );
        case 'heading-2':
          return (
            <TextField
              fullWidth
              variant="standard"
              InputProps={{ 
                disableUnderline: true,
                sx: { fontSize: '1.5rem', fontWeight: 'bold' }
              }}
              value={block.content || ''}
              onChange={handleTextChange}
              placeholder="Заголовок 2"
            />
          );
        case 'heading-3':
          return (
            <TextField
              fullWidth
              variant="standard"
              InputProps={{ 
                disableUnderline: true,
                sx: { fontSize: '1.17rem', fontWeight: 'bold' }
              }}
              value={block.content || ''}
              onChange={handleTextChange}
              placeholder="Заголовок 3"
            />
          );
        case 'bulleted-list':
          return (
            <Box sx={{ pl: 2 }}>
              <TextField
                fullWidth
                variant="standard"
                InputProps={{ 
                  disableUnderline: true,
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>•</Box>
                }}
                value={block.content || ''}
                onChange={handleTextChange}
                placeholder="Элемент списка"
              />
            </Box>
          );
        case 'numbered-list':
          return (
            <Box sx={{ pl: 2 }}>
              <TextField
                fullWidth
                variant="standard"
                InputProps={{ 
                  disableUnderline: true,
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>{index + 1}.</Box>
                }}
                value={block.content || ''}
                onChange={handleTextChange}
                placeholder="Элемент списка"
              />
            </Box>
          );
        case 'to-do':
          return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={handleCheckboxChange} size="small" sx={{ mr: 1 }}>
                <CheckBoxOutlinedIcon 
                  color={block.content.checked ? 'primary' : 'action'} 
                />
              </IconButton>
              <TextField
                fullWidth
                variant="standard"
                InputProps={{ 
                  disableUnderline: true,
                  sx: { 
                    textDecoration: block.content.checked ? 'line-through' : 'none',
                    color: block.content.checked ? 'text.secondary' : 'text.primary'
                  }
                }}
                value={block.content.text || ''}
                onChange={handleTextChange}
                placeholder="Задача"
              />
            </Box>
          );
        default:
          return (
            <TextField
              fullWidth
              multiline
              variant="standard"
              InputProps={{ disableUnderline: true }}
              value={typeof block.content === 'string' ? block.content : JSON.stringify(block.content)}
              onChange={handleTextChange}
              placeholder="Введите текст..."
            />
          );
      }
    }
  };
  
  // Эффект для обработки выделения текста
  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.getSelection && contentRef.current?.contains(document.getSelection()?.anchorNode || null)) {
        const selection = document.getSelection();
        if (selection && selection.toString() !== '') {
          setSelectedText(selection.toString());
          setShowToolbar(true);
        } else {
          setShowToolbar(false);
        }
      }
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);
  
  // Список типов блоков
  const blockTypes = [
    { type: 'paragraph', icon: <TextFieldsIcon />, label: 'Текст', shortcut: '/' },
    { type: 'heading-1', icon: <Typography variant="subtitle2">H1</Typography>, label: 'Заголовок 1', shortcut: '# ' },
    { type: 'heading-2', icon: <Typography variant="subtitle2">H2</Typography>, label: 'Заголовок 2', shortcut: '## ' },
    { type: 'heading-3', icon: <Typography variant="subtitle2">H3</Typography>, label: 'Заголовок 3', shortcut: '### ' },
    { type: 'bulleted-list', icon: <FormatListBulletedIcon />, label: 'Маркированный список', shortcut: '* ' },
    { type: 'numbered-list', icon: <FormatListNumberedIcon />, label: 'Нумерованный список', shortcut: '1. ' },
    { type: 'to-do', icon: <CheckBoxOutlinedIcon />, label: 'Список задач', shortcut: '[] ' },
    { type: 'image', icon: <ImageIcon />, label: 'Изображение', shortcut: '/image' },
    { type: 'code', icon: <CodeIcon />, label: 'Код', shortcut: '```' },
    { type: 'table', icon: <TableChartIcon />, label: 'Таблица', shortcut: '/table' },
  ];
  
  return (
    <BlockContainer>
      {isEditing && !readOnly && (
        <BlockHandle className="block-handle">
          <Tooltip title="Перетащить блок">
            <IconButton size="small">
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Кнопка добавления нового блока */}
          <Tooltip title="Добавить блок">
            <IconButton 
              size="small"
              onClick={() => onAddBlockBelow(block.id, 'paragraph')}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </BlockHandle>
      )}
      
      <BlockContent elevation={0}>
        {isEditing && !readOnly && (
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Box 
              ref={typeButtonRef} 
              position="relative"
            >
              <BlockTypeButton onClick={toggleTypeMenu}>
                {getBlockTypeIcon()}
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {getBlockTypeName()}
                </Typography>
              </BlockTypeButton>
              
              <Collapse in={typeMenuOpen}>
                <BlockTypeMenu>
                  {blockTypes.map((item) => (
                    <BlockTypeMenuItem 
                      key={item.type} 
                      onClick={() => changeBlockType(item.type as BlockType)}
                    >
                      <Box className="icon">{item.icon}</Box>
                      <Typography className="label" variant="body2">{item.label}</Typography>
                      <Typography className="shortcut">{item.shortcut}</Typography>
                    </BlockTypeMenuItem>
                  ))}
                </BlockTypeMenu>
              </Collapse>
            </Box>
            
            <Box sx={{ ml: 'auto' }}>
              <IconButton size="small" onClick={handleOpenMenu}>
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
        
        <Box ref={contentRef} sx={{ position: 'relative' }}>
          {showToolbar && (
            <FormatToolbar>
              <Tooltip title="Полужирный">
                <IconButton size="small" onClick={() => applyFormat('bold')}>
                  <FormatBoldIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Курсив">
                <IconButton size="small" onClick={() => applyFormat('italic')}>
                  <FormatItalicIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Подчеркнутый">
                <IconButton size="small" onClick={() => applyFormat('underline')}>
                  <FormatUnderlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Цвет текста">
                <IconButton size="small" onClick={() => applyFormat('color')}>
                  <FormatColorTextIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </FormatToolbar>
          )}
          
          {renderBlockContent()}
        </Box>
      </BlockContent>
      
      {/* Меню опций блока */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => { 
          handleCloseMenu(); 
          onDelete(block.id); 
        }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
        <MenuItem onClick={() => { 
          handleCloseMenu(); 
          onDuplicate(block.id); 
        }}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Дублировать
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { 
          handleCloseMenu(); 
          onMoveUp(block.id); 
        }}>
          <ArrowUpwardIcon fontSize="small" sx={{ mr: 1 }} />
          Переместить вверх
        </MenuItem>
        <MenuItem onClick={() => { 
          handleCloseMenu(); 
          onMoveDown(block.id); 
        }}>
          <ArrowDownwardIcon fontSize="small" sx={{ mr: 1 }} />
          Переместить вниз
        </MenuItem>
      </Menu>
    </BlockContainer>
  );
};

export default NotionBlockWidget; 