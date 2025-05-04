@echo off
echo ==========================================================
echo    Запуск бэкенда SocialQR (с проверкой зависимостей)
echo ==========================================================
echo.

set PYTHON_CMD=python
set BACKEND_DIR=src\backend
set PORT=8000

REM Проверка Python
%PYTHON_CMD% --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Python не установлен или недоступен!
    echo Установите Python 3.8 или выше с сайта https://www.python.org/
    pause
    exit /b 1
)

REM Переход в директорию бэкенда
cd %BACKEND_DIR% || (
    echo [ОШИБКА] Директория %BACKEND_DIR% не найдена!
    pause
    exit /b 1
)

echo [1/3] Установка необходимых пакетов...
%PYTHON_CMD% -m pip install --upgrade pip >nul 2>&1
%PYTHON_CMD% -m pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Не удалось установить зависимости!
    pause
    exit /b 1
)

echo [2/3] Проверка занятости порта %PORT%...
netstat -ano | findstr :%PORT% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [ВНИМАНИЕ] Порт %PORT% уже используется! 
    echo Возможно, сервер уже запущен или порт занят другим приложением.
    choice /c YN /m "Хотите попробовать запустить сервер все равно? (Y/N)"
    if %ERRORLEVEL% NEQ 1 (
        echo Запуск отменен. Освободите порт %PORT% и попробуйте снова.
        pause
        exit /b 1
    )
)

echo [3/3] Запуск сервера...
echo.
echo ==========================================================
echo    API доступно по адресу: http://localhost:%PORT%
echo    Для остановки сервера нажмите Ctrl+C
echo ==========================================================
echo.

%PYTHON_CMD% run_server.py

REM Если мы здесь, значит сервер завершил работу
echo.
echo Сервер остановлен.
pause 