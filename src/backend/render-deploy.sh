#!/bin/bash

# Этот скрипт устанавливает зависимости и запускает приложение на Render

# Установка зависимостей
pip install -r requirements.txt

# Запуск приложения
uvicorn main:app --host 0.0.0.0 --port $PORT 