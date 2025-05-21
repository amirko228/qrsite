import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';

// Определяем, находимся ли мы в production среде (netlify и другие хостинги)
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Используем соответствующий API URL в зависимости от среды
// В продакшн используем мок-режим (MOCK_API = true) или реальный API-сервер
const MOCK_API = true; // Всегда включаем мок-режим для всех сред

// Константы для оптимизации
const TOKEN_KEY = 'accessToken';
const USERS_STORAGE_KEY = 'adminPanelData'; // Ключ для хранения пользователей
const USERS_LOGIN_KEY = 'users'; // Дополнительный ключ для хранения пользователей для авторизации
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
  { id: 3, username: 'test', password: 'test', name: 'Тестовый пользователь', is_admin: false },
  // Можно добавить больше пользователей если нужно
];

// Функция для инициализации пользовательских данных для тестирования
const initializeTestUsers = () => {
  try {
    console.log('Инициализация тестовых пользователей...');

    // Очищаем предыдущие сессии авторизации, если они есть
    // Это помогает избежать проблем с неправильными токенами
    localStorage.removeItem(TOKEN_KEY);

    // Проверяем, существуют ли пользователи в adminPanelData
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    console.log('Данные пользователей из хранилища:', storedUsers ? 'найдены' : 'отсутствуют');

    // Обязательно создаем массив пользователей
    let users = [];
    try {
      // Пробуем распарсить существующих пользователей
      if (storedUsers) {
        users = JSON.parse(storedUsers);
        
        // Проверяем, что users действительно массив
        if (!Array.isArray(users)) {
          console.warn('Данные пользователей повреждены, сбрасываем');
          users = [];
        }
      }
    } catch (e) {
      console.error('Ошибка при разборе данных пользователей:', e);
      users = []; // При ошибке создаем пустой массив
    }
    
    // Добавляем тестового пользователя в adminPanelData, если нужно
    let needsUpdate = false;
    
    // Проверяем существование всех стандартных пользователей    
    // Обязательно добавляем стандартных пользователей
    if (!users.some((u) => u?.username === 'admin')) {
      users.push({ 
        id: 1, 
        username: 'admin', 
        password: 'admin', 
        name: 'Администратор',
        is_admin: true,
        subscription: null 
      });
      needsUpdate = true;
      console.log('Добавлен пользователь admin');
    }
    
    if (!users.some((u) => u?.username === 'user')) {
      users.push({ 
        id: 2, 
        username: 'user', 
        password: 'user', 
        name: 'Пользователь',
        is_admin: false,
        subscription: null 
      });
      needsUpdate = true;
      console.log('Добавлен пользователь user');
    }

    if (!users.some((u) => u?.username === 'test')) {
      users.push({ 
        id: 3, 
        username: 'test', 
        password: 'test', 
        name: 'Тестовый пользователь',
        is_admin: false,
        subscription: null 
      });
      needsUpdate = true;
      console.log('Добавлен пользователь test');
    }
    
    // Сохраняем обновленные данные, если были изменения
    if (needsUpdate) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      console.log('Обновлен список пользователей в adminPanelData');
    }
    
    // Также создаем/обновляем хранилище 'users' для совместимости 
    // Всегда обновляем loginUsers для надежности
    localStorage.setItem(USERS_LOGIN_KEY, JSON.stringify(users));
    console.log('Синхронизировано хранилище users с adminPanelData');
    
    // Создаем тестовый профиль, если его нет
    const profileKey = `${PROFILE_PREFIX}3`;
    const widgetsKey = `${WIDGETS_PREFIX}3`;
    const settingsKey = `${SETTINGS_PREFIX}3`;
    
    if (!localStorage.getItem(profileKey)) {
      localStorage.setItem(profileKey, JSON.stringify({
        id: '3',
        name: 'Тестовый пользователь',
        bio: 'Это тестовый профиль для демонстрации',
        avatar: '',
        theme: 'light',
        isPublic: true
      }));
      
      localStorage.setItem(widgetsKey, JSON.stringify([]));
      localStorage.setItem(settingsKey, JSON.stringify({
        theme: 'light',
        notifications: true,
        privacy: 'public'
      }));
      
      console.log('Инициализирован тестовый профиль');
    }
    
    // Проверка корректности данных
    console.log('Проверка данных после инициализации:');
    const finalUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const finalLoginUsers = localStorage.getItem(USERS_LOGIN_KEY);
    console.log(`USERS_STORAGE_KEY (${USERS_STORAGE_KEY}): ${finalUsers ? 'данные есть' : 'данных нет'}`);
    console.log(`USERS_LOGIN_KEY (${USERS_LOGIN_KEY}): ${finalLoginUsers ? 'данные есть' : 'данных нет'}`);

    // Выводим пользователей для отладки
    try {
      const parsedUsers = finalUsers ? JSON.parse(finalUsers) : [];
      console.log('Доступные пользователи:', parsedUsers.map((u: any) => ({ 
        id: u.id, 
        username: u.username, 
        password: u.password 
      })));
    } catch (e) {
      console.error('Ошибка при выводе пользователей для отладки:', e);
    }
    
    return true;
  } catch (e) {
    console.error('Ошибка при инициализации тестовых пользователей:', e);
    return false;
  }
};

// Сразу инициализируем тестовых пользователей при загрузке модуля
// Помогает обеспечить доступность пользователей до рендера компонентов
try {
  console.log('🚀 Автоматическая инициализация пользователей при старте приложения');
  initializeTestUsers();
} catch (e) {
  console.error('Ошибка при предварительной инициализации пользователей:', e);
}

// Используем соответствующий API URL в зависимости от среды
// В продакшн используем мок-режим (MOCK_API = true) или реальный API-сервер
const API_BASE_URL = isProduction 
  ? 'https://socialqr-backend.onrender.com' // URL для продакшн (замените на ваш реальный API URL)
  : 'http://localhost:8000'; // URL для разработки

// Функция для загрузки пользователей из localStorage
const loadUsersFromStorage = (): any[] => {
  try {
    console.log('Попытка загрузки пользователей из локального хранилища...');
    
    // Проверяем оба хранилища
    const adminUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const loginUsers = localStorage.getItem(USERS_LOGIN_KEY);
    
    console.log('Загрузка пользователей из хранилища:', {
      adminUsersExists: !!adminUsers,
      adminUsersLength: adminUsers ? JSON.parse(adminUsers).length : 0,
      loginUsersExists: !!loginUsers,
      loginUsersLength: loginUsers ? JSON.parse(loginUsers).length : 0,
    });
    
    // Предпочитаем основное хранилище, если оно существует и содержит хотя бы одного пользователя
    if (adminUsers) {
      try {
        const parsedUsers = JSON.parse(adminUsers);
        if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
          console.log(`Загружено ${parsedUsers.length} пользователей из ${USERS_STORAGE_KEY}`);
          return parsedUsers;
        }
      } catch (parseError) {
        console.error(`Ошибка при разборе данных из ${USERS_STORAGE_KEY}:`, parseError);
      }
    }
    
    // Если основное хранилище пусто или повреждено, проверяем дополнительное
    if (loginUsers) {
      try {
        const parsedUsers = JSON.parse(loginUsers);
        if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
          console.log(`Загружено ${parsedUsers.length} пользователей из ${USERS_LOGIN_KEY}`);
          return parsedUsers;
        }
      } catch (parseError) {
        console.error(`Ошибка при разборе данных из ${USERS_LOGIN_KEY}:`, parseError);
      }
    }
    
    // Если оба хранилища пусты или повреждены - создаем новых пользователей и сохраняем
    console.log('Локальные хранилища пусты или повреждены. Создаем стандартных пользователей.');
    
    // Создаем стандартных пользователей
    const standardUsers = MOCK_USERS.map(user => ({
      id: user.id,
      username: user.username,
      password: user.password,
      name: user.name,
      is_admin: user.is_admin,
      subscription: null
    }));
    
    // Сохраняем в оба хранилища для надежности
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(standardUsers));
    localStorage.setItem(USERS_LOGIN_KEY, JSON.stringify(standardUsers));
    
    console.log(`Созданы и сохранены ${standardUsers.length} стандартных пользователя`);
    return standardUsers;
    
  } catch (e) {
    console.error('Критическая ошибка при загрузке пользователей из localStorage:', e);
    // При ошибке возвращаем стандартных пользователей для работы в памяти
    return MOCK_USERS.map(user => ({
      id: user.id,
      username: user.username,
      password: user.password,
      name: user.name,
      is_admin: user.is_admin,
      subscription: null
    }));
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

  // Инициализируем тестовых пользователей при загрузке провайдера
  useEffect(() => {
    initializeTestUsers();
  }, []);

  // Мок-функция имитирующая запрос аутентификации
  const mockLogin = async (username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: User;
    error?: string;
  }> => {
    // Имитируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Авторизация: попытка входа пользователя "${username}" (пароль: ${password.length > 0 ? '***' : 'пустой'})`);
    
    try {
      // Специальное условие для отладки - выводим содержимое хранилища
      if (username === 'debug' && password === 'debug') {
        console.log('🛠️ РЕЖИМ ОТЛАДКИ: вывод информации о хранилище');
        const storageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          storageKeys.push(key);
        }
        
        console.log('Все ключи в localStorage:', storageKeys);
        console.log('Тестовые пользователи из MOCK_USERS:', MOCK_USERS);
        
        const adminUsers = localStorage.getItem(USERS_STORAGE_KEY);
        console.log(`Пользователи в ${USERS_STORAGE_KEY}:`, adminUsers);
        
        const loginUsers = localStorage.getItem(USERS_LOGIN_KEY);
        console.log(`Пользователи в ${USERS_LOGIN_KEY}:`, loginUsers);
        
        // Принудительно инициализируем тестовых пользователей
        initializeTestUsers();
        
        return {
          success: false,
          error: 'Режим отладки: информация выведена в консоль. Используйте стандартный логин/пароль для входа.'
        };
      }
    
      // Проверка на специальные кейсы для разработки - авторизуем всегда
      if (username === 'admin' && password === 'admin') {
        console.log('Специальный случай: входим как админ');
        const adminUser = MOCK_USERS[0]; // Первый пользователь в списке - админ
        const token = `mock-token-${adminUser.id}-admin-${Date.now()}`;
        
        return {
          success: true,
          token,
          user: {
            id: adminUser.id,
            username: adminUser.username,
            name: adminUser.name,
            is_admin: true
          }
        };
      }
        
      if (username === 'user' && password === 'user') {
        console.log('Специальный случай: входим как обычный пользователь');
        const regularUser = MOCK_USERS[1]; // Второй пользователь - обычный
        const token = `mock-token-${regularUser.id}-user-${Date.now()}`;
        
        return {
          success: true,
          token,
          user: {
            id: regularUser.id,
            username: regularUser.username,
            name: regularUser.name,
            is_admin: false
          }
        };
      }
        
      if (username === 'test' && password === 'test') {
        console.log('Специальный случай: входим как тестовый пользователь');
        const testUser = MOCK_USERS[2]; // Третий пользователь - тестовый
        const token = `mock-token-${testUser.id}-user-${Date.now()}`;
        
        return {
          success: true,
          token,
          user: {
            id: testUser.id,
            username: testUser.username,
            name: testUser.name,
            is_admin: false
          }
        };
      }
      
      // Если стандартные учетные записи не сработали, пробуем найти в хранилище
      console.log('Стандартные учетные записи не подошли, ищем пользователя в хранилище...');
      
      // Загружаем пользователей из localStorage
      const storageUsers = loadUsersFromStorage();
      
      console.log('Поиск пользователя для авторизации:', {
        username,
        usersFound: storageUsers.length,
        searchingIn: 'localStorage'
      });
      
      // Логируем список пользователей для отладки
      console.log('Список всех пользователей для отладки:', 
        storageUsers.map((u: any) => ({ id: u.id, username: u.username }))
      );
      
      // Ищем пользователя по имени пользователя И паролю
      const storageUser = storageUsers.find((u: any) => u.username === username && u.password === password);
      
      // Если пользователь найден
      if (storageUser) {
        const mockUser = {
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
      
      // При неудаче - принудительно инициализируем пользователей для следующего входа
      console.log('Пользователь не найден, пробуем переинициализировать базу пользователей');
      initializeTestUsers();
      
      // Если мы дошли до этого момента - пользователь не найден
      console.log('Неверный логин или пароль для:', username);
      return {
        success: false,
        error: 'Неверный логин или пароль. Используйте: admin/admin, user/user или test/test'
      };
    } catch (e) {
      console.error('Ошибка при авторизации:', e);
      return {
        success: false,
        error: 'Произошла ошибка при обработке авторизации'
      };
    }
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
    // Сохраняем данные пользователей для админ-панели и профилей
    const adminPanelData = localStorage.getItem(USERS_STORAGE_KEY);
    
    // Сохраняем все ключи профилей и виджетов перед очисткой
    const keysToPreserve: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith(PROFILE_PREFIX) || 
          key.startsWith(WIDGETS_PREFIX) || 
          key.startsWith(SETTINGS_PREFIX) || 
          key === USERS_STORAGE_KEY
        )) {
        keysToPreserve[key] = localStorage.getItem(key) || '';
      }
    }
    
    console.log('Выход пользователя: очистка данных аутентификации');
    
    // Удаляем только ключи, связанные с аутентификацией
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('current_user_name');
    localStorage.removeItem('current_user_is_admin');
    
    // Восстанавливаем сохраненные данные (профили и пр.)
    Object.entries(keysToPreserve).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
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