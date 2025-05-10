import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Button,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Menu,
  MenuItem,
  Divider,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Chip,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { styled } from '@mui/material/styles';

// Стилизованные компоненты
const GalleryContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  boxShadow: 'rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 2px 4px',
  marginBottom: theme.spacing(3),
}));

const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
  }
}));

const SearchField = styled(TextField)(({ theme }) => ({
  flex: 1,
  marginRight: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    marginRight: 0,
    width: '100%',
  }
}));

const ViewToggleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(0.5),
  overflow: 'hidden',
}));

const GalleryCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  }
}));

const GalleryListItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  }
}));

const TagsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(1),
}));

// Цвета для тегов
const tagColors = [
  { name: 'blue', bg: '#E6F7FF', color: '#1890FF' },
  { name: 'green', bg: '#E6FFFB', color: '#13C2C2' },
  { name: 'red', bg: '#FFF1F0', color: '#F5222D' },
  { name: 'orange', bg: '#FFF7E6', color: '#FA8C16' },
  { name: 'purple', bg: '#F9F0FF', color: '#722ED1' },
  { name: 'yellow', bg: '#FEFFE6', color: '#FADB14' },
  { name: 'cyan', bg: '#E6FFFB', color: '#13C2C2' },
  { name: 'pink', bg: '#FFF0F6', color: '#EB2F96' },
  { name: 'lime', bg: '#FCFFE6', color: '#A0D911' },
  { name: 'geekblue', bg: '#F0F5FF', color: '#2F54EB' },
  { name: 'gold', bg: '#FFFBE6', color: '#FAAD14' },
  { name: 'volcano', bg: '#FFF2E8', color: '#FA541C' },
];

// Интерфейсы
interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  date?: string;
  tags: string[];
  properties: Record<string, any>;
}

interface GalleryDatabaseWidgetProps {
  content: {
    title: string;
    items: GalleryItem[];
    properties: Array<{
      name: string;
      type: 'text' | 'date' | 'select' | 'multiselect' | 'number' | 'checkbox';
      options?: string[];
    }>;
  };
  onUpdate: (content: any) => void;
  isEditing: boolean;
  onDelete?: () => void;
  readOnly?: boolean;
}

// Компонент
const GalleryDatabaseWidget: React.FC<GalleryDatabaseWidgetProps> = ({
  content,
  onUpdate,
  isEditing,
  onDelete,
  readOnly = false,
}) => {
  // Состояния
  const [title, setTitle] = useState(content.title || 'Галерея');
  const [items, setItems] = useState<GalleryItem[]>(content.items || []);
  const [properties, setProperties] = useState(content.properties || []);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState<Partial<GalleryItem>>({
    title: '',
    imageUrl: '',
    description: '',
    tags: [],
    properties: {}
  });
  
  // Синхронизация с пропсами
  useEffect(() => {
    setTitle(content.title || 'Галерея');
    setItems(content.items || []);
    setProperties(content.properties || []);
  }, [content]);
  
  // Сохранение изменений
  const handleSaveChanges = () => {
    onUpdate({
      title,
      items,
      properties
    });
  };
  
  // Обработка поиска
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Обработка сортировки
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Обработка фильтрации по тегу
  const handleFilterByTag = (tag: string | null) => {
    setFilterTag(tag);
  };
  
  // Добавление нового элемента
  const handleAddItem = () => {
    if (!newItem.title || !newItem.imageUrl) return;
    
    const itemProperties: Record<string, any> = {};
    properties.forEach(prop => {
      itemProperties[prop.name] = newItem.properties?.[prop.name] || '';
    });
    
    const newGalleryItem: GalleryItem = {
      id: Date.now().toString(),
      imageUrl: newItem.imageUrl || '',
      title: newItem.title || '',
      description: newItem.description || '',
      date: new Date().toISOString().split('T')[0],
      tags: newItem.tags || [],
      properties: itemProperties
    };
    
    setItems([...items, newGalleryItem]);
    setShowAddDialog(false);
    setNewItem({
      title: '',
      imageUrl: '',
      description: '',
      tags: [],
      properties: {}
    });
    
    // Сохраняем изменения
    onUpdate({
      title,
      items: [...items, newGalleryItem],
      properties
    });
  };
  
  // Удаление элемента
  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    setMenuAnchor(null);
    
    // Сохраняем изменения
    onUpdate({
      title,
      items: updatedItems,
      properties
    });
  };
  
  // Открытие меню элемента
  const handleOpenItemMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedItemId(id);
  };
  
  // Закрытие меню элемента
  const handleCloseItemMenu = () => {
    setMenuAnchor(null);
    setSelectedItemId(null);
  };
  
  // Редактирование элемента
  const handleEditItem = () => {
    if (!selectedItemId) return;
    
    const itemToEdit = items.find(item => item.id === selectedItemId);
    if (!itemToEdit) return;
    
    setNewItem({
      title: itemToEdit.title,
      imageUrl: itemToEdit.imageUrl,
      description: itemToEdit.description || '',
      tags: itemToEdit.tags,
      properties: itemToEdit.properties
    });
    
    setShowAddDialog(true);
    setMenuAnchor(null);
  };
  
  // Добавление/удаление тега
  const handleTagToggle = (tag: string) => {
    if (!newItem.tags) return;
    
    const currentTags = [...newItem.tags];
    if (currentTags.includes(tag)) {
      setNewItem({
        ...newItem,
        tags: currentTags.filter(t => t !== tag)
      });
    } else {
      setNewItem({
        ...newItem,
        tags: [...currentTags, tag]
      });
    }
  };
  
  // Изменение значения свойства нового элемента
  const handlePropertyChange = (propName: string, value: any) => {
    setNewItem({
      ...newItem,
      properties: {
        ...newItem.properties,
        [propName]: value
      }
    });
  };
  
  // Получение уникальных тегов из всех элементов
  const getAllTags = () => {
    const tags = new Set<string>();
    items.forEach(item => {
      item.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };
  
  // Фильтрация и сортировка элементов
  const getFilteredAndSortedItems = () => {
    return items
      .filter(item => {
        // Поиск
        const matchesSearch = 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Фильтр по тегу
        const matchesTag = filterTag ? item.tags.includes(filterTag) : true;
        
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        // Сортировка
        if (sortField === 'title') {
          return sortDirection === 'asc' 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        } else if (sortField === 'date') {
          const dateA = a.date || '';
          const dateB = b.date || '';
          return sortDirection === 'asc'
            ? dateA.localeCompare(dateB)
            : dateB.localeCompare(dateA);
        } else {
          // Сортировка по другим свойствам
          const valueA = a.properties[sortField] || '';
          const valueB = b.properties[sortField] || '';
          
          if (typeof valueA === 'string' && typeof valueB === 'string') {
            return sortDirection === 'asc'
              ? valueA.localeCompare(valueB)
              : valueB.localeCompare(valueA);
          } else if (typeof valueA === 'number' && typeof valueB === 'number') {
            return sortDirection === 'asc'
              ? valueA - valueB
              : valueB - valueA;
          }
          return 0;
        }
      });
  };
  
  // Получение случайного цвета для тега
  const getTagColor = (tag: string) => {
    // Хэширование строки для получения постоянного цвета
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % tagColors.length;
    return tagColors[index];
  };
  
  const filteredItems = getFilteredAndSortedItems();
  const allTags = getAllTags();
  
  return (
    <GalleryContainer>
      {/* Заголовок галереи */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isEditing && !readOnly ? (
          <TextField
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="standard"
            fullWidth
            inputProps={{
              style: { fontSize: '1.5rem', fontWeight: 'bold' }
            }}
          />
        ) : (
          <Typography variant="h5" fontWeight="bold">
            {title}
          </Typography>
        )}
        
        {isEditing && !readOnly && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleSaveChanges}
            size="small"
          >
            Сохранить
          </Button>
        )}
      </Box>
      
      {/* Панель инструментов */}
      <ToolbarContainer>
        <SearchField
          placeholder="Поиск..."
          value={searchQuery}
          onChange={handleSearch}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Фильтр по тегам */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Теги</InputLabel>
            <Select
              value={filterTag || ''}
              onChange={(e) => handleFilterByTag(e.target.value || null)}
              label="Теги"
            >
              <MenuItem value="">Все теги</MenuItem>
              {allTags.map(tag => (
                <MenuItem key={tag} value={tag}>
                  {tag}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Сортировка */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Сортировка</InputLabel>
            <Select
              value={sortField}
              onChange={(e) => handleSort(e.target.value)}
              label="Сортировка"
            >
              <MenuItem value="title">По названию</MenuItem>
              <MenuItem value="date">По дате</MenuItem>
              {properties.map(prop => (
                <MenuItem key={prop.name} value={prop.name}>
                  По {prop.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Вид отображения */}
          <ViewToggleContainer>
            <IconButton 
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <ViewModuleIcon />
            </IconButton>
            <IconButton 
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ViewListIcon />
            </IconButton>
          </ViewToggleContainer>
        </Box>
      </ToolbarContainer>
      
      {/* Индикация активных фильтров */}
      {(filterTag || sortField !== 'title' || sortDirection !== 'asc') && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {filterTag && (
            <Chip 
              label={`Тег: ${filterTag}`}
              onDelete={() => handleFilterByTag(null)}
              size="small"
            />
          )}
          <Chip 
            label={`Сортировка: ${sortField} (${sortDirection === 'asc' ? '↑' : '↓'})`}
            size="small"
          />
        </Box>
      )}
      
      {/* Галерея в режиме сетки */}
      {viewMode === 'grid' && (
        <Grid container spacing={2}>
          {filteredItems.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <GalleryCard>
                <CardMedia
                  component="img"
                  height="160"
                  image={item.imageUrl}
                  alt={item.title}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" gutterBottom component="div" noWrap>
                      {item.title}
                    </Typography>
                    
                    {isEditing && !readOnly && (
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleOpenItemMenu(e, item.id)}
                      >
                        <MoreHorizIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  
                  {item.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                      {item.description}
                    </Typography>
                  )}
                  
                  {item.date && (
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      {new Date(item.date).toLocaleDateString()}
                    </Typography>
                  )}
                  
                  {/* Отображение дополнительных свойств */}
                  {properties.map(prop => {
                    const value = item.properties[prop.name];
                    if (!value) return null;
                    
                    return (
                      <Typography key={prop.name} variant="body2" gutterBottom>
                        <strong>{prop.name}:</strong> {value.toString()}
                      </Typography>
                    );
                  })}
                  
                  {/* Теги */}
                  {item.tags.length > 0 && (
                    <TagsContainer>
                      {item.tags.map(tag => {
                        const tagColor = getTagColor(tag);
                        return (
                          <Chip 
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{ 
                              backgroundColor: tagColor.bg,
                              color: tagColor.color,
                              fontSize: '0.75rem'
                            }}
                            onClick={() => handleFilterByTag(tag)}
                          />
                        );
                      })}
                    </TagsContainer>
                  )}
                </CardContent>
              </GalleryCard>
            </Grid>
          ))}
          
          {/* Добавление нового элемента */}
          {isEditing && !readOnly && (
            <Grid item xs={12} sm={6} md={4}>
              <Box
                sx={{
                  height: '100%',
                  minHeight: 250,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  }
                }}
                onClick={() => setShowAddDialog(true)}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <AddIcon fontSize="large" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Добавить элемент
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
      
      {/* Галерея в режиме списка */}
      {viewMode === 'list' && (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Box sx={{ 
            display: 'flex', 
            fontWeight: 'bold', 
            p: 1, 
            bgcolor: 'background.default', 
            borderBottom: 1, 
            borderColor: 'divider' 
          }}>
            <Box sx={{ width: 80 }}></Box>
            <Box sx={{ flex: 2 }}>Название</Box>
            <Box sx={{ flex: 1 }}>Дата</Box>
            <Box sx={{ flex: 1 }}>Теги</Box>
            <Box sx={{ width: 48 }}></Box>
          </Box>
          
          {filteredItems.map(item => (
            <GalleryListItem key={item.id}>
              <Box sx={{ width: 80, height: 50, mr: 1 }}>
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} 
                />
              </Box>
              <Box sx={{ flex: 2 }}>
                <Typography variant="body1" fontWeight="medium">
                  {item.title}
                </Typography>
                {item.description && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {item.description}
                  </Typography>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                {item.date && new Date(item.date).toLocaleDateString()}
              </Box>
              <Box sx={{ flex: 1 }}>
                {item.tags.slice(0, 2).map(tag => {
                  const tagColor = getTagColor(tag);
                  return (
                    <Chip 
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ 
                        backgroundColor: tagColor.bg,
                        color: tagColor.color,
                        fontSize: '0.7rem',
                        mr: 0.5,
                        mb: 0.5
                      }}
                      onClick={() => handleFilterByTag(tag)}
                    />
                  );
                })}
                {item.tags.length > 2 && (
                  <Chip 
                    label={`+${item.tags.length - 2}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              <Box sx={{ width: 48, display: 'flex', justifyContent: 'flex-end' }}>
                {isEditing && !readOnly && (
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleOpenItemMenu(e, item.id)}
                  >
                    <MoreHorizIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </GalleryListItem>
          ))}
          
          {/* Добавление нового элемента */}
          {isEditing && !readOnly && (
            <Box
              sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                }
              }}
              onClick={() => setShowAddDialog(true)}
            >
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">
                Добавить элемент
              </Typography>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Диалог добавления/редактирования элемента */}
      <Dialog 
        open={showAddDialog} 
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedItemId ? 'Редактировать элемент' : 'Добавить новый элемент'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Название"
            fullWidth
            margin="normal"
            value={newItem.title}
            onChange={(e) => setNewItem({...newItem, title: e.target.value})}
            required
          />
          
          <TextField
            label="URL изображения"
            fullWidth
            margin="normal"
            value={newItem.imageUrl}
            onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})}
            required
          />
          
          <TextField
            label="Описание"
            fullWidth
            margin="normal"
            value={newItem.description}
            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
            multiline
            rows={2}
          />
          
          {/* Поля свойств */}
          {properties.map(prop => (
            <FormControl key={prop.name} fullWidth margin="normal">
              <InputLabel>{prop.name}</InputLabel>
              <Select
                value={newItem.properties?.[prop.name] || ''}
                onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
                label={prop.name}
              >
                {prop.options?.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
          
          {/* Выбор тегов */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Теги
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {allTags.map(tag => {
              const isSelected = newItem.tags?.includes(tag);
              const tagColor = getTagColor(tag);
              return (
                <Chip 
                  key={tag}
                  label={tag}
                  onClick={() => handleTagToggle(tag)}
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  sx={{
                    backgroundColor: isSelected ? tagColor.bg : undefined,
                    color: isSelected ? tagColor.color : undefined,
                  }}
                />
              );
            })}
            <Chip 
              icon={<AddIcon />}
              label="Новый тег"
              variant="outlined"
              onClick={() => {
                const newTag = prompt('Введите новый тег:');
                if (newTag && newTag.trim() && !allTags.includes(newTag)) {
                  handleTagToggle(newTag);
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleAddItem} 
            variant="contained"
            disabled={!newItem.title || !newItem.imageUrl}
          >
            {selectedItemId ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Меню действий с элементом */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseItemMenu}
      >
        <MenuItem onClick={handleEditItem}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Редактировать
        </MenuItem>
        <MenuItem onClick={() => handleDeleteItem(selectedItemId || '')}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>
    </GalleryContainer>
  );
};

export default GalleryDatabaseWidget; 