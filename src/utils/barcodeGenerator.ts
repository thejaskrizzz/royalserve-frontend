import JsBarcode from 'jsbarcode';

export interface BarcodeOptions {
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'MSI' | 'pharmacode' | 'codabar';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
}

export const generateBarcode = (
  value: string,
  options: BarcodeOptions = {}
): string => {
  const canvas = document.createElement('canvas');
  
  const defaultOptions = {
    format: 'CODE128' as const,
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 14,
    margin: 10,
    background: '#ffffff',
    lineColor: '#000000',
    ...options
  };

  try {
    JsBarcode(canvas, value, defaultOptions);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw new Error('Failed to generate barcode');
  }
};

export const generateProductBarcode = (sku: string): string => {
  // Generate a barcode using the product SKU
  // If SKU is too short, pad it to make it valid for barcode generation
  let barcodeValue = sku;
  
  // Ensure the value is at least 3 characters for CODE128
  if (barcodeValue.length < 3) {
    barcodeValue = barcodeValue.padStart(3, '0');
  }
  
  // If SKU is too long, truncate it (CODE128 can handle up to 80 characters)
  if (barcodeValue.length > 80) {
    barcodeValue = barcodeValue.substring(0, 80);
  }
  
  return generateBarcode(barcodeValue, {
    format: 'CODE128',
    width: 2,
    height: 80,
    displayValue: true,
    fontSize: 12,
    margin: 5,
    background: '#ffffff',
    lineColor: '#000000'
  });
};

export const generateRandomBarcode = (): string => {
  // Generate a random 8-digit number for products without SKU
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return generateBarcode(randomNumber.toString(), {
    format: 'CODE128',
    width: 2,
    height: 80,
    displayValue: true,
    fontSize: 12,
    margin: 5,
    background: '#ffffff',
    lineColor: '#000000'
  });
};

export const validateBarcode = (value: string, format: string = 'CODE128'): boolean => {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, { format: format as any });
    return true;
  } catch (error) {
    return false;
  }
};
