import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CardContent,
  GridLegacy as Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { expenseApi, vendorApi } from '../api';
import { ExpenseFormData, Vendor } from '../types';
import GlassmorphismCard from './GlassmorphismCard';
import GlowingButton from './GlowingButton';

interface ExpenseFormProps {
  mode?: 'create' | 'edit' | 'view';
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    description: '',
    category: 'office_supplies',
    amount: 0,
    currency: 'USD',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    vendor: null,
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    expenseDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    receiptImage: '',
    tags: [],
    notes: ''
  });

  const categoryOptions = [
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'rent', label: 'Rent' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'travel', label: 'Travel' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other' }
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'other', label: 'Other' }
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'reimbursed', label: 'Reimbursed' }
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
    { value: 'AED', label: 'AED' },
    { value: 'INR', label: 'INR' }
  ];

  const fetchVendors = async () => {
    try {
      const response = await vendorApi.getVendors({}, 1, 100);
      setVendors(response.vendors);
    } catch (err: any) {
      console.error('Failed to fetch vendors:', err);
    }
  };

  const fetchExpense = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const expense = await expenseApi.getExpense(id);
      setFormData({
        title: expense.title,
        description: expense.description || '',
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency,
        paymentMethod: expense.paymentMethod,
        paymentStatus: expense.paymentStatus,
        vendor: expense.vendor?.id || null,
        vendorName: expense.vendorName || '',
        vendorEmail: expense.vendorEmail || '',
        vendorPhone: expense.vendorPhone || '',
        expenseDate: expense.expenseDate.split('T')[0],
        receiptNumber: expense.receiptNumber || '',
        receiptImage: expense.receiptImage || '',
        tags: expense.tags || [],
        notes: expense.notes || ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expense');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVendors();
    if (id && mode !== 'create') {
      fetchExpense();
    }
  }, [id, mode, fetchExpense]);

  const handleInputChange = (field: keyof ExpenseFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVendorChange = (vendor: Vendor | null) => {
    setFormData(prev => ({
      ...prev,
      vendor: vendor?.id || null,
      vendorName: vendor?.name || '',
      vendorEmail: vendor?.email || '',
      vendorPhone: vendor?.phone || ''
    }));
  };

  const handleTagChange = (event: any, newTags: string[]) => {
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (mode === 'create') {
        await expenseApi.createExpense(formData);
        navigate('/expenses');
      } else if (id) {
        await expenseApi.updateExpense(id, formData);
        navigate('/expenses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/expenses');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'white' }}>
          {mode === 'create' ? 'Add New Expense' : mode === 'edit' ? 'Edit Expense' : 'View Expense'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancel}
          sx={{ color: 'white', borderColor: 'white' }}
        >
          Cancel
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={8}>
            <GlassmorphismCard>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                  Basic Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                      disabled={mode === 'view'}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      multiline
                      rows={3}
                      disabled={mode === 'view'}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        label="Category"
                        disabled={mode === 'view'}
                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                      >
                        {categoryOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expense Date"
                      type="date"
                      value={formData.expenseDate}
                      onChange={(e) => handleInputChange('expenseDate', e.target.value)}
                      required
                      disabled={mode === 'view'}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      required
                      disabled={mode === 'view'}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        label="Currency"
                        disabled={mode === 'view'}
                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                      >
                        {currencyOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={formData.paymentMethod}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        label="Payment Method"
                        disabled={mode === 'view'}
                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                      >
                        {paymentMethodOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Status</InputLabel>
                      <Select
                        value={formData.paymentStatus}
                        onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                        label="Payment Status"
                        disabled={mode === 'view'}
                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                      >
                        {paymentStatusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </GlassmorphismCard>
          </Grid>

          {/* Vendor Information */}
          <Grid item xs={12} md={4}>
            <GlassmorphismCard>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                  Vendor Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={vendors}
                      getOptionLabel={(option) => option.name}
                      value={vendors.find(v => v.id === formData.vendor) || null}
                      onChange={(_, value) => handleVendorChange(value)}
                      disabled={mode === 'view'}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Vendor"
                          sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Vendor Name"
                      value={formData.vendorName}
                      onChange={(e) => handleInputChange('vendorName', e.target.value)}
                      disabled={mode === 'view'}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Vendor Email"
                      type="email"
                      value={formData.vendorEmail}
                      onChange={(e) => handleInputChange('vendorEmail', e.target.value)}
                      disabled={mode === 'view'}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Vendor Phone"
                      value={formData.vendorPhone}
                      onChange={(e) => handleInputChange('vendorPhone', e.target.value)}
                      disabled={mode === 'view'}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </GlassmorphismCard>
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12}>
            <GlassmorphismCard>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
                  Additional Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Receipt Number"
                      value={formData.receiptNumber}
                      onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                      disabled={mode === 'view'}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Receipt Image URL"
                      value={formData.receiptImage}
                      onChange={(e) => handleInputChange('receiptImage', e.target.value)}
                      disabled={mode === 'view'}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      options={[]}
                      freeSolo
                      value={formData.tags}
                      onChange={handleTagChange}
                      disabled={mode === 'view'}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={index}
                            sx={{ color: 'white', borderColor: 'white' }}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Tags"
                          placeholder="Add tags..."
                          sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      multiline
                      rows={3}
                      disabled={mode === 'view'}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </GlassmorphismCard>
          </Grid>

          {/* Actions */}
          {mode !== 'view' && (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  Cancel
                </Button>
                <GlowingButton
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Expense' : 'Update Expense'}
                </GlowingButton>
              </Box>
            </Grid>
          )}
        </Grid>
      </form>
    </Box>
  );
};

export default ExpenseForm;