import React from 'react';
import { Backdrop, Box, CircularProgress, Typography, Fade } from '@mui/material';
import { COLORS } from '../theme/colors';

interface ActionLoaderProps {
  open: boolean;
  message?: string;
  subMessage?: string;
}

const ActionLoader: React.FC<ActionLoaderProps> = ({
  open,
  message = 'Loading...',
  subMessage = 'Please wait a moment while we process your request.'
}) => {
  return (
    <Backdrop
      open={open}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 999,
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(10, 12, 18, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Fade in={open} timeout={400}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: `1px solid rgba(255, 255, 255, 0.08)`,
            boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 15px ${COLORS.accent}15`,
            maxWidth: 400,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle, ${COLORS.accent}05 0%, transparent 70%)`,
              pointerEvents: 'none',
            }
          }}
        >
          {/* Animated Spinner with Glow */}
          <Box sx={{ position: 'relative', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress
              variant="determinate"
              sx={{ color: 'rgba(255, 255, 255, 0.05)' }}
              size={70}
              thickness={4}
              value={100}
            />
            <CircularProgress
              variant="indeterminate"
              disableShrink
              sx={{
                color: COLORS.accent,
                position: 'absolute',
                left: 0,
                filter: `drop-shadow(0px 0px 8px ${COLORS.accent})`,
                animationDuration: '800ms',
              }}
              size={70}
              thickness={4}
            />
          </Box>

          {/* Primary Message */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: COLORS.textPrimary,
              mb: 1.5,
              textShadow: `0 0 10px ${COLORS.accent}30`,
              animation: 'pulseText 2s ease-in-out infinite',
              '@keyframes pulseText': {
                '0%, 100%': {
                  opacity: 0.85,
                },
                '50%': {
                  opacity: 1,
                  filter: `drop-shadow(0 0 4px ${COLORS.accent}40)`,
                },
              },
            }}
          >
            {message}
          </Typography>

          {/* Sub Message */}
          <Typography
            variant="body2"
            sx={{
              color: COLORS.textSecondary,
              lineHeight: 1.6,
              fontSize: '0.85rem',
            }}
          >
            {subMessage}
          </Typography>
        </Box>
      </Fade>
    </Backdrop>
  );
};

export default ActionLoader;
