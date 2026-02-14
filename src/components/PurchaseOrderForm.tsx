import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Storefront as StorefrontIcon,
  People as PeopleIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { purchaseOrderApi, vendorApi, taxApi } from '../api';
import { PurchaseOrderFormData, Vendor, Tax } from '../types';
import { useCompany } from '../contexts/CompanyContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { PurchaseOrderItem } from '../types';

const PurchaseOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings, company } = useCompany();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    vendor: '',
    client: '', // This will be auto-populated with company info
    title: '',
    description: '',
    items: [
      {
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
    ],
    taxRate: settings?.taxRate || 0,
    priority: 'medium',
    expectedDeliveryDate: '',
    paymentTerms: 'Net 30',
    customPaymentTerms: '',
    shippingAddress: {
      street: company?.address?.street || '',
      city: company?.address?.city || '',
      state: company?.address?.state || '',
      zipCode: company?.address?.zipCode || '',
      country: company?.address?.country || ''
    },
    billingAddress: {
      street: company?.address?.street || '',
      city: company?.address?.city || '',
      state: company?.address?.state || '',
      zipCode: company?.address?.zipCode || '',
      country: company?.address?.country || ''
    },
    terms: '',
    notes: '',
    approvedBy: ''
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load vendors and taxes
  useEffect(() => {
    const loadData = async () => {
      try {
        const [vendorsResponse, taxesData] = await Promise.all([
          vendorApi.getVendors({}, 1, 1000),
          taxApi.getTaxes()
        ]);
        setVendors(vendorsResponse.vendors);
        setTaxes(taxesData);
      } catch (err: any) {
        setError('Failed to load data');
      }
    };
    loadData();
  }, []);

  // Load purchase order data for editing
  const loadPO = useCallback(async () => {
    if (!isEdit || !id) return;
    
    try {
      setLoading(true);
      const po = await purchaseOrderApi.getPurchaseOrder(id);
      setFormData({
        vendor: po.vendor.id,
        client: 'company', // Always use company as client
        title: po.title,
        description: po.description || '',
        items: po.items.map(item => ({
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        taxRate: po.taxRate,
        priority: po.priority,
        expectedDeliveryDate: po.expectedDeliveryDate ? 
          new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : '',
        paymentTerms: po.paymentTerms,
        customPaymentTerms: po.customPaymentTerms || '',
        shippingAddress: po.shippingAddress || {
          street: company?.address?.street || '',
          city: company?.address?.city || '',
          state: company?.address?.state || '',
          zipCode: company?.address?.zipCode || '',
          country: company?.address?.country || ''
        },
        billingAddress: po.billingAddress || {
          street: company?.address?.street || '',
          city: company?.address?.city || '',
          state: company?.address?.state || '',
          zipCode: company?.address?.zipCode || '',
          country: company?.address?.country || ''
        },
        terms: po.terms || '',
        notes: po.notes || '',
        approvedBy: po.approvedBy || ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, company?.address?.street, company?.address?.city, company?.address?.state, company?.address?.zipCode, company?.address?.country]);

  useEffect(() => {
    if (isEdit && id) {
      loadPO();
    }
  }, [id, isEdit, loadPO]);

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle tax selection
  const handleTaxChange = (taxId: string) => {
    const selectedTax = taxes.find(tax => tax.id === taxId);
    setFormData(prev => ({
      ...prev,
      taxId: taxId,
      taxRate: selectedTax?.percentage || 0
    }));
  };

  // Handle item changes
  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }]
    }));
  };

  // Remove item
  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendor || !formData.title.trim()) {
      setError('Supplier/Vendor and title are required');
      return;
    }

    if (formData.items.length === 0 || formData.items.some(item => !item.name.trim())) {
      setError('At least one item with a name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Auto-populate client with company info
      const formDataWithClient = {
        ...formData,
        client: 'company' // This will be handled by the backend to use the logged-in user's company
      };

      if (isEdit && id) {
        await purchaseOrderApi.updatePurchaseOrder(id, formDataWithClient);
        setSuccess('Purchase order updated successfully');
      } else {
        await purchaseOrderApi.createPurchaseOrder(formDataWithClient);
        setSuccess('Purchase order created successfully');
      }

      setTimeout(() => {
        navigate('/purchase-orders');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} purchase order`);
    } finally {
      setLoading(false);
    }
  };

  // Clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading && isEdit) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: '#99D9F9' }} />
      </Box>
    );
  }

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ 
          background: 'linear-gradient(45deg, #99D9F9, #FDD9DB)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          {isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/purchase-orders')}
          sx={{ borderRadius: '15px' }}
        >
          Cancel
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '15px' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '15px' }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCartIcon sx={{ mr: 1, color: '#99D9F9' }} />
                <Typography variant="h6" fontWeight="bold">Basic Information</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl sx={{ flex: '1 1 300px' }}>
                    <InputLabel>Supplier/Vendor *</InputLabel>
                    <Select
                      value={formData.vendor}
                      onChange={(e) => handleChange('vendor', e.target.value)}
                      label="Supplier/Vendor *"
                      sx={{ borderRadius: '15px' }}
                    >
                      {vendors.map((vendor) => (
                        <MenuItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', p: 2, bgcolor: 'rgba(153, 217, 249, 0.1)', borderRadius: '15px', border: '1px solid rgba(153, 217, 249, 0.3)' }}>
                    <StorefrontIcon sx={{ mr: 1, color: '#99D9F9' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Buyer/Client</Typography>
                      <Typography variant="body1" fontWeight="bold">{company?.name || 'Your Company'}</Typography>
                    </Box>
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl sx={{ flex: '1 1 200px' }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      label="Priority"
                      sx={{ borderRadius: '15px' }}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    type="date"
                    label="Expected Delivery Date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => handleChange('expectedDeliveryDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: '1 1 200px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Items */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoneyIcon sx={{ mr: 1, color: '#99D9F9' }} />
                  <Typography variant="h6" fontWeight="bold">Items</Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addItem}
                  sx={{ borderRadius: '15px' }}
                >
                  Add Item
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {formData.items.map((item, index) => (
                  <Card key={index} sx={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Item {index + 1}
                        </Typography>
                        {formData.items.length > 1 && (
                          <IconButton
                            onClick={() => removeItem(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Item Name *"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                        />
                        <TextField
                          fullWidth
                          label="Description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                        />
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <TextField
                            label="Quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            sx={{ flex: '1 1 150px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                          />
                          <TextField
                            label="Unit Price"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">{getCurrencySymbol(settings?.currency || 'USD')}</InputAdornment>,
                            }}
                            sx={{ flex: '1 1 150px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                          />
                          <TextField
                            label="Total"
                            value={formatCurrency(item.total, settings?.currency || 'USD')}
                            disabled
                            sx={{ flex: '1 1 150px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Tax Selection */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon sx={{ mr: 1, color: '#99D9F9' }} />
                <Typography variant="h6" fontWeight="bold">Tax Information</Typography>
              </Box>
              <FormControl fullWidth>
                <InputLabel>Tax</InputLabel>
                <Select
                  value={formData.taxId || ''}
                  onChange={(e) => handleTaxChange(e.target.value)}
                  label="Tax"
                  sx={{ borderRadius: '15px' }}
                >
                  <MenuItem value="">
                    <em>No Tax</em>
                  </MenuItem>
                  {taxes.map((tax) => (
                    <MenuItem key={tax.id} value={tax.id}>
                      {tax.name} ({tax.percentage}%)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Totals</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>{formatCurrency(subtotal, settings?.currency || 'USD')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Tax ({formData.taxRate}%):</Typography>
                  <Typography>{formatCurrency(taxAmount, settings?.currency || 'USD')}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight="bold">Total:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(total, settings?.currency || 'USD')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Payment Terms</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ flex: '1 1 300px' }}>
                  <InputLabel>Payment Terms</InputLabel>
                  <Select
                    value={formData.paymentTerms}
                    onChange={(e) => handleChange('paymentTerms', e.target.value)}
                    label="Payment Terms"
                    sx={{ borderRadius: '15px' }}
                  >
                    <MenuItem value="Net 15">Net 15</MenuItem>
                    <MenuItem value="Net 30">Net 30</MenuItem>
                    <MenuItem value="Net 45">Net 45</MenuItem>
                    <MenuItem value="Net 60">Net 60</MenuItem>
                    <MenuItem value="Due on Receipt">Due on Receipt</MenuItem>
                    <MenuItem value="Custom">Custom</MenuItem>
                  </Select>
                </FormControl>
                {formData.paymentTerms === 'Custom' && (
                  <TextField
                    fullWidth
                    label="Custom Payment Terms"
                    value={formData.customPaymentTerms}
                    onChange={(e) => handleChange('customPaymentTerms', e.target.value)}
                    required
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Approval Signature */}
        <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon sx={{ mr: 1, color: '#99D9F9' }} />
              <Typography variant="h6" fontWeight="bold">Approval Signature</Typography>
            </Box>
            <TextField
              fullWidth
              label="Approved By"
              value={formData.approvedBy || ''}
              onChange={(e) => handleChange('approvedBy', e.target.value)}
              placeholder="Enter approver name and position"
              sx={{ borderRadius: '15px' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Enter the name and position of the person who will approve this purchase order
            </Typography>
          </CardContent>
        </Card>

          {/* Notes */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Notes</Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this purchase order..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
              sx={{
                background: 'linear-gradient(45deg, #99D9F9, #FDD9DB)',
                borderRadius: '25px',
                px: 4,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(45deg, #7BC8F0, #FBC4C7)',
                }
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                isEdit ? 'Update Purchase Order' : 'Create Purchase Order'
              )}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default PurchaseOrderForm;
