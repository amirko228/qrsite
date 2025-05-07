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
  will-change: transform;
  transform: translateZ(0);
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
        },
        willChange: 'transform, box-shadow',
        transform: 'translateZ(0)'
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

// Диалог добавления/редактирования социальной сети
const SocialLinkDialog = memo(({
  open,
  onClose,
  selectedNetwork,
  networkUrl,
  errors,
  onNetworkChange,
  onUrlChange,
  onSave,
  availableNetworks,
  editingIndex
}: {
  open: boolean;
  onClose: () => void;
  selectedNetwork: string;
  networkUrl: string;
  errors: { network: boolean; url: boolean };
  onNetworkChange: (event: SelectChangeEvent<string>) => void;
  onUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  availableNetworks: typeof socialNetworks;
  editingIndex: number | null;
}) => {
  const urlPrefix = useMemo(() => {
    const network = availableNetworks.find(n => n.id === selectedNetwork);
    return network ? network.urlPrefix : '';
  }, [selectedNetwork, availableNetworks]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingIndex !== null ? 'Редактировать профиль' : 'Добавить профиль'}
      </DialogTitle>
      <DialogContent>
        <FormControl 
          fullWidth 
          margin="normal" 
          error={errors.network}
        >
          <InputLabel id="network-select-label">Социальная сеть</InputLabel>
          <Select
            labelId="network-select-label"
            id="network-select"
            value={selectedNetwork}
            label="Социальная сеть"
            onChange={onNetworkChange}
          >
            {availableNetworks.map((network) => (
              <MenuItem key={network.id} value={network.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ mr: 1 }}>{network.icon}</Box>
                  {network.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
          {errors.network && <FormHelperText>Выберите социальную сеть</FormHelperText>}
        </FormControl>

        <TextField
          margin="normal"
          fullWidth
          label="URL профиля"
          value={networkUrl}
          onChange={onUrlChange}
          error={errors.url}
          helperText={errors.url ? 'Введите корректный URL' : null}
          InputProps={{
            startAdornment: selectedNetwork ? (
              <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                {urlPrefix}
              </Box>
            ) : null
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          color="primary"
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
});

const SocialLinksWidget: React.FC<SocialLinksWidgetProps> = memo(({ content, onContentChange, readOnly = false }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [networkUrl, setNetworkUrl] = useState('');
  const [errors, setErrors] = useState({ network: false, url: false });

  // Мемоизируем текущие социальные сети
  const networks = useMemo(() => content.networks || [], [content.networks]);

  // Обработчик открытия диалога
  const handleOpenDialog = useCallback((index?: number) => {
    setErrors({ network: false, url: false });
    
    if (index !== undefined) {
      // Редактирование существующей социальной сети
      const social = networks[index];
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
  }, [networks]);

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
    let networkError = false;
    let urlError = false;
    
    if (!selectedNetwork) {
      networkError = true;
    }
    
    if (!networkUrl) {
      urlError = true;
    }
    
    if (networkError || urlError) {
      setErrors({ network: networkError, url: urlError });
      return;
    }

    // Сохраняем сеть
    const updatedNetworks = [...networks];
    
    const newSocial = {
      type: selectedNetwork,
      url: networkUrl
    };
    
    if (editingIndex !== null) {
      // Обновляем существующую запись
      updatedNetworks[editingIndex] = newSocial;
    } else {
      // Добавляем новую запись
      updatedNetworks.push(newSocial);
    }
    
    // Вызываем родительский обработчик
    onContentChange({ networks: updatedNetworks });
    
    // Закрываем диалог
    setDialogOpen(false);
  }, [selectedNetwork, networkUrl, networks, editingIndex, onContentChange]);

  // Удаление социальной сети
  const handleDeleteSocialLink = useCallback((index: number) => {
    const updatedNetworks = networks.filter((_, i) => i !== index);
    onContentChange({ networks: updatedNetworks });
  }, [networks, onContentChange]);

  // Мемоизируем отображаемые социальные сети
  const socialItems = useMemo(() => {
    return networks.map((social, index) => {
      const network = socialNetworks.find(n => n.id === social.type);
      
      if (!network) return null;
      
      return (
        <SocialLinkItem 
          key={`${social.type}-${index}`}
          social={social}
          index={index}
          icon={network.icon}
          name={network.name}
          onEdit={handleOpenDialog}
          onDelete={handleDeleteSocialLink}
          readOnly={readOnly}
        />
      );
    });
  }, [networks, handleOpenDialog, handleDeleteSocialLink, readOnly]);

  return (
    <Box sx={{ py: 2, willChange: 'transform', transform: 'translateZ(0)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Социальные сети</Typography>
        {!readOnly && (
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Добавить
          </Button>
        )}
        </Box>
      
      <LinksContainer>
        {networks.length === 0 ? (
          <Typography align="center" color="textSecondary" sx={{ py: 2 }}>
            {readOnly 
              ? 'Нет добавленных социальных сетей.' 
              : 'Нажмите "Добавить", чтобы добавить социальную сеть.'
            }
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {socialItems}
          </List>
        )}
      </LinksContainer>
      
      <SocialLinkDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        selectedNetwork={selectedNetwork}
        networkUrl={networkUrl}
        errors={errors}
        onNetworkChange={handleNetworkChange}
        onUrlChange={handleUrlChange}
        onSave={handleSave}
        availableNetworks={socialNetworks}
        editingIndex={editingIndex}
      />
    </Box>
  );
});

export default SocialLinksWidget; 