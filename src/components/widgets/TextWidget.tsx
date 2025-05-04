import React, { useState } from 'react';
import { Box, Typography, TextField } from '@mui/material';

interface TextWidgetProps {
  content: {
    text: string;
    align: 'left' | 'center' | 'right';
  };
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

const TextWidget: React.FC<TextWidgetProps> = ({ content, onContentChange, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content.text);

  const handleDoubleClick = () => {
    if (!readOnly) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== content.text) {
      onContentChange({ ...content, text });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  const getTextAlign = () => {
    return content.align || 'left';
  };

  return (
    <Box 
      sx={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: getTextAlign() === 'center' ? 'center' : 'flex-start',
        textAlign: getTextAlign()
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <TextField
          autoFocus
          multiline
          fullWidth
          variant="outlined"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'primary.main',
              },
            },
            '& textarea': {
              textAlign: getTextAlign(),
            }
          }}
        />
      ) : (
        <Typography 
          variant="body1" 
          component="div"
          sx={{ 
            width: '100%',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
        >
          {content.text || 'Двойной клик для редактирования'}
        </Typography>
      )}
    </Box>
  );
};

export default TextWidget; 