import React, { useState, useEffect } from 'react';
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
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { vendorApi } from '../api';
import { VendorFormData } from '../types';
import { useCompany } from '../contexts/CompanyContext';

const VendorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useCompany();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    contactPerson: {
      name: '',
      title: '',
      email: '',
      phone: ''
    },
    businessInfo: {
      taxId: '',
      registrationNumber: '',
      industry: '',
      description: ''
    },
    paymentTerms: 'Net 30',
    customPaymentTerms: '',
    currency: settings?.currency || 'USD',
    status: 'active',
    tags: [],
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newTag, setNewTag] = useState('');

  // Load vendor data for editing
  useEffect(() => {
    if (isEdit && id) {
      const loadVendor = async () => {
        try {
          setLoading(true);
          const vendor = await vendorApi.getVendor(id);
          setFormData({
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone || '',
            website: vendor.website || '',
            address: vendor.address || {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'United States'
            },
            contactPerson: vendor.contactPerson || {
              name: '',
              title: '',
              email: '',
              phone: ''
            },
            businessInfo: vendor.businessInfo || {
              taxId: '',
              registrationNumber: '',
              industry: '',
              description: ''
            },
            paymentTerms: vendor.paymentTerms,
            customPaymentTerms: vendor.customPaymentTerms || '',
            currency: vendor.currency,
            status: vendor.status,
            tags: vendor.tags || [],
            notes: vendor.notes || ''
          });
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load vendor');
        } finally {
          setLoading(false);
        }
      };
      loadVendor();
    }
  }, [id, isEdit]);

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested object changes
  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof VendorFormData] as any),
        [field]: value
      }
    }));
  };

  // Handle tag management
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isEdit && id) {
        await vendorApi.updateVendor(id, formData);
        setSuccess('Vendor updated successfully');
      } else {
        await vendorApi.createVendor(formData);
        setSuccess('Vendor created successfully');
      }

      setTimeout(() => {
        navigate('/vendors');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} vendor`);
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
          {isEdit ? 'Edit Vendor' : 'Create Vendor'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/vendors')}
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
                <BusinessIcon sx={{ mr: 1, color: '#99D9F9' }} />
                <Typography variant="h6" fontWeight="bold">Basic Information</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    fullWidth
                    label="Vendor Name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.com"
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl sx={{ flex: '1 1 300px' }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      label="Status"
                      sx={{ borderRadius: '15px' }}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="suspended">Suspended</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ flex: '1 1 300px' }}>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      label="Currency"
                      sx={{ borderRadius: '15px' }}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                      <MenuItem value="AED">AED</MenuItem>
                      <MenuItem value="CAD">CAD</MenuItem>
                      <MenuItem value="AUD">AUD</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationIcon sx={{ mr: 1, color: '#99D9F9' }} />
                <Typography variant="h6" fontWeight="bold">Address Information</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={formData.address?.street || ''}
                  onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                    sx={{ flex: '1 1 200px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                  <TextField
                    fullWidth
                    label="State/Province"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                    sx={{ flex: '1 1 200px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                  <TextField
                    fullWidth
                    label="ZIP/Postal Code"
                    value={formData.address?.zipCode || ''}
                    onChange={(e) => handleNestedChange('address', 'zipCode', e.target.value)}
                    sx={{ flex: '1 1 200px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Country"
                  value={formData.address?.country || ''}
                  onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
                  sx={{ maxWidth: '400px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Contact Person */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: '#99D9F9' }} />
                <Typography variant="h6" fontWeight="bold">Contact Person</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    value={formData.contactPerson?.name || ''}
                    onChange={(e) => handleNestedChange('contactPerson', 'name', e.target.value)}
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                  <TextField
                    fullWidth
                    label="Title/Position"
                    value={formData.contactPerson?.title || ''}
                    onChange={(e) => handleNestedChange('contactPerson', 'title', e.target.value)}
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    fullWidth
                    label="Contact Email"
                    type="email"
                    value={formData.contactPerson?.email || ''}
                    onChange={(e) => handleNestedChange('contactPerson', 'email', e.target.value)}
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    value={formData.contactPerson?.phone || ''}
                    onChange={(e) => handleNestedChange('contactPerson', 'phone', e.target.value)}
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ mr: 1, color: '#99D9F9' }} />
                <Typography variant="h6" fontWeight="bold">Business Information</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    fullWidth
                    label="Tax ID"
                    value={formData.businessInfo?.taxId || ''}
                    onChange={(e) => handleNestedChange('businessInfo', 'taxId', e.target.value)}
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                  <TextField
                    fullWidth
                    label="Registration Number"
                    value={formData.businessInfo?.registrationNumber || ''}
                    onChange={(e) => handleNestedChange('businessInfo', 'registrationNumber', e.target.value)}
                    sx={{ flex: '1 1 300px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Industry"
                  value={formData.businessInfo?.industry || ''}
                  onChange={(e) => handleNestedChange('businessInfo', 'industry', e.target.value)}
                  sx={{ maxWidth: '400px', '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.businessInfo?.description || ''}
                  onChange={(e) => handleNestedChange('businessInfo', 'description', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaymentIcon sx={{ mr: 1, color: '#99D9F9' }} />
                <Typography variant="h6" fontWeight="bold">Payment Terms</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              </Box>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Tags</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {(formData.tags || []).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{ borderRadius: '10px' }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  size="small"
                  sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: '15px' } }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddTag}
                  sx={{ borderRadius: '15px' }}
                >
                  Add
                </Button>
              </Box>
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
                placeholder="Additional notes about this vendor..."
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
                isEdit ? 'Update Vendor' : 'Create Vendor'
              )}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default VendorForm;