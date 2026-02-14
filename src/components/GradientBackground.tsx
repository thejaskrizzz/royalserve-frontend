import React from 'react';
import { Box } from '@mui/material';
import { COLORS } from '../theme/colors';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  children, 
  variant = 'primary' 
}) => {
  const getGradientStyles = () => {
    const gradients = {
      primary: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.surface} 50%, ${COLORS.surfaceAlt} 100%)`,
      secondary: `linear-gradient(135deg, ${COLORS.surface} 0%, ${COLORS.surfaceAlt} 50%, ${COLORS.background} 100%)`,
      success: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.accent} 50%, ${COLORS.surface} 100%)`,
      warning: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.gold} 50%, ${COLORS.surfaceAlt} 100%)`,
      error: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.danger} 50%, ${COLORS.surfaceAlt} 100%)`,
      info: `linear-gradient(135deg, ${COLORS.surface} 0%, ${COLORS.accent} 50%, ${COLORS.surfaceAlt} 100%)`,
    };

    return {
      background: gradients[variant],
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          none
        `,
        pointerEvents: 'none',
      },
    };
  };

  return (
    <Box sx={getGradientStyles()}>
      {children}
    </Box>
  );
};

export default GradientBackground;
