import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider as StyledThemeProvider, createGlobalStyle } from 'styled-components';
import CssBaseline from '@mui/material/CssBaseline';
import customTheme from './theme/theme';

// Глобальные стили для всего приложения
const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'Vetrino';
    src: url('/fonts/Vetrino.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'Tilda Sans';
    src: url('/fonts/TildaSans.07Web/TildaSans-Regular/TildaSans-Regular.woff2') format('woff2'),
         url('/fonts/TildaSans.07Web/TildaSans-Regular/TildaSans-Regular.woff') format('woff'),
         url('/fonts/TildaSans.07Web/TildaSans-Regular/TildaSans-Regular.eot') format('embedded-opentype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  /* Глобальные стили для улучшения адаптивности */
  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    overflow-x: hidden;
    font-family: 'Tilda Sans', sans-serif !important;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Vetrino', serif !important;
  }

  p, span, div, button, a, li, input, textarea, label {
    font-family: 'Tilda Sans', sans-serif !important;
  }
  
  /* Переопределяем для всех упоминаний "Pagememory" */
  h1:contains('Pagememory'),
  h2:contains('Pagememory'),
  h3:contains('Pagememory'),
  h4:contains('Pagememory'),
  h5:contains('Pagememory'),
  h6:contains('Pagememory'),
  span:contains('Pagememory'),
  p:contains('Pagememory'),
  div:contains('Pagememory') {
    font-family: 'Vetrino', serif !important;
  }
`;

// Ленивая загрузка компонентов для оптимизации
const Landing = lazy(() => import('./pages/landing/Landing'));
const Navigation = lazy(() => import('./components/common/Navigation'));
const Footer = lazy(() => import('./components/common/Footer'));
const Auth = lazy(() => import('./pages/auth/Auth'));
const SocialPage = lazy(() => import('./pages/social/SocialPage'));
const About = lazy(() => import('./pages/about/About'));
const Subscription = lazy(() => import('./pages/subscription/Subscription'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
const FAQ = lazy(() => import('./pages/FAQ'));
const ProfileSettings = lazy(() => import('./pages/profile/ProfileSettings'));

// Компонент загрузки для обеспечения лучшего UX во время загрузки страниц
const LoadingScreen = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
    }}
  >
    <CircularProgress />
  </Box>
);

// Компонент для защищенных маршрутов (требуется аутентификация)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Компонент для маршрутов администратора
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // Дополнительная проверка администратора
  const isActuallyAdmin = user && user.is_admin === true;
  
  // Выводим отладочную информацию
  console.log('Проверка доступа к админ-панели:', {
    username: user?.username,
    isAdmin: user?.is_admin,
    hasAccess: isActuallyAdmin
  });
  
  if (!isActuallyAdmin) {
    console.log('Доступ запрещен. Перенаправление на /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Отдельный компонент для админ-панели без футера
const AdminLayout = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Navigation />
      <AdminPanel />
    </Suspense>
  );
};

// Базовая структура приложения с навигацией и футером для авторизованных пользователей
const AppLayout = () => {
  const location = useLocation();
  const isAdminPanel = location.pathname === '/admin';
  
  // Для админ-панели используем отдельный шаблон без футера
  if (isAdminPanel) {
    return (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Navigation />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route 
          path="/social" 
          element={
            <ProtectedRoute>
              <SocialPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/social/:id" element={<SocialPage />} />
        <Route path="/login" element={<Auth />} />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          } 
        />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
      <Footer />
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <StyledThemeProvider theme={customTheme}>
        <GlobalStyle />
      <Router>
        <AuthProvider>
            <Routes>
              <Route path="/*" element={<AppLayout />} />
            </Routes>
        </AuthProvider>
      </Router>
      </StyledThemeProvider>
    </ThemeProvider>
  );
};

export default App;
