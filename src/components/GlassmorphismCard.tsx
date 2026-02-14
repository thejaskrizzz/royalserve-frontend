import React from 'react';
import { Card, CardProps } from '@mui/material';
import { COLORS } from '../theme/colors';

interface GlassmorphismCardProps extends CardProps {
  children: React.ReactNode;
  intensity?: 'light' | 'medium' | 'strong';
}

const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({ 
  children, 
  intensity = 'medium',
  sx,
  ...props 
}) => {
  const getGlassmorphismStyles = () => {
    const baseStyles = {
      background: `rgba(255, 255, 255, 0.1)`,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${COLORS.border}`,
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    };

    switch (intensity) {
      case 'light':
        return {
          ...baseStyles,
          background: `rgba(255, 255, 255, 0.05)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${COLORS.border}`,
        };
      case 'strong':
        return {
          ...baseStyles,
          background: `rgba(255, 255, 255, 0.15)`,
          backdropFilter: 'blur(30px)',
          border: `1px solid ${COLORS.border}`,
        };
      default:
        return baseStyles;
    }
  };

  return (
    <Card
      {...props}
      sx={{
        ...getGlassmorphismStyles(),
        ...sx,
      }}
    >
      {children}
    </Card>
  );
};

export default GlassmorphismCard;

