import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { COLORS } from '../theme/colors';

interface GlowingButtonProps extends ButtonProps {
  glowColor?: string;
  intensity?: 'light' | 'medium' | 'strong';
}

const GlowingButton: React.FC<GlowingButtonProps> = ({ 
  children, 
  glowColor = COLORS.accent,
  intensity = 'medium',
  sx,
  ...props 
}) => {
  const getGlowStyles = () => {
    const baseGlow = {
      boxShadow: `0 0 20px ${glowColor}40`,
      transition: 'all 0.3s ease',
    };

    switch (intensity) {
      case 'light':
        return {
          ...baseGlow,
          boxShadow: `0 0 10px ${glowColor}30`,
        };
      case 'strong':
        return {
          ...baseGlow,
          boxShadow: `0 0 30px ${glowColor}60, 0 0 60px ${glowColor}30`,
        };
      default:
        return baseGlow;
    }
  };

  return (
    <Button
      {...props}
      sx={{
        ...getGlowStyles(),
        '&:hover': {
          boxShadow: `0 0 25px ${glowColor}60, 0 0 50px ${glowColor}40`,
          transform: 'translateY(-2px)',
        },
        '&:active': {
          transform: 'translateY(0px)',
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
};

export default GlowingButton;
