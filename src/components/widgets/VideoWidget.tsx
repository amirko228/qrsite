import React, { useState } from 'react';
import { Box, TextField, Typography, Button, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { YouTube, Videocam } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';

export interface VideoWidgetProps {
  content: {
    url: string;
    title?: string;
  };
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

const VideoWidget: React.FC<VideoWidgetProps> = ({ content, onContentChange, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(content.url || '');
  const [title, setTitle] = useState(content.title || '');

  const handleSave = () => {
    onContentChange({
      url,
      title
    });
    setIsEditing(false);
  };

  // Extract YouTube ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYouTubeId(content.url);

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {!isEditing ? (
        <>
          {youtubeId ? (
            <Box sx={{ position: 'relative', width: '100%', pt: '56.25%' /* 16:9 aspect ratio */ }}>
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={content.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: 1,
                p: 3,
                cursor: 'pointer'
              }}
              onClick={() => setIsEditing(true)}
            >
              <Videocam sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Нажмите для добавления видео
              </Typography>
            </Box>
          )}

          {content.title && (
            <Typography
              variant="subtitle1"
              component="div"
              sx={{ mt: 1, fontWeight: 500 }}
            >
              {content.title}
            </Typography>
          )}

          <Button
            variant="outlined"
            size="small"
            sx={{ mt: 1, alignSelf: 'flex-start' }}
            onClick={() => setIsEditing(true)}
          >
            {content.url ? 'Изменить видео' : 'Добавить видео'}
          </Button>
        </>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" component="div" gutterBottom>
            Редактирование видео
          </Typography>
          <TextField
            fullWidth
            label="Ссылка на YouTube"
            variant="outlined"
            size="small"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <TextField
            fullWidth
            label="Название видео"
            variant="outlined"
            size="small"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setIsEditing(false)}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<YouTube />}
            >
              Сохранить
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default VideoWidget; 