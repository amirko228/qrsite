import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import CssBaseline from '@mui/material/CssBaseline';
import customTheme from './theme/theme';

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
const Editor = lazy(() => import('./pages/editor/Editor'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));

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
          path="/editor" 
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          } 
        />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
