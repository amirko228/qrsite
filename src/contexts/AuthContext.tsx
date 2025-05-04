import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';

// Определяем, находимся ли мы в production среде (netlify и другие хостинги)
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Используем соответствующий API URL в зависимости от среды
// В продакшн используем мок-режим (MOCK_API = true) или реальный API-сервер
const MOCK_API = isProduction; // Включаем мок-режим для продакшн
const API_BASE_URL = isProduction 
  ? 'https://socialqr-backend.onrender.com' // URL для продакшн (замените на ваш реальный API URL)
  : 'http://localhost:8000'; // URL для разработки

// Константы для оптимизации
const TOKEN_KEY = 'accessToken';
const AUTH_TIMEOUT = 30000; // 30 секунд для запросов аутентификации
const CACHE_EXPIRY = 60 * 1000; // 1 минута кеширования данных пользователя

// Мок-данные для аутентификации в продакшн
const MOCK_USERS = [
  { id: 1, username: 'admin', password: 'admin', name: 'Администратор', is_admin: true },
  { id: 2, username: 'user', password: 'user', name: 'Пользователь', is_admin: false },
  // Можно добавить больше пользователей если нужно
];

interface User {
  id: number;
  username: string;
  name: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const lastAuthCheckRef = useRef<number>(0);
  const authCheckPromiseRef = useRef<Promise<boolean> | null>(null);

  // Мок-функция имитирующая запрос аутентификации
  const mockLogin = async (username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: User;
    error?: string;
  }> => {
    // Имитируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Генерируем фейковый токен
      const token = `mock-token-${user.id}-${Date.now()}`;
      return {
        success: true,
        token,
        user: { id: user.id, username: user.username, name: user.name, is_admin: user.is_admin }
      };
    }
    
    return {
      success: false,
      error: 'Неверный логин или пароль'
    };
  };
  
  // Мок-функция для получения данных пользователя по токену
  const mockGetUser = async (token: string): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> => {
    // Имитируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (!token || !token.startsWith('mock-token-')) {
      return {
        success: false,
        error: 'Недействительный токен'
      };
    }
    
    // Извлекаем ID пользователя из токена
    const userId = parseInt(token.split('-')[2]);
    const user = MOCK_USERS.find(u => u.id === userId);
    
    if (user) {
      return {
        success: true,
        user: { id: user.id, username: user.username, name: user.name, is_admin: user.is_admin }
      };
    }
    
    return {
      success: false,
      error: 'Пользователь не найден'
    };
  };

  // Оптимизированная проверка аутентификации с кешированием и предотвращением гонок
  const checkAuth = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    
    // Если у нас уже идет проверка аутентификации, возвращаем тот же промис
    if (authCheckPromiseRef.current && now - lastAuthCheckRef.current < CACHE_EXPIRY) {
      return authCheckPromiseRef.current;
    }
    
    lastAuthCheckRef.current = now;
    setIsLoading(true);
    
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      setUser(null);
      setIsLoggedIn(false);
      setIsLoading(false);
      return false;
    }

    // Создаем новый промис для проверки аутентификации
    const authPromise = new Promise<boolean>(async (resolve) => {
      try {
        if (MOCK_API) {
          // Используем мок-функцию в продакшн
          const result = await mockGetUser(token);
          if (result.success && result.user) {
            setUser(result.user);
            setIsLoggedIn(true);
            setIsLoading(false);
            resolve(true);
          } else {
            localStorage.removeItem(TOKEN_KEY);
            setUser(null);
            setIsLoggedIn(false);
            setIsLoading(false);
            resolve(false);
          }
        } else {
          // Получаем данные пользователя с токеном
          const userData = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: AUTH_TIMEOUT
          });
          
          setUser(userData.data);
          setIsLoggedIn(true);
          setIsLoading(false);
          resolve(true);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setIsLoggedIn(false);
        setIsLoading(false);
        resolve(false);
      }
    });

    // Сохраняем промис и возвращаем его
    authCheckPromiseRef.current = authPromise;
    return authPromise;
  }, []);

  // Авторизация пользователя с оптимизацией
  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (MOCK_API) {
        // Используем мок-аутентификацию в продакшн
        const result = await mockLogin(username, password);
        
        if (result.success && result.token && result.user) {
          localStorage.setItem(TOKEN_KEY, result.token);
          setUser(result.user);
          setIsLoggedIn(true);
          lastAuthCheckRef.current = Date.now();
          return { success: true };
        } else {
          return { success: false, error: result.error || 'Ошибка при входе' };
        }
      } else {
        // Создаем данные формы для реального API
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        // Отправляем запрос с таймаутом
        const response = await axios.post(`${API_BASE_URL}/token`, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: AUTH_TIMEOUT
        });

        // Сохраняем токен в localStorage
        const token = response.data.access_token;
        localStorage.setItem(TOKEN_KEY, token);
        
        // Получаем данные пользователя
        const userData = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: AUTH_TIMEOUT
        });
        
        setUser(userData.data);
        setIsLoggedIn(true);
        
        // Сбрасываем кэш проверки аутентификации
        lastAuthCheckRef.current = Date.now();
        
        return { success: true };
      }
    } catch (error: any) {
      let errorMessage = 'Ошибка при входе';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Неверный логин или пароль';
        } else if (error.response.status === 404) {
          errorMessage = 'API эндпоинт не найден. Проверьте путь';
        } else if (error.response.status === 422) {
          errorMessage = 'Ошибка валидации данных. Проверьте формат запроса.';
        } else if (error.response.status === 405) {
          errorMessage = 'Метод не разрешен. Проблема с настройкой API.';
        } else {
          errorMessage = `Ошибка сервера: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Нет ответа от сервера. Проверьте соединение с интернетом.';
      } else {
        errorMessage = `Ошибка: ${error.message}`;
      }
      
      return { success: false, error: errorMessage };
    }
  }, []);

  // Оптимизированный выход пользователя
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setIsLoggedIn(false);
    lastAuthCheckRef.current = 0;
    authCheckPromiseRef.current = null;
  }, []);

  // Настраиваем axios для всех запросов с токеном один раз при загрузке
  useEffect(() => {
    // Первоначальная проверка аутентификации
    checkAuth();
    
    // Настраиваем глобальный перехватчик для всех запросов axios только если не используем моки
    if (!MOCK_API) {
      // Настраиваем глобальный перехватчик для всех запросов axios
      const requestInterceptor = axios.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem(TOKEN_KEY);
          if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Настраиваем глобальный перехватчик для ответов с оптимизацией обработки 401
      const responseInterceptor = axios.interceptors.response.use(
        (response) => response,
        async (error) => {
          // Проверяем только на 401 статус один раз
          if (error.response && error.response.status === 401) {
            // Выходим только если до этого пользователь был авторизован
            if (isLoggedIn) {
              logout();
            }
          }
          return Promise.reject(error);
        }
      );

      // Очищаем перехватчики при размонтировании
      return () => {
        axios.interceptors.request.eject(requestInterceptor);
        axios.interceptors.response.eject(responseInterceptor);
      };
    }
  }, [checkAuth, isLoggedIn, logout]);

  // Мемоизируем контекст для предотвращения ненужных рендеров
  const contextValue = useMemo(() => ({
    user,
    isLoggedIn,
    isLoading,
    login,
    logout,
    checkAuth
  }), [user, isLoggedIn, isLoading, login, logout, checkAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 