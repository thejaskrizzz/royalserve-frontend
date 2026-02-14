import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

interface Bubble {
  id: number;
  size: number;
  x: number;
  y: number;
  opacity: number;
  animationDuration: number;
  delay: number;
}

const FloatingBubbles: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles: Bubble[] = [];
      const bubbleCount = 15;

      for (let i = 0; i < bubbleCount; i++) {
        newBubbles.push({
          id: i,
          size: Math.random() * 200 + 50, // 50-250px
          x: Math.random() * 100, // 0-100%
          y: Math.random() * 100, // 0-100%
          opacity: Math.random() * 0.3 + 0.1, // 0.1-0.4
          animationDuration: Math.random() * 20 + 15, // 15-35 seconds
          delay: Math.random() * 5, // 0-5 seconds delay
        });
      }

      setBubbles(newBubbles);
    };

    generateBubbles();
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      {bubbles.map((bubble) => (
        <Box
          key={bubble.id}
          sx={{
            position: 'absolute',
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            width: bubble.size,
            height: bubble.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, 
              rgba(254, 177, 179, ${bubble.opacity}), 
              rgba(253, 217, 219, ${bubble.opacity * 0.7}), 
              rgba(217, 231, 244, ${bubble.opacity * 0.5}), 
              rgba(153, 217, 249, ${bubble.opacity * 0.3}))`,
            filter: 'blur(20px)',
            animation: `float ${bubble.animationDuration}s ease-in-out infinite`,
            animationDelay: `${bubble.delay}s`,
            '@keyframes float': {
              '0%, 100%': {
                transform: 'translateY(0px) translateX(0px) scale(1)',
              },
              '25%': {
                transform: 'translateY(-20px) translateX(10px) scale(1.1)',
              },
              '50%': {
                transform: 'translateY(-10px) translateX(-15px) scale(0.9)',
              },
              '75%': {
                transform: 'translateY(-30px) translateX(5px) scale(1.05)',
              },
            },
          }}
        />
      ))}
    </Box>
  );
};

export default FloatingBubbles;
