import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Facebook,
  Instagram,
  Twitter,
  LinkedIn,
  YouTube,
  CloudCircle,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import styled from 'styled-components';

interface SocialLink {
  id: string;
  type: string;
  url: string;
  title: string;
}

interface SocialLinksWidgetProps {
  content: {
    links: SocialLink[];
  };
  onUpdate: (content: { links: SocialLink[] }) => void;
  isEditing: boolean;
}

const LinksContainer = styled(Box)`
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  min-height: 100px;
`;

const LinkItem = styled(ListItem)`
  background: white;
  margin: 8px 0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const socialTypes = {
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    color: '#1877F2'
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    color: '#E4405F'
  },
  twitter: {
    label: 'Twitter',
    icon: Twitter,
    color: '#1DA1F2'
  },
  linkedin: {
    label: 'LinkedIn',
    icon: LinkedIn,
    color: '#0A66C2'
  },
  youtube: {
    label: 'YouTube',
    icon: YouTube,
    color: '#FF0000'
  },
  cloud: {
    label: 'Облако',
    icon: CloudCircle,
    color: '#607D8B'
  }
};

const SocialLinksWidget: React.FC<SocialLinksWidgetProps> = ({
  content,
  onUpdate,
  isEditing
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [type, setType] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const handleAddLink = () => {
    setEditingLink(null);
    setType('');
    setUrl('');
    setTitle('');
    setIsDialogOpen(true);
  };

  const handleEditLink = (link: SocialLink) => {
    setEditingLink(link);
    setType(link.type);
    setUrl(link.url);
    setTitle(link.title);
    setIsDialogOpen(true);
  };

  const handleDeleteLink = (id: string) => {
    onUpdate({
      links: content.links.filter(link => link.id !== id)
    });
  };

  const handleSave = () => {
    if (!type || !url || !title) return;

    if (editingLink) {
      onUpdate({
        links: content.links.map(link =>
          link.id === editingLink.id
            ? { ...link, type, url, title }
            : link
        )
      });
    } else {
      onUpdate({
        links: [
          ...content.links,
          {
            id: Date.now().toString(),
            type,
            url,
            title
          }
        ]
      });
    }

    setIsDialogOpen(false);
  };

  const renderIcon = (type: string) => {
    const IconComponent = socialTypes[type as keyof typeof socialTypes]?.icon;
    return IconComponent ? <IconComponent sx={{ color: socialTypes[type as keyof typeof socialTypes].color }} /> : null;
  };

  return (
    <LinksContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Социальные сети и облака
        </Typography>
        {isEditing && (
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddLink}
            variant="contained"
            size="small"
          >
            Добавить
          </Button>
        )}
      </Box>

      <List>
        {content.links.map(link => (
          <LinkItem key={link.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {renderIcon(link.type)}
              <ListItemText
                primary={link.title}
                secondary={
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {link.url}
                  </a>
                }
              />
            </Box>
            {isEditing && (
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  onClick={() => handleEditLink(link)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  edge="end" 
                  onClick={() => handleDeleteLink(link.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            )}
          </LinkItem>
        ))}
      </List>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>
          {editingLink ? 'Редактировать ссылку' : 'Добавить ссылку'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Тип</InputLabel>
              <Select
                value={type}
                label="Тип"
                onChange={(e) => setType(e.target.value)}
              >
                {Object.entries(socialTypes).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {React.createElement(value.icon, { sx: { color: value.color } })}
                      {value.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Название"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="URL"
              fullWidth
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </LinksContainer>
  );
};

export default SocialLinksWidget; 