import React, { useState, useCallback, memo, useEffect } from 'react';
import { Box, Avatar, Typography, TextField, Button, IconButton, Paper, Tooltip, Chip, Divider } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, PhotoCamera as PhotoCameraIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

interface ProfileInfoWidgetProps {
  content: {
    name: string;
    bio: string;
    avatar: string;
    tags?: string[];
    location?: string;
  };
  onUpdate: (content: any) => void;
  isEditing?: boolean;
  onDelete?: () => void;
}

// Оптимизированные компоненты
const AvatarDisplay = memo(({ avatar, name, size = 120 }: { avatar: string; name: string; size?: number }) => (
          <Avatar
            src={avatar}
            sx={{
      width: size,
      height: size,
              mb: 2,
              bgcolor: 'primary.main',
      fontSize: size / 3 + 'px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '4px solid white'
            }}
          >
            {!avatar && name.substring(0, 1).toUpperCase()}
          </Avatar>
));

const ReadOnlyView = memo(({ name, bio, avatar, tags, location }: { 
  name: string; 
  bio: string; 
  avatar: string; 
  tags?: string[];
  location?: string;
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
    <AvatarDisplay avatar={avatar} name={name} />
    <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
      {name || 'Имя Фамилия'}
          </Typography>
    
    {location && (
      <Chip 
        icon={<span className="material-icons" style={{ fontSize: 16 }}>location_on</span>}
        label={location}
        size="small"
        sx={{ mb: 2 }}
      />
    )}
    
          <Typography
      variant="body1"
            align="center"
            color="text.secondary"
      sx={{ mt: 1, mb: 2, whiteSpace: 'pre-wrap', maxWidth: '100%' }}
          >
      {bio || 'Нет информации'}
          </Typography>
    
    {tags && tags.length > 0 && (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 1 }}>
        {tags.map((tag, index) => (
          <Chip 
            key={index} 
            label={tag} 
            size="small" 
            variant="outlined" 
            sx={{ m: 0.5 }} 
          />
        ))}
      </Box>
    )}
  </Box>
));

const EditView = memo(({ 
  name, 
  bio, 
  avatar, 
  tags = [],
  location,
  onNameChange, 
  onBioChange, 
  onAvatarChange, 
  onLocationChange,
  onTagsChange,
  onSave 
}: { 
  name: string; 
  bio: string; 
  avatar: string; 
  tags?: string[];
  location?: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBioChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLocationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTagsChange: (newTags: string[]) => void;
  onSave: () => void;
}) => {
  const [newTag, setNewTag] = useState('');
  
  const handleAddTag = () => {
    if (newTag.trim()) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%', borderRadius: 2 }}>
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <AvatarDisplay avatar={avatar} name={name} />
        <Tooltip title="Изменить фото">
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
        </Tooltip>
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
        label="Местоположение"
        variant="outlined"
        size="small"
        value={location || ''}
        onChange={onLocationChange}
        placeholder="Например: Москва, Россия"
        InputProps={{
          startAdornment: (
            <span className="material-icons" style={{ fontSize: 18, marginRight: 8, opacity: 0.6 }}>
              location_on
            </span>
          ),
        }}
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
      
      <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
        Теги / Интересы
      </Typography>
      
      <Box sx={{ display: 'flex', mb: 1 }}>
        <TextField
          size="small"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Добавить тег"
          onKeyPress={handleTagKeyPress}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="contained"
          onClick={handleAddTag}
          disabled={!newTag.trim()}
          sx={{ ml: 1 }}
        >
          <AddIcon fontSize="small" />
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
        {tags.map((tag, index) => (
          <Chip 
            key={index} 
            label={tag} 
            onDelete={() => handleRemoveTag(tag)} 
            size="small" 
            sx={{ m: 0.5 }} 
          />
        ))}
        {tags.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Нет тегов. Добавьте теги для лучшего описания профиля.
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
        onClick={onSave}
          color="primary"
            >
              Сохранить
            </Button>
          </Box>
        </Paper>
  );
});

const ProfileInfoWidget: React.FC<ProfileInfoWidgetProps> = memo(({ content, onUpdate, isEditing = false, onDelete }) => {
  const [localEditing, setLocalEditing] = useState(false);
  const [name, setName] = useState(() => content.name || 'Введите ФИО человека');
  const [bio, setBio] = useState(() => content.bio || 'Введите краткую информацию');
  const [avatar, setAvatar] = useState(() => content.avatar || '');
  const [tags, setTags] = useState(() => content.tags || []);
  const [location, setLocation] = useState(() => content.location || '');

  // Обновляем локальное состояние при изменении пропсов
  useEffect(() => {
    if (content.name !== undefined) setName(content.name || 'Имя Фамилия');
    if (content.bio !== undefined) setBio(content.bio || 'Краткая информация о себе');
    if (content.avatar !== undefined) setAvatar(content.avatar || '');
    if (content.tags !== undefined) setTags(content.tags || []);
    if (content.location !== undefined) setLocation(content.location || '');
  }, [content]);

  const handleSave = useCallback(() => {
    onUpdate({
      name,
      bio,
      avatar,
      tags,
      location
    });
    setLocalEditing(false);
  }, [name, bio, avatar, tags, location, onUpdate]);

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
    setLocalEditing(prev => !prev);
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const handleBioChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBio(e.target.value);
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  }, []);

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
      {!isEditing && !localEditing ? (
        <>
          <IconButton
            sx={{ position: 'absolute', top: 0, right: 0 }}
            onClick={handleToggleEdit}
            size="small"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <ReadOnlyView name={name} bio={bio} avatar={avatar} tags={tags} location={location} />
        </>
      ) : (
        <EditView 
          name={name}
          bio={bio}
          avatar={avatar}
          tags={tags}
          location={location}
          onNameChange={handleNameChange}
          onBioChange={handleBioChange}
          onAvatarChange={handleAvatarChange}
          onLocationChange={handleLocationChange}
          onTagsChange={setTags}
          onSave={handleSave}
        />
      )}
    </Box>
  );
});

export default ProfileInfoWidget; 