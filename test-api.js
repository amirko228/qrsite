const axios = require('axios');

async function testAPI() {
  const apis = [
    'http://localhost:8000', 
    'https://socialqr-backend.onrender.com'
  ];
  
  for (const baseUrl of apis) {
    console.log(`\nТестирование API по адресу: ${baseUrl}`);
    
    try {
      console.log('Проверка главной страницы API...');
      const rootResponse = await axios.get(baseUrl, { timeout: 5000 });
      console.log(`✅ Статус: ${rootResponse.status}`);
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
    }
    
    try {
      console.log('Проверка авторизации...');
      const formData = new URLSearchParams();
      formData.append('username', 'admin');
      formData.append('password', 'admin123');
      
      const tokenResponse = await axios.post(`${baseUrl}/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000
      });
      
      console.log(`✅ Статус: ${tokenResponse.status}`);
      console.log(`✅ Токен получен: ${tokenResponse.data.access_token?.substring(0, 15)}...`);
      
      // Проверяем токен
      if (tokenResponse.data.access_token) {
        try {
          console.log('Проверка профиля пользователя с токеном...');
          const userResponse = await axios.get(`${baseUrl}/users/me`, {
            headers: {
              'Authorization': `Bearer ${tokenResponse.data.access_token}`
            },
            timeout: 5000
          });
          
          console.log(`✅ Статус: ${userResponse.status}`);
          console.log(`✅ Данные пользователя: ${JSON.stringify(userResponse.data)}`);
        } catch (error) {
          console.log(`❌ Ошибка при получении профиля: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ Ошибка авторизации: ${error.message}`);
    }
  }
}

testAPI().catch(console.error); 