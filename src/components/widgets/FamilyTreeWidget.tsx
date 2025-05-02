import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Divider, Grid, Card, CardContent, Avatar, List, ListItem, ListItemButton, ListItemText, ListItemAvatar, FormControlLabel, Switch, CircularProgress } from '@mui/material';
import { Person, PersonAdd, Link, CloudDownload, CloudUpload, ContentCopy, Delete, Edit, Close, FamilyRestroom } from '@mui/icons-material';
import styled from 'styled-components';

// Интерфейс для человека в семейном древе
interface FamilyMember {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  gender: 'male' | 'female' | 'other';
  avatar?: string;
  bio?: string;
  parentIds: string[];
  childrenIds: string[];
  spouseIds: string[];
  profileUrl?: string;
  isRegistered: boolean;
  occupation?: string;
  location?: string;
}

interface FamilyTreeWidgetProps {
  initialMembers?: FamilyMember[];
  currentUserId: string;
  onSave: (members: FamilyMember[]) => void;
  readOnly?: boolean;
}

// Стили
const TreeContainer = styled.div`
  position: relative;
  min-height: 400px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  overflow: auto;
`;

const TreeNode = styled.div<{ $isSelected: boolean; $isCurrentUser: boolean }>`
  background-color: ${props => props.$isCurrentUser ? '#e3f2fd' : props.$isSelected ? '#f0f7ff' : 'white'};
  border: 2px solid ${props => props.$isCurrentUser ? '#2196f3' : props.$isSelected ? '#bbdefb' : '#e0e0e0'};
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 220px;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const TreeConnection = styled.div`
  border-left: 2px dashed #bbdefb;
  height: 20px;
  margin-left: 20px;
`;

const TreeLevel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 12px;
`;

const MemberAvatar = styled(Avatar)`
  width: 50px;
  height: 50px;
  margin-right: 16px;
`;

const SearchResult = styled(ListItemButton)<{ $isRegistered: boolean }>`
  background-color: ${props => props.$isRegistered ? '#f0f7ff' : 'white'};
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid ${props => props.$isRegistered ? '#bbdefb' : '#e0e0e0'};
  
  &:hover {
    background-color: ${props => props.$isRegistered ? '#e3f2fd' : '#f5f5f5'};
  }
`;

const ImportExportButtons = styled(Box)`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

// Компонент семейного древа
const FamilyTreeWidget: React.FC<FamilyTreeWidgetProps> = ({ initialMembers = [], currentUserId, onSave, readOnly = false }) => {
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [openEditor, setOpenEditor] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [editMember, setEditMember] = useState<FamilyMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FamilyMember[]>([]);
  const [relationshipType, setRelationshipType] = useState<'parent' | 'child' | 'spouse'>('parent');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Если нет членов семьи, добавляем текущего пользователя
  useEffect(() => {
    if (members.length === 0) {
      const currentUser: FamilyMember = {
        id: currentUserId,
        name: 'Я',
        gender: 'male',
        parentIds: [],
        childrenIds: [],
        spouseIds: [],
        isRegistered: true,
        profileUrl: `/social/${currentUserId}`
      };
      setMembers([currentUser]);
      setSelectedMemberId(currentUserId);
    }
  }, [currentUserId, members.length]);

  // Обработчик поиска пользователей
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    // Имитация API-запроса для поиска пользователей
    setTimeout(() => {
      // Мок-данные для демонстрации
      const mockSearchResults: FamilyMember[] = [
        {
          id: 'user1',
          name: 'Анна Смирнова',
          gender: 'female',
          birthDate: '1980-05-15',
          avatar: 'https://source.unsplash.com/random/100x100/?woman',
          parentIds: [],
          childrenIds: [],
          spouseIds: [],
          isRegistered: true,
          profileUrl: '/social/user1',
        },
        {
          id: 'user2',
          name: 'Иван Петров',
          gender: 'male',
          birthDate: '1975-08-23',
          avatar: 'https://source.unsplash.com/random/100x100/?man',
          parentIds: [],
          childrenIds: [],
          spouseIds: [],
          isRegistered: true,
          profileUrl: '/social/user2',
        },
        {
          id: 'nonregistered1',
          name: 'Мария Иванова',
          gender: 'female',
          parentIds: [],
          childrenIds: [],
          spouseIds: [],
          isRegistered: false,
        }
      ];
      
      // Фильтруем результаты по поисковому запросу
      const filteredResults = term 
        ? mockSearchResults.filter(m => m.name.toLowerCase().includes(term.toLowerCase()))
        : [];
        
      setSearchResults(filteredResults);
    }, 500);
  };
  
  // Добавляем нового члена семьи вручную
  const handleAddNewMember = () => {
    const newMember: FamilyMember = {
      id: `member_${Date.now()}`,
      name: '',
      gender: 'male',
      parentIds: [],
      childrenIds: [],
      spouseIds: [],
      isRegistered: false,
    };
    
    setEditMember(newMember);
    setOpenEditor(true);
  };
  
  // Редактирование существующего члена семьи
  const handleEditMember = (id: string) => {
    const member = members.find(m => m.id === id);
    if (member) {
      setEditMember({ ...member });
      setOpenEditor(true);
    }
  };
  
  // Сохранение изменений члена семьи
  const handleSaveMember = () => {
    if (!editMember) return;
    
    if (editMember.id.startsWith('member_')) {
      // Новый член семьи
      setMembers(prev => [...prev, editMember]);
    } else {
      // Обновление существующего
      setMembers(prev => prev.map(m => m.id === editMember.id ? editMember : m));
    }
    
    setOpenEditor(false);
    setEditMember(null);
    
    // Сохраняем изменения через callback
    onSave(members);
  };
  
  // Удаление члена семьи
  const handleDeleteMember = (id: string) => {
    const updatedMembers = members.filter(m => m.id !== id);
    
    // Удаляем все ссылки на удаленного члена семьи
    const cleanedMembers = updatedMembers.map(member => ({
      ...member,
      parentIds: member.parentIds.filter(pid => pid !== id),
      childrenIds: member.childrenIds.filter(cid => cid !== id),
      spouseIds: member.spouseIds.filter(sid => sid !== id),
    }));
    
    setMembers(cleanedMembers);
    
    if (selectedMemberId === id) {
      setSelectedMemberId(null);
    }
    
    // Сохраняем изменения через callback
    onSave(cleanedMembers);
  };
  
  // Добавление связи между членами семьи
  const handleAddRelationship = (targetMemberId: string) => {
    if (!selectedMemberId) return;
    
    const updatedMembers = [...members];
    const selectedIndex = updatedMembers.findIndex(m => m.id === selectedMemberId);
    const targetIndex = updatedMembers.findIndex(m => m.id === targetMemberId);
    
    if (selectedIndex === -1 || targetIndex === -1) return;
    
    switch (relationshipType) {
      case 'parent':
        // Добавляем targetMember как родителя selectedMember
        if (!updatedMembers[selectedIndex].parentIds.includes(targetMemberId)) {
          updatedMembers[selectedIndex].parentIds.push(targetMemberId);
          // Добавляем selectedMember как ребенка targetMember
          if (!updatedMembers[targetIndex].childrenIds.includes(selectedMemberId)) {
            updatedMembers[targetIndex].childrenIds.push(selectedMemberId);
          }
        }
        break;
        
      case 'child':
        // Добавляем targetMember как ребенка selectedMember
        if (!updatedMembers[selectedIndex].childrenIds.includes(targetMemberId)) {
          updatedMembers[selectedIndex].childrenIds.push(targetMemberId);
          // Добавляем selectedMember как родителя targetMember
          if (!updatedMembers[targetIndex].parentIds.includes(selectedMemberId)) {
            updatedMembers[targetIndex].parentIds.push(selectedMemberId);
          }
        }
        break;
        
      case 'spouse':
        // Взаимное добавление супругов
        if (!updatedMembers[selectedIndex].spouseIds.includes(targetMemberId)) {
          updatedMembers[selectedIndex].spouseIds.push(targetMemberId);
        }
        if (!updatedMembers[targetIndex].spouseIds.includes(selectedMemberId)) {
          updatedMembers[targetIndex].spouseIds.push(selectedMemberId);
        }
        break;
    }
    
    setMembers(updatedMembers);
    setOpenSearch(false);
    setSearchTerm('');
    setSearchResults([]);
    
    // Сохраняем изменения через callback
    onSave(updatedMembers);
  };
  
  // Экспорт древа в CSV или JSON формат
  const handleExportTree = () => {
    // В реальном приложении здесь будет более сложная логика форматирования
    const jsonData = JSON.stringify(members, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'family-tree.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Импорт древа из файла
  const handleImportTree = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string) as FamilyMember[];
        // Проверка данных перед импортом
        if (Array.isArray(importedData) && importedData.length > 0) {
          // Объединение с существующими данными или их замена
          // Здесь можно добавить логику обработки дубликатов
          setMembers(importedData);
          onSave(importedData);
        }
      } catch (error) {
        console.error('Ошибка при импорте:', error);
        // Здесь добавить уведомление об ошибке
      } finally {
        setLoading(false);
      }
    };
    
    reader.readAsText(file);
    
    // Сбрасываем значение input для возможности повторного выбора того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Получение всех родителей члена семьи
  const getParents = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return [];
    
    return members.filter(m => member.parentIds.includes(m.id));
  };
  
  // Получение всех детей члена семьи
  const getChildren = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return [];
    
    return members.filter(m => member.childrenIds.includes(m.id));
  };
  
  // Получение всех супругов члена семьи
  const getSpouses = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return [];
    
    return members.filter(m => member.spouseIds.includes(m.id));
  };
  
  // Рендерим карточку члена семьи
  const renderMemberCard = (member: FamilyMember) => {
    const isCurrentUser = member.id === currentUserId;
    const isSelected = member.id === selectedMemberId;
    
    return (
      <TreeNode 
        key={member.id}
        $isSelected={isSelected}
        $isCurrentUser={isCurrentUser}
        onClick={() => setSelectedMemberId(member.id)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar 
            src={member.avatar}
            sx={{ 
              width: 32, 
              height: 32, 
              mr: 1,
              bgcolor: member.gender === 'male' ? '#bbdefb' : member.gender === 'female' ? '#f8bbd0' : '#e0e0e0'
            }}
          >
            {!member.avatar && <Person />}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {member.name || 'Без имени'}
            </Typography>
            {member.birthDate && (
              <Typography variant="caption" color="textSecondary" display="block">
                {member.birthDate}
                {member.deathDate ? ` - ${member.deathDate}` : ''}
              </Typography>
            )}
          </Box>
          {!readOnly && (
            <Box>
              <IconButton 
                size="small" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleEditMember(member.id);
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
              {!isCurrentUser && (
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMember(member.id);
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
        
        {member.isRegistered && (
          <Tooltip title="Профиль на платформе">
            <Button 
              size="small" 
              fullWidth
              variant="outlined"
              href={member.profileUrl}
              sx={{ mt: 1 }}
            >
              Открыть профиль
            </Button>
          </Tooltip>
        )}
      </TreeNode>
    );
  };
  
  // Рендерим семью выбранного пользователя
  const renderSelectedFamily = () => {
    if (!selectedMemberId) return null;
    
    const selectedMember = members.find(m => m.id === selectedMemberId);
    if (!selectedMember) return null;
    
    const parents = getParents(selectedMemberId);
    const spouses = getSpouses(selectedMemberId);
    const children = getChildren(selectedMemberId);
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Семья {selectedMember.name}
        </Typography>
        
        {parents.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Родители:
            </Typography>
            <TreeLevel>
              {parents.map(parent => renderMemberCard(parent))}
            </TreeLevel>
            <TreeConnection />
          </Box>
        )}
        
        <Box mb={2}>
          <TreeLevel>
            {renderMemberCard(selectedMember)}
            {spouses.map(spouse => renderMemberCard(spouse))}
          </TreeLevel>
        </Box>
        
        {children.length > 0 && (
          <Box>
            <TreeConnection />
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Дети:
            </Typography>
            <TreeLevel>
              {children.map(child => renderMemberCard(child))}
            </TreeLevel>
          </Box>
        )}
        
        {!readOnly && (
          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<PersonAdd />}
              onClick={handleAddNewMember}
              size="small"
            >
              Добавить вручную
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Link />}
              onClick={() => setOpenSearch(true)}
              size="small"
            >
              Связать с человеком
            </Button>
          </Box>
        )}
      </Box>
    );
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Семейное древо
        </Typography>
        
        {!readOnly && (
          <ImportExportButtons>
            <Tooltip title="Импортировать из файла">
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Импорт'}
              </Button>
            </Tooltip>
            <Tooltip title="Экспортировать в файл">
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<CloudDownload />}
                onClick={handleExportTree}
                disabled={loading || members.length === 0}
              >
                Экспорт
              </Button>
            </Tooltip>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImportTree}
              accept=".json"
              style={{ display: 'none' }}
            />
          </ImportExportButtons>
        )}
      </Box>
      
      <TreeContainer>
        {members.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <FamilyRestroom sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography color="textSecondary">
              Семейное древо пока пусто
            </Typography>
            {!readOnly && (
              <Button 
                variant="contained" 
                onClick={handleAddNewMember}
                sx={{ mt: 2 }}
              >
                Добавить первого члена семьи
              </Button>
            )}
          </Box>
        ) : (
          renderSelectedFamily()
        )}
      </TreeContainer>
      
      {/* Диалог редактирования члена семьи */}
      <Dialog 
        open={openEditor} 
        onClose={() => setOpenEditor(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMember?.id.startsWith('member_') ? 'Добавить члена семьи' : 'Редактировать информацию'}
        </DialogTitle>
        <DialogContent>
          {editMember && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Имя"
                    fullWidth
                    value={editMember.name}
                    onChange={(e) => setEditMember({...editMember, name: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Пол</InputLabel>
                    <Select
                      value={editMember.gender}
                      label="Пол"
                      onChange={(e) => setEditMember({...editMember, gender: e.target.value as 'male' | 'female' | 'other'})}
                    >
                      <MenuItem value="male">Мужской</MenuItem>
                      <MenuItem value="female">Женский</MenuItem>
                      <MenuItem value="other">Другой</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Профессия"
                    fullWidth
                    value={editMember.occupation || ''}
                    onChange={(e) => setEditMember({...editMember, occupation: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Дата рождения"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={editMember.birthDate || ''}
                    onChange={(e) => setEditMember({...editMember, birthDate: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Дата смерти"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={editMember.deathDate || ''}
                    onChange={(e) => setEditMember({...editMember, deathDate: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Краткая биография"
                    fullWidth
                    multiline
                    rows={3}
                    value={editMember.bio || ''}
                    onChange={(e) => setEditMember({...editMember, bio: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Место жительства"
                    fullWidth
                    value={editMember.location || ''}
                    onChange={(e) => setEditMember({...editMember, location: e.target.value})}
                  />
                </Grid>
                {editMember.id !== currentUserId && (
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={editMember.isRegistered} 
                          onChange={(e) => setEditMember({...editMember, isRegistered: e.target.checked})}
                        />
                      }
                      label="Зарегистрирован на платформе"
                    />
                  </Grid>
                )}
                {editMember.isRegistered && editMember.id !== currentUserId && (
                  <Grid item xs={12}>
                    <TextField
                      label="URL профиля"
                      fullWidth
                      value={editMember.profileUrl || ''}
                      onChange={(e) => setEditMember({...editMember, profileUrl: e.target.value})}
                      placeholder="/social/username"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditor(false)}>Отмена</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveMember}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог поиска и связывания */}
      <Dialog 
        open={openSearch} 
        onClose={() => setOpenSearch(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Связать с человеком
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Тип связи</InputLabel>
              <Select
                value={relationshipType}
                label="Тип связи"
                onChange={(e) => setRelationshipType(e.target.value as 'parent' | 'child' | 'spouse')}
              >
                <MenuItem value="parent">Родитель</MenuItem>
                <MenuItem value="child">Ребенок</MenuItem>
                <MenuItem value="spouse">Супруг(а)</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Поиск по имени"
              fullWidth
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Введите имя для поиска..."
            />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Найденные пользователи:
              </Typography>
              
              {searchResults.length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                  {searchTerm ? 'Ничего не найдено' : 'Введите имя для поиска'}
                </Typography>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {searchResults.map(result => (
                    <SearchResult 
                      key={result.id}
                      $isRegistered={result.isRegistered}
                      onClick={() => handleAddRelationship(result.id)}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={result.avatar}
                          sx={{ 
                            bgcolor: result.gender === 'male' ? '#bbdefb' : result.gender === 'female' ? '#f8bbd0' : '#e0e0e0'
                          }}
                        >
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={result.name} 
                        secondary={
                          <>
                            {result.isRegistered ? 'Пользователь платформы' : 'Не зарегистрирован'}
                            {result.birthDate && ` • ${result.birthDate}`}
                          </>
                        }
                      />
                    </SearchResult>
                  ))}
                </List>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Или добавьте нового человека
            </Typography>
            
            <Button 
              variant="outlined" 
              startIcon={<PersonAdd />}
              onClick={() => {
                setOpenSearch(false);
                handleAddNewMember();
              }}
              fullWidth
            >
              Создать новую запись
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSearch(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FamilyTreeWidget; 