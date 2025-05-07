import React, { useState, useCallback, memo, useEffect } from 'react';
import { Box, Avatar, Typography, TextField, Button, IconButton, Paper } from '@mui/material';
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

// Оптимизированные компоненты
const AvatarDisplay = memo(({ avatar, name, size = 100 }: { avatar: string; name: string; size?: number }) => (
          <Avatar
            src={avatar}
            sx={{
      width: size,
      height: size,
              mb: 2,
              bgcolor: 'primary.main',
      fontSize: size / 2 + 'rem',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            {!avatar && name.substring(0, 1).toUpperCase()}
          </Avatar>
));

const ReadOnlyView = memo(({ name, bio, avatar }: { name: string; bio: string; avatar: string }) => (
  <>
    <AvatarDisplay avatar={avatar} name={name} />
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
));

const EditView = memo(({ 
  name, 
  bio, 
  avatar, 
  onNameChange, 
  onBioChange, 
  onAvatarChange, 
  onSave 
}: { 
  name: string; 
  bio: string; 
  avatar: string; 
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBioChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}) => (
        <Paper elevation={2} sx={{ p: 2, width: '100%' }}>
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <AvatarDisplay avatar={avatar} name={name} />
            <IconButton
              color="primary"
              component="label"
              sx={{ mt: 1 }}
            >
              <input
                hidden
                accept="image/*"
                type="file"
          onChange={onAvatarChange}
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
      onChange={onNameChange}
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
      onChange={onBioChange}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
        onClick={onSave}
            >
              Сохранить
            </Button>
          </Box>
        </Paper>
));

const ProfileInfoWidget: React.FC<ProfileInfoWidgetProps> = memo(({ content, onContentChange, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(() => content.name || 'Имя Фамилия');
  const [bio, setBio] = useState(() => content.bio || 'Краткая информация о себе');
  const [avatar, setAvatar] = useState(() => content.avatar || '');

  // Обновляем локальное состояние при изменении пропсов
  useEffect(() => {
    if (content.name !== name) setName(content.name || 'Имя Фамилия');
    if (content.bio !== bio) setBio(content.bio || 'Краткая информация о себе');
    if (content.avatar !== avatar) setAvatar(content.avatar || '');
  }, [content]);

  const handleSave = useCallback(() => {
    onContentChange({
      name,
      bio,
      avatar
    });
    setIsEditing(false);
  }, [name, bio, avatar, onContentChange]);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleToggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const handleBioChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBio(e.target.value);
  }, []);

  if (readOnly) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 2,
          height: '100%',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      >
        <ReadOnlyView name={name} bio={bio} avatar={avatar} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        height: '100%',
        position: 'relative',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
    >
      {!isEditing ? (
        <>
          <IconButton
            sx={{ position: 'absolute', top: 0, right: 0 }}
            onClick={handleToggleEdit}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <ReadOnlyView name={name} bio={bio} avatar={avatar} />
        </>
      ) : (
        <EditView 
          name={name}
          bio={bio}
          avatar={avatar}
          onNameChange={handleNameChange}
          onBioChange={handleBioChange}
          onAvatarChange={handleAvatarChange}
          onSave={handleSave}
        />
      )}
    </Box>
  );
});

export default ProfileInfoWidget; 