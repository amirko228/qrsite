@echo off
echo --------------------------------------------------
echo Запуск бэкенда SocialQR 
echo --------------------------------------------------
echo.
echo 1. Установка необходимых Python-пакетов...
cd src\backend
python -m pip install -r requirements.txt

echo.
echo 2. Запуск сервера API...
echo Адрес API: http://localhost:8000
echo.
echo Сервер запущен! Для остановки нажмите Ctrl+C
echo.

uvicorn main:app --reload --host 0.0.0.0 --port 8000 