import React, { useState } from 'react';
import { Box, Typography, IconButton, TextField, Grid, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const InfoContainer = styled(Box)`
  padding: 24px;
  background: white;
  border-radius: 16px;
  min-height: 100px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  animation: ${fadeIn} 0.6s ease-out;
`;

const StyledTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    border-radius: 12px;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    
    &.Mui-focused {
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
    }
  }
`;

const InfoLabel = styled(Typography)`
  color: ${props => props.theme.palette.primary.main};
  font-weight: 500;
  margin-bottom: 4px;
`;

const InfoValue = styled(Typography)`
  color: ${props => props.theme.palette.text.primary};
  margin-bottom: 16px;
`;

const ActionButton = styled(IconButton)`
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
`;

interface ProfileInfo {
  fullName: string;
  birthDate: string;
  deathDate?: string;
  gender: string;
  family: string;
  hobbies: string;
  work: string;
}

interface ProfileInfoWidgetProps {
  onDelete: () => void;
  onEdit: () => void;
  isEditing: boolean;
  initialInfo?: ProfileInfo;
}

const ProfileInfoWidget: React.FC<ProfileInfoWidgetProps> = ({
  onDelete,
  onEdit,
  isEditing,
  initialInfo = {
    fullName: '',
    birthDate: '',
    deathDate: '',
    gender: '',
    family: '',
    hobbies: '',
    work: ''
  }
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [info, setInfo] = useState<ProfileInfo>(initialInfo);
  const theme = useTheme();

  const handleSave = () => {
    setIsEditMode(false);
  };

  const handleChange = (field: keyof ProfileInfo) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInfo({
      ...info,
      [field]: event.target.value
    });
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <InfoContainer>
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            color: theme.palette.primary.main,
            mb: 3
          }}
        >
          Информация
        </Typography>
        <AnimatePresence mode="wait">
          {isEditMode ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    label="ФИО"
                    value={info.fullName}
                    onChange={handleChange('fullName')}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Дата рождения"
                    type="date"
                    value={info.birthDate}
                    onChange={handleChange('birthDate')}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Дата смерти"
                    type="date"
                    value={info.deathDate}
                    onChange={handleChange('deathDate')}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Пол"
                    value={info.gender}
                    onChange={handleChange('gender')}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Семья"
                    value={info.family}
                    onChange={handleChange('family')}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    label="Увлечения"
                    value={info.hobbies}
                    onChange={handleChange('hobbies')}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    label="Работа"
                    value={info.work}
                    onChange={handleChange('work')}
                    size="small"
                  />
                </Grid>
              </Grid>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <InfoLabel variant="subtitle1">ФИО</InfoLabel>
                  <InfoValue variant="body1">{info.fullName}</InfoValue>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoLabel variant="subtitle1">Дата рождения</InfoLabel>
                  <InfoValue variant="body1">{info.birthDate}</InfoValue>
                </Grid>
                {info.deathDate && (
                  <Grid item xs={12} sm={6}>
                    <InfoLabel variant="subtitle1">Дата смерти</InfoLabel>
                    <InfoValue variant="body1">{info.deathDate}</InfoValue>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <InfoLabel variant="subtitle1">Пол</InfoLabel>
                  <InfoValue variant="body1">{info.gender}</InfoValue>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoLabel variant="subtitle1">Семья</InfoLabel>
                  <InfoValue variant="body1">{info.family}</InfoValue>
                </Grid>
                <Grid item xs={12}>
                  <InfoLabel variant="subtitle1">Увлечения</InfoLabel>
                  <InfoValue variant="body1">{info.hobbies}</InfoValue>
                </Grid>
                <Grid item xs={12}>
                  <InfoLabel variant="subtitle1">Работа</InfoLabel>
                  <InfoValue variant="body1">{info.work}</InfoValue>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      </InfoContainer>
      {isEditing && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            display: 'flex', 
            gap: 1,
            zIndex: 1
          }}
        >
          <AnimatePresence mode="wait">
            {isEditMode ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <ActionButton 
                  onClick={handleSave} 
                  size="small"
                  sx={{ 
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    }
                  }}
                >
                  <SaveIcon />
                </ActionButton>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <ActionButton 
                  onClick={() => setIsEditMode(true)} 
                  size="small"
                  sx={{ 
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    }
                  }}
                >
                  <EditIcon />
                </ActionButton>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <ActionButton 
              onClick={onDelete} 
              size="small"
              sx={{ 
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                }
              }}
            >
              <DeleteIcon />
            </ActionButton>
          </motion.div>
        </Box>
      )}
    </Box>
  );
};

export default ProfileInfoWidget; 