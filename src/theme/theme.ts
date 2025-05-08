import { createTheme } from '@mui/material/styles';
import { ruRU } from '@mui/material/locale';

const customColors = {
  primary: '#1E88E5',
  secondary: '#7E57C2',
  success: '#66BB6A',
  error: '#EF5350',
  warning: '#FFCA28',
  info: '#29B6F6',
  light: '#F5F5F5',
  dark: '#212121',
  background: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
};

// Создаем тему Material UI
const theme = createTheme(
  {
    palette: {
      primary: {
        main: customColors.primary,
      },
      secondary: {
        main: customColors.secondary,
      },
      success: {
        main: customColors.success,
      },
      error: {
        main: customColors.error,
      },
      warning: {
        main: customColors.warning,
      },
      info: {
        main: customColors.info,
      },
      background: {
        default: customColors.background,
      },
      text: {
        primary: customColors.textPrimary,
        secondary: customColors.textSecondary,
      },
    },
    typography: {
      fontFamily: "'Tilda Sans', 'Roboto', 'Arial', sans-serif",
      h1: {
        fontFamily: "'Vetrino', serif",
        fontWeight: 700,
      },
      h2: {
        fontFamily: "'Vetrino', serif",
        fontWeight: 700,
      },
      h3: {
        fontFamily: "'Vetrino', serif",
        fontWeight: 700,
      },
      h4: {
        fontFamily: "'Vetrino', serif",
        fontWeight: 600,
      },
      h5: {
        fontFamily: "'Vetrino', serif",
        fontWeight: 600,
      },
      h6: {
        fontFamily: "'Vetrino', serif",
        fontWeight: 600,
      },
      subtitle1: {
        fontFamily: "'Tilda Sans', sans-serif",
      },
      subtitle2: {
        fontFamily: "'Tilda Sans', sans-serif",
      },
      body1: {
        fontFamily: "'Tilda Sans', sans-serif",
      },
      body2: {
        fontFamily: "'Tilda Sans', sans-serif",
      },
      button: {
        fontFamily: "'Tilda Sans', sans-serif",
        textTransform: 'none',
        fontWeight: 500,
      },
      caption: {
        fontFamily: "'Tilda Sans', sans-serif",
      },
      overline: {
        fontFamily: "'Tilda Sans', sans-serif",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: "'Tilda Sans', sans-serif",
            fontWeight: 500,
            '&.Mui-selected': {
              fontWeight: 600,
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            // Плавный рендеринг шрифтов
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    shape: {
      borderRadius: 8,
    },
  },
  ruRU // Добавляем русскую локализацию для Material UI
);

export { customColors };
export default theme; 