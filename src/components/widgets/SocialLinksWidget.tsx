import React, { useState, useCallback, memo, useMemo } from 'react';
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

// Мемоизированный компонент для отображения отдельной социальной сети
const SocialLinkItem = memo(({ 
  social, 
  index, 
  icon, 
  name, 
  onEdit, 
  onDelete, 
  readOnly 
}: { 
  social: { type: string; url: string }; 
  index: number; 
  icon: React.ReactNode; 
  name: string; 
  onEdit: (index: number) => void; 
  onDelete: (index: number) => void;
  readOnly: boolean;
}) => {
  const handleEdit = useCallback(() => onEdit(index), [index, onEdit]);
  const handleDelete = useCallback(() => onDelete(index), [index, onDelete]);

  return (
    <ListItem
      key={index}
      sx={{ 
        p: 1, 
        mb: 1, 
        bgcolor: 'background.paper', 
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <Box sx={{ mr: 1, color: 'primary.main' }}>
          {icon}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" fontWeight="bold">
            {name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {social.url}
          </Typography>
        </Box>
      </Box>
      {!readOnly && (
        <Box>
          <IconButton 
            size="small" 
            onClick={handleEdit}
            sx={{ ml: 1 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={handleDelete}
            sx={{ ml: 0.5 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </ListItem>
  );
});

const SocialLinksWidget: React.FC<SocialLinksWidgetProps> = memo(({ content, onContentChange, readOnly = false }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [networkUrl, setNetworkUrl] = useState('');
  const [errors, setErrors] = useState({ network: false, url: false });

  // Обработчик открытия диалога
  const handleOpenDialog = useCallback((index?: number) => {
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
  }, [content.networks]);

  // Обработчик закрытия диалога
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  // Обработчик выбора социальной сети
  const handleNetworkChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedNetwork(event.target.value);
    setErrors((prev) => ({ ...prev, network: false }));
  }, []);

  // Обработчик изменения URL
  const handleUrlChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setNetworkUrl(event.target.value);
    setErrors((prev) => ({ ...prev, url: false }));
  }, []);

  // Получение URL префикса для выбранной сети
  const getUrlPrefix = useCallback(() => {
    const network = socialNetworks.find(n => n.id === selectedNetwork);
    return network ? network.urlPrefix : '';
  }, [selectedNetwork]);

  // Сохранение социальной сети
  const handleSave = useCallback(() => {
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
  }, [content, editingIndex, networkUrl, selectedNetwork, onContentChange, handleCloseDialog]);

  // Удаление социальной сети
  const handleDelete = useCallback((index: number) => {
    const updatedNetworks = content.networks.filter((_, i) => i !== index);
    onContentChange({ ...content, networks: updatedNetworks });
  }, [content, onContentChange]);

  // Получение иконки по типу социальной сети
  const getSocialIcon = useCallback((type: string) => {
    const network = socialNetworks.find(n => n.id === type);
    return network ? network.icon : null;
  }, []);

  // Получение имени социальной сети
  const getSocialName = useCallback((type: string) => {
    const network = socialNetworks.find(n => n.id === type);
    return network ? network.name : type;
  }, []);

  // Мемоизация сетевых элементов для предотвращения ненужных перерисовок
  const networkItems = useMemo(() => {
    return content.networks.map((social, index) => (
      <SocialLinkItem
        key={`${social.type}-${index}`}
        social={social}
        index={index}
        icon={getSocialIcon(social.type)}
        name={getSocialName(social.type)}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
        readOnly={readOnly}
      />
    ));
  }, [content.networks, getSocialIcon, getSocialName, handleOpenDialog, handleDelete, readOnly]);

  // Мемоизация пунктов меню выбора сети
  const networkMenuItems = useMemo(() => {
    return socialNetworks.map(network => (
      <MenuItem key={network.id} value={network.id}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ mr: 1 }}>{network.icon}</Box>
          <Typography>{network.name}</Typography>
        </Box>
      </MenuItem>
    ));
  }, []);

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Социальные сети</Typography>
        {!readOnly && (
          <IconButton 
            color="primary" 
            size="small" 
            onClick={() => handleOpenDialog()}
          >
            <AddIcon />
          </IconButton>
        )}
      </Box>

      {content.networks.length > 0 ? (
        <List disablePadding>
          {networkItems}
        </List>
      ) : (
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: 'background.default', 
            borderRadius: 1, 
            textAlign: 'center',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">
            {readOnly ? 'Социальные сети не добавлены' : 'Добавьте ваши социальные сети'}
          </Typography>
        </Box>
      )}

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
            <InputLabel id="social-network-label">Выберите социальную сеть</InputLabel>
            <Select
              labelId="social-network-label"
              value={selectedNetwork}
              onChange={handleNetworkChange}
              label="Выберите социальную сеть"
            >
              {networkMenuItems}
            </Select>
            {errors.network && (
              <FormHelperText>Выберите социальную сеть</FormHelperText>
            )}
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="URL или username"
            value={networkUrl}
            onChange={handleUrlChange}
            error={errors.url}
            helperText={errors.url ? 'Введите URL или имя пользователя' : `Например: ${getUrlPrefix()}username`}
            InputProps={{
              startAdornment: selectedNetwork && (
                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  {getSocialIcon(selectedNetwork)}
                </Box>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default SocialLinksWidget; 