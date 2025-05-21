import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Card,
  CardContent,
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
  Grid,
  Divider,
  CircularProgress,
  Tooltip,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Person, 
  PersonAdd, 
  Link as LinkIcon,
  ArrowDownward,
  ArrowRight,
  Check,
  Close,
  Search,
  Add
} from '@mui/icons-material';
import { Block, BlockType, FamilyMember } from '../types';
import { SocialNetworkType } from '../types';

// Функция для определения пола по имени (упрощенная)
const inferGenderFromName = (name: string): 'male' | 'female' => {
  const nameLower = name.toLowerCase();
  // Простая проверка для русских имен (очень упрощенно)
  if (nameLower.endsWith('а') || nameLower.endsWith('я')) {
    return 'female';
  }
  return 'male';
};

// Функция для обеспечения наличия gender в объекте FamilyMember
const ensureGender = (member: FamilyMember): FamilyMember => {
  if (member.gender) return member;
  return {
    ...member,
    gender: inferGenderFromName(member.fullName)
  };
};

// Компонент персоны в семейном древе
interface PersonCardProps {
  member: FamilyMember;
  onClick?: () => void;
  onAddRelation?: (type: 'parent' | 'child' | 'spouse' | 'sibling') => void;
  onRemove?: () => void;
  relationLabel?: string;
}

const PersonCard: React.FC<PersonCardProps> = ({ member, onClick, onAddRelation, onRemove, relationLabel }) => {
  // Для совместимости убедимся, что в member есть gender
  const memberWithGender = ensureGender(member);
  
  // Расчет возраста
  const getAge = (): string => {
    if (memberWithGender.age) return `${memberWithGender.age} лет`;
    
    const birthDate = memberWithGender.birthDate ? new Date(memberWithGender.birthDate) : null;
    const deathDate = memberWithGender.deathDate ? new Date(memberWithGender.deathDate) : null;
    
    if (!birthDate) return '';
    
    if (deathDate) {
      const age = deathDate.getFullYear() - birthDate.getFullYear();
      return `${age} лет`;
    } else {
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      return `${age} лет`;
    }
  };

  // Форматирование даты в формат ДД.ММ.ГГГГ
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    // Пробуем разобрать дату
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (e) {
      // Если дата уже в нужном формате, возвращаем как есть
      return dateString;
    }
  };

  // Определяем цвет карточки на основе пола: розовый для женщин, голубой для мужчин
  const cardColor = memberWithGender.gender === 'female' ? '#FFF5F5' : '#F5F9FF';
  const cardBorderColor = memberWithGender.gender === 'female' ? '#FFCCE5' : '#CCE5FF';
  
  // Получаем иконку роли
  const getRoleIcon = () => {
    if (!memberWithGender.relationshipType) return null;
    
    let roleText = '';
    
    switch (memberWithGender.relationshipType) {
      case 'parent':
        roleText = memberWithGender.gender === 'female' ? 'Прародитель ♀' : 'Прародитель ♂';
        break;
      case 'child':
        roleText = memberWithGender.gender === 'female' ? 'Потомок ♀' : 'Потомок ♂';
        break;
      case 'spouse':
        roleText = memberWithGender.gender === 'female' ? 'Партнёр ♀' : 'Партнёр ♂';
        break;
      case 'sibling':
        roleText = memberWithGender.gender === 'female' ? 'Родственник ♀' : 'Родственник ♂';
        break;
      default:
        return null;
    }
    
    return (
      <Box
        sx={{
          position: 'absolute',
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: memberWithGender.gender === 'female' ? '#FF92C6' : '#92BEFF',
          color: '#fff',
          fontSize: '0.6rem',
          fontWeight: 'bold',
          padding: '2px 8px',
          borderRadius: '12px',
          whiteSpace: 'nowrap',
          zIndex: 2,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {roleText}
      </Box>
    );
  };

  return (
    <Box sx={{ position: 'relative', width: 160, height: 'auto' }}>
      {getRoleIcon()}
      
      <Card 
        sx={{ 
          width: '100%', 
          borderRadius: '16px',
          position: 'relative',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          border: `2px solid ${cardBorderColor}`,
          backgroundColor: cardColor,
          overflow: 'visible',
          boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
          }
        }}
      >
        {!memberWithGender.isApproved && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: '#ff4b4b',
              color: '#fff',
              borderRadius: '8px',
              padding: '1px 6px',
              fontSize: '10px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 2
            }}
          >
            Ожидает
          </Box>
        )}
        
        <CardContent sx={{ p: 2, textAlign: 'center' }}>
          <Avatar 
            src={memberWithGender.photo || '/placeholder-person.jpg'} 
            sx={{ 
              width: 80, 
              height: 80, 
              margin: '0 auto 12px', 
              border: `3px solid ${cardBorderColor}`,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }} 
          />
          
          <Typography variant="subtitle2" fontWeight="bold" sx={{ 
            lineHeight: 1.2, 
            mb: 0.5, 
            height: '36px', 
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {memberWithGender.fullName}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" display="block" sx={{ 
            fontSize: '0.7rem', 
            whiteSpace: 'nowrap',
            mb: 0.5
          }}>
            {formatDate(memberWithGender.birthDate)} {memberWithGender.deathDate ? `- ${formatDate(memberWithGender.deathDate)}` : ''}
          </Typography>
          
          {memberWithGender.socialNetwork && (
            <Box mt={1} display="flex" justifyContent="center">
              {memberWithGender.socialNetwork.type === SocialNetworkType.VK && (
                <IconButton size="small" color="primary" onClick={() => window.open(memberWithGender.socialNetwork?.url, '_blank')}>
                  <Box component="img" src="/icons/vk.svg" width={16} height={16} alt="VK" />
                </IconButton>
              )}
              {memberWithGender.socialNetwork.type === SocialNetworkType.TELEGRAM && (
                <IconButton size="small" color="primary" onClick={() => window.open(memberWithGender.socialNetwork?.url, '_blank')}>
                  <Box component="img" src="/icons/telegram.svg" width={16} height={16} alt="Telegram" />
                </IconButton>
              )}
              {memberWithGender.socialNetwork.type === SocialNetworkType.ODNOKLASSNIKI && (
                <IconButton size="small" color="primary" onClick={() => window.open(memberWithGender.socialNetwork?.url, '_blank')}>
                  <Box component="img" src="/icons/ok.svg" width={16} height={16} alt="OK" />
                </IconButton>
              )}
            </Box>
          )}
          
          {onAddRelation && (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',  
                mt: 1 
              }}
            >
              <IconButton 
                size="small" 
                color="error"
                onClick={onRemove}
                sx={{ padding: '2px' }}
              >
                <Close fontSize="small" />
              </IconButton>
              
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Родители">
                  <IconButton 
                    size="small" 
                    onClick={() => onAddRelation('parent')}
                    sx={{ padding: '2px' }}
                  >
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Дети">
                  <IconButton 
                    size="small" 
                    onClick={() => onAddRelation('child')}
                    sx={{ padding: '2px' }}
                  >
                    <ArrowDownward 
                      fontSize="small" 
                      sx={{ transform: 'rotate(180deg)' }} 
                    />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Супруг(а)">
                  <IconButton 
                    size="small" 
                    onClick={() => onAddRelation('spouse')}
                    sx={{ padding: '2px' }}
                  >
                    <ArrowRight fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// Компонент создания новой персоны
interface AddPersonDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (member: FamilyMember) => void;
  relationType: 'parent' | 'child' | 'spouse' | 'sibling' | null;
  relationTo: FamilyMember | null;
}

const AddPersonDialog: React.FC<AddPersonDialogProps> = ({ open, onClose, onAdd, relationType, relationTo }) => {
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [socialType, setSocialType] = useState<SocialNetworkType>(SocialNetworkType.VK);
  const [socialUrl, setSocialUrl] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchById, setSearchById] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  // Задание пола на основе типа отношения
  useEffect(() => {
    if (relationType && relationTo) {
      // Для супругов: противоположный пол от того, к кому добавляем
      if (relationType === 'spouse') {
        const relationToGender = ensureGender(relationTo).gender;
        setGender(relationToGender === 'male' ? 'female' : 'male');
      }
      // Для родителей: если добавляем к мужчине, то скорее всего женщина (мать)
      else if (relationType === 'parent') {
        const relationToGender = ensureGender(relationTo).gender;
        setGender(relationToGender === 'male' ? 'female' : 'male');
      }
    }
  }, [relationType, relationTo, open]);

  // Очистка формы при закрытии
  useEffect(() => {
    if (!open) {
      setFullName('');
      setBirthDate('');
      setDeathDate('');
      setSocialUrl('');
      setPhoto(null);
      setSearchTerm('');
      setSearchById('');
      setSearchResults([]);
      setActiveTab(0);
    }
  }, [open]);

  // Предложение даты в правильном формате
  const formatDateInput = (input: string): string => {
    // Удаляем все, кроме цифр
    const digitsOnly = input.replace(/\D/g, '');
    
    // Форматируем как ДД.ММ.ГГГГ
    if (digitsOnly.length <= 2) {
      return digitsOnly;
    } else if (digitsOnly.length <= 4) {
      return `${digitsOnly.substring(0, 2)}.${digitsOnly.substring(2)}`;
    } else {
      return `${digitsOnly.substring(0, 2)}.${digitsOnly.substring(2, 4)}.${digitsOnly.substring(4, 8)}`;
    }
  };

  // Обработчик ввода даты
  const handleDateInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatDateInput(value));
  };

  // Симуляция поиска людей по имени (заменить на реальный API)
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    // Имитация запроса к API
    setTimeout(() => {
      setSearchResults([
        { id: '123', fullName: 'Романова Екатерина Алексеевна', photo: 'https://randomuser.me/api/portraits/women/1.jpg' },
        { id: '124', fullName: 'Романов Петр II Алексеевич', photo: 'https://randomuser.me/api/portraits/men/2.jpg' },
        { id: '125', fullName: 'Романова Мария Федоровна', photo: 'https://randomuser.me/api/portraits/women/3.jpg' },
        { id: '126', fullName: 'Романов Павел I Петрович', photo: 'https://randomuser.me/api/portraits/men/4.jpg' },
        { id: '127', fullName: 'Романова Наталья Алексеевна', photo: 'https://randomuser.me/api/portraits/women/5.jpg' },
      ]);
      setLoading(false);
    }, 1000);
  };

  // Симуляция поиска по ID
  const handleSearchById = () => {
    if (!searchById.trim()) return;
    
    setLoading(true);
    // Имитация запроса к API
    setTimeout(() => {
      if (searchById === '123') {
        setSearchResults([
          { id: '123', fullName: 'Романова Екатерина Алексеевна', photo: 'https://randomuser.me/api/portraits/women/1.jpg' }
        ]);
      } else if (searchById === '124') {
        setSearchResults([
          { id: '124', fullName: 'Романов Петр II Алексеевич', photo: 'https://randomuser.me/api/portraits/men/2.jpg' }
        ]);
      } else {
        setSearchResults([]);
      }
      setLoading(false);
    }, 800);
  };

  // Загрузка фото (симуляция)
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Добавление человека с указанием пола
  const handleAddPerson = () => {
    const newMember: FamilyMember = {
      id: `member-${Date.now()}`,
      fullName,
      birthDate,
      deathDate: deathDate || undefined,
      photo: photo || undefined,
      relationshipType: relationType || undefined,
      relationTo: relationTo?.id,
      socialNetwork: socialUrl ? {
        type: socialType,
        url: socialUrl
      } : undefined,
      isApproved: true, // Локально добавленные люди сразу одобрены
      pendingRequestId: undefined,
      gender: gender
    };
    
    onAdd(newMember);
    onClose();
  };

  // Выбор существующего человека с определением пола
  const handleSelectExisting = (person: any) => {
    const newMember: FamilyMember = {
      id: person.id,
      fullName: person.fullName,
      photo: person.photo,
      relationshipType: relationType || undefined,
      relationTo: relationTo?.id,
      isApproved: false, // Человек из сервиса требует подтверждения
      pendingRequestId: `request-${Date.now()}`,
      gender: inferGenderFromName(person.fullName) // Определяем пол по имени
    };
    
    onAdd(newMember);
    onClose();
  };

  const renderSearchTab = () => (
    <Box sx={{ mt: 2 }}>
      <Tabs 
        value={activeTab === 1 ? 0 : 1} 
        onChange={(_, newValue) => setActiveTab(newValue === 0 ? 1 : 2)}
        sx={{ mb: 2 }}
      >
        <Tab label="Поиск по имени" />
        <Tab label="Поиск по ID" />
      </Tabs>
      
      {activeTab === 1 ? (
        // Поиск по имени
        <TextField
          fullWidth
          label="Поиск по имени"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: (
              <Button 
                variant="contained" 
                onClick={handleSearch}
                disabled={!searchTerm.trim() || loading}
                sx={{ minWidth: '80px' }}
              >
                {loading ? <CircularProgress size={24} /> : "Поиск"}
              </Button>
            )
          }}
        />
      ) : (
        // Поиск по ID
        <TextField
          fullWidth
          label="Введите ID человека"
          variant="outlined"
          value={searchById}
          onChange={(e) => setSearchById(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchById()}
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: (
              <Button 
                variant="contained" 
                onClick={handleSearchById}
                disabled={!searchById.trim() || loading}
                sx={{ minWidth: '80px' }}
              >
                {loading ? <CircularProgress size={24} /> : "Найти"}
              </Button>
            )
          }}
        />
      )}
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Человек получит запрос на добавление в ваше семейное древо.
        Информация появится после его подтверждения.
      </Typography>
      
      <Box sx={{ mt: 2, maxHeight: '250px', overflowY: 'auto' }}>
        {searchResults.length > 0 ? (
          searchResults.map((person) => (
            <Paper 
              key={person.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1.5,
                mb: 1.5,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }
              }}
              onClick={() => handleSelectExisting(person)}
              elevation={1}
            >
              <Avatar src={person.photo} sx={{ width: 50, height: 50, mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">{person.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">ID: {person.id}</Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<Add />}
                sx={{ ml: 1 }}
              >
                Добавить
              </Button>
            </Paper>
          ))
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (searchTerm.trim() || searchById.trim()) ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
            Ничего не найдено
          </Typography>
        ) : null}
      </Box>
    </Box>
  );

  const renderManualAddTab = () => (
    <Grid container spacing={2} sx={{ mt: 0.5 }}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="ФИО"
          variant="outlined"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </Grid>
      
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Пол</InputLabel>
          <Select
            value={gender}
            label="Пол"
            onChange={(e) => setGender(e.target.value as 'male' | 'female')}
          >
            <MenuItem value="male">Мужской</MenuItem>
            <MenuItem value="female">Женский</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Дата рождения"
          variant="outlined"
          placeholder="ДД.ММ.ГГГГ"
          value={birthDate}
          onChange={(e) => handleDateInput(e.target.value, setBirthDate)}
        />
      </Grid>
      
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Дата смерти (если применимо)"
          variant="outlined"
          placeholder="ДД.ММ.ГГГГ"
          value={deathDate}
          onChange={(e) => handleDateInput(e.target.value, setDeathDate)}
        />
      </Grid>
      
      <Grid item xs={12}>
        <Paper 
          variant="outlined" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed #aaa',
            borderRadius: 1,
            p: 2,
            mb: 1
          }}
        >
          {photo ? (
            <Box sx={{ position: 'relative', width: 120, height: 120 }}>
              <Avatar 
                src={photo} 
                sx={{ width: 120, height: 120, margin: '0 auto' }} 
              />
              <IconButton
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: -8, 
                  right: -8,
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0'
                }}
                onClick={() => setPhoto(null)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Button 
              component="label" 
              variant="outlined" 
              startIcon={<Person />}
              sx={{ margin: '0 auto' }}
            >
              Загрузить фото
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoUpload}
              />
            </Button>
          )}
        </Paper>
      </Grid>
      
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Социальная сеть</InputLabel>
          <Select
            value={socialType}
            label="Социальная сеть"
            onChange={(e) => setSocialType(e.target.value as SocialNetworkType)}
          >
            <MenuItem value={SocialNetworkType.VK}>ВКонтакте</MenuItem>
            <MenuItem value={SocialNetworkType.TELEGRAM}>Телеграм</MenuItem>
            <MenuItem value={SocialNetworkType.ODNOKLASSNIKI}>Одноклассники</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Ссылка на страницу"
          variant="outlined"
          value={socialUrl}
          onChange={(e) => setSocialUrl(e.target.value)}
        />
      </Grid>
    </Grid>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Добавить человека
        {relationType && relationTo ? (
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
            {relationType === 'parent' ? 'Родитель' : 
             relationType === 'child' ? 'Ребенок' : 
             relationType === 'spouse' ? 'Супруг(а)' : 'Брат/Сестра'} для {relationTo.fullName}
          </Typography>
        ) : null}
      </DialogTitle>
      
      <DialogContent>
        <Tabs 
          value={activeTab} 
          onChange={(_, value) => setActiveTab(value)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Добавить вручную" />
          <Tab label="Найти в сервисе" />
        </Tabs>
        
        {activeTab === 0 ? renderManualAddTab() : renderSearchTab()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        {activeTab === 0 && (
          <Button
            variant="contained"
            onClick={handleAddPerson}
            disabled={!fullName.trim()}
          >
            Добавить
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Компонент добавления связи
interface RelationIndicatorProps {
  position: 'top' | 'right' | 'bottom' | 'left';
  onClick: () => void;
}

const RelationIndicator: React.FC<RelationIndicatorProps> = ({ position, onClick }) => {
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { top: -15, left: '50%', transform: 'translateX(-50%)' };
      case 'right':
        return { right: -15, top: '50%', transform: 'translateY(-50%)' };
      case 'bottom':
        return { bottom: -15, left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { left: -15, top: '50%', transform: 'translateY(-50%)' };
    }
  };

  return (
    <Tooltip title="Добавить связь">
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          position: 'absolute',
          ...getPositionStyles(),
          backgroundColor: 'white',
          border: '2px dashed #1976d2',
          width: 32,
          height: 32,
          '&:hover': {
            backgroundColor: '#e3f2fd',
          }
        }}
      >
        <Add fontSize="small" color="primary" />
      </IconButton>
    </Tooltip>
  );
};

// Основной компонент блока семейного древа
interface FamilyTreeBlockProps {
  block: Block;
  onUpdateBlock: (changes: Partial<Block>) => void;
  isEditable?: boolean;
}

const FamilyTreeBlock: React.FC<FamilyTreeBlockProps> = ({ block, onUpdateBlock, isEditable = true }) => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [relationType, setRelationType] = useState<'parent' | 'child' | 'spouse' | 'sibling' | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showQuickAddDialog, setShowQuickAddDialog] = useState(false);
  const [quickAddPosition, setQuickAddPosition] = useState<'top' | 'right' | 'bottom' | 'left'>('bottom');
  const [showLines, setShowLines] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const familyMembersRefs = useRef<{[key: string]: React.RefObject<HTMLDivElement>}>({});

  // Добавляем gender к членам семьи при первом рендере
  const processedMembers = block.content.familyMembers 
    ? block.content.familyMembers.map(ensureGender) 
    : [];

  // Инициализация refs для каждого члена семьи
  useEffect(() => {
    if (processedMembers && processedMembers.length > 0) {
      const refs: {[key: string]: React.RefObject<HTMLDivElement>} = {};
      processedMembers.forEach(member => {
        refs[member.id] = React.createRef<HTMLDivElement>();
      });
      familyMembersRefs.current = refs;
    }
  }, [processedMembers]);

  // Эффект для активации отображения линий с задержкой
  // после позиционирования карточек
  useEffect(() => {
    setShowLines(false);
    const timer = setTimeout(() => {
      setShowLines(true);
    }, 300); // Задержка, соответствующая transition в позиционировании
    
    return () => clearTimeout(timer);
  }, [processedMembers]);

  // Добавление члена семьи
  const handleAddMember = (member: FamilyMember) => {
    const updatedMembers = [...(block.content.familyMembers || []), member];
    
    // Обновляем блок
    onUpdateBlock({
      content: {
        ...block.content,
        familyMembers: updatedMembers
      }
    });
    
    // Сбрасываем состояние
    setSelectedMember(null);
    setRelationType(null);
  };

  // Удаление члена семьи
  const handleRemoveMember = (memberId: string) => {
    const updatedMembers = (block.content.familyMembers || []).filter(
      member => member.id !== memberId
    );
    
    onUpdateBlock({
      content: {
        ...block.content,
        familyMembers: updatedMembers
      }
    });
  };

  // Выбор члена семьи и типа связи
  const handleSelectRelation = (member: FamilyMember, type: 'parent' | 'child' | 'spouse' | 'sibling') => {
    setSelectedMember(member);
    setRelationType(type);
    setShowAddDialog(true);
  };

  // Открытие диалога быстрого добавления
  const handleQuickAdd = (position: 'top' | 'right' | 'bottom' | 'left') => {
    setQuickAddPosition(position);
    setShowQuickAddDialog(true);
  };

  // Обработчик быстрого добавления члена семьи
  const handleQuickAddMember = (member: FamilyMember) => {
    // Определяем тип отношения на основе позиции
    let relationshipType: 'parent' | 'child' | 'spouse' | 'sibling' | undefined;
    
    if (quickAddPosition === 'top') {
      relationshipType = 'parent';
    } else if (quickAddPosition === 'bottom') {
      relationshipType = 'child';
    } else {
      relationshipType = 'spouse';
    }
    
    // Создаем копию с обновленным типом отношения
    const updatedMember: FamilyMember = {
      ...member,
      relationshipType
    };
    
    handleAddMember(updatedMember);
  };

  // Получение подписи для отношения
  const getRelationLabel = (member: FamilyMember): string => {
    const memberWithGender = ensureGender(member);
    
    if (!memberWithGender.relationshipType) return '';
    
    switch (memberWithGender.relationshipType) {
      case 'parent':
        return memberWithGender.gender === 'female' ? 'Мама' : 'Папа';
      case 'child':
        return memberWithGender.gender === 'female' ? 'Дочь' : 'Сын';
      case 'spouse':
        return memberWithGender.gender === 'female' ? 'Жена' : 'Муж';
      case 'sibling':
        return memberWithGender.gender === 'female' ? 'Сестра' : 'Брат';
      default:
        return '';
    }
  };

  // Построение семейной структуры
  const buildFamilyTree = () => {
    if (!processedMembers || processedMembers.length === 0) {
      return {
        generations: [],
        relationships: []
      };
    }

    // Найдем основных предков (корни древа)
    const ancestors = processedMembers.filter(member => 
      !member.relationTo || // Нет связи с кем-либо
      !processedMembers.some(m => m.id === member.relationTo && 
        (member.relationshipType === 'child' || member.relationshipType === 'spouse')) // Не является чьим-то ребенком или супругом
    );

    // Если не нашли предков, возьмем первого члена
    const roots = ancestors.length > 0 ? ancestors : [processedMembers[0]];

    // Построим дерево
    const generations: FamilyMember[][] = [];
    const relationships: {from: string, to: string, type: string}[] = [];
    
    // Добавляем корни в первое поколение
    generations.push(roots);
    
    // Для каждого человека находим детей и добавляем их в следующее поколение
    let currentGen = 0;
    while (currentGen < generations.length) {
      const nextGeneration: FamilyMember[] = [];
      
      for (const member of generations[currentGen]) {
        // Находим супругов
        const spouses = processedMembers.filter(m => 
          (m.relationTo === member.id && m.relationshipType === 'spouse') ||
          (member.relationTo === m.id && member.relationshipType === 'spouse')
        );
        
        // Добавляем связи с супругами
        for (const spouse of spouses) {
          if (!generations[currentGen].includes(spouse)) {
            generations[currentGen].push(spouse);
          }
          relationships.push({
            from: member.id,
            to: spouse.id,
            type: 'spouse'
          });
        }
        
        // Находим детей
        const children = processedMembers.filter(m => 
          (m.relationTo === member.id && m.relationshipType === 'child') ||
          (member.relationTo === m.id && member.relationshipType === 'parent')
        );
        
        // Добавляем детей в следующее поколение
        for (const child of children) {
          if (!nextGeneration.includes(child)) {
            nextGeneration.push(child);
          }
          relationships.push({
            from: member.id,
            to: child.id,
            type: 'parent-child'
          });
        }
      }
      
      if (nextGeneration.length > 0) {
        generations.push(nextGeneration);
      }
      
      currentGen++;
    }
    
    return { generations, relationships };
  };

  // Отрисовка линий связей между членами семьи
  const renderFamilyConnections = () => {
    if (!familyMembersRefs.current || Object.keys(familyMembersRefs.current).length === 0) {
      return null;
    }

    const { relationships } = buildFamilyTree();
    
    // Проверяем, показывать ли линии
    if (!showLines) return null;

    // Создаем линии связей
    return (
      <svg 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'visible'
        }}
      >
        {/* Контейнер для соединительных линий - рисуется под картами */}
        <g>
          {relationships.map((relation, index) => {
            const sourceRef = familyMembersRefs.current[relation.from];
            const targetRef = familyMembersRefs.current[relation.to];
            
            if (!sourceRef?.current || !targetRef?.current) return null;
            
            const sourceBounds = sourceRef.current.getBoundingClientRect();
            const targetBounds = targetRef.current.getBoundingClientRect();
            const containerBounds = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
            
            // Вычисляем начальные и конечные координаты в относительной системе
            const sourceX = sourceBounds.left + sourceBounds.width / 2 - containerBounds.left;
            const sourceY = sourceBounds.top + sourceBounds.height - containerBounds.top;
            const targetX = targetBounds.left + targetBounds.width / 2 - containerBounds.left;
            const targetY = targetBounds.top - containerBounds.top;
            
            // Определяем цвет на основе членов семьи
            const sourceMember = processedMembers.find(m => m.id === relation.from);
            const targetMember = processedMembers.find(m => m.id === relation.to);
            
            if (!sourceMember || !targetMember) return null;
            
            const sourceGender = ensureGender(sourceMember).gender;
            const targetGender = ensureGender(targetMember).gender;
            
            // Цвета в зависимости от пола - более мягкие оттенки
            const sourceColor = sourceGender === 'female' ? '#FF92C6' : '#92BEFF';
            const targetColor = targetGender === 'female' ? '#FF92C6' : '#92BEFF';
            
            // Линии для родитель-ребенок
            if (relation.type === 'parent-child') {
              const midY = sourceY + (targetY - sourceY) / 2;
              
              // Определим, должны ли линии разойтись в стороны перед соединением
              const shouldOffset = Math.abs(sourceX - targetX) > 80;
              
              if (shouldOffset) {
                // Сложная линия с горизонтальным участком посередине и скруглёнными углами
                return (
                  <g key={`relation-${index}`}>
                    {/* Градиентная линия */}
                    <defs>
                      <linearGradient id={`line-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={sourceColor} />
                        <stop offset="100%" stopColor={targetColor} />
                      </linearGradient>
                    </defs>
                    
                    <path 
                      d={`M ${sourceX} ${sourceY} 
                          L ${sourceX} ${midY - 10} 
                          Q ${sourceX} ${midY} ${sourceX < targetX ? sourceX + 10 : sourceX - 10} ${midY}
                          L ${targetX < sourceX ? targetX + 10 : targetX - 10} ${midY}
                          Q ${targetX} ${midY} ${targetX} ${midY + 10}
                          L ${targetX} ${targetY}`} 
                      stroke={`url(#line-gradient-${index})`}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Маленькая точка соединения в начале линии */}
                    <circle cx={sourceX} cy={sourceY} r="3" fill={sourceColor} />
                    
                    {/* Маленькая точка соединения в конце линии */}
                    <circle cx={targetX} cy={targetY} r="3" fill={targetColor} />
                  </g>
                );
              } else {
                // Прямая вертикальная линия
                return (
                  <g key={`relation-${index}`}>
                    {/* Градиентная линия */}
                    <defs>
                      <linearGradient id={`line-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={sourceColor} />
                        <stop offset="100%" stopColor={targetColor} />
                      </linearGradient>
                    </defs>
                    
                    <line 
                      x1={sourceX} 
                      y1={sourceY} 
                      x2={targetX} 
                      y2={targetY}
                      stroke={`url(#line-gradient-${index})`}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    
                    {/* Маленькая точка соединения в начале линии */}
                    <circle cx={sourceX} cy={sourceY} r="3" fill={sourceColor} />
                    
                    {/* Маленькая точка соединения в конце линии */}
                    <circle cx={targetX} cy={targetY} r="3" fill={targetColor} />
                  </g>
                );
              }
            } 
            // Линии для супругов
            else if (relation.type === 'spouse') {
              // Горизонтальная линия для супругов с градиентом
              return (
                <g key={`relation-${index}`}>
                  {/* Градиентная линия */}
                  <defs>
                    <linearGradient id={`line-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={sourceColor} />
                      <stop offset="100%" stopColor={targetColor} />
                    </linearGradient>
                  </defs>
                  
                  <line 
                    x1={sourceBounds.left + sourceBounds.width - containerBounds.left} 
                    y1={sourceBounds.top + sourceBounds.height / 2 - containerBounds.top} 
                    x2={targetBounds.left - containerBounds.left} 
                    y2={targetBounds.top + targetBounds.height / 2 - containerBounds.top}
                    stroke={`url(#line-gradient-${index})`}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    strokeLinecap="round"
                  />
                  
                  {/* Маленькое сердечко или иконка посередине линии */}
                  <circle 
                    cx={(sourceBounds.left + sourceBounds.width - containerBounds.left + targetBounds.left - containerBounds.left) / 2} 
                    cy={(sourceBounds.top + sourceBounds.height / 2 - containerBounds.top + targetBounds.top + targetBounds.height / 2 - containerBounds.top) / 2}
                    r="4"
                    fill="#FF92C6"
                    stroke="#fff"
                    strokeWidth="1"
                  />
                </g>
              );
            }
            
            return null;
          })}
        </g>
      </svg>
    );
  };

  // Отрисовка семейного древа
  const renderFamilyTree = () => {
    if (!processedMembers || processedMembers.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          height: '100%',
          width: '100%',
          backgroundColor: '#f9f9f9',
          borderRadius: '16px',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
        }}>
          <Person sx={{ fontSize: 60, color: '#bbb', mb: 2 }} />
          <Typography variant="h6" align="center" gutterBottom>
            Семейное древо
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
          >
            Добавьте членов семьи для создания генеалогического древа.
          </Typography>
          
          {isEditable && (
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              sx={{ mt: 2 }}
              onClick={() => setShowAddDialog(true)}
            >
              Добавить человека
            </Button>
          )}
        </Box>
      );
    }

    const { generations } = buildFamilyTree();

    return (
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          p: 3,
          backgroundColor: '#f9f9f9',
          borderRadius: '16px',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
          // Добавляем сетку для выравнивания
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          overflowX: 'auto'
        }}
      >
        {/* Верхний индикатор для быстрого добавления члена в верхнее поколение */}
        {isEditable && (
          <RelationIndicator position="top" onClick={() => handleQuickAdd('top')} />
        )}
        
        {/* Отрисовка генерации (поколения людей) */}
        {generations.map((generation, genIndex) => (
          <Box
            key={`generation-${genIndex}`}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 3,
              my: 4,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {generation.map((member) => (
              <Box
                key={member.id}
                ref={familyMembersRefs.current[member.id]}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  transition: 'transform 0.3s ease'
                }}
              >
                <PersonCard
                  member={member}
                  onAddRelation={isEditable ? (type) => handleSelectRelation(member, type) : undefined}
                  onRemove={isEditable ? () => handleRemoveMember(member.id) : undefined}
                  relationLabel={getRelationLabel(member)}
                />
              </Box>
            ))}
          </Box>
        ))}
        
        {/* Соединительные линии */}
        {renderFamilyConnections()}
        
        {/* Кнопка быстрого добавления */}
        {isEditable && processedMembers.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mt: 2
          }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PersonAdd />}
              onClick={() => setShowAddDialog(true)}
              sx={{
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Добавить члена семьи
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        padding: 3,
        backgroundColor: block.style.backgroundColor || '#f9f9f9',
        color: block.style.color || '#000',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
      ref={containerRef}
    >
      {/* Индикаторы быстрого добавления связей (видны только в режиме редактирования и когда есть хотя бы один член) */}
      {isEditable && processedMembers && processedMembers.length > 0 && (
        <>
          <RelationIndicator position="top" onClick={() => handleQuickAdd('top')} />
          <RelationIndicator position="right" onClick={() => handleQuickAdd('right')} />
          <RelationIndicator position="bottom" onClick={() => handleQuickAdd('bottom')} />
          <RelationIndicator position="left" onClick={() => handleQuickAdd('left')} />
        </>
      )}
      
      {/* Содержимое древа */}
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          flex: 1,
          overflowY: 'auto',
          padding: 2
        }}
      >
        {renderFamilyTree()}
      </Box>
      
      {/* Диалог добавления человека */}
      <AddPersonDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setSelectedMember(null);
          setRelationType(null);
        }}
        onAdd={handleAddMember}
        relationType={relationType}
        relationTo={selectedMember}
      />
      
      {/* Диалог быстрого добавления человека через индикаторы */}
      <AddPersonDialog
        open={showQuickAddDialog}
        onClose={() => {
          setShowQuickAddDialog(false);
        }}
        onAdd={handleQuickAddMember}
        relationType={
          quickAddPosition === 'top' ? 'parent' : 
          quickAddPosition === 'bottom' ? 'child' : 
          'spouse'
        }
        relationTo={null}
      />
    </Box>
  );
};

export default FamilyTreeBlock; 