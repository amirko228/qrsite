import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import styled from 'styled-components';

const OverlayContainer = styled(Box)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
`;

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Загрузка...' }) => {
  return (
    <OverlayContainer>
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </OverlayContainer>
  );
};

export default LoadingOverlay; 