import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Save,
  Cancel,
  Add,
  Delete,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { invoiceApi, customerApi, taxApi, creditNoteApi } from '../api';
import { InvoiceFormData, Customer, Tax } from '../types';
import { useCompany } from '../contexts/CompanyContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { Payment, QuoteItem } from '../types';
import { COLORS } from '../theme/colors';

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useCompany();
  const isEditing = Boolean(id);

  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: '',
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
    taxId: '',
    taxRate: settings?.taxRate || 0,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    terms: settings?.terms || 'Payment due within 30 days of invoice date.',
    notes: '',
    payments: [],
    companySignature: '',
    customerSignature: ''
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTaxes = async () => {
    try {
      const data = await taxApi.getTaxes();
      setTaxes(data);
    } catch (error) {
      console.error('Failed to fetch taxes:', error);
    }
  };

  // Payment management state
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [newPayment, setNewPayment] = useState<Payment>({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    notes: ''
  });

  // Customer Credit state
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
    fetchCustomers();
    fetchTaxes();
    if (isEditing && id) {
      fetchInvoice(id);
    }
  }, [id, isEditing]);

  const fetchCustomers = async () => {
    try {
      const response = await customerApi.getCustomers({ limit: 1000 });
      setCustomers(response.customers);
    } catch (err: any) {
      setError('Failed to fetch customers');
    }
  };

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setIsLoading(true);
      const response = await invoiceApi.getInvoice(invoiceId);
      const invoice = response.invoice;
      
      setFormData({
        customerId: invoice.customer.id,
        title: invoice.title,
        description: invoice.description || '',
        items: invoice.items.map(item => ({
          name: item.name || '',
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        taxId: invoice.tax?._id || '',
        taxRate: invoice.taxRate,
        dueDate: invoice.dueDate.split('T')[0],
        terms: invoice.terms,
        notes: invoice.notes || '',
        creditApplied: invoice.creditApplied || 0
      });
      
      if (invoice.customer?.id) {
        fetchCustomerCredit(invoice.customer.id);
        if (invoice.creditApplied && invoice.creditApplied > 0) {
          setApplyCredit(true);
        }
      }
    } catch (err: any) {
      setError('Failed to fetch invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'customerId') {
      fetchCustomerCredit(value);
      setApplyCredit(false);
      setFormData(prev => ({ ...prev, creditApplied: 0 }));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
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
          total: 0
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
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

  const calculateFinalPayable = () => {
    const total = calculateTotal();
    const credit = applyCredit ? Number(formData.creditApplied || 0) : 0;
    return Math.max(0, total - credit);
  };

  const calculatePaidAmount = () => {
    return formData.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  };

  const calculateBalanceDue = () => {
    return calculateFinalPayable() - calculatePaidAmount();
  };

  const handleCancel = () => {
    navigate('/invoices');
  };

  const addPayment = () => {
    if (newPayment.amount > 0) {
      setFormData(prev => ({
        ...prev,
        payments: [...(prev.payments || []), { ...newPayment }]
      }));
      setNewPayment({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        notes: ''
      });
    }
  };

  const removePayment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      payments: prev.payments?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const invoiceToSave = {
        ...formData,
        creditApplied: applyCredit ? Number(formData.creditApplied || 0) : 0
      };

      if (isEditing && id) {
        await invoiceApi.updateInvoice(id, invoiceToSave);
        setSuccess('Invoice updated successfully');
      } else {
        await invoiceApi.createInvoice(invoiceToSave);
        setSuccess('Invoice created successfully');
      }

      setTimeout(() => {
        navigate('/invoices');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Edit Invoice' : 'Create Invoice'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Invoice'}
          </Button>
        </Box>
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

      {/* Invoice Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Invoice Details
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={formData.customerId}
                  label="Customer"
                  onChange={(e) => handleInputChange('customerId', e.target.value)}
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName}
                      {customer.companyName && ` - ${customer.companyName}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Website Development Services"
              />
            </Box>
            
            {availableCredit > 0 && (
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
            )}
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the invoice"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
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
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Items
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addItem}
            >
              Add Item
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>Quantity</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>Unit Price</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>Total</TableCell>
                  <TableCell align="center" sx={{ width: 60 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="Item name"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0 }}
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
                        size="small"
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(item.total, settings?.currency || 'USD')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        color="error"
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

      {/* Totals */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Totals
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ minWidth: 300 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>{formatCurrency(calculateSubtotal(), settings?.currency || 'USD')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax ({formData.taxRate}%):</Typography>
                <Typography>{formatCurrency(calculateTaxAmount(), settings?.currency || 'USD')}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">{formatCurrency(calculateTotal(), settings?.currency || 'USD')}</Typography>
              </Box>
              {applyCredit && (formData.creditApplied || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: COLORS.success }}>
                  <Typography>Credit Applied:</Typography>
                  <Typography>-{formatCurrency(formData.creditApplied || 0, settings?.currency || 'USD')}</Typography>
                </Box>
              )}
              {applyCredit && (formData.creditApplied || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Final Payable:</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(calculateFinalPayable(), settings?.currency || 'USD')}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" color="primary">Balance Due:</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(calculateBalanceDue(), settings?.currency || 'USD')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Payment Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Payments
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setShowPaymentSection(!showPaymentSection)}
            >
              {showPaymentSection ? 'Hide Payments' : 'Add Payment'}
            </Button>
          </Box>

          {showPaymentSection && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Payment Amount"
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment(prev => ({ ...prev as Payment, amount: parseFloat(e.target.value) || 0 }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{getCurrencySymbol(settings?.currency || 'USD')}</InputAdornment>
                  }}
                />
                <TextField
                  fullWidth
                  label="Payment Date"
                  type="date"
                  value={newPayment.paymentDate}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, paymentDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={newPayment.paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setNewPayment(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <TextField
                fullWidth
                label="Payment Notes"
                multiline
                rows={2}
                value={newPayment.notes}
                onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional payment notes"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={addPayment}
                  disabled={newPayment.amount <= 0}
                >
                  Add Payment
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowPaymentSection(false)}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          )}

          {/* Payment List */}
          {formData.payments && formData.payments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Payment History:
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.payments.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(payment.amount, settings?.currency || 'USD')}</TableCell>
                        <TableCell>{payment.paymentMethod.replace('_', ' ')}</TableCell>
                        <TableCell>{payment.notes || '-'}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => removePayment(index)}
                            color="error"
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
          )}
        </CardContent>
      </Card>

      {/* Terms and Notes */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Additional Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Terms & Conditions"
              multiline
              rows={3}
              value={formData.terms}
              onChange={(e) => handleInputChange('terms', e.target.value)}
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or comments"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Signature Fields */}
      <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Signatures
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Company Signature"
              value={formData.companySignature || ''}
              onChange={(e) => handleInputChange('companySignature', e.target.value)}
              placeholder="Enter company representative name and position"
            />
            <TextField
              fullWidth
              label="Customer Signature"
              value={formData.customerSignature || ''}
              onChange={(e) => handleInputChange('customerSignature', e.target.value)}
              placeholder="Enter customer representative name and position"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvoiceForm;
