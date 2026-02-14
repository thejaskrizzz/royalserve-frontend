import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  QrCode,
  Close,
  Download,
  Print,
  Refresh,
} from '@mui/icons-material';
import { generateProductBarcode, generateRandomBarcode } from '../utils/barcodeGenerator';

interface BarcodeDisplayProps {
  sku?: string;
  productName?: string;
  barcodeValue?: string;
  onBarcodeGenerated?: (barcode: string) => void;
}

const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  sku,
  productName,
  barcodeValue,
  onBarcodeGenerated
}) => {
  const [barcodeImage, setBarcodeImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const generateBarcodeImage = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);

      let barcode: string;
      
      if (barcodeValue) {
        // Use provided barcode value
        barcode = barcodeValue;
      } else if (sku) {
        // Generate from SKU
        barcode = generateProductBarcode(sku);
      } else {
        // Generate random barcode
        barcode = generateRandomBarcode();
      }

      setBarcodeImage(barcode);
      
      if (onBarcodeGenerated) {
        onBarcodeGenerated(barcode);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate barcode');
    } finally {
      setIsGenerating(false);
    }
  }, [barcodeValue, sku, onBarcodeGenerated]);

  useEffect(() => {
    if (barcodeValue || sku) {
      generateBarcodeImage();
    }
  }, [barcodeValue, sku, generateBarcodeImage]);

  const handleDownload = () => {
    if (barcodeImage) {
      const link = document.createElement('a');
      link.download = `barcode-${sku || 'product'}.png`;
      link.href = barcodeImage;
      link.click();
    }
  };

  const handlePrint = () => {
    if (barcodeImage) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Barcode - ${productName || 'Product'}</title>
              <style>
                body { 
                  text-align: center; 
                  font-family: Arial, sans-serif; 
                  margin: 20px;
                }
                .barcode-container {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 10px;
                }
                .product-info {
                  margin-bottom: 20px;
                }
                img {
                  max-width: 100%;
                  height: auto;
                }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                <div class="product-info">
                  <h2>${productName || 'Product'}</h2>
                  ${sku ? `<p>SKU: ${sku}</p>` : ''}
                </div>
                <img src="${barcodeImage}" alt="Product Barcode" />
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleRegenerate = () => {
    generateBarcodeImage();
  };

  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <QrCode sx={{ mr: 1 }} />
        Product Barcode
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isGenerating ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Generating barcode...
          </Typography>
        </Box>
      ) : barcodeImage ? (
        <Box>
          <Box
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              p: 2,
              mb: 2,
              background: 'white',
              display: 'inline-block'
            }}
          >
            <img
              src={barcodeImage}
              alt="Product Barcode"
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={handleRegenerate}
            >
              Regenerate
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              onClick={handleDownload}
            >
              Download
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Print />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<QrCode />}
              onClick={() => setShowDialog(true)}
            >
              View Large
            </Button>
          </Box>
        </Box>
      ) : (
        <Button
          variant="contained"
          startIcon={<QrCode />}
          onClick={generateBarcodeImage}
          disabled={isGenerating}
        >
          Generate Barcode
        </Button>
      )}

      {/* Large View Dialog */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
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
          <Typography variant="h6">Product Barcode</Typography>
          <IconButton onClick={() => setShowDialog(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center' }}>
          {barcodeImage && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {productName || 'Product'}
              </Typography>
              {sku && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  SKU: {sku}
                </Typography>
              )}
              <Box
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  p: 3,
                  background: 'white',
                  display: 'inline-block',
                  mt: 2
                }}
              >
                <img
                  src={barcodeImage}
                  alt="Product Barcode"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowDialog(false)}
            variant="outlined"
          >
            Close
          </Button>
          <Button
            onClick={handleDownload}
            variant="contained"
            startIcon={<Download />}
          >
            Download
          </Button>
          <Button
            onClick={handlePrint}
            variant="contained"
            startIcon={<Print />}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BarcodeDisplay;
