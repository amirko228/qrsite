import React from 'react';
import { Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import styled from 'styled-components';

const VideoContainer = styled(Box)`
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
`;

const StyledVideo = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

interface VideoWidgetProps {
  onDelete: () => void;
  onEdit: () => void;
  isEditing: boolean;
  videoUrl?: string;
}

const VideoWidget: React.FC<VideoWidgetProps> = ({
  onDelete,
  onEdit,
  isEditing,
  videoUrl = 'https://example.com/video.mp4'
}) => {
  return (
    <Box sx={{ position: 'relative' }}>
      <VideoContainer>
        <StyledVideo controls>
          <source src={videoUrl} type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </StyledVideo>
      </VideoContainer>
      {isEditing && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
          <IconButton onClick={onEdit} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={onDelete} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default VideoWidget; 