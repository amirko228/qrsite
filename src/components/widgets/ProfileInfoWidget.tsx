import React, { useState } from 'react';
import { Box, Avatar, Typography, TextField, Button, IconButton, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';

interface ProfileInfoWidgetProps {
  content: {
    name: string;
    bio: string;
    avatar: string;
  };
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

const ProfileInfoWidget: React.FC<ProfileInfoWidgetProps> = ({ content, onContentChange, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(content.name || 'Имя Фамилия');
  const [bio, setBio] = useState(content.bio || 'Краткая информация о себе');
  const [avatar, setAvatar] = useState(content.avatar || '');

  const handleSave = () => {
    onContentChange({
      name,
      bio,
      avatar
    });
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        height: '100%',
        position: 'relative'
      }}
    >
      {!isEditing ? (
        <>
          <IconButton
            sx={{ position: 'absolute', top: 0, right: 0 }}
            onClick={() => setIsEditing(true)}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          <Avatar
            src={avatar}
            sx={{
              width: 100,
              height: 100,
              mb: 2,
              bgcolor: 'primary.main',
              fontSize: '2rem'
            }}
          >
            {!avatar && name.substring(0, 1).toUpperCase()}
          </Avatar>

          <Typography variant="h6" align="center" gutterBottom>
            {name}
          </Typography>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
          >
            {bio}
          </Typography>
        </>
      ) : (
        <Paper elevation={2} sx={{ p: 2, width: '100%' }}>
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              src={avatar}
              sx={{
                width: 100,
                height: 100,
                mb: 1,
                bgcolor: 'primary.main',
                fontSize: '2rem'
              }}
            >
              {!avatar && name.substring(0, 1).toUpperCase()}
            </Avatar>

            <IconButton
              color="primary"
              component="label"
              sx={{ mt: 1 }}
            >
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleAvatarChange}
              />
              <PhotoCameraIcon />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            label="Имя"
            variant="outlined"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="О себе"
            variant="outlined"
            size="small"
            multiline
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Сохранить
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ProfileInfoWidget; 