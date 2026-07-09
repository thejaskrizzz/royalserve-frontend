import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  GridLegacy as Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Save,
  Cancel,
  Add,
  Delete,
  ShoppingCart,
  AttachMoney,
  Person,
  Receipt,
  QrCodeScanner,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { salesApi, productApi, customerApi, taxApi, creditNoteApi } from '../api';
import { SaleFormData, SaleItem, Product, Customer, Tax } from '../types';
import { useCompany } from '../contexts/CompanyContext';
import { formatCurrency } from '../utils/currency';
import { COLORS } from '../theme/colors';
import BarcodeScanner from './BarcodeScanner';

const SalesForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useCompany();
  const isEditing = Boolean(id);
  const isReturn = window.location.pathname.includes('/return');

  const [formData, setFormData] = useState<SaleFormData>({
    customer: null,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [],
    subtotal: 0,
    total: 0,
    taxId: '',
    taxRate: 0,
    discount: 0,
    discountType: 'fixed',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    saleDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [manualName, setManualName] = useState('');
  const [manualSku, setManualSku] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const [availableCredit, setAvailableCredit] = useState<number>(0);
  const [applyCredit, setApplyCredit] = useState<boolean>(false);

  const fetchCustomerCredit = async (customerId: string) => {
    if (!customerId) {
      setAvailableCredit(0);
      return;
    }
    try {
      const res = await creditNoteApi.getCustomerBalance(customerId);
      setAvailableCredit(res.balance?.remainingBalance || 0);
    } catch (err) {
      console.error('Failed to fetch customer credit balance:', err);
    }
  };

  useEffect(() => {
    if (isEditing) {
      fetchSale();
    }
    fetchProducts();
    fetchCustomers();
    fetchTaxes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Update totals when items, tax rate, or discount changes
  useEffect(() => {
    const { subtotal, total } = calculateTotals(
      formData.items,
      formData.taxRate,
      formData.discount,
      formData.discountType
    );
    setFormData(prev => ({
      ...prev,
      subtotal,
      total
    }));
  }, [formData.items, formData.taxRate, formData.discount, formData.discountType]);

  const fetchSale = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const sale = await salesApi.getSale(id);
      const saleItems = sale.items.map(item => ({
        product: item.product,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        costPrice: item.costPrice,
        profit: item.profit,
      }));

      const { subtotal, total } = calculateTotals(
        saleItems,
        sale.taxRate,
        sale.discount,
        sale.discountType
      );

      setFormData({
        customer: sale.customer?.id || null,
        customerName: sale.customerName || '',
        customerEmail: sale.customerEmail || '',
        customerPhone: sale.customerPhone || '',
        items: saleItems,
        subtotal,
        total,
        taxId: sale.tax?.id || '',
        taxRate: sale.taxRate,
        discount: sale.discount,
        discountType: sale.discountType,
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus,
        saleDate: sale.saleDate.split('T')[0],
        notes: sale.notes || '',
        creditApplied: sale.creditApplied || 0
      });

      if (sale.customer?.id) {
        fetchCustomerCredit(sale.customer.id);
        if (sale.creditApplied && sale.creditApplied > 0) {
          setApplyCredit(true);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sale');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productApi.getProducts({ isActive: 'true' });
      setProducts(response.products);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerApi.getCustomers();
      setCustomers(response.customers);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchTaxes = async () => {
    try {
      const taxes = await taxApi.getTaxes();
      setTaxes(taxes);
    } catch (err: any) {
      console.error('Failed to fetch taxes:', err);
    }
  };

  const handleInputChange = (field: keyof SaleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerChange = (customer: Customer | null) => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        customerPhone: customer.phone || '',
        creditApplied: 0
      }));
      fetchCustomerCredit(customer.id);
      setApplyCredit(false);
    } else {
      setFormData(prev => ({
        ...prev,
        customer: null,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        creditApplied: 0
      }));
      setAvailableCredit(0);
      setApplyCredit(false);
    }
  };

  const calculateTotals = (items: SaleItem[], taxRate: number, discount: number, discountType: 'percentage' | 'fixed') => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discountAmount = discountType === 'percentage' ? (subtotal * discount / 100) : discount;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);
    const total = afterDiscount + taxAmount;
    
    return { subtotal, total };
  };

  const handleBarcodeScan = (barcode: string) => {
    console.log('Scanned barcode:', barcode);
    
    // Find product by barcode
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      setSelectedProduct(product);
      setItemPrice(product.sellingPrice);
      setItemQuantity(1);
      setSuccess(`Product found: ${product.name}`);
      
      // Auto-add the item to the sale
      setTimeout(() => {
        handleAddItem();
      }, 500); // Small delay to show the success message
    } else {
      setError(`Product with barcode "${barcode}" not found. Please add the product first.`);
    }
  };

  const handleAddItem = () => {
    // Add from selected product if present
    if (selectedProduct) {
      const existingItemIndex = formData.items.findIndex(item => item.product === selectedProduct.id);
    
      if (existingItemIndex >= 0) {
        const updatedItems = [...formData.items];
        updatedItems[existingItemIndex].quantity += itemQuantity;
        updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
        setFormData(prev => ({ ...prev, items: updatedItems }));
      } else {
        const newItem: SaleItem = {
          product: selectedProduct.id,
          productName: selectedProduct.name,
          productSku: selectedProduct.sku,
          quantity: itemQuantity,
          unitPrice: itemPrice,
          total: itemQuantity * itemPrice,
          costPrice: selectedProduct.costPrice,
          profit: (itemPrice - selectedProduct.costPrice) * itemQuantity,
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
      }

      // Reset product selector
      setSelectedProduct(null);
      setItemQuantity(1);
      setItemPrice(0);
      setSuccess(`Added ${selectedProduct.name} to sale`);
      return;
    }

    // Otherwise add manual item by name/SKU
    if (!manualName.trim()) {
      setError('Please enter an item name for manual entry');
      return;
    }

    const newManualItem: SaleItem = {
      productName: manualName.trim(),
      productSku: (manualSku || 'CUSTOM').toUpperCase(),
      quantity: itemQuantity,
      unitPrice: itemPrice,
      total: itemQuantity * itemPrice,
      costPrice: 0,
      profit: itemQuantity * itemPrice,
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newManualItem] }));

    // Reset manual fields
    setManualName('');
    setManualSku('');
    setItemQuantity(1);
    setItemPrice(0);
    setSuccess('Added manual item');
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...formData.items];
    updatedItems[index].quantity = quantity;
    updatedItems[index].total = quantity * updatedItems[index].unitPrice;
    updatedItems[index].profit = (updatedItems[index].unitPrice - (updatedItems[index].costPrice || 0)) * quantity;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleUpdateItemPrice = (index: number, price: number) => {
    const updatedItems = [...formData.items];
    updatedItems[index].unitPrice = price;
    updatedItems[index].total = updatedItems[index].quantity * price;
    updatedItems[index].profit = (price - (updatedItems[index].costPrice || 0)) * updatedItems[index].quantity;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (formData.discountType === 'percentage') {
      return (subtotal * formData.discount) / 100;
    }
    return formData.discount;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return (subtotal - discount) * (formData.taxRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  const calculateFinalPayable = () => {
    const total = calculateTotal();
    const credit = applyCredit ? Number(formData.creditApplied || 0) : 0;
    return Math.max(0, total - credit);
  };

  const calculateTotalProfit = () => {
    return formData.items.reduce((sum, item) => sum + (item.profit || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Calculate totals before submission
      const { subtotal, total } = calculateTotals(
        formData.items,
        formData.taxRate,
        formData.discount,
        formData.discountType
      );

      const submitData = {
        ...formData,
        subtotal,
        total,
        customer: formData.customer === '' ? null : formData.customer,
        creditApplied: applyCredit ? Number(formData.creditApplied || 0) : 0
      };

      if (isEditing) {
        if (isReturn) {
          await salesApi.createReturn(id!, submitData);
          setSuccess('Return created successfully');
        } else {
          await salesApi.updateSale(id!, submitData);
          setSuccess('Sale updated successfully');
        }
      } else {
        await salesApi.createSale(submitData);
        setSuccess('Sale created successfully');
      }
      
      setTimeout(() => {
        navigate('/sales');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save sale');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {isReturn ? 'Create Return' : isEditing ? 'Edit Sale' : 'New Sale'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          onClick={() => navigate('/sales')}
        >
          Cancel
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Customer Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1 }} />
                  Customer Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={customers}
                      getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                      value={customers.find(c => c.id === formData.customer) || null}
                      onChange={(_, newValue) => handleCustomerChange(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer"
                          placeholder="Select customer or leave empty for walk-in"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Sale Date"
                      type="date"
                      value={formData.saleDate}
                      onChange={(e) => handleInputChange('saleDate', e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Customer Name"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder="Walk-in customer"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Customer Email"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Customer Phone"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    />
                  </Grid>

                  {availableCredit > 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: 'rgba(21, 209, 154, 0.08)', border: `1px solid ${COLORS.success}`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: COLORS.success, fontWeight: 600 }}>
                          Available Wallet Credit: {formatCurrency(availableCredit)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={applyCredit}
                                onChange={(e) => {
                                  setApplyCredit(e.target.checked);
                                  if (e.target.checked) {
                                    const defaultDeduct = Math.min(availableCredit, calculateTotal());
                                    handleInputChange('creditApplied', defaultDeduct);
                                  } else {
                                    handleInputChange('creditApplied', 0);
                                  }
                                }}
                                color="success"
                              />
                            }
                            label="Apply Credit"
                            sx={{ color: COLORS.textPrimary }}
                          />
                          {applyCredit && (
                            <TextField
                              label="Redeem Amount"
                              type="number"
                              size="small"
                              value={formData.creditApplied || ''}
                              onChange={(e) => {
                                const val = Math.min(availableCredit, Math.min(calculateTotal(), Math.max(0, parseFloat(e.target.value) || 0)));
                                handleInputChange('creditApplied', val);
                              }}
                              inputProps={{ min: 0, max: Math.min(availableCredit, calculateTotal()), step: 1 }}
                              sx={{
                                width: 150,
                                '& .MuiInputLabel-root': { color: COLORS.textMuted },
                                '& .MuiOutlinedInput-root': {
                                  color: COLORS.textPrimary,
                                  '& fieldset': { borderColor: COLORS.border },
                                  '&.Mui-focused fieldset': { borderColor: COLORS.accent }
                                }
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Add Items */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <ShoppingCart sx={{ mr: 1 }} />
                    Add Items
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeScanner />}
                    onClick={() => setShowBarcodeScanner(true)}
                    size="small"
                  >
                    Scan Barcode
                  </Button>
                </Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      options={products}
                      getOptionLabel={(option) => `${option.name} (${option.sku})`}
                      value={selectedProduct}
                      onChange={(_, newValue) => {
                        setSelectedProduct(newValue);
                        setItemPrice(newValue?.sellingPrice || 0);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Product"
                          placeholder="Search products..."
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Or type Item Name"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Manual item name"
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="SKU (optional)"
                      value={manualSku}
                      onChange={(e) => setManualSku(e.target.value)}
                      placeholder="e.g. CUSTOM"
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Unit Price"
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Total"
                        value={formatCurrency(itemQuantity * itemPrice, settings?.currency || 'USD')}
                        disabled
                      />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddItem}
                      disabled={!selectedProduct && !manualName.trim()}
                      fullWidth
                    >
                      Add Item
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Items Table */}
          {formData.items.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sale Items
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Profit</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {item.productName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {item.productSku}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 1)}
                                inputProps={{ min: 1 }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItemPrice(index, parseFloat(e.target.value) || 0)}
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{ width: 100 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {formatCurrency(item.total, settings?.currency || 'USD')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                color={item.profit && item.profit >= 0 ? 'success.main' : 'error.main'}
                                fontWeight="bold"
                              >
                                {formatCurrency(item.profit || 0, settings?.currency || 'USD')}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                onClick={() => handleRemoveItem(index)}
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
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Pricing and Payment */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ mr: 1 }} />
                  Pricing and Payment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Tax</InputLabel>
                      <Select
                        value={formData.taxId}
                        onChange={(e) => {
                          const tax = taxes.find(t => t.id === e.target.value);
                          handleInputChange('taxId', e.target.value);
                          handleInputChange('taxRate', tax?.percentage || 0);
                        }}
                        label="Tax"
                      >
                        <MenuItem value="">No Tax</MenuItem>
                        {taxes.map((tax) => (
                          <MenuItem key={tax.id} value={tax.id}>
                            {tax.name} ({tax.percentage}%)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Discount"
                      type="number"
                      value={formData.discount}
                      onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Discount Type</InputLabel>
                      <Select
                        value={formData.discountType}
                        onChange={(e) => handleInputChange('discountType', e.target.value)}
                        label="Discount Type"
                      >
                        <MenuItem value="fixed">Fixed Amount</MenuItem>
                        <MenuItem value="percentage">Percentage</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={formData.paymentMethod}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        label="Payment Method"
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                        <MenuItem value="credit">Credit</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Receipt sx={{ mr: 1 }} />
                  Sale Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Subtotal:</Typography>
                      <Typography>{formatCurrency(calculateSubtotal(), settings?.currency || 'USD')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Discount:</Typography>
                      <Typography color="error">-{formatCurrency(calculateDiscount(), settings?.currency || 'USD')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Tax:</Typography>
                      <Typography>{formatCurrency(calculateTax(), settings?.currency || 'USD')}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(calculateTotal(), settings?.currency || 'USD')}
                      </Typography>
                    </Box>
                    {applyCredit && (formData.creditApplied || 0) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: COLORS.success }}>
                        <Typography>Credit Applied:</Typography>
                        <Typography>-{formatCurrency(formData.creditApplied || 0, settings?.currency || 'USD')}</Typography>
                      </Box>
                    )}
                    {applyCredit && (formData.creditApplied || 0) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">Final Payable:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {formatCurrency(calculateFinalPayable(), settings?.currency || 'USD')}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Total Profit:</Typography>
                      <Typography 
                        color={calculateTotalProfit() >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatCurrency(calculateTotalProfit(), settings?.currency || 'USD')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      multiline
                      rows={4}
                      placeholder="Additional notes about this sale..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/sales')}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
                disabled={isSaving || formData.items.length === 0}
                sx={{ 
                  background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #388E3C 30%, #689F38 90%)',
                  }
                }}
              >
                {isSaving ? 'Saving...' : isReturn ? 'Create Return' : isEditing ? 'Update Sale' : 'Create Sale'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
      />
    </Box>
  );
};

export default SalesForm;
