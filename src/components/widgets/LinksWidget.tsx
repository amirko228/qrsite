import React, { useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, TextField, Button, Divider, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Link as LinkIcon, Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

interface LinksWidgetProps {
  content: {
    links: Array<{
      title: string;
      url: string;
    }>;
  };
  onContentChange: (content: any) => void;
  readOnly?: boolean;
}

const LinksWidget: React.FC<LinksWidgetProps> = ({ content, onContentChange, readOnly = false }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [error, setError] = useState({ title: false, url: false });

  const handleOpenDialog = (index?: number) => {
    if (index !== undefined) {
      // Editing existing link
      setEditingIndex(index);
      setNewLink({ ...content.links[index] });
    } else {
      // Adding new link
      setEditingIndex(null);
      setNewLink({ title: '', url: '' });
    }
    setDialogOpen(true);
    setError({ title: false, url: false });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewLink(prev => ({ ...prev, [name]: value }));
    setError(prev => ({ ...prev, [name]: !value }));
  };

  const handleSaveLink = () => {
    // Validate inputs
    const titleError = !newLink.title.trim();
    const urlError = !newLink.url.trim();
    
    if (titleError || urlError) {
      setError({ title: titleError, url: urlError });
      return;
    }

    // Ensure URL has protocol
    let formattedUrl = newLink.url;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const updatedLink = { ...newLink, url: formattedUrl };
    
    let updatedLinks;
    if (editingIndex !== null) {
      // Update existing link
      updatedLinks = [...content.links];
      updatedLinks[editingIndex] = updatedLink;
    } else {
      // Add new link
      updatedLinks = [...content.links, updatedLink];
    }

    onContentChange({ ...content, links: updatedLinks });
    handleCloseDialog();
  };

  const handleDeleteLink = (index: number) => {
    const updatedLinks = content.links.filter((_, i) => i !== index);
    onContentChange({ ...content, links: updatedLinks });
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {content.links.length > 0 ? (
        <List sx={{ p: 0 }}>
          {content.links.map((link, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <Box>
                  <IconButton edge="end" onClick={() => handleOpenDialog(index)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDeleteLink(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              disablePadding
              sx={{ mb: 1 }}
            >
              <ListItemButton
                component="a"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon>
                  <LinkIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={link.title}
                  secondary={link.url}
                  primaryTypographyProps={{ 
                    noWrap: true,
                    style: { fontWeight: 500 } 
                  }}
                  secondaryTypographyProps={{ 
                    noWrap: true,
                    style: { fontSize: '0.75rem' } 
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
          <LinkIcon sx={{ fontSize: 40, mb: 1, opacity: 0.7 }} />
          <Typography variant="body2" sx={{ mb: 2 }}>Нет ссылок</Typography>
        </Box>
      )}

      <Divider sx={{ my: 1 }} />
      
      <Button
        fullWidth
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        sx={{ mt: 1 }}
      >
        Добавить ссылку
      </Button>

      {/* Dialog for adding/editing links */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>{editingIndex !== null ? 'Редактировать ссылку' : 'Добавить ссылку'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название"
            name="title"
            fullWidth
            variant="outlined"
            value={newLink.title}
            onChange={handleInputChange}
            error={error.title}
            helperText={error.title ? 'Название обязательно' : ''}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="URL"
            name="url"
            fullWidth
            variant="outlined"
            value={newLink.url}
            onChange={handleInputChange}
            error={error.url}
            helperText={error.url ? 'URL обязателен' : 'Например: https://example.com'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSaveLink} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LinksWidget; 