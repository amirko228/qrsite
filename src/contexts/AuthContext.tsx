import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';

// Определяем, находимся ли мы в production среде (netlify и другие хостинги)
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Используем соответствующий API URL в зависимости от среды
// В продакшн используем мок-режим (MOCK_API = true) или реальный API-сервер
const MOCK_API = true; // Временно включаем мок-режим для всех сред, чтобы исправить ошибку
const API_BASE_URL = isProduction 
  ? 'https://socialqr-backend.onrender.com' // URL для продакшн (замените на ваш реальный API URL)
  : 'http://localhost:8000'; // URL для разработки

// Константы для оптимизации
const TOKEN_KEY = 'accessToken';
const USERS_STORAGE_KEY = 'adminPanelData'; // Ключ для хранения пользователей
const PROFILE_PREFIX = 'profile_';
const WIDGETS_PREFIX = 'widgets_';
const SETTINGS_PREFIX = 'settings_';
const AUTH_TIMEOUT = 30000; // 30 секунд для запросов аутентификации
const CACHE_EXPIRY = 60 * 1000; // 1 минута кеширования данных пользователя
const MAX_RETRIES = 3; // Максимальное количество повторных попыток

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  theme: string;
  isPublic: boolean;
}

interface BaseUser {
  id: number;
  username: string;
  name: string;
  is_admin: boolean;
}

interface User extends BaseUser {
  profile?: UserProfile;
}

interface MockUser extends BaseUser {
  password: string;
}

// Мок-данные для аутентификации в продакшн
const MOCK_USERS: MockUser[] = [
  { id: 1, username: 'admin', password: 'admin', name: 'Администратор', is_admin: true },
  { id: 2, username: 'user', password: 'user', name: 'Пользователь', is_admin: false },
  // Можно добавить больше пользователей если нужно
];

// Функция для загрузки пользователей из localStorage
const loadUsersFromStorage = (): any[] => {
  try {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    return savedUsers ? JSON.parse(savedUsers) : [];
  } catch (e) {
    console.error('Ошибка при загрузке пользователей из localStorage:', e);
    return [];
  }
};

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
    
    // Поиск пользователя в мок-данных
    let mockUser: MockUser | undefined = MOCK_USERS.find(u => u.username === username && u.password === password);
    
    // Если не нашли в предустановленных, ищем в localStorage
    if (!mockUser) {
      // Загружаем пользователей из localStorage
      const storageUsers = loadUsersFromStorage();
      
      // Ищем пользователя по имени пользователя И паролю
      const storageUser = storageUsers.find(u => u.username === username && u.password === password);
      
      // Если пользователь найден
      if (storageUser) {
        mockUser = {
          id: storageUser.id,
          username: storageUser.username,
          password: storageUser.password,
          name: storageUser.name,
          is_admin: false // Пользователи из localStorage НИКОГДА не могут быть админами
        };
        
        console.log('Успешная авторизация пользователя из localStorage:', {
          username: mockUser.username,
          is_admin: mockUser.is_admin,
          source: 'localStorage'
        });
      }
    } else {
      console.log('Успешная авторизация пользователя из MOCK_USERS:', {
        username: mockUser.username,
        is_admin: mockUser.is_admin,
        source: 'MOCK_USERS'
      });
    }
    
    if (mockUser) {
      // Генерируем фейковый токен с информацией о типе пользователя
      const token = `mock-token-${mockUser.id}-${mockUser.is_admin ? 'admin' : 'user'}-${Date.now()}`;
      
      // Преобразуем MockUser в User
      const user: User = {
        id: mockUser.id,
        username: mockUser.username,
        name: mockUser.name,
        is_admin: mockUser.is_admin
      };
      
      console.log('Авторизация завершена, возвращаем пользователя:', user);
      
      return {
        success: true,
        token,
        user
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
    
    // Извлекаем ID пользователя и тип из токена
    const tokenParts = token.split('-');
    const userId = parseInt(tokenParts[2]);
    const userType = tokenParts[3]; // 'admin' или 'user'
    
    // Проверяем: является ли пользователь админом по токену
    const isAdminByToken = userType === 'admin';
    
    // Проверяем сначала предустановленных пользователей
    let user: User | undefined = MOCK_USERS.find(u => u.id === userId);
    
    // Если не нашли в предустановленных, ищем в localStorage
    if (!user) {
      const storageUsers = loadUsersFromStorage();
      const storageUser = storageUsers.find(u => u.id === userId);
      
      if (storageUser) {
        user = {
          id: storageUser.id,
          username: storageUser.username,
          name: storageUser.name,
          // ВАЖНО: Пользователи из localStorage НИКОГДА не могут быть админами
          is_admin: false 
        };
        
        console.log('Восстановлена сессия пользователя из localStorage:', {
          username: user.username,
          is_admin: user.is_admin,
          source: 'localStorage'
        });
      }
    } else {
      // Для пользователя из MOCK_USERS проверяем его права из токена
      user = {
        ...user,
        // Двойная проверка прав администратора
        is_admin: user.is_admin && isAdminByToken
      };
      
      console.log('Восстановлена сессия пользователя из MOCK_USERS:', {
        username: user.username,
        is_admin: user.is_admin,
        source: 'MOCK_USERS'
      });
    }
    
    if (user) {
      const userObj = { 
        id: user.id, 
        username: user.username, 
        name: user.name, 
        // Явно устанавливаем флаг администратора
        is_admin: user.is_admin 
      };
      
      console.log('Проверка токена, возвращаем пользователя:', userObj);
      
      return {
        success: true,
        user: userObj
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

  // Функция для получения ключей хранилища по userId
  const getStorageKeys = (userId: string) => ({
    profile: `${PROFILE_PREFIX}${userId}`,
    widgets: `${WIDGETS_PREFIX}${userId}`,
    settings: `${SETTINGS_PREFIX}${userId}`
  });
      
  // Функция для загрузки профиля пользователя
  const loadUserProfile = (userId: string) => {
    const { profile: profileKey } = getStorageKeys(userId);
    try {
      const savedProfile = localStorage.getItem(profileKey);
      return savedProfile ? JSON.parse(savedProfile) : null;
    } catch (e) {
      console.error('Ошибка при загрузке профиля:', e);
      return null;
    }
  };

  // Функция для сохранения профиля пользователя
  const saveUserProfile = (userId: string, profile: any) => {
    const { profile: profileKey } = getStorageKeys(userId);
    try {
      localStorage.setItem(profileKey, JSON.stringify(profile));
    } catch (e) {
      console.error('Ошибка при сохранении профиля:', e);
    }
  };

  // Авторизация пользователя с оптимизацией и повторными попытками
  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    let retries = 0;
    let lastError: any = null;

    while (retries < MAX_RETRIES) {
      try {
        if (MOCK_API || isProduction) {
          const result = await mockLogin(username, password);
          
          if (result.success && result.token && result.user) {
            const userId = result.user.id.toString();
            
            // Загружаем существующий профиль или создаем новый
            let userProfile = loadUserProfile(userId);
            
            if (!userProfile) {
              const { profile: profileKey, widgets: widgetsKey, settings: settingsKey } = getStorageKeys(userId);
              
              userProfile = {
                id: userId,
                name: result.user.name,
                bio: '',
                avatar: '',
                theme: 'light',
                isPublic: true
              };
              
              // Сохраняем новый профиль
              localStorage.setItem(profileKey, JSON.stringify(userProfile));
              localStorage.setItem(widgetsKey, JSON.stringify([]));
              localStorage.setItem(settingsKey, JSON.stringify({
                theme: 'light',
                notifications: true,
                privacy: 'public'
              }));
            }
            
            // Сохраняем токен и информацию о текущем пользователе
            localStorage.setItem(TOKEN_KEY, result.token);
            localStorage.setItem('current_user_id', userId);
            localStorage.setItem('current_user_name', result.user.name);
            localStorage.setItem('current_user_is_admin', result.user.is_admin.toString());
            
            setUser({ ...result.user, profile: userProfile });
            setIsLoggedIn(true);
            setIsLoading(false);
            lastAuthCheckRef.current = Date.now();
            
            // Перенаправляем пользователя
            if (result.user && !result.user.is_admin) {
              window.location.href = `/social/${username}`;
            } else {
              window.location.href = '/social';
            }
            
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
        lastError = error;
        console.error(`Попытка входа ${retries + 1} из ${MAX_RETRIES} не удалась:`, error);
      
      if (error.response) {
          break;
        }
        
        retries++;
        
        if (retries < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }
    
    let errorMessage = 'Ошибка при входе';
    
    if (lastError) {
      if (lastError.response) {
        if (lastError.response.status === 401) {
          errorMessage = 'Неверный логин или пароль';
        } else if (lastError.response.status === 404) {
          errorMessage = 'API эндпоинт не найден. Проверьте путь';
        } else if (lastError.response.status === 422) {
          errorMessage = 'Ошибка валидации данных. Проверьте формат запроса.';
        } else if (lastError.response.status === 405) {
          errorMessage = 'Метод не разрешен. Проблема с настройкой API.';
        } else {
          errorMessage = `Ошибка сервера: ${lastError.response.status}`;
        }
      } else if (lastError.request) {
        errorMessage = 'Нет ответа от сервера. Проверьте соединение с интернетом.';
      } else {
        errorMessage = `Ошибка: ${lastError.message}`;
      }
      }
      
      return { success: false, error: errorMessage };
  }, []);

  // Оптимизированный выход пользователя
  const logout = useCallback(() => {
    // Сохраняем данные пользователей для админ-панели
    const adminPanelData = localStorage.getItem(USERS_STORAGE_KEY);
    
    console.log('Выход пользователя: полная очистка localStorage');
    
    // ПОЛНАЯ очистка localStorage
    localStorage.clear();
    
    // Восстанавливаем только данные для админ-панели
    if (adminPanelData) {
      localStorage.setItem(USERS_STORAGE_KEY, adminPanelData);
    }
    
    // Очищаем состояние React
    setUser(null);
    setIsLoggedIn(false);
    lastAuthCheckRef.current = 0;
    authCheckPromiseRef.current = null;

    // Перенаправление на страницу входа
    console.log('Перенаправление на страницу входа...');
    window.location.href = '/login';
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