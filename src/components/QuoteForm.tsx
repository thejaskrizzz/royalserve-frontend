import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  CalendarToday,
  Image as ImageIcon,
} from '@mui/icons-material';
import { Quote, QuoteFormData, Customer, QuoteItem, Product } from '../types';
import { useCompany } from '../contexts/CompanyContext';
import { formatCurrency } from '../utils/currency';
import { imageApi, taxApi, productApi } from '../api';
import { Tax } from '../types';

interface QuoteFormProps {
  quote?: Quote | null;
  customers: Customer[];
  onSave: (data: QuoteFormData) => void;
  onCancel: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ quote, customers, onSave, onCancel }) => {
  const { settings } = useCompany();
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<QuoteFormData>({
    customerId: '',
    title: '',
    description: '',
    items: [
      {
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        productId: '',
        product: undefined,
      },
    ],
    taxId: '',
    taxRate: settings?.taxRate || 0,
    validUntil: '',
    terms: settings?.terms || 'Payment due within 30 days of invoice date.',
    notes: '',
  });
  const [error, setError] = useState('');
  const [, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTaxes();
    fetchProducts();
  }, []);

  const fetchTaxes = async () => {
    try {
      const data = await taxApi.getTaxes();
      setTaxes(data);
    } catch (error) {
      console.error('Failed to fetch taxes:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productApi.getProducts({ isActive: 'true', limit: 1000 });
      setProducts(response.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  useEffect(() => {
    if (quote) {
      setFormData({
        customerId: quote.customer.id,
        title: quote.title,
        description: quote.description || '',
        items: quote.items.map(item => ({
          name: item.name || '',
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          image: item.image,
          productId: item.productId || '',
          product: item.product,
        })),
        taxId: quote.tax?._id || '',
        taxRate: quote.taxRate,
        validUntil: new Date(quote.validUntil).toISOString().split('T')[0],
        terms: quote.terms,
        notes: quote.notes || '',
      });
    } else {
      // Set default valid until date based on company settings (default 2 weeks)
      const defaultDate = new Date();
      const validityDays = settings?.quoteValidityDays || 14;
      defaultDate.setDate(defaultDate.getDate() + validityDays);
      setFormData(prev => ({
        ...prev,
        validUntil: defaultDate.toISOString().split('T')[0],
      }));
    }
  }, [quote, settings?.quoteValidityDays]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    // Calculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    setFormData(prev => ({
      ...prev,
      items: newItems,
    }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      const newItems = [...formData.items];
      newItems[index] = {
        ...newItems[index],
        name: selectedProduct.name,
        description: selectedProduct.description || '',
        unitPrice: selectedProduct.sellingPrice,
        total: newItems[index].quantity * selectedProduct.sellingPrice,
        image: selectedProduct.images?.[0] || '',
        productId: selectedProduct.id,
        product: selectedProduct,
      };

      setFormData(prev => ({
        ...prev,
        items: newItems,
      }));
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setIsLoading(true);
      const response = await imageApi.uploadImage(file);
      handleItemChange(index, 'image', response.imageUrl);
    } catch (error) {
      console.error('Image upload error:', error);
      setError('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
          productId: '',
          product: undefined,
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTaxAmount = () => {
    return (calculateSubtotal() * formData.taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  const hasItemsWithAmounts = () => {
    return formData.items.some(item => item.unitPrice > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customerId || !formData.title || !formData.validUntil) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.items.some(item => !item.description || item.quantity <= 0)) {
      setError('Please fill in all item details correctly (description and quantity are required)');
      return;
    }

    onSave(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Quote Information */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quote Information
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <FormControl fullWidth required>
              <InputLabel>Customer</InputLabel>
              <Select
                value={formData.customerId}
                onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                label="Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName} ({customer.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              required
              fullWidth
              label="Quote Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
          </Box>
        </Box>
        <Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <TextField
              required
              fullWidth
              label="Valid Until"
              name="validUntil"
              type="date"
              value={formData.validUntil}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <FormControl fullWidth>
              <InputLabel>Tax</InputLabel>
              <Select
                value={formData.taxId}
                onChange={(e) => {
                  const selectedTaxId = e.target.value;
                  const selectedTax = taxes.find(tax => tax._id === selectedTaxId);
                  setFormData(prev => ({
                    ...prev,
                    taxId: selectedTaxId,
                    taxRate: selectedTax ? selectedTax.percentage : 0
                  }));
                }}
                label="Tax"
              >
                <MenuItem value="">
                  <em>No Tax</em>
                </MenuItem>
                {taxes.map((tax) => (
                  <MenuItem key={tax._id} value={tax._id}>
                    {tax.name} ({tax.percentage}%)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Quote Items */}
        <Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Quote Items
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addItem}
            >
              Add Item
            </Button>
          </Box>
        </Box>
        <Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price (Optional)</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <InputLabel>Select Product</InputLabel>
                        <Select
                          value={item.productId || ''}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          label="Select Product"
                        >
                          <MenuItem value="">
                            <em>Manual Entry</em>
                          </MenuItem>
                          {products.map((product) => (
                            <MenuItem key={product.id} value={product.id}>
                              {product.name} ({product.sku}) - {formatCurrency(product.sellingPrice, settings?.currency || 'USD')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        {item.image ? (
                          <Box sx={{ position: 'relative' }}>
                            <img
                              src={item.image}
                              alt="Product"
                              style={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 4,
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleItemChange(index, 'image', '')}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                backgroundColor: 'error.main',
                                color: 'white',
                                width: 20,
                                height: 20,
                                '&:hover': {
                                  backgroundColor: 'error.dark',
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              component="label"
                              sx={{
                                width: 60,
                                height: 60,
                                border: '2px dashed',
                                borderColor: 'grey.300',
                                borderRadius: 1,
                              }}
                            >
                              <ImageIcon />
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(index, file);
                                  }
                                }}
                              />
                            </IconButton>
                            <Typography variant="caption" color="text.secondary">
                              Add Image
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0.01, step: 0.01 }}
                        size="small"
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                        placeholder="Optional"
                        size="small"
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(item.total, settings?.currency || 'USD')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Totals */}
        <Box>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            {hasItemsWithAmounts() ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal:
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(calculateSubtotal(), settings?.currency || 'USD')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Tax ({formData.taxRate}%):
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(calculateTaxAmount(), settings?.currency || 'USD')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1976d2', pt: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Total:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(calculateTotal(), settings?.currency || 'USD')}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Quote items without amounts - pricing to be discussed
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total: {formatCurrency(0, settings?.currency || 'USD')}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Terms and Notes */}
        <Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Terms & Notes
          </Typography>
        </Box>
        <Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Terms & Conditions"
            name="terms"
            value={formData.terms}
            onChange={handleChange}
          />
        </Box>
        <Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          {quote ? 'Update Quote' : 'Create Quote'}
        </Button>
      </Box>
    </Box>
  );
};

export default QuoteForm;
