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
  Divider,
  ListItemIcon,
  Tooltip,
  Theme,
  Link as MuiLink,
  Badge
} from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon, AccountCircle, KeyboardArrowDown, Settings, ExitToApp, Person, Home, Info, AdminPanelSettings } from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const StyledAppBar = muiStyled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5, 0),
  }
}));

const Logo = muiStyled(Box)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 'bold',
  fontSize: '1.5rem',
  cursor: 'pointer',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.25rem'
  }
}));

const StyledDrawer = muiStyled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': { 
    boxSizing: 'border-box', 
    width: 280,
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    [theme.breakpoints.down('sm')]: {
      width: '85%',
      maxWidth: 280,
    }
  }
}));

// Общие стили для элементов списка меню
const listItemStyles = (theme: Theme) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5, 1),
  padding: theme.spacing(1.25, 2),
  transition: 'all 0.2s ease',
  '&.Mui-selected': {
    backgroundColor: `${theme.palette.primary.main}15`,
    '&:hover': {
      backgroundColor: `${theme.palette.primary.main}25`,
    },
  },
  '&:hover': {
    backgroundColor: `${theme.palette.action.hover}`,
    transform: 'translateX(4px)'
  }
});

const Navigation: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { isLoggedIn, user, logout } = useAuth();

  const menuItems = [
    { text: 'Главная', path: '/', icon: <Home /> },
    { text: 'О нас', path: '/about', icon: <Info /> }
  ];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/social');
  };

  const handleAdminClick = () => {
    setAnchorEl(null);
    setTimeout(() => {
    navigate('/admin');
    }, 100);
  };

  const handleSubscriptionClick = () => {
    handleMenuClose();
    navigate('/subscription');
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 30;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  useEffect(() => {
    // Сбрасываем меню пользователя при изменении статуса авторизации
    if (!isLoggedIn) {
      setAnchorEl(null);
    }
  }, [isLoggedIn]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ width: '100%', pt: 1 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 2,
          pb: 1 
        }}
      >
        <Logo>
          <Typography variant="h6" component="span">
            Pagememory
          </Typography>
        </Logo>
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{
            '&:hover': {
              backgroundColor: `${theme.palette.error.light}30`
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      {isLoggedIn && (
        <Box 
          sx={{ 
            px: 2, 
            py: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            backgroundColor: theme.palette.background.default,
            borderRadius: 2,
            mx: 2,
            mb: 2,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
          }}
        >
          <Avatar 
            sx={{ 
              width: 68, 
              height: 68,
              mb: 1.5,
              bgcolor: theme.palette.primary.main,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            {user?.name?.charAt(0) || <Person />}
          </Avatar>
          <Typography 
            variant="subtitle1" 
            fontWeight="bold"
            sx={{ mb: 0.5 }}
          >
            {user?.name || user?.username || 'Пользователь'}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 1.5, textAlign: 'center' }}
          >
            {user?.username || ''}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="medium"
            onClick={() => {
              handleDrawerToggle();
              navigate('/social');
            }}
            startIcon={<AccountCircle />}
            fullWidth
            sx={{ 
              mt: 0.5, 
              borderRadius: 2,
              py: 1,
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
              '&:hover': {
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Мой профиль
          </Button>
        </Box>
      )}
      
      <List sx={{ px: 1 }}>
        {menuItems.map((item, index) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <RouterLink 
              to={item.path}
              style={{ textDecoration: 'none', color: 'inherit' }}
              onClick={handleDrawerToggle}
            >
              <ListItemButton 
              selected={location.pathname === item.path}
                sx={listItemStyles(theme)}
              >
                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? theme.palette.primary.main : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                    fontWeight: location.pathname === item.path ? 'bold' : 'medium',
                    fontSize: '0.95rem'
                  }}
                />
              </ListItemButton>
            </RouterLink>
          </motion.div>
        ))}
        
        {isLoggedIn && (
          <>
            <Divider sx={{ my: 2, mx: 2 }} />
            <ListItemButton 
              onClick={() => {
                handleLogout();
                handleDrawerToggle();
              }}
              sx={{
                ...listItemStyles(theme),
                color: theme.palette.error.main,
                  '&:hover': {
                  backgroundColor: `${theme.palette.error.light}20`,
                  transform: 'translateX(4px)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ExitToApp color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Выйти" 
                primaryTypographyProps={{
                  color: theme.palette.error.main,
                  fontWeight: 'medium',
                  fontSize: '0.95rem'
                }}
              />
            </ListItemButton>
          </>
        )}
        
        {!isLoggedIn && (
          <>
            <Divider sx={{ my: 2, mx: 2 }} />
            <RouterLink
              to="/login"
              style={{ textDecoration: 'none', color: 'inherit' }}
              onClick={handleDrawerToggle}
            >
              <ListItemButton 
                sx={{
                  ...listItemStyles(theme),
                  backgroundColor: `${theme.palette.primary.main}10`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}20`,
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AccountCircle color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Войти" 
                  primaryTypographyProps={{
                    color: theme.palette.primary.main,
                    fontWeight: 'medium',
                    fontSize: '0.95rem'
                  }}
                />
              </ListItemButton>
            </RouterLink>
          </>
        )}
      </List>
      
      <Box
        sx={{
          textAlign: 'center',
          p: 2,
        }}
      >
        <Typography variant="caption">
          © 2023 Pagememory. Все права защищены.
        </Typography>
      </Box>
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
        elevation={scrolled ? 4 : 0}
      >
        <Container maxWidth="lg">
          <Toolbar 
            sx={{ 
              justifyContent: 'space-between',
              height: { xs: 56, sm: 64 },
              minHeight: { xs: 56, sm: 64 }
            }}
            disableGutters={isMobile}
          >
            {isMobile && (
              <IconButton
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ 
                  mr: 1, 
                  color: theme.palette.text.primary,
                  ml: 1 
                }}
                size="medium"
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
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  component="span"
                  sx={{ letterSpacing: 0.5 }}
                >
                  Pagememory
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
                    startIcon={isTablet ? item.icon : null}
                    sx={{
                      margin: isTablet ? '0 4px' : '0 8px',
                      color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      fontSize: isTablet ? '0.85rem' : '0.9rem',
                      py: isTablet ? 0.5 : 0.75,
                      px: isTablet ? 1 : 1.5,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: location.pathname === item.path ? '70%' : 0,
                        height: '2px',
                        background: theme.palette.primary.main,
                        transition: 'width 0.3s ease'
                      },
                      '&:hover': {
                        backgroundColor: 'transparent',
                        transform: 'translateY(-2px)',
                        '&::after': {
                          width: '70%'
                        }
                      }
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
                
                {isLoggedIn ? (
                  <Button
                    variant="contained"
                    color="primary"
                    aria-controls={open ? 'user-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleMenuOpen}
                    endIcon={<KeyboardArrowDown />}
                    startIcon={<AccountCircle />}
                    size={isTablet ? "small" : "medium"}
                    sx={{ 
                      ml: isTablet ? 1 : 2,
                      transition: 'all 0.3s ease',
                      px: isTablet ? 1.5 : 2,
                      py: isTablet ? 0.5 : 0.75,
                      fontSize: isTablet ? '0.8rem' : '0.9rem',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }
                    }}
                  >
                    {isTablet ? 'Профиль' : (user?.name || user?.username || 'Профиль')}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    component={RouterLink}
                    to="/login"
                    size={isTablet ? "small" : "medium"}
                    sx={{ 
                      ml: isTablet ? 1 : 2,
                      transition: 'all 0.3s ease',
                      px: isTablet ? 1.5 : 2,
                      py: isTablet ? 0.5 : 0.75,
                      fontSize: isTablet ? '0.8rem' : '0.9rem',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }
                    }}
                  >
                    Войти
                  </Button>
                )}
                
                {isLoggedIn && anchorEl && (
                  <Menu
                    id="user-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    MenuListProps={{
                      'aria-labelledby': 'profile-button',
                    }}
                    anchorOrigin={{
                      vertical: 'top',
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
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                        minWidth: 180
                      }
                    }}
                    disableEnforceFocus={true}
                    disableAutoFocusItem={true}
                  >
                    <Box sx={{ py: 1, px: 2, textAlign: 'center' }}>
                      <Avatar 
                        sx={{ 
                          mx: 'auto', 
                          mb: 1, 
                          width: 48, 
                          height: 48,
                          bgcolor: theme.palette.primary.main,
                          fontSize: '1.2rem',
                        }}
                      >
                        {user?.name?.charAt(0) || <Person />}
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {user?.name || user?.username || 'Профиль'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user?.username || ''}
                      </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <MenuItem onClick={() => navigate('/social')}>
                      <ListItemIcon>
                        <Person fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Мой профиль" />
                    </MenuItem>
                    
                    <MenuItem onClick={() => navigate('/settings')}>
                      <ListItemIcon>
                        <Settings fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Настройки" />
                    </MenuItem>
                    
                    <Divider />
                    
                    {user?.is_admin && (
                      <MenuItem 
                        onClick={handleAdminClick}
                        sx={{ py: 1.25 }}
                      >
                        <ListItemIcon>
                          <AdminPanelSettings fontSize="small" sx={{ color: theme.palette.info.main }} />
                        </ListItemIcon>
                        <ListItemText primary="Админ-панель" />
                      </MenuItem>
                    )}
                    
                    <Divider sx={{ my: 0.5 }} />
                    
                    <MenuItem 
                      onClick={handleLogout}
                      sx={{ 
                        py: 1.25,
                        mb: 0.5,
                        color: theme.palette.error.main,
                        '&:hover': {
                          backgroundColor: `${theme.palette.error.light}15`,
                        }
                      }}
                    >
                      <ListItemIcon>
                        <ExitToApp fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Выйти" 
                        primaryTypographyProps={{
                          color: theme.palette.error.main
                        }}
                      />
                    </MenuItem>
                  </Menu>
                )}
              </Box>
            )}
            
            {isMobile && isLoggedIn && (
              <>
              <Tooltip title="Профиль">
                <IconButton
                  onClick={() => navigate('/social')}
                  color="primary"
                  sx={{ mr: 1 }}
                >
                  <AccountCircle />
                </IconButton>
              </Tooltip>
                
                {user?.is_admin && (
                  <Tooltip title="Админ-панель">
                    <IconButton
                      onClick={() => navigate('/admin')}
                      color="info"
                      sx={{ mr: 1 }}
                    >
                      <AdminPanelSettings />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
            
            {isMobile && !isLoggedIn && (
              <Button
                component={RouterLink}
                to="/login"
                color="primary"
                variant="outlined"
                size="small"
                sx={{ 
                  mr: 1, 
                  fontSize: '0.75rem',
                  py: 0.5, 
                  px: 1.5
                }}
              >
                Войти
              </Button>
            )}
            
          </Toolbar>
        </Container>
      </StyledAppBar>

      <StyledDrawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
        }}
      >
        {drawer}
      </StyledDrawer>
      
      <Box sx={{ height: { xs: 56, sm: 64 } }} />
    </>
  );
};

export default Navigation; 