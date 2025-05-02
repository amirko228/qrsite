import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, TextField } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import styled from 'styled-components';

const TextContainer = styled(Box)`
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  min-height: 100px;
`;

interface TextWidgetProps {
  content: {
    text: string;
  };
  onUpdate: (content: { text: string }) => void;
  isEditing: boolean;
}

const TextWidget: React.FC<TextWidgetProps> = ({
  content,
  onUpdate,
  isEditing
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [text, setText] = useState(content.text || 'Введите текст...');

  useEffect(() => {
    setText(content.text || 'Введите текст...');
  }, [content.text]);

  const handleSave = () => {
    onUpdate({ text });
    setIsEditMode(false);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextContainer>
        {isEditMode ? (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white'
              }
            }}
          />
        ) : (
          <Typography 
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {text}
          </Typography>
        )}
      </TextContainer>
      {isEditing && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
          {isEditMode ? (
            <IconButton 
              onClick={handleSave} 
              size="small" 
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              <SaveIcon />
            </IconButton>
          ) : (
            <IconButton 
              onClick={() => setIsEditMode(true)} 
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
          )}
        </Box>
      )}
    </Box>
  );
};

export default TextWidget; 