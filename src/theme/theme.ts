import { createTheme } from '@mui/material/styles';

// Цвета согласно требованиям дизайна
const theme = createTheme({
  palette: {
    primary: {
      main: '#0A3D67', // Темно-синий
      light: '#3F6C97',
      dark: '#072A4A',
    },
    secondary: {
      main: '#3E9AFF', // Голубой
      light: '#6BB6FF',
      dark: '#1F7EE5',
    },
    background: {
      default: '#FFFFFF', // Белый
      paper: '#F5F7FA', // Светло-серый для фонов
    },
    text: {
      primary: '#000000', // Черный для основного текста
      secondary: '#4A5568', // Темно-серый для вторичного текста
    },
    grey: {
      100: '#F5F7FA', // Светло-серый
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568', // Темно-серый
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
  },
  typography: {
    fontFamily: [
      'Tilda Sans',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'Vetrino, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'Vetrino, serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'Vetrino, serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'Vetrino, serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: 'Vetrino, serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: 'Vetrino, serif',
      fontWeight: 600,
    },
    body1: {
      fontFamily: 'Tilda Sans, sans-serif',
    },
    body2: {
      fontFamily: 'Tilda Sans, sans-serif',
    },
    button: {
      fontFamily: 'Tilda Sans, sans-serif',
      textTransform: 'none',
    },
    subtitle1: {
      fontFamily: 'Tilda Sans, sans-serif',
    },
    subtitle2: {
      fontFamily: 'Tilda Sans, sans-serif',
    },
    caption: {
      fontFamily: 'Tilda Sans, sans-serif',
    },
    overline: {
      fontFamily: 'Tilda Sans, sans-serif',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        contained: {
          backgroundColor: '#0A3D67', // Темно-синий для кнопок
          color: '#FFFFFF', // Белый текст на кнопках
          '&:hover': {
            backgroundColor: '#072A4A',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: 'Tilda Sans, sans-serif',
        },
        h1: {
          fontFamily: 'Vetrino, serif',
        },
        h2: {
          fontFamily: 'Vetrino, serif',
        },
        h3: {
          fontFamily: 'Vetrino, serif',
        },
        h4: {
          fontFamily: 'Vetrino, serif',
        },
        h5: {
          fontFamily: 'Vetrino, serif',
        },
        h6: {
          fontFamily: 'Vetrino, serif',
        },
      },
    },
  },
});

export default theme; 