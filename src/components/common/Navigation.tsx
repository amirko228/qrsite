import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
  Container,
  styled as muiStyled,
  Menu,
  MenuItem,
  Avatar,
  Divider
} from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon, AccountCircle, KeyboardArrowDown, Settings, ExitToApp } from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const StyledAppBar = muiStyled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease'
}));

const Logo = muiStyled(Box)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 'bold',
  fontSize: '1.5rem',
  cursor: 'pointer',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)'
  }
}));

const Navigation: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const menuItems = [
    { text: 'Главная', path: '/' },
    { text: 'О нас', path: '/about' },
    { text: 'Возможности', path: '/features' },
    { text: 'Цены', path: '/pricing' },
  ];

  const handleSubscription = () => {
    // Здесь будет логика для оплаты подписки
    window.location.href = '/subscription';
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    window.location.href = '/social';
  };

  const handleSubscriptionClick = () => {
    handleMenuClose();
    window.location.href = '/subscription';
  };

  const handleLogout = () => {
    handleMenuClose();
    // В реальном приложении здесь будет логика выхода из аккаунта
    alert('Выход из аккаунта. В реальном приложении здесь будет API-запрос.');
    // После выхода перенаправляем на главную страницу
    window.location.href = '/';
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ width: 250, pt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2 }}>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {menuItems.map((item, index) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ListItemButton 
              component={RouterLink} 
              to={item.path}
              onClick={handleDrawerToggle}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  },
                },
              }}
            >
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          </motion.div>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <StyledAppBar 
        position="fixed"
        sx={{
          background: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
          boxShadow: scrolled ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, color: theme.palette.text.primary }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Box 
              component={RouterLink} 
              to="/" 
              sx={{ 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Logo>
                <Typography variant="h6" component="span">
                  SocialQR
                </Typography>
              </Logo>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.text}
                    component={RouterLink}
                    to={item.path}
                    sx={{
                      margin: '0 8px',
                      color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: location.pathname === item.path ? '100%' : 0,
                        height: '2px',
                        background: theme.palette.primary.main,
                        transition: 'width 0.3s ease'
                      },
                      '&:hover': {
                        backgroundColor: 'transparent',
                        transform: 'translateY(-2px)',
                        '&::after': {
                          width: '100%'
                        }
                      }
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
                
                <Button
                  variant="contained"
                  color="primary"
                  aria-controls={open ? 'user-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  onClick={handleMenuOpen}
                  endIcon={<KeyboardArrowDown />}
                  startIcon={<AccountCircle />}
                  sx={{ 
                    ml: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                >
                  Профиль
                </Button>
                <Menu
                  id="user-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  MenuListProps={{
                    'aria-labelledby': 'profile-button',
                  }}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  sx={{ 
                    mt: 1.5,
                    '& .MuiPaper-root': {
                      borderRadius: 2,
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <MenuItem onClick={handleProfileClick}>
                    <AccountCircle sx={{ mr: 1 }} /> Мой профиль
                  </MenuItem>
                  <MenuItem onClick={handleSubscriptionClick}>
                    <Settings sx={{ mr: 1 }} /> Настройки подписки
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ExitToApp sx={{ mr: 1 }} /> Выйти
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Toolbar>
        </Container>
      </StyledAppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 240,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)'
          },
        }}
      >
        {drawer}
      </Drawer>
      
      <Toolbar />
    </>
  );
};

export default Navigation; 