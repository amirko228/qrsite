import React from 'react';
import { Container, Typography, Grid, Box, Card, CardContent, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const StyledSection = styled.section`
  padding: 80px 0;
  background: #fff;
`;

const TeamMemberCard = styled(motion(Card))`
  height: 100%;
  transition: transform 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-10px);
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

  return (
    <>
      <StyledSection>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography variant="h2" align="center" gutterBottom>
              О нас
            </Typography>
            <Typography variant="h5" align="center" color="textSecondary" paragraph>
              Мы создаем технологии, которые помогают сохранить память о важных моментах жизни
            </Typography>
          </motion.div>
        </Container>
      </StyledSection>

      <Box sx={{ background: '#f8f9fa' }}>
        <StyledSection>
          <Container>
            <Typography variant="h3" align="center" gutterBottom>
              Наша миссия
            </Typography>
            <Typography variant="body1" align="center" sx={{ maxWidth: 800, mx: 'auto', mb: 8 }}>
              Мы верим, что каждая история заслуживает быть рассказанной и сохраненной. 
              Наша цель - создать инновационную платформу, которая поможет людям сохранить 
              и передать свои воспоминания будущим поколениям, используя современные технологии.
            </Typography>

            <Grid container spacing={4}>
              {teamMembers.map((member, index) => (
                <Grid item xs={12} md={4} key={member.name}>
                  <TeamMemberCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
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
          </Container>
        </StyledSection>
      </Box>

      <StyledSection>
        <Container>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography variant="h3" gutterBottom>
                  Наши ценности
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="h6" gutterBottom>
                    Инновации
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Мы постоянно ищем новые способы улучшить наш продукт и сделать его более удобным для пользователей.
                  </Typography>

                  <Typography component="li" variant="h6" gutterBottom>
                    Безопасность
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Мы обеспечиваем надежную защиту данных наших пользователей и их личной информации.
                  </Typography>

                  <Typography component="li" variant="h6" gutterBottom>
                    Доступность
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Наш сервис должен быть понятным и доступным для пользователей любого возраста.
                  </Typography>
                </Box>
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
        </Container>
      </StyledSection>
    </>
  );
};

export default About; 