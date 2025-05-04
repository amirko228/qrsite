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
  ListItemSecondaryAction,
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon,
  Telegram as TelegramIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import styled from 'styled-components';

interface SocialLinksWidgetProps {
  content: {
    networks: Array<{
      type: string;
      url: string;
    }>;
  };
  onContentChange: (content: any) => void;
  readOnly?: boolean;
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

// Конфигурация доступных социальных сетей
const socialNetworks = [
  { id: 'facebook', name: 'Facebook', icon: <FacebookIcon />, urlPrefix: 'https://facebook.com/' },
  { id: 'instagram', name: 'Instagram', icon: <InstagramIcon />, urlPrefix: 'https://instagram.com/' },
  { id: 'twitter', name: 'Twitter', icon: <TwitterIcon />, urlPrefix: 'https://twitter.com/' },
  { id: 'linkedin', name: 'LinkedIn', icon: <LinkedInIcon />, urlPrefix: 'https://linkedin.com/in/' },
  { id: 'youtube', name: 'YouTube', icon: <YouTubeIcon />, urlPrefix: 'https://youtube.com/' },
  { id: 'telegram', name: 'Telegram', icon: <TelegramIcon />, urlPrefix: 'https://t.me/' },
];

const SocialLinksWidget: React.FC<SocialLinksWidgetProps> = ({ content, onContentChange, readOnly = false }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [networkUrl, setNetworkUrl] = useState('');
  const [errors, setErrors] = useState({ network: false, url: false });

  // Обработчик открытия диалога
  const handleOpenDialog = (index?: number) => {
    setErrors({ network: false, url: false });
    
    if (index !== undefined) {
      // Редактирование существующей социальной сети
      const social = content.networks[index];
      setEditingIndex(index);
      setSelectedNetwork(social.type);
      setNetworkUrl(social.url);
    } else {
      // Новая социальная сеть
      setEditingIndex(null);
      setSelectedNetwork('');
      setNetworkUrl('');
    }
    
    setDialogOpen(true);
  };

  // Обработчик закрытия диалога
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Обработчик выбора социальной сети
  const handleNetworkChange = (event: SelectChangeEvent<string>) => {
    setSelectedNetwork(event.target.value);
    setErrors({ ...errors, network: false });
  };

  // Обработчик изменения URL
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNetworkUrl(event.target.value);
    setErrors({ ...errors, url: false });
  };

  // Получение URL префикса для выбранной сети
  const getUrlPrefix = () => {
    const network = socialNetworks.find(n => n.id === selectedNetwork);
    return network ? network.urlPrefix : '';
  };

  // Сохранение социальной сети
  const handleSave = () => {
    // Валидация
    const hasNetworkError = !selectedNetwork;
    const hasUrlError = !networkUrl.trim();
    
    if (hasNetworkError || hasUrlError) {
      setErrors({
        network: hasNetworkError,
        url: hasUrlError
      });
      return;
    }

    // Создаем новый массив социальных сетей
    let updatedNetworks;
    
    if (editingIndex !== null) {
      // Обновление существующей
      updatedNetworks = [...content.networks];
      updatedNetworks[editingIndex] = { type: selectedNetwork, url: networkUrl };
    } else {
      // Добавление новой
      updatedNetworks = [...content.networks, { type: selectedNetwork, url: networkUrl }];
    }

    // Обновление компонента
    onContentChange({ ...content, networks: updatedNetworks });
    handleCloseDialog();
  };

  // Удаление социальной сети
  const handleDelete = (index: number) => {
    const updatedNetworks = content.networks.filter((_, i) => i !== index);
    onContentChange({ ...content, networks: updatedNetworks });
  };

  // Получение иконки по типу социальной сети
  const getSocialIcon = (type: string) => {
    const network = socialNetworks.find(n => n.id === type);
    return network ? network.icon : null;
  };

  // Получение имени социальной сети
  const getSocialName = (type: string) => {
    const network = socialNetworks.find(n => n.id === type);
    return network ? network.name : type;
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Социальные сети</Typography>
        <IconButton 
          color="primary" 
          size="small" 
          onClick={() => handleOpenDialog()}
        >
          <AddIcon />
        </IconButton>
      </Box>

      {content.networks.length > 0 ? (
        <List disablePadding>
          {content.networks.map((social, index) => (
            <ListItem
              key={index}
              sx={{ 
                p: 1, 
                mb: 1, 
                bgcolor: 'background.paper', 
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getSocialIcon(social.type)}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {getSocialName(social.type)}
                </Typography>
              </Box>
              <Box>
                <IconButton size="small" onClick={() => handleOpenDialog(index)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>
      ) : (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: 'calc(100% - 40px)',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            Добавьте свои социальные сети
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => handleOpenDialog()}
          >
            Добавить соцсеть
          </Button>
        </Box>
      )}

      {/* Диалог для добавления/редактирования социальной сети */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Редактировать социальную сеть' : 'Добавить социальную сеть'}
        </DialogTitle>
        <DialogContent>
          <FormControl 
            fullWidth 
            margin="normal" 
            error={errors.network}
          >
            <InputLabel id="social-network-label">Социальная сеть</InputLabel>
            <Select
              labelId="social-network-label"
              value={selectedNetwork}
              onChange={handleNetworkChange}
              label="Социальная сеть"
            >
              {socialNetworks.map(network => (
                <MenuItem key={network.id} value={network.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {React.cloneElement(network.icon as React.ReactElement, { style: { marginRight: 8 } })}
                    {network.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.network && (
              <FormHelperText>Выберите социальную сеть</FormHelperText>
            )}
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="URL или имя пользователя"
            value={networkUrl}
            onChange={handleUrlChange}
            error={errors.url}
            helperText={errors.url ? 'Введите ссылку или имя пользователя' : `Пример: ${getUrlPrefix()}username`}
            InputProps={{
              startAdornment: selectedNetwork ? (
                <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                  {getUrlPrefix()}
                </Box>
              ) : null,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialLinksWidget; 