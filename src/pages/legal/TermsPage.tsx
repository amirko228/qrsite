import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const TermsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Условия использования
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Общие положения
          </Typography>
          <Typography paragraph>
            Настоящие Условия использования (далее — «Условия») регулируют отношения между SocialQR (далее — «Сервис») и пользователем (далее — «Пользователь») при использовании сервиса SocialQR.
          </Typography>
          <Typography paragraph>
            Используя Сервис, Пользователь соглашается с настоящими Условиями в полном объеме.
          </Typography>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. Регистрация пользователя
          </Typography>
          <Typography paragraph>
            Для использования полного функционала Сервиса Пользователю необходимо создать учетную запись. При регистрации Пользователь обязуется предоставить достоверную информацию.
          </Typography>
          <Typography paragraph>
            Пользователь несет ответственность за сохранность своих учетных данных и за все действия, совершенные с использованием его учетной записи.
          </Typography>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. Использование сервиса
          </Typography>
          <Typography paragraph>
            Сервис предоставляет Пользователю возможность создавать персональные QR-коды, связанные с цифровым профилем пользователя.
          </Typography>
          <Typography paragraph>
            Пользователь обязуется не использовать Сервис для размещения материалов, нарушающих законодательство РФ, права третьих лиц, нормы морали и этики.
          </Typography>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Подписка и оплата
          </Typography>
          <Typography paragraph>
            Сервис предлагает различные тарифные планы, включая бесплатный ограниченный доступ и платные планы с расширенным функционалом.
          </Typography>
          <Typography paragraph>
            Оплата подписки производится в соответствии с выбранным тарифом и способом оплаты. Возврат средств за подписку осуществляется согласно действующему законодательству.
          </Typography>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Интеллектуальная собственность
          </Typography>
          <Typography paragraph>
            Все права на Сервис, включая программный код, дизайн, логотипы, базы данных и другие элементы, принадлежат SocialQR.
          </Typography>
          <Typography paragraph>
            Пользователь сохраняет права на размещаемый им контент, однако предоставляет Сервису неисключительную лицензию на его использование в рамках функционирования Сервиса.
          </Typography>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            6. Заключительные положения
          </Typography>
          <Typography paragraph>
            SocialQR оставляет за собой право изменять настоящие Условия в одностороннем порядке, публикуя обновленную версию на сайте.
          </Typography>
          <Typography paragraph>
            Продолжение использования Сервиса после публикации изменений означает согласие Пользователя с новой редакцией Условий.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsPage; 