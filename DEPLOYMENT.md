# Инструкция по деплою SocialQR

## Деплой фронтенда на Vercel

1. Зарегистрируйтесь на [Vercel](https://vercel.com)
2. Подключите ваш GitHub репозиторий
3. Импортируйте проект
4. Настройки проекта оставьте по умолчанию:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
5. Нажмите Deploy

## Деплой бэкенда на Render

1. Зарегистрируйтесь на [Render](https://render.com)
2. Создайте новый Web Service
3. Подключите ваш GitHub репозиторий
4. Укажите настройки:
   - Name: socialqr-backend
   - Root Directory: src/backend
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Добавьте переменные окружения:
   - SECRET_KEY: (сгенерируйте секретный ключ)
   - DATABASE_URL: sqlite:///socialqr.db (или укажите URL вашей базы данных)
6. Нажмите Create Web Service

## Обновление настроек после деплоя

1. После деплоя фронтенда и бэкенда, обновите файл `vercel.json`:
   - Замените URL бэкенда в `rewrites` на ваш фактический URL бэкенда на Render
   
2. В файле `src/backend/main.py` обновите CORS настройки:
   - Добавьте URL вашего фронтенда на Vercel в список `allow_origins`

3. Перезапустите оба сервиса

## Проверка работоспособности

1. Проверьте, что фронтенд загружается по URL Vercel
2. Убедитесь, что регистрация и авторизация работают корректно
3. Если возникают ошибки, проверьте логи в консоли разработчика и на серверах Vercel/Render 