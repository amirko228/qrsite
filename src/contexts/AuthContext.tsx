import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Константа для URL API - меняйте этот URL при деплое
const API_BASE_URL = 'http://localhost:8000';
// const API_BASE_URL = 'https://socialqr-backend.onrender.com'; // Раскомментируйте для продакшн

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

  // Функция для получения данных пользователя
  const getUserProfile = async (token: string) => {
    try {
      // Пробуем сначала через прямой URL
      try {
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        console.error('Ошибка при прямом запросе профиля:', error);
        // Если прямой запрос не сработал, пробуем через прокси
        const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

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
      const userData = await getUserProfile(token);
      setUser(userData);
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
      
      let response;
      let error;
      
      // Добавляем прямой URL к бэкенду для тестирования
      const apiUrl = `${API_BASE_URL}/api/token`; 
      // Используем локальный URL для тестирования
      const directBackendUrl = `${API_BASE_URL}/token`;
      
      // Пробуем несколько форматов запросов, чтобы найти подходящий
      try {
        // Метод 1: FormData с прямым URL
        console.log("Пробуем метод FormData с прямым URL к бэкенду");
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        response = await axios.post(directBackendUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (err: any) {
        console.log("Метод FormData с прямым URL не сработал:", err.response?.status);
        error = err;
        
        try {
          // Метод 2: FormData через прокси
          console.log("Пробуем метод FormData через прокси");
          const formData = new FormData();
          formData.append('username', username);
          formData.append('password', password);
          
          response = await axios.post(apiUrl, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } catch (err2: any) {
          console.log("Метод FormData через прокси не сработал:", err2.response?.status);
          error = err2;
          
          try {
            // Метод 3: URLSearchParams с прямым URL
            console.log("Пробуем метод URLSearchParams с прямым URL");
            response = await axios.post(directBackendUrl, 
              new URLSearchParams({
                'username': username,
                'password': password,
                'grant_type': 'password'
              }),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              }
            );
          } catch (err3: any) {
            console.log("Метод URLSearchParams с прямым URL не сработал:", err3.response?.status);
            error = err3;
            
            try {
              // Метод 4: JSON с прямым URL
              console.log("Пробуем метод JSON с прямым URL");
              response = await axios.post(directBackendUrl, {
                username,
                password
              }, {
                headers: {
                  'Content-Type': 'application/json'
                }
              });
            } catch (err4: any) {
              console.log("Метод JSON с прямым URL не сработал:", err4.response?.status);
              error = err4;
              
              // Если все методы не сработали, используем последнюю ошибку
            }
          }
        }
      }
      
      // Если запрос не удался и мы исчерпали все методы
      if (!response) {
        throw error;
      }

      console.log('Ответ от сервера:', response.data);

      // Сохраняем токен в localStorage
      const token = response.data.access_token;
      localStorage.setItem('accessToken', token);
      
      // Получаем данные пользователя - также используем прямой URL
      const userData = await getUserProfile(token);
      setUser(userData);
      setIsLoggedIn(true);
      
      return { success: true };
    } catch (error: any) {
      console.error('Полная информация об ошибке:', error);
      let errorMessage = 'Ошибка при входе';
      
      if (error.response) {
        console.error('Данные ответа с ошибкой:', error.response.data);
        console.error('Статус ответа с ошибкой:', error.response.status);
        console.error('Заголовки ответа с ошибкой:', error.response.headers);
        
        if (error.response.status === 401) {
          errorMessage = 'Неверный логин или пароль';
        } else if (error.response.status === 404) {
          errorMessage = 'API эндпоинт не найден. Проверьте путь: ' + error.config?.url;
        } else if (error.response.status === 422) {
          errorMessage = 'Ошибка валидации данных. Проверьте формат запроса.';
        } else if (error.response.status === 405) {
          errorMessage = 'Метод не разрешен. Проблема с настройкой API. Обратитесь к администратору.';
        } else {
          errorMessage = `Ошибка сервера: ${error.response.status}`;
        }
      } else if (error.request) {
        console.error('Данные запроса:', error.request);
        errorMessage = 'Нет ответа от сервера. Возможно, API сервер не запущен или недоступен.';
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