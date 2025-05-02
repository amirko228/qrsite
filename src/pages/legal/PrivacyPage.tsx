import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const PrivacyPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Политика конфиденциальности
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Введение
          </Typography>
          <Typography paragraph>
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сервиса SocialQR (далее — «Сервис»).
          </Typography>
          <Typography paragraph>
            Используя Сервис, пользователь дает согласие на обработку своих персональных данных в соответствии с настоящей Политикой.
          </Typography>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. Собираемая информация
          </Typography>
          <Typography paragraph>
            При регистрации и использовании Сервиса мы можем собирать следующие персональные данные:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Box component="li">
              <Typography>Имя, фамилия, адрес электронной почты</Typography>
            </Box>
            <Box component="li">
              <Typography>Информация о профиле (фотографии, личные данные, интересы)</Typography>
            </Box>
            <Box component="li">
              <Typography>Данные о местоположении (при согласии пользователя)</Typography>
            </Box>
            <Box component="li">
              <Typography>Информация о действиях пользователя при работе с Сервисом</Typography>
            </Box>
            <Box component="li">
              <Typography>Технические данные (IP-адрес, тип браузера, файлы cookie)</Typography>
            </Box>
          </Box>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. Цели обработки данных
          </Typography>
          <Typography paragraph>
            Персональные данные пользователей обрабатываются в следующих целях:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Box component="li">
              <Typography>Предоставление доступа к Сервису и его функциям</Typography>
            </Box>
            <Box component="li">
              <Typography>Обработка запросов пользователей и предоставление технической поддержки</Typography>
            </Box>
            <Box component="li">
              <Typography>Персонализация пользовательского опыта</Typography>
            </Box>
            <Box component="li">
              <Typography>Улучшение работы Сервиса и разработка новых функций</Typography>
            </Box>
            <Box component="li">
              <Typography>Информирование о новостях и обновлениях Сервиса</Typography>
            </Box>
          </Box>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Защита информации
          </Typography>
          <Typography paragraph>
            Мы принимаем необходимые организационные и технические меры для защиты персональных данных пользователей от несанкционированного доступа, уничтожения, изменения, блокирования и других неправомерных действий.
          </Typography>
          <Typography paragraph>
            Доступ к персональным данным имеют только уполномоченные сотрудники, которые обязаны соблюдать конфиденциальность.
          </Typography>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Передача данных третьим лицам
          </Typography>
          <Typography paragraph>
            Персональные данные пользователей не передаются третьим лицам, за исключением следующих случаев:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Box component="li">
              <Typography>С согласия пользователя</Typography>
            </Box>
            <Box component="li">
              <Typography>Для обеспечения работы Сервиса (поставщики услуг, партнеры)</Typography>
            </Box>
            <Box component="li">
              <Typography>По требованию законодательства</Typography>
            </Box>
          </Box>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            6. Права пользователей
          </Typography>
          <Typography paragraph>
            Пользователь имеет право:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Box component="li">
              <Typography>Получать информацию о хранящихся персональных данных</Typography>
            </Box>
            <Box component="li">
              <Typography>Требовать исправления неточных данных</Typography>
            </Box>
            <Box component="li">
              <Typography>Требовать удаления своих персональных данных</Typography>
            </Box>
            <Box component="li">
              <Typography>Отозвать согласие на обработку персональных данных</Typography>
            </Box>
          </Box>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            7. Изменения политики
          </Typography>
          <Typography paragraph>
            Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. Обновленная версия публикуется на сайте Сервиса.
          </Typography>
          <Typography paragraph>
            Продолжение использования Сервиса после публикации изменений означает согласие пользователя с новой редакцией Политики.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPage; 