import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Константа для URL API - меняйте этот URL при деплое
const API_BASE_URL = 'http://localhost:8000';
// const API_BASE_URL = 'https://socialqr-backend.onrender.com'; // URL для продакшн

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

  // Проверка аутентификации при загрузке
  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      setUser(null);
      setIsLoggedIn(false);
      setIsLoading(false);
      return false;
    }

    try {
      // Получаем данные пользователя с токеном
      const userData = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setUser(userData.data);
      setIsLoggedIn(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      localStorage.removeItem('accessToken');
      setUser(null);
      setIsLoggedIn(false);
      setIsLoading(false);
      return false;
    }
  };

  // Авторизация пользователя
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Попытка входа с логином:', username);
      
      // Создаем данные формы
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      console.log('Отправка запроса на:', `${API_BASE_URL}/token`);
      
      // Отправляем запрос напрямую к API
      const response = await axios.post(`${API_BASE_URL}/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // Увеличиваем таймаут до 10 секунд
      });

      console.log('Ответ от сервера:', response.data);

      // Сохраняем токен в localStorage
      const token = response.data.access_token;
      localStorage.setItem('accessToken', token);
      
      // Получаем данные пользователя
      const userData = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setUser(userData.data);
      setIsLoggedIn(true);
      
      return { success: true };
    } catch (error: any) {
      console.error('Полная информация об ошибке:', error);
      let errorMessage = 'Ошибка при входе';
      
      if (error.response) {
        console.error('Данные ответа с ошибкой:', error.response.data);
        console.error('Статус ответа с ошибкой:', error.response.status);
        
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
        console.error('Данные запроса:', error.request);
        errorMessage = 'Нет ответа от сервера. Убедитесь, что сервер запущен по адресу ' + API_BASE_URL;
      } else {
        console.error('Сообщение об ошибке:', error.message);
        errorMessage = `Ошибка: ${error.message}`;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Выход пользователя
  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setIsLoggedIn(false);
  };

  // Проверяем авторизацию при загрузке компонента
  useEffect(() => {
    checkAuth();
    
    // Настраиваем глобальный перехватчик для всех запросов axios
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Настраиваем глобальный перехватчик для ответов
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          // Если получаем 401, значит токен истек или недействителен
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Очищаем перехватчики при размонтировании
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 