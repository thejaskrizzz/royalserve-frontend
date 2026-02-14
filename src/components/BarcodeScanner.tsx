import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  QrCodeScanner,
  Close,
  CameraAlt,
  Stop,
} from '@mui/icons-material';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ open, onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const initializeScanner = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      codeReader.current = new BrowserMultiFormatReader();
      
      // Get available video devices
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        setError('No camera devices found. Please ensure your device has a camera.');
        setHasPermission(false);
        return;
      }

      // Use the first available camera (usually the back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;
      
      // Start decoding from video element
      await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            console.log('Barcode scanned:', barcode);
            onScan(barcode);
            stopScanning();
            onClose();
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.error('Scanning error:', error);
            setError('Failed to scan barcode. Please try again.');
          }
        }
      );
      
      setHasPermission(true);
    } catch (err: any) {
      console.error('Scanner initialization error:', err);
      setError(err.message || 'Failed to initialize camera. Please check permissions.');
      setHasPermission(false);
    } finally {
      setIsScanning(false);
    }
  }, [onScan, onClose]);

  useEffect(() => {
    if (open) {
      // Small delay to prevent blinking
      const timer = setTimeout(() => {
        initializeScanner();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open, initializeScanner]);

  const stopScanning = () => {
    if (codeReader.current) {
      try {
        // Properly stop the decoding process
        // Note: BrowserMultiFormatReader doesn't have a reset() method
        // The cleanup happens when we set it to null
        codeReader.current = null;
      } catch (error) {
        console.log('Error stopping scanner:', error);
        codeReader.current = null;
      }
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    initializeScanner();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          background: 'rgba(248, 249, 251, 0.95)',
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <QrCodeScanner sx={{ mr: 1 }} />
          <Typography variant="h6">Scan Product Barcode</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Position the barcode within the camera view to scan
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {hasPermission === false && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Camera permission denied. Please allow camera access and try again.
          </Alert>
        )}

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '300px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: '#000',
            }}
            autoPlay
            playsInline
            muted
            controls={false}
          />
          
          {isScanning && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: 'white',
              }}
            >
              <CircularProgress size={40} sx={{ color: 'white', mb: 1 }} />
              <Typography variant="body2">Scanning...</Typography>
            </Box>
          )}

          {/* Scanning overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '100px',
              border: '2px solid #99D9F9',
              borderRadius: '8px',
              background: 'rgba(153, 217, 249, 0.1)',
            }}
          />
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Supported formats: UPC, EAN, Code 128, Code 39, QR Code, and more
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          startIcon={<Stop />}
        >
          Cancel
        </Button>
        
        {error && (
          <Button
            onClick={handleRetry}
            variant="contained"
            startIcon={<CameraAlt />}
          >
            Retry
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScanner;
