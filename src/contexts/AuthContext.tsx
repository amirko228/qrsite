import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

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
      const response = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
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
      
      // Пробуем несколько форматов запросов, чтобы найти подходящий
      try {
        // Метод 1: FormData
        console.log("Пробуем метод FormData");
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        response = await axios.post('/api/token', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (err: any) {
        console.log("Метод FormData не сработал:", err.response?.status);
        error = err;
        
        try {
          // Метод 2: URLSearchParams (стандарт OAuth2)
          console.log("Пробуем метод URLSearchParams");
          response = await axios.post('/api/token', 
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
        } catch (err2: any) {
          console.log("Метод URLSearchParams не сработал:", err2.response?.status);
          
          try {
            // Метод 3: JSON body
            console.log("Пробуем метод JSON");
            response = await axios.post('/api/token', {
              username,
              password
            }, {
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (err3: any) {
            console.log("Метод JSON не сработал:", err3.response?.status);
            
            // Если все методы не сработали, используем последнюю ошибку
            error = err3;
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
      
      // Получаем данные пользователя
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
        } else {
          errorMessage = `Ошибка сервера: ${error.response.status}`;
        }
      } else if (error.request) {
        console.error('Данные запроса:', error.request);
        errorMessage = 'Нет ответа от сервера. Убедитесь, что сервер запущен.';
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