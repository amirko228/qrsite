import React from 'react';
import { Container, Typography, Grid, Box, Card, CardContent, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import styled, { createGlobalStyle } from 'styled-components';

// Определим основные цвета для соответствия главной странице
const customColors = {
  primary: '#0A3D67', // Темно-синий
  secondary: '#3E9AFF', // Голубой
  white: '#FFFFFF', // Белый
  gray: '#f8f9fa' // Светло-серый
};

// Глобальные стили для шрифтов
const GlobalFonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap');

  h1, h2, h3, h4, h5, h6 {
    font-family: 'EB Garamond', serif !important;
  }

  p, span, div, button, a, li {
    font-family: 'Alegreya', serif !important;
  }
`;

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
  border-radius: 16px;
  overflow: hidden;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  position: relative;
  
  @media (max-width: 600px) {
    padding: 30px 20px;
    border-radius: 16px;
  }
`;

// Заголовок страницы - убираем полукруг
const HeaderSection = styled(BaseSection)`
  padding: 60px 40px;
  background: linear-gradient(135deg, ${customColors.white} 0%, ${customColors.secondary}15 100%);
  border-radius: 16px;
  
  @media (max-width: 600px) {
    padding: 40px 20px;
  }
`;

// Секция миссии - убираем неравномерное скругление
const MissionSection = styled(BaseSection)`
  background: linear-gradient(135deg, ${customColors.white} 0%, ${customColors.secondary}10 100%);
  border-radius: 16px;
`;

// Секция команды - убираем неравномерное скругление
const TeamSection = styled(BaseSection)`
  background: ${customColors.white};
  border-radius: 16px;
`;

// Секция преимуществ - убираем неравномерное скругление
const ValuesSection = styled(BaseSection)`
  background: linear-gradient(135deg, ${customColors.secondary}10 0%, ${customColors.white} 100%);
  border-radius: 16px;
`;

// Карточка для команды - убираем геометрические формы
const TeamMemberCard = styled(motion(Card))<{ index: number }>`
  height: 100%;
  transition: transform 0.3s ease;
  cursor: pointer;
  border-radius: 16px;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

// Блок для элементов списка - убираем геометрические формы
const ValueBlock = styled(Box)<{index: number}>`
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
`;

// Добавляем новые секции для подзаголовков из образца
const FeatureBox = styled(Box)`
  background-color: #f5f5f5;
  border-radius: 16px;
  padding: 30px;
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
`;

const StyledAccordion = styled(Box)<{index: number}>`
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
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
      title: 'Доступность',
      description: 'Мы стремимся сделать сервис максимально доступным, по этому его цена небольшая, а стоимость месячной подписки не превышает двух поездок на общественном транспорте в вашем городе.'
    },
    {
      title: 'Безопасность',
      description: 'Мы обеспечиваем надежную защиту данных наших пользователей и их личной информации.'
    },
    {
      title: 'Развитие',
      description: 'Мы постоянно ищем новые способы улучшить наш продукт и сделать его более удобным для пользователей. Наш сервис должен быть понятным и доступным для пользователей любого возраста.'
    }
  ];

  return (
    <>
      <GlobalFonts />
    <PageContainer>
      <Container maxWidth="lg">
        {/* Заголовок страницы */}
        <HeaderSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
              <Typography variant="h2" align="center" gutterBottom sx={{ position: 'relative', zIndex: 1, fontFamily: 'EB Garamond, serif' }}>
                О проекте
            </Typography>
              <Typography variant="h5" align="center" color="textSecondary" paragraph sx={{ position: 'relative', zIndex: 1, fontFamily: 'Alegreya, serif' }}>
                Проект "PageMemory" направлен на то, чтобы сохранить воспоминания для будущих поколений, сделать их доступными в любое время и в любом месте. Мы верим, что каждый человек оставляет след в сердцах других, и наша платформа помогает увековечить эти моменты в цифровом формате
            </Typography>
          </motion.div>
        </HeaderSection>

          {/* Секция с двумя блоками по образцу */}
          <Grid container spacing={4} sx={{ mb: 5 }}>
            <Grid item xs={12} md={6}>
              <FeatureBox>
                <Typography variant="h4" gutterBottom sx={{ fontFamily: 'EB Garamond, serif' }}>
                  Наша цель
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'Alegreya, serif' }}>
                  Мы создаем качественный продукт, стремимся популяризировать сохранение семейных историй и памяти о близких для будущих поколений
                </Typography>
              </FeatureBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <FeatureBox>
                <Typography variant="h4" gutterBottom sx={{ fontFamily: 'EB Garamond, serif' }}>
                  Доступность
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'Alegreya, serif' }}>
                  Мы стремимся сделать сервис максимально доступным, по этому его цена небольшая, а стоимость месячной подписки не превышает двух поездок на общественном транспорте в вашем городе.
                </Typography>
              </FeatureBox>
            </Grid>
          </Grid>

        {/* Секция миссии */}
        <MissionSection>
            <Typography variant="h3" align="center" gutterBottom sx={{ fontFamily: 'EB Garamond, serif' }}>
            Наша миссия
          </Typography>
            <Typography variant="body1" align="center" sx={{ maxWidth: 800, mx: 'auto', mb: 4, fontFamily: 'Alegreya, serif' }}>
            Мы верим, что каждая история заслуживает быть рассказанной и сохраненной. 
            Наша цель - создать инновационную платформу, которая поможет людям сохранить 
            и передать свои воспоминания будущим поколениям, используя современные технологии.
          </Typography>
        </MissionSection>

        {/* Секция команды */}
        <TeamSection>
            <Typography variant="h3" align="center" gutterBottom sx={{ fontFamily: 'EB Garamond, serif' }}>
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
                      <Typography variant="h6" gutterBottom sx={{ fontFamily: 'EB Garamond, serif' }}>
                      {member.name}
                    </Typography>
                      <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontFamily: 'Alegreya, serif' }}>
                      {member.role}
                    </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'Alegreya, serif' }}>
                      {member.description}
                    </Typography>
                  </CardContent>
                </TeamMemberCard>
              </Grid>
            ))}
          </Grid>
        </TeamSection>

          {/* Секция наших преимуществ (переименованная из ценностей) */}
        <ValuesSection>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                  <Typography variant="h3" gutterBottom align="center" sx={{ fontFamily: 'EB Garamond, serif' }}>
                    Наши преимущества
                </Typography>
                {values.map((value, index) => (
                  <ValueBlock key={value.title} index={index}>
                      <Typography component="h3" variant="h6" gutterBottom sx={{ position: 'relative', zIndex: 1, fontFamily: 'EB Garamond, serif' }}>
                      {value.title}
                    </Typography>
                      <Typography variant="body1" paragraph sx={{ position: 'relative', zIndex: 1, fontFamily: 'Alegreya, serif' }}>
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
                    alt="Наши преимущества"
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
    </>
  );
};

export default About; 