import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Save,
  Business,
  LocationOn,
  Language,
  Schedule,
  Upload,
  AttachMoney,
  Email
} from '@mui/icons-material';
import { useCompany } from '../contexts/CompanyContext';
import { companyApi } from '../api';
import { Company, CompanySettings } from '../types';

const SettingsPage: React.FC = () => {
  const { company, settings, isLoading, refreshCompany, updateSettings } = useCompany();
  const [localCompany, setLocalCompany] = useState<Company | null>(null);
  const [localSettings, setLocalSettings] = useState<CompanySettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (company && settings) {
      setLocalCompany(company);
      setLocalSettings(settings);
    }
  }, [company, settings]);

  const handleSettingsChange = (field: keyof CompanySettings, value: any) => {
    setLocalSettings(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  const handleCompanyChange = (field: keyof Company, value: any) => {
    setLocalCompany(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  // Helper function to display website without protocol for editing
  const getDisplayWebsite = (website: string | undefined) => {
    if (!website) return '';
    return website.replace(/^https?:\/\//, '');
  };

  // Helper function to handle website input
  const handleWebsiteChange = (value: string) => {
    handleCompanyChange('website', value);
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      // Save company settings
      if (localSettings) {
        await updateSettings(localSettings);
      }
      
      // Save company info
      if (localCompany) {
        const companyData = {
          name: localCompany.name,
          description: localCompany.description,
          industry: localCompany.industry,
          website: localCompany.website,
          email: localCompany.email,
          phone: localCompany.phone,
          address: localCompany.address,
          logo: localCompany.logo,
        };
        console.log('Saving company data:', companyData);
        console.log('Logo data length:', localCompany.logo?.length || 0);
        await companyApi.updateCompany(companyData);
      }

      // Refresh company data
      await refreshCompany();
      setSuccess('Settings saved successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('Logo uploaded, data URL length:', result.length);
        handleCompanyChange('logo', result);
        setSuccess('Logo uploaded successfully!');
      };
      reader.onerror = () => {
        setError('Failed to read the file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Failed to upload logo');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Company Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Company Information */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Business sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Company Information
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={localCompany?.name || ''}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={localCompany?.description || ''}
                  onChange={(e) => handleCompanyChange('description', e.target.value)}
                />

                <TextField
                  fullWidth
                  label="Industry"
                  value={localCompany?.industry || ''}
                  onChange={(e) => handleCompanyChange('industry', e.target.value)}
                />

                <TextField
                  fullWidth
                  label="Website"
                  value={getDisplayWebsite(localCompany?.website)}
                  onChange={(e) => handleWebsiteChange(e.target.value)}
                  placeholder="example.com (https:// will be added automatically)"
                  helperText="Enter your website URL with or without https://"
                />

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={localCompany?.email || ''}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  label="Phone"
                  value={localCompany?.phone || ''}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                />
              </Box>
            </Paper>
          </Box>

          {/* Company Logo */}
          <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Upload sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Company Logo
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={localCompany?.logo}
                  sx={{ width: 120, height: 120, bgcolor: 'grey.200' }}
                >
                  <Business sx={{ fontSize: 60 }} />
                </Avatar>

                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="logo-upload"
                  type="file"
                  onChange={handleLogoUpload}
                />
                <label htmlFor="logo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<Upload />}
                  >
                    Upload Logo
                  </Button>
                </label>

                <Typography variant="caption" color="text.secondary" align="center">
                  Recommended size: 200x200px. Supported formats: JPG, PNG, GIF
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Company Address */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Company Address
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Street Address"
              value={localCompany?.address?.street || ''}
              onChange={(e) => handleCompanyChange('address', {
                ...localCompany?.address,
                street: e.target.value,
              })}
            />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                sx={{ flex: '1 1 200px', minWidth: '200px' }}
                label="City"
                value={localCompany?.address?.city || ''}
                onChange={(e) => handleCompanyChange('address', {
                  ...localCompany?.address,
                  city: e.target.value,
                })}
              />
              <TextField
                sx={{ flex: '1 1 200px', minWidth: '200px' }}
                label="State/Province"
                value={localCompany?.address?.state || ''}
                onChange={(e) => handleCompanyChange('address', {
                  ...localCompany?.address,
                  state: e.target.value,
                })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                sx={{ flex: '1 1 200px', minWidth: '200px' }}
                label="ZIP/Postal Code"
                value={localCompany?.address?.zipCode || ''}
                onChange={(e) => handleCompanyChange('address', {
                  ...localCompany?.address,
                  zipCode: e.target.value,
                })}
              />
              <TextField
                sx={{ flex: '1 1 200px', minWidth: '200px' }}
                label="Country"
                value={localCompany?.address?.country || ''}
                onChange={(e) => handleCompanyChange('address', {
                  ...localCompany?.address,
                  country: e.target.value,
                })}
              />
            </Box>
          </Box>
        </Paper>

        {/* Business Settings */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Business Settings
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={localSettings?.currency || 'USD'}
                    onChange={(e) => handleSettingsChange('currency', e.target.value)}
                    label="Currency"
                  >
                        <MenuItem value="USD">USD - US Dollar</MenuItem>
                        <MenuItem value="EUR">EUR - Euro</MenuItem>
                        <MenuItem value="GBP">GBP - British Pound</MenuItem>
                        <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
                        <MenuItem value="AUD">AUD - Australian Dollar</MenuItem>
                        <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                        <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Tax Rate (%)"
                  type="number"
                  value={localSettings?.taxRate || 0}
                  onChange={(e) => handleSettingsChange('taxRate', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />

                <TextField
                  fullWidth
                  label="Quote Prefix"
                  value={localSettings?.quotePrefix || 'Q'}
                  onChange={(e) => handleSettingsChange('quotePrefix', e.target.value)}
                  placeholder="Q"
                />

                <TextField
                  fullWidth
                  label="Next Quote Number"
                  type="number"
                  value={localSettings?.quoteNumber || 1}
                  onChange={(e) => handleSettingsChange('quoteNumber', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
                />

                <TextField
                  fullWidth
                  label="Quote Validity (Days)"
                  type="number"
                  value={localSettings?.quoteValidityDays || 14}
                  onChange={(e) => handleSettingsChange('quoteValidityDays', parseInt(e.target.value) || 14)}
                  inputProps={{ min: 1, max: 365 }}
                  helperText="Number of days quotes remain valid (default: 14 days)"
                />

                <TextField
                  fullWidth
                  label="Credit Note Prefix"
                  value={localSettings?.creditNotePrefix || 'CN'}
                  onChange={(e) => handleSettingsChange('creditNotePrefix', e.target.value)}
                  placeholder="CN"
                />

                <TextField
                  fullWidth
                  label="Next Credit Note Number"
                  type="number"
                  value={localSettings?.nextCreditNoteNumber || 1}
                  onChange={(e) => handleSettingsChange('nextCreditNoteNumber', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings?.creditNoteExpiryEnabled || false}
                        onChange={(e) => handleSettingsChange('creditNoteExpiryEnabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Enable Credit Note Expiry"
                  />
                  
                  {localSettings?.creditNoteExpiryEnabled && (
                    <TextField
                      fullWidth
                      label="Credit Note Expiry Period (Days)"
                      type="number"
                      value={localSettings?.creditNoteExpiryDays || 365}
                      onChange={(e) => handleSettingsChange('creditNoteExpiryDays', parseInt(e.target.value) || 365)}
                      inputProps={{ min: 1 }}
                      helperText="Default period before a credit note expires (default: 365 days)"
                    />
                  )}
                </Box>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => window.open('/tax-settings', '_blank')}
                  sx={{ mt: 2 }}
                >
                  Manage Custom Taxes
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Regional Settings */}
          <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Language sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Regional Settings
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={localSettings?.timezone || 'UTC'}
                    onChange={(e) => handleSettingsChange('timezone', e.target.value)}
                    label="Timezone"
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="America/New_York">America/New_York</MenuItem>
                    <MenuItem value="America/Los_Angeles">America/Los_Angeles</MenuItem>
                    <MenuItem value="Europe/London">Europe/London</MenuItem>
                    <MenuItem value="Europe/Paris">Europe/Paris</MenuItem>
                    <MenuItem value="Asia/Tokyo">Asia/Tokyo</MenuItem>
                    <MenuItem value="Asia/Kolkata">Asia/Kolkata</MenuItem>
                    <MenuItem value="Australia/Sydney">Australia/Sydney</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={localSettings?.dateFormat || 'MM/DD/YYYY'}
                    onChange={(e) => handleSettingsChange('dateFormat', e.target.value)}
                    label="Date Format"
                  >
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    <MenuItem value="DD-MM-YYYY">DD-MM-YYYY</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Terms & Conditions */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Schedule sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Terms & Conditions
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={6}
            label="Default Terms & Conditions"
            value={localSettings?.terms || ''}
            onChange={(e) => handleSettingsChange('terms', e.target.value)}
            placeholder="Enter your default terms and conditions that will be used in quotes..."
          />
        </Paper>

        {/* Email Templates */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Email sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Email Templates Configuration
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Invoice Email Template
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Available placeholders: {"{{customerName}}, {{invoiceNumber}}, {{totalAmount}}, {{paidAmount}}, {{balanceDue}}, {{companyName}}"}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Invoice Email Subject"
                  value={localSettings?.invoiceEmailSubject || ''}
                  onChange={(e) => handleSettingsChange('invoiceEmailSubject', e.target.value)}
                  placeholder="Invoice {{invoiceNumber}} from {{companyName}}"
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Invoice Email Message"
                  value={localSettings?.invoiceEmailBody || ''}
                  onChange={(e) => handleSettingsChange('invoiceEmailBody', e.target.value)}
                  placeholder="Enter custom message body..."
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Quote Email Template
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Available placeholders: {"{{customerName}}, {{quoteNumber}}, {{totalAmount}}, {{companyName}}"}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Quote Email Subject"
                  value={localSettings?.quoteEmailSubject || ''}
                  onChange={(e) => handleSettingsChange('quoteEmailSubject', e.target.value)}
                  placeholder="Quote {{quoteNumber}} from {{companyName}}"
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Quote Email Message"
                  value={localSettings?.quoteEmailBody || ''}
                  onChange={(e) => handleSettingsChange('quoteEmailBody', e.target.value)}
                  placeholder="Enter custom message body..."
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default SettingsPage;