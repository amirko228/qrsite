/**
 * Скрипт для проверки соединения с бэкендом
 * Запуск: node test-connection.js
 */

// Адрес бэкенда для проверки
const BACKEND_URL = 'http://localhost:8000';

// Этот скрипт не требует установки модулей и использует только стандартный http модуль
const http = require('http');
const https = require('https');

function isHttpsUrl(url) {
  return url.startsWith('https://');
}

function testConnection(url) {
  console.log(`\nПроверка соединения с ${url}...`);
  
  const startTime = Date.now();
  const client = isHttpsUrl(url) ? https : http;
  
  const req = client.get(url, (res) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Статус: ${res.statusCode} ${res.statusMessage}`);
    console.log(`Время ответа: ${duration}ms`);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Соединение успешно установлено!');
    } else {
      console.log('⚠️ Получен ответ от сервера, но статус указывает на ошибку');
    }
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        if (data.length > 0) {
          console.log('Ответ сервера:');
          console.log(data.substring(0, 500) + (data.length > 500 ? '...' : ''));
        }
      } catch (e) {
        console.error('Ошибка при обработке ответа:', e.message);
      }
    });
  });
  
  req.on('error', (error) => {
    console.log(`❌ Ошибка соединения: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nСервер не запущен или недоступен. Проверьте:');
      console.log('1. Запущен ли бэкенд (используйте start-backend.bat)');
      console.log('2. Правильно ли указан порт (8000 по умолчанию)');
      console.log('3. Нет ли блокировки брандмауэром или антивирусом');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\nНе удалось найти сервер. Проверьте:');
      console.log('1. Правильно ли указан адрес сервера');
      console.log('2. Работает ли ваше сетевое соединение');
    }
  });
  
  req.on('timeout', () => {
    console.log('❌ Таймаут соединения');
    req.abort();
  });
  
  req.setTimeout(5000);
}

// Запуск теста
testConnection(BACKEND_URL); 