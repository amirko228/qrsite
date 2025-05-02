import React, { useState } from 'react';
import { Box, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import styled from 'styled-components';

const ImageContainer = styled(Box)`
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 8px;
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

interface PhotoWidgetProps {
  content: {
    url: string;
    caption: string;
  };
  onUpdate: (content: { url: string; caption: string }) => void;
  isEditing: boolean;
}

const PhotoWidget: React.FC<PhotoWidgetProps> = ({
  content,
  onUpdate,
  isEditing
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editUrl, setEditUrl] = useState(content.url || 'https://via.placeholder.com/400x300');
  const [editCaption, setEditCaption] = useState(content.caption || '');

  const handleSave = () => {
    onUpdate({
      url: editUrl,
      caption: editCaption
    });
    setIsEditDialogOpen(false);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <ImageContainer>
        <StyledImage 
          src={content.url || 'https://via.placeholder.com/400x300'} 
          alt={content.caption || 'Фотография'} 
        />
      </ImageContainer>
      {isEditing && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={() => setIsEditDialogOpen(true)} 
            size="small"
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            <EditIcon />
          </IconButton>
        </Box>
      )}

      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Редактировать фотографию</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="URL изображения"
              fullWidth
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
            />
            <TextField
              label="Подпись"
              fullWidth
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhotoWidget; 