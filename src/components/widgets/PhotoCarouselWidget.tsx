import React, { useState } from 'react';
import { Box, IconButton, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import styled from 'styled-components';

const CarouselContainer = styled(Box)`
  position: relative;
  width: 100%;
  height: 400px;
  overflow: hidden;
  border-radius: 8px;
  background-color: #000;
`;

const CarouselImage = styled.img<{ isActive: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${props => props.isActive ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
`;

const NavigationButton = styled(IconButton)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.5);
  &:hover {
    background-color: rgba(255, 255, 255, 0.8);
  }
`;

interface Photo {
  id: string;
  url: string;
}

interface PhotoCarouselWidgetProps {
  onDelete: () => void;
  onEdit: () => void;
  isEditing: boolean;
  initialPhotos?: Photo[];
}

const PhotoCarouselWidget: React.FC<PhotoCarouselWidgetProps> = ({
  onDelete,
  onEdit,
  isEditing,
  initialPhotos = []
}) => {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  const handleAddPhoto = () => {
    const newPhoto: Photo = {
      id: Date.now().toString(),
      url: 'https://via.placeholder.com/800x600'
    };
    setPhotos([...photos, newPhoto]);
  };

  const handleDeletePhoto = (id: string) => {
    const newPhotos = photos.filter(photo => photo.id !== id);
    setPhotos(newPhotos);
    if (currentIndex >= newPhotos.length) {
      setCurrentIndex(Math.max(0, newPhotos.length - 1));
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <CarouselContainer>
        {photos.map((photo, index) => (
          <CarouselImage
            key={photo.id}
            src={photo.url}
            alt={`Фото ${index + 1}`}
            isActive={index === currentIndex}
          />
        ))}
        {photos.length > 1 && (
          <>
            <NavigationButton
              onClick={handlePrev}
              sx={{ left: 8 }}
            >
              <NavigateBeforeIcon />
            </NavigationButton>
            <NavigationButton
              onClick={handleNext}
              sx={{ right: 8 }}
            >
              <NavigateNextIcon />
            </NavigationButton>
          </>
        )}
        {isEditMode && (
          <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddPhoto}
              variant="contained"
              sx={{ bgcolor: 'rgba(255,255,255,0.8)', color: 'black' }}
            >
              Добавить фото
            </Button>
          </Box>
        )}
      </CarouselContainer>
      {isEditing && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setIsEditMode(!isEditMode)}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={onDelete}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )}
      {isEditMode && photos.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          {photos.map((photo, index) => (
            <Box
              key={photo.id}
              sx={{
                position: 'relative',
                width: 60,
                height: 60,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: index === currentIndex ? '2px solid #1976d2' : 'none'
              }}
              onClick={() => setCurrentIndex(index)}
            >
              <img
                src={photo.url}
                alt={`Миниатюра ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(photo.id);
                }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bgcolor: 'rgba(255,255,255,0.8)',
                  p: 0.5
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PhotoCarouselWidget; 