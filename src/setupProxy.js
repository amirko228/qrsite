const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Мок-сервер для локальной разработки
  // В продакшн-среде этот прокси не будет использоваться,
  // так как мы применяем мок-функции напрямую в коде
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': ''
      },
      onProxyReq: function(proxyReq, req, res) {
        // Преобразуем путь перед отправкой запроса
        const originalPath = req.url;
        console.log(`Проксирование запроса: ${req.method} ${originalPath} -> ${proxyReq.path}`);
        
        // Логируем заголовки
        console.log('Заголовки запроса:', JSON.stringify(req.headers, null, 2));
        
        // Важно для multipart/form-data и application/x-www-form-urlencoded
        if (req.body) {
          try {
            console.log('Тело запроса:', JSON.stringify(req.body, null, 2));
          } catch (e) {
            console.log('Не удалось сериализовать тело запроса');
          }
        }
      },
      onProxyRes: function(proxyRes, req, res) {
        console.log(`Получен ответ от сервера для ${req.method} ${req.url}: ${proxyRes.statusCode}`);
        
        // Логируем заголовки ответа
        console.log('Заголовки ответа:', JSON.stringify(proxyRes.headers, null, 2));
      },
      onError: function(err, req, res) {
        console.error(`Ошибка прокси для ${req.method} ${req.url}:`, err);
        console.error('Детали ошибки:', err.stack || err.message || err);
        
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Ошибка прокси', 
            message: err.message,
            code: err.code 
          }));
        }
      }
    })
  );
}; 