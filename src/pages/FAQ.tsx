import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Paper
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { motion } from 'framer-motion';
import styled from 'styled-components';

// Стили для страницы FAQ
const PageContainer = styled(Box)`
  background-color: #f8f9fa;
  padding: 40px 20px;
  min-height: 100vh;
  
  @media (max-width: 600px) {
    padding: 20px 10px;
  }
`;

const HeaderSection = styled(Paper)`
  padding: 60px 40px;
  background: linear-gradient(135deg, #ffffff 0%, rgba(62, 154, 255, 0.1) 100%);
  border-radius: 16px;
  margin-bottom: 40px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 600px) {
    padding: 40px 20px;
  }
`;

const StyledAccordion = styled(Accordion)`
  border-radius: 12px !important;
  margin-bottom: 16px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
  overflow: hidden;
  
  &:before {
    display: none;
  }
  
  &.Mui-expanded {
    margin-bottom: 16px !important;
  }
`;

const AccordionHeader = styled(AccordionSummary)`
  padding: 0 24px;
  min-height: 64px !important;
  
  & .MuiAccordionSummary-content {
    margin: 16px 0 !important;
  }
`;

const AccordionContent = styled(AccordionDetails)`
  padding: 8px 24px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`;

// Стилизованная типография для заголовков с шрифтом Garamond
const TitleTypography = styled(Typography)`
  font-family: 'EB Garamond', serif !important;
`;

// Стилизованная типография для обычного текста с шрифтом Alegreya
const ContentTypography = styled(Typography)`
  font-family: 'Alegreya', serif !important;
`;

// Создаем глобальные стили для шрифтов
const GlobalFonts = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap');
`;

const FAQ: React.FC = () => {
  const faqItems = [
    {
      question: 'Безопасно ли хранить данные у вас?',
      answer: 'Да, мы шифруем все Ваши личные данные и храним их на серверах находящихся в РФ. Материалы, которые Вы загружаете на страницу памяти сохраняются на двух разных серверах, для предотвращения их безвозвратной потери.'
    },
    {
      question: 'Как приобрести страницу памяти?',
      answer: 'Вы можете заказать наш продукт по ссылке или найти по поиску товаров "Страница Памяти" на OZON или WB и оформите заказ до ближайшего пункта выдачи.'
    },
    {
      question: 'Что придет мне вместе с табличкой?',
      answer: 'При заказе с марекетплейсов Вам придет: Черный конверт, внутри него будет табличка с Qr-кодом и небольшая инструкция с логином и паролем'
    },
    {
      question: 'Как создать страницу памяти?',
      answer: 'Страницу памяти Вы создаете самостоятельно. Вскройте конверт, отсканируйте Qr-код и введите логин и пароль из конверта, при желании смените их. Далее с помощью встроенного конструктора создайте уникальную страницу памяти или используйте заранее созданные шаблоны.'
    },
    {
      question: 'Сколько стоит страница памяти?',
      answer: 'Стоимость страницы памяти зависит от выбранного вами тарифа. Базовая цена с годовой подпиской составляет 4000 рублей. Для получения актуальной информации о ценах и специальных предложениях, пожалуйста, посетите раздел "Подписка".'
    }
  ];

  return (
    <GlobalFonts>
      <PageContainer>
        <Container maxWidth="lg">
          <HeaderSection>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <TitleTypography variant="h2" align="center" gutterBottom>
                Частые вопросы
              </TitleTypography>
              <ContentTypography variant="h5" align="center" color="textSecondary" paragraph>
                Здесь вы найдете ответы на часто задаваемые вопросы о нашей платформе
              </ContentTypography>
            </motion.div>
          </HeaderSection>
          
          <Box sx={{ my: 4 }}>
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <StyledAccordion>
                  <AccordionHeader expandIcon={<ExpandMore />}>
                    <TitleTypography variant="h6">
                      {item.question}
                    </TitleTypography>
                  </AccordionHeader>
                  <AccordionContent>
                    <ContentTypography variant="body1">
                      {item.answer}
                    </ContentTypography>
                  </AccordionContent>
                </StyledAccordion>
              </motion.div>
            ))}
          </Box>
        </Container>
      </PageContainer>
    </GlobalFonts>
  );
};

export default FAQ; 