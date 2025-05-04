import React, { useState } from 'react';
import { Box, Typography, Button, TextField, IconButton } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';

export interface PhotoWidgetProps {
  content: {
    url: string;
    caption: string;
  };
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

const PhotoWidget: React.FC<PhotoWidgetProps> = ({ content, onContentChange, readOnly = false }) => {
  const [caption, setCaption] = useState(content.caption || '');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  
  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaption(e.target.value);
  };
  
  const handleSaveCaption = () => {
    onContentChange({
      ...content,
      caption
    });
    setIsEditingCaption(false);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onContentChange({
          ...content,
          url: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'rgba(0,0,0,0.03)',
          backgroundImage: content.url ? `url(${content.url})` : 'none',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {!content.url && (
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadIcon />}
          >
            Загрузить изображение
            <input 
              type="file" 
              hidden 
              accept="image/*" 
              onChange={handleImageChange}
            />
          </Button>
        )}
        
        {content.url && (
          <IconButton 
            sx={{ position: 'absolute', bottom: 8, right: 8 }}
            component="label"
          >
            <UploadIcon />
            <input 
              type="file" 
              hidden 
              accept="image/*" 
              onChange={handleImageChange}
            />
          </IconButton>
        )}
      </Box>
      
      {!isEditingCaption ? (
        <Typography 
          variant="caption" 
          component="div" 
          align="center" 
          sx={{ 
            mt: 1, 
            cursor: 'pointer', 
            '&:hover': { textDecoration: 'underline' } 
          }}
          onClick={() => setIsEditingCaption(true)}
        >
          {content.caption || 'Добавить подпись (нажмите)'}
        </Typography>
      ) : (
        <Box sx={{ mt: 1, display: 'flex' }}>
          <TextField
            fullWidth
            size="small"
            value={caption}
            onChange={handleCaptionChange}
            onBlur={handleSaveCaption}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveCaption()}
            autoFocus
            placeholder="Введите подпись"
          />
        </Box>
      )}
    </Box>
  );
};

export default PhotoWidget; 