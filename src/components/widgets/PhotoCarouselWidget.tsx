import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Button, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Tooltip, Snackbar, Alert, Fade, Paper, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SaveIcon from '@mui/icons-material/Save';
import styled from 'styled-components';

const CarouselContainer = styled(Box)`
  position: relative;
  width: 100%;
  height: 320px;
  overflow: hidden;
  border-radius: 12px;
  background-color: #f0f0f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`;

const CarouselImage = styled.img<{ isActive: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${props => props.isActive ? 1 : 0};
  transition: opacity 0.5s ease-in-out, transform 0.3s ease;
  transform: scale(${props => props.isActive ? 1 : 1.05});
`;

const NavigationButton = styled(IconButton)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 10;
  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
`;

const IndicatorContainer = styled(Box)`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const Indicator = styled(Box)<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#fff' : 'rgba(255, 255, 255, 0.5)'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.2);
    background-color: ${props => props.active ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  }
`;

const PhotoThumbnail = styled(Box)<{ active: boolean }>`
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: ${props => props.active ? 1 : 0.6};
  border: ${props => props.active ? '2px solid #1976d2' : '2px solid transparent'};
  
  &:hover {
    opacity: 1;
    transform: translateY(-3px);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ImageOverlay = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7) 100%);
  z-index: 1;
  pointer-events: none;
`;

const PhotoInfo = styled(Box)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  z-index: 2;
  color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
`;

interface Photo {
  id: string;
  url: string;
  caption?: string;
  date?: string;
  location?: string;
}

interface PhotoCarouselWidgetProps {
  content: {
    photos: Photo[];
    title?: string;
  };
  onUpdate: (content: any) => void;
  isEditing: boolean;
  onDelete: () => void;
}

const PhotoCarouselWidget: React.FC<PhotoCarouselWidgetProps> = ({
  content,
  onUpdate,
  isEditing,
  onDelete
}) => {
  const [photos, setPhotos] = useState<Photo[]>(content.photos || []);
  const [title, setTitle] = useState(content.title || 'Фотоальбом');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLocalEditing, setIsLocalEditing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoLocation, setNewPhotoLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Синхронизация с пропсами
  useEffect(() => {
    if (content.photos && JSON.stringify(content.photos) !== JSON.stringify(photos)) {
      setPhotos(content.photos);
    }
    if (content.title !== undefined && content.title !== title) {
      setTitle(content.title);
    }
  }, [content]);

  // Сохранение изменений в общий стейт
  const saveChanges = () => {
    onUpdate({
      photos,
      title
    });
    setIsLocalEditing(false);
  };

  const handleNext = () => {
    if (photos.length < 2) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  const handlePrev = () => {
    if (photos.length < 2) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  const handleAddPhotoFromURL = () => {
    if (!newPhotoUrl.trim()) {
      setUploadError('Пожалуйста, укажите URL изображения');
      return;
    }

    setLoading(true);

    // Проверка URL изображения
    const img = new Image();
    img.onload = () => {
      const newPhoto: Photo = {
        id: Date.now().toString(),
        url: newPhotoUrl,
        caption: newPhotoCaption,
        location: newPhotoLocation,
        date: new Date().toISOString().split('T')[0]
      };
      
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      onUpdate({ photos: updatedPhotos, title });
      
      setNewPhotoUrl('');
      setNewPhotoCaption('');
      setNewPhotoLocation('');
      setShowAddDialog(false);
      setLoading(false);
    };
    
    img.onerror = () => {
      setLoading(false);
      setUploadError('Невозможно загрузить изображение с этого URL');
    };
    
    img.src = newPhotoUrl;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Выбран неверный тип файла. Пожалуйста, выберите изображение.');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
    const newPhoto: Photo = {
      id: Date.now().toString(),
        url: event.target?.result as string,
        caption: '',
        date: new Date().toISOString().split('T')[0]
      };
      
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      onUpdate({ photos: updatedPhotos, title });
      
      setLoading(false);
    };
    
    reader.onerror = () => {
      setLoading(false);
      setUploadError('Ошибка при чтении файла');
    };
    
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (id: string) => {
    const newPhotos = photos.filter(photo => photo.id !== id);
    setPhotos(newPhotos);
    onUpdate({ photos: newPhotos, title });
    
    if (currentIndex >= newPhotos.length) {
      setCurrentIndex(Math.max(0, newPhotos.length - 1));
    }
  };

  const handleEditCaption = (id: string, newCaption: string) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === id ? { ...photo, caption: newCaption } : photo
    );
    setPhotos(updatedPhotos);
    onUpdate({ photos: updatedPhotos, title });
  };
  
  const handleEditLocation = (id: string, newLocation: string) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === id ? { ...photo, location: newLocation } : photo
    );
    setPhotos(updatedPhotos);
    onUpdate({ photos: updatedPhotos, title });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDismissError = () => {
    setUploadError('');
  };

  // Обработчик перемещения фото (изменения порядка)
  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 || 
      fromIndex >= photos.length || 
      toIndex < 0 || 
      toIndex >= photos.length
    ) return;
    
    const updatedPhotos = [...photos];
    const [movedItem] = updatedPhotos.splice(fromIndex, 1);
    updatedPhotos.splice(toIndex, 0, movedItem);
    
    setPhotos(updatedPhotos);
    onUpdate({ photos: updatedPhotos, title });
    setCurrentIndex(toIndex);
  };

  // Перемещение фото влево/вправо
  const movePhotoLeft = (index: number) => {
    if (index > 0) {
      movePhoto(index, index - 1);
    }
  };
  
  const movePhotoRight = (index: number) => {
    if (index < photos.length - 1) {
      movePhoto(index, index + 1);
    }
  };

  // Авто-прокрутка для эскизов
  const scrollToCurrentThumbnail = (thumbnailIndex: number) => {
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    if (!thumbnailsContainer) return;
    
    const thumbnailElement = thumbnailsContainer.children[thumbnailIndex] as HTMLElement;
    if (thumbnailElement) {
      thumbnailsContainer.scrollLeft = thumbnailElement.offsetLeft - thumbnailsContainer.offsetWidth / 2 + thumbnailElement.offsetWidth / 2;
    }
  };

  useEffect(() => {
    if (showThumbnails) {
      scrollToCurrentThumbnail(currentIndex);
    }
  }, [currentIndex, showThumbnails]);

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      {/* Заголовок альбома */}
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isLocalEditing ? (
          <TextField
            size="small"
            value={title}
            onChange={handleTitleChange}
            placeholder="Название альбома"
            sx={{ mb: 1 }}
            fullWidth
          />
        ) : (
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
            {title}
            {photos.length > 0 && (
              <Chip 
                size="small" 
                label={`${photos.length} фото`} 
                sx={{ ml: 1, fontSize: '0.7rem' }} 
                variant="outlined" 
              />
            )}
          </Typography>
        )}
        
        {isEditing && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              if (isLocalEditing) {
                saveChanges();
              }
              setIsLocalEditing(!isLocalEditing);
            }}
            startIcon={isLocalEditing ? <SaveIcon /> : <EditIcon />}
          >
            {isLocalEditing ? 'Сохранить' : 'Редактировать'}
          </Button>
        )}
      </Box>

      {photos.length === 0 ? (
        <Paper 
          elevation={1} 
          sx={{ 
            height: 300, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 3,
            backgroundColor: 'rgba(0,0,0,0.03)'
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Этот альбом пока пуст
          </Typography>
          {(isEditing || isLocalEditing) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddDialog(true)}
            >
              Добавить фото
            </Button>
          )}
        </Paper>
      ) : (
        <>
      <CarouselContainer>
        {photos.map((photo, index) => (
          <CarouselImage
            key={photo.id}
            src={photo.url}
                alt={photo.caption || `Фото ${index + 1}`}
            isActive={index === currentIndex}
                onClick={() => setShowFullScreen(true)}
                style={{ cursor: 'pointer' }}
          />
        ))}
            
            <ImageOverlay />
            
            {photos[currentIndex]?.caption && (
              <PhotoInfo>
                <Typography variant="body1" fontWeight="medium">
                  {photos[currentIndex].caption}
                </Typography>
                {photos[currentIndex].location && (
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    <span className="material-icons" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>
                      location_on
                    </span>
                    {photos[currentIndex].location}
                  </Typography>
                )}
              </PhotoInfo>
            )}

        {photos.length > 1 && (
          <>
            <NavigationButton
              onClick={handlePrev}
              sx={{ left: 8 }}
                  size="small"
            >
              <NavigateBeforeIcon />
            </NavigationButton>
            <NavigationButton
              onClick={handleNext}
              sx={{ right: 8 }}
                  size="small"
            >
              <NavigateNextIcon />
            </NavigationButton>
          </>
        )}

            <IndicatorContainer>
              {photos.map((_, index) => (
                <Indicator
                  key={index}
                  active={index === currentIndex}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </IndicatorContainer>
            
            {/* Полноэкранный режим */}
            <Tooltip title="Полноэкранный просмотр">
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(255,255,255,0.7)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
                size="small"
                onClick={() => setShowFullScreen(true)}
              >
                <FullscreenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Кнопка показа/скрытия эскизов */}
            <Tooltip title={showThumbnails ? "Скрыть эскизы" : "Показать эскизы"}>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: -16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  '&:hover': { bgcolor: 'white' },
                  zIndex: 20,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                size="small"
                onClick={() => setShowThumbnails(!showThumbnails)}
              >
                <KeyboardArrowDownIcon 
                  fontSize="small" 
                  sx={{ 
                    transform: showThumbnails ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }} 
                />
              </IconButton>
            </Tooltip>
          </CarouselContainer>

          {/* Миниатюры фотографий */}
          <Fade in={showThumbnails}>
            <Box
              id="thumbnails-container"
              sx={{ 
                display: 'flex',
                overflowX: 'auto', 
                pb: 2,
                pt: 1,
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': {
                  height: '8px',
                  borderRadius: '4px'
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.25)'
                  }
                }
              }}
            >
              {photos.map((photo, index) => (
                <PhotoThumbnail
                  key={photo.id}
                  active={index === currentIndex}
                  onClick={() => setCurrentIndex(index)}
                  sx={{ position: 'relative' }}
                >
                  <img src={photo.url} alt={photo.caption || `Миниатюра ${index + 1}`} />
                  
                  {/* Панель редактирования для каждой миниатюры */}
                  {isLocalEditing && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {index > 0 && (
                          <IconButton 
                            size="small" 
                            sx={{ p: '3px', bgcolor: 'rgba(255,255,255,0.9)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              movePhotoLeft(index);
                            }}
                          >
                            <NavigateBeforeIcon fontSize="small" />
                          </IconButton>
                        )}
                        
                        <IconButton 
                          size="small" 
                          sx={{ p: '3px', bgcolor: 'rgba(255,255,255,0.9)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const caption = prompt('Подпись к фото:', photo.caption);
                            if (caption !== null) {
                              handleEditCaption(photo.id, caption);
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton 
                          size="small" 
                          sx={{ p: '3px', bgcolor: 'rgba(255,255,255,0.9)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        
                        {index < photos.length - 1 && (
                          <IconButton 
                            size="small" 
                            sx={{ p: '3px', bgcolor: 'rgba(255,255,255,0.9)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              movePhotoRight(index);
                            }}
                          >
                            <NavigateNextIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  )}
                </PhotoThumbnail>
              ))}
              
              {/* Кнопка добавления фото */}
              {isLocalEditing && (
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '2px dashed rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    ml: 0.5,
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }}
                  onClick={() => setShowAddDialog(true)}
                >
                  <AddIcon color="action" />
                </Box>
              )}
            </Box>
          </Fade>
        </>
      )}

      {/* Диалог добавления фото */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Добавить фотографию</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Загрузить с устройства:
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              fullWidth
              sx={{ mb: 2 }}
            >
              Выбрать файл
            </Button>
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <Typography variant="subtitle2" gutterBottom>
              Или добавить по ссылке:
            </Typography>
            <TextField
              fullWidth
              label="URL изображения"
              variant="outlined"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              margin="dense"
              InputProps={{
                startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            
            <TextField
              fullWidth
              label="Подпись (необязательно)"
              variant="outlined"
              value={newPhotoCaption}
              onChange={(e) => setNewPhotoCaption(e.target.value)}
              margin="dense"
              sx={{ mt: 2 }}
            />
            
            <TextField
              fullWidth
              label="Место съемки (необязательно)"
              variant="outlined"
              value={newPhotoLocation}
              onChange={(e) => setNewPhotoLocation(e.target.value)}
              margin="dense"
              sx={{ mt: 2 }}
              InputProps={{
                startAdornment: (
                  <span className="material-icons" style={{ fontSize: 18, marginRight: 8, opacity: 0.6 }}>
                    location_on
                  </span>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleAddPhotoFromURL} 
            variant="contained" 
            disabled={loading || !newPhotoUrl.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Загрузка...' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Полноэкранный просмотр */}
      <Dialog
        open={showFullScreen}
        onClose={() => setShowFullScreen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.95)',
            color: 'white',
            backgroundImage: 'none',
            height: '90vh'
          }
        }}
          >
        <Box sx={{ 
          position: 'relative', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <IconButton
            onClick={() => setShowFullScreen(false)}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
          >
            <DeleteIcon />
          </IconButton>
          
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1
          }}>
            {photos.length > 1 && (
              <IconButton
                onClick={handlePrev}
                sx={{ color: 'white', mx: 2 }}
              >
                <NavigateBeforeIcon fontSize="large" />
              </IconButton>
            )}
            
            <Box sx={{ 
                position: 'relative',
              height: '80vh',
              width: '80%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <img
                src={photos[currentIndex]?.url}
                alt={photos[currentIndex]?.caption || `Фото ${currentIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
            
            {photos.length > 1 && (
              <IconButton
                onClick={handleNext}
                sx={{ color: 'white', mx: 2 }}
              >
                <NavigateNextIcon fontSize="large" />
              </IconButton>
            )}
          </Box>
          
          {photos[currentIndex]?.caption && (
            <Box sx={{ 
              p: 2, 
              textAlign: 'center',
              maxWidth: '80%',
              mx: 'auto'
            }}>
              <Typography variant="h6">
                {photos[currentIndex].caption}
              </Typography>
              {photos[currentIndex].location && (
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                  <span className="material-icons" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>
                    location_on
                  </span>
                  {photos[currentIndex].location}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Уведомление об ошибке */}
      <Snackbar
        open={!!uploadError}
        autoHideDuration={5000}
        onClose={handleDismissError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleDismissError} severity="error" sx={{ width: '100%' }}>
          {uploadError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PhotoCarouselWidget; 