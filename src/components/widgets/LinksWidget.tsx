import React, { useState } from 'react';
import { Box, Typography, IconButton, Button, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import styled from 'styled-components';

const LinksContainer = styled(Box)`
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  min-height: 100px;
`;

interface Link {
  id: string;
  title: string;
  url: string;
}

interface LinksWidgetProps {
  onDelete: () => void;
  onEdit: () => void;
  isEditing: boolean;
  initialLinks?: Link[];
}

const LinksWidget: React.FC<LinksWidgetProps> = ({
  onDelete,
  onEdit,
  isEditing,
  initialLinks = []
}) => {
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleAddLink = () => {
    if (newLinkTitle && newLinkUrl) {
      const newLink: Link = {
        id: Date.now().toString(),
        title: newLinkTitle,
        url: newLinkUrl
      };
      setLinks([...links, newLink]);
      setNewLinkTitle('');
      setNewLinkUrl('');
    }
  };

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <LinksContainer>
        <Typography variant="h6" gutterBottom>
          Ссылки
        </Typography>
        {links.length === 0 ? (
          <Typography color="text.secondary">
            Добавьте ссылки
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {links.map((link) => (
              <Box
                key={link.id}
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinkIcon />
                  <Box>
                    <Typography variant="subtitle1">{link.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {link.url}
                    </Typography>
                  </Box>
                </Box>
                {isEditMode && (
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteLink(link.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        )}
        {isEditMode && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Название"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              size="small"
            />
            <TextField
              label="URL"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              size="small"
            />
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddLink}
              variant="outlined"
            >
              Добавить ссылку
            </Button>
          </Box>
        )}
      </LinksContainer>
      {isEditing && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setIsEditMode(!isEditMode)}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={onDelete}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default LinksWidget; 