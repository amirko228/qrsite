import React from 'react';
import { Container, Typography, Grid, Box, Card, CardContent, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import styled from 'styled-components';

// Определим основные цвета для соответствия главной странице
const customColors = {
  primary: '#0A3D67', // Темно-синий
  secondary: '#3E9AFF', // Голубой
  white: '#FFFFFF', // Белый
  gray: '#f8f9fa' // Светло-серый
};

// Основной контейнер для всех секций
const PageContainer = styled(Box)`
  background-color: ${customColors.gray};
  padding: 40px 20px;
  min-height: 100vh;
  width: 100%;
  
  @media (max-width: 600px) {
    padding: 20px 10px;
  }
`;

// Базовая секция с закругленными углами
const BaseSection = styled(Box)`
  background: ${customColors.white};
  border-radius: 20px;
  overflow: hidden;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  position: relative;
  
  @media (max-width: 600px) {
    padding: 30px 20px;
    border-radius: 15px;
  }
`;

// Заголовок страницы
const HeaderSection = styled(BaseSection)`
  padding: 60px 40px;
  background: linear-gradient(135deg, ${customColors.white} 0%, ${customColors.secondary}15 100%);
  border-radius: 30px 30px 20px 20px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0; 
    width: 150px;
    height: 150px;
    background: ${customColors.secondary}20;
    border-radius: 0 0 0 100%;
    z-index: 0;
  }
  
  @media (max-width: 600px) {
    padding: 40px 20px;
  }
`;

// Секция миссии
const MissionSection = styled(BaseSection)`
  background: linear-gradient(135deg, ${customColors.white} 0%, ${customColors.secondary}10 100%);
  border-radius: 20px 50px 20px 20px;
`;

// Секция команды
const TeamSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 20px 20px 50px 20px;
`;

// Секция ценностей
const ValuesSection = styled(BaseSection)`
  background: linear-gradient(135deg, ${customColors.secondary}10 0%, ${customColors.white} 100%);
  border-radius: 20px 20px 20px 50px;
`;

// Карточка для команды с геометрическими формами
const TeamMemberCard = styled(motion(Card))<{ index: number }>`
  height: 100%;
  transition: transform 0.3s ease;
  cursor: pointer;
  border-radius: ${props => {
    switch(props.index % 3) {
      case 0: return '30px 15px 15px 15px'; // Скругление вверху слева
      case 1: return '15px 30px 15px 15px'; // Скругление вверху справа
      case 2: return '15px 15px 15px 30px'; // Скругление внизу слева
      default: return '15px';
    }
  }};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    z-index: 0;
    
    ${props => {
      switch(props.index % 3) {
        case 0: return `
          bottom: 0;
          right: 0;
          width: 90px;
          height: 90px;
          background: ${customColors.secondary}15;
          border-radius: 0 0 0 100%;
        `;
        case 1: return `
          top: 0;
          right: 0;
          width: 80px;
          height: 80px;
          background: ${customColors.secondary}20;
          border-radius: 0 0 0 100%;
        `;
        case 2: return `
          top: 0;
          left: 0;
          width: 100px;
          height: 100px;
          background: ${customColors.secondary}15;
          border-radius: 0 0 100% 0;
        `;
        default: return `
          display: none;
        `;
      }
    }}
  }

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

// Блок для элементов списка
const ValueBlock = styled(Box)<{index: number}>`
  padding: 20px;
  margin-bottom: 15px;
  border-radius: ${props => {
    switch(props.index % 3) {
      case 0: return '20px 20px 50px 20px'; // Скругление внизу справа
      case 1: return '20px 50px 20px 20px'; // Скругление вверху справа
      case 2: return '50px 20px 20px 20px'; // Скругление вверху слева
      default: return '20px';
    }
  }};
  background: rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    z-index: 0;
    
    ${props => {
      switch(props.index % 3) {
        case 0: return `
          bottom: 0;
          right: 0;
          width: 70px;
          height: 70px;
          background: ${customColors.secondary}10;
          border-radius: 70% 0 0 0;
        `;
        case 1: return `
          top: 0;
          right: 0;
          width: 60px;
          height: 60px;
          background: ${customColors.secondary}15;
          border-radius: 0 0 0 100%;
        `;
        case 2: return `
          top: 0;
          left: 0;
          width: 80px;
          height: 80px;
          background: ${customColors.secondary}10;
          border-radius: 0 0 100% 0;
        `;
        default: return `
          display: none;
        `;
      }
    }}
  }
`;

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'Александр Иванов',
      role: 'CEO & Основатель',
      description: 'Более 10 лет опыта в разработке инновационных решений',
      avatar: '/team/alex.jpg'
    },
    {
      name: 'Мария Петрова',
      role: 'Ведущий дизайнер',
      description: 'Специалист по UX/UI дизайну с фокусом на пользовательский опыт',
      avatar: '/team/maria.jpg'
    },
    {
      name: 'Дмитрий Сидоров',
      role: 'Технический директор',
      description: 'Эксперт в области веб-разработки и облачных технологий',
      avatar: '/team/dmitry.jpg'
    }
  ];

  const values = [
    {
      title: 'Инновации',
      description: 'Мы постоянно ищем новые способы улучшить наш продукт и сделать его более удобным для пользователей.'
    },
    {
      title: 'Безопасность',
      description: 'Мы обеспечиваем надежную защиту данных наших пользователей и их личной информации.'
    },
    {
      title: 'Доступность',
      description: 'Наш сервис должен быть понятным и доступным для пользователей любого возраста.'
    }
  ];

  return (
    <PageContainer>
      <Container maxWidth="lg">
        {/* Заголовок страницы */}
        <HeaderSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography variant="h2" align="center" gutterBottom sx={{ position: 'relative', zIndex: 1 }}>
              О нас
            </Typography>
            <Typography variant="h5" align="center" color="textSecondary" paragraph sx={{ position: 'relative', zIndex: 1 }}>
              Мы создаем технологии, которые помогают сохранить память о важных моментах жизни
            </Typography>
          </motion.div>
        </HeaderSection>

        {/* Секция миссии */}
        <MissionSection>
          <Typography variant="h3" align="center" gutterBottom>
            Наша миссия
          </Typography>
          <Typography variant="body1" align="center" sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
            Мы верим, что каждая история заслуживает быть рассказанной и сохраненной. 
            Наша цель - создать инновационную платформу, которая поможет людям сохранить 
            и передать свои воспоминания будущим поколениям, используя современные технологии.
          </Typography>
        </MissionSection>

        {/* Секция команды */}
        <TeamSection>
          <Typography variant="h3" align="center" gutterBottom>
            Наша команда
          </Typography>
          <Grid container spacing={4}>
            {teamMembers.map((member, index) => (
              <Grid item xs={12} md={4} key={member.name}>
                <TeamMemberCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  index={index}
                >
                  <CardContent sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        mx: 'auto', 
                        mb: 2,
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Typography variant="h6" gutterBottom>
                      {member.name}
                    </Typography>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      {member.role}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {member.description}
                    </Typography>
                  </CardContent>
                </TeamMemberCard>
              </Grid>
            ))}
          </Grid>
        </TeamSection>

        {/* Секция ценностей */}
        <ValuesSection>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography variant="h3" gutterBottom align="center">
                  Наши ценности
                </Typography>
                {values.map((value, index) => (
                  <ValueBlock key={value.title} index={index}>
                    <Typography component="h3" variant="h6" gutterBottom sx={{ position: 'relative', zIndex: 1 }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ position: 'relative', zIndex: 1 }}>
                      {value.description}
                    </Typography>
                  </ValueBlock>
                ))}
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Box
                  component="img"
                  src="/about/values.jpg"
                  alt="Наши ценности"
                  sx={{
                    width: '100%',
                    borderRadius: 4,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </motion.div>
            </Grid>
          </Grid>
        </ValuesSection>
      </Container>
    </PageContainer>
  );
};

export default About; 