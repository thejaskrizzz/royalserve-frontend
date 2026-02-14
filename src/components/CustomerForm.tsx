import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Chip,
  Typography,
  Alert,
} from '@mui/material';
import { Customer, CustomerFormData } from '../types';

interface CustomerFormProps {
  customer?: Customer | null;
  onSave: (data: CustomerFormData) => void;
  onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    notes: '',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || '',
        companyName: customer.companyName || '',
        address: {
          street: customer.address.street || '',
          city: customer.address.city || '',
          state: customer.address.state || '',
          zipCode: customer.address.zipCode || '',
          country: customer.address.country || '',
        },
        notes: customer.notes || '',
        tags: customer.tags || [],
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields');
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Personal Information */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Personal Information
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              required
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              required
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </Box>
        </Box>

        {/* Company Information */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
            Company Information
          </Typography>
        </Box>
        <Box>
          <TextField
            fullWidth
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
          />
        </Box>

        {/* Address */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
            Address
          </Typography>
        </Box>
        <Box>
          <TextField
            fullWidth
            label="Street Address"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <TextField
              fullWidth
              label="City"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <TextField
              fullWidth
              label="State"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <TextField
              fullWidth
              label="ZIP Code"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <TextField
              fullWidth
              label="Country"
              name="address.country"
              value={formData.address.country}
              onChange={handleChange}
            />
          </Box>
        </Box>

        {/* Tags */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
            Tags
          </Typography>
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TextField
              label="Add Tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              size="small"
            />
            <Button variant="outlined" onClick={handleAddTag} disabled={!newTag.trim()}>
              Add
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Notes */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
            Notes
          </Typography>
        </Box>
        <Box>
          <TextField
            fullWidth
            multiline
            rows={4}
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
          {customer ? 'Update Customer' : 'Create Customer'}
        </Button>
      </Box>
    </Box>
  );
};

export default CustomerForm;
