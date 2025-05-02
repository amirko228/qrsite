import React from 'react';
import { Box, Container, Typography, Grid, Divider, IconButton, Link as MuiLink } from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn, YouTube } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const FooterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#f9f9f9',
  padding: theme.spacing(6, 0),
  marginTop: 'auto',
}));

const SocialIcon = styled(IconButton)(({ theme }) => ({
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
  },
}));

const LinkItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  '& a': {
    color: theme.palette.text.secondary,
    textDecoration: 'none',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
}));

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              SocialQR
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Создайте свою цифровую память и делитесь ею с близкими людьми через удобный QR-код.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <SocialIcon size="small" aria-label="Facebook">
                <Facebook fontSize="small" />
              </SocialIcon>
              <SocialIcon size="small" aria-label="Twitter">
                <Twitter fontSize="small" />
              </SocialIcon>
              <SocialIcon size="small" aria-label="Instagram">
                <Instagram fontSize="small" />
              </SocialIcon>
              <SocialIcon size="small" aria-label="LinkedIn">
                <LinkedIn fontSize="small" />
              </SocialIcon>
              <SocialIcon size="small" aria-label="YouTube">
                <YouTube fontSize="small" />
              </SocialIcon>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Сервис
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <LinkItem component="li">
                <MuiLink component={Link} to="/about" sx={{ textDecoration: 'none' }}>О нас</MuiLink>
              </LinkItem>
              <LinkItem component="li">
                <MuiLink component={Link} to="/pricing" sx={{ textDecoration: 'none' }}>Тарифы</MuiLink>
              </LinkItem>
              <LinkItem component="li">
                <MuiLink component={Link} to="/faq" sx={{ textDecoration: 'none' }}>Частые вопросы</MuiLink>
              </LinkItem>
              <LinkItem component="li">
                <MuiLink href="mailto:info@socialqr.app" sx={{ textDecoration: 'none' }}>Связаться с нами</MuiLink>
              </LinkItem>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Аккаунт
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <LinkItem component="li">
                <MuiLink component={Link} to="/login" sx={{ textDecoration: 'none' }}>Вход</MuiLink>
              </LinkItem>
              <LinkItem component="li">
                <MuiLink component={Link} to="/signup" sx={{ textDecoration: 'none' }}>Регистрация</MuiLink>
              </LinkItem>
              <LinkItem component="li">
                <MuiLink component={Link} to="/subscription" sx={{ textDecoration: 'none' }}>Подписка</MuiLink>
              </LinkItem>
              <LinkItem component="li">
                <MuiLink component={Link} to="/social" sx={{ textDecoration: 'none' }}>Мой профиль</MuiLink>
              </LinkItem>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Правовая информация
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <LinkItem component="li">
                <MuiLink component={Link} to="/terms" sx={{ textDecoration: 'none' }}>Условия использования</MuiLink>
              </LinkItem>
              <LinkItem component="li">
                <MuiLink component={Link} to="/privacy" sx={{ textDecoration: 'none' }}>Политика конфиденциальности</MuiLink>
              </LinkItem>
              <LinkItem component="li">
                <MuiLink component={Link} to="/cookie" sx={{ textDecoration: 'none' }}>Использование cookie</MuiLink>
              </LinkItem>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} SocialQR. Все права защищены.
          </Typography>
          <Box>
            <MuiLink 
              href="https://ozon.ru" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ mx: 1 }}
            >
              <img src="https://logobank.ru/images/logos/ozon-new-logo.png" alt="Ozon" height="20" />
            </MuiLink>
            <MuiLink 
              href="https://wildberries.ru" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ mx: 1 }}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Wildberries.svg/2560px-Wildberries.svg.png" alt="Wildberries" height="20" />
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </FooterContainer>
  );
};

export default Footer;

// Добавление пустого экспорта для решения проблемы с изолированными модулями
export {}; 