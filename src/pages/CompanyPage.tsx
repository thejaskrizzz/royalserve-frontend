import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Avatar,
  Paper,
  Chip
} from '@mui/material';
import {
  Business,
  People,
  AttachMoney,
  Description
} from '@mui/icons-material';
import { useCompany } from '../contexts/CompanyContext';
import { companyApi } from '../api';
import { formatCurrency } from '../utils/currency';

const CompanyPage: React.FC = () => {
  const { company, settings } = useCompany();
  const [, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      try {
        const response = await companyApi.getCompany();
        setFormData({
          name: response.company.name,
          description: response.company.description || '',
          industry: response.company.industry || '',
          website: response.company.website || '',
          email: response.company.email,
          phone: response.company.phone || '',
          address: {
            street: response.company.address?.street || '',
            city: response.company.address?.city || '',
            state: response.company.address?.state || '',
            zipCode: response.company.address?.zipCode || '',
            country: response.company.address?.country || ''
          }
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch company details');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const response = await companyApi.getStats();
        setStats(response);
      } catch (err: any) {
        setStatsError(err.response?.data?.message || 'Failed to fetch company statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    if (company) {
      setFormData({
        name: company.name,
        description: company.description || '',
        industry: company.industry || '',
        website: company.website || '',
        email: company.email,
        phone: company.phone || '',
        address: {
          street: company.address?.street || '',
          city: company.address?.city || '',
          state: company.address?.state || '',
          zipCode: company.address?.zipCode || '',
          country: company.address?.country || ''
        }
      });
      fetchStats();
    }
  }, [company]);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
          {company?.logo ? (
            <img 
              src={company.logo} 
              alt="Company Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Business sx={{ fontSize: 32 }} />
          )}
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {company?.name || 'Company'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {company?.description || 'Company overview and statistics'}
          </Typography>
        </Box>
      </Box>

      {/* Company Information */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Company Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Industry</Typography>
                <Typography variant="body1">{company?.industry || 'Not specified'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Website</Typography>
                <Typography variant="body1">
                  {company?.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      {company.website}
                    </a>
                  ) : (
                    'Not specified'
                  )}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Address</Typography>
                <Typography variant="body1">
                  {company?.address ? (
                    `${company.address.street || ''}, ${company.address.city || ''}, ${company.address.state || ''} ${company.address.zipCode || ''}`
                  ) : (
                    'Not specified'
                  )}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Company Settings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Currency</Typography>
                <Typography variant="body1">{settings?.currency || 'USD'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Quote Validity</Typography>
                <Typography variant="body1">{settings?.quoteValidityDays || 14} days</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Tax Rate</Typography>
                <Typography variant="body1">{settings?.taxRate || 0}%</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Statistics */}
      {statsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : statsError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {statsError}
        </Alert>
      ) : stats ? (
        <Box>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Company Statistics
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Customers */}
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <People sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Customers</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.customers?.totalCustomers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Value: {formatCurrency(stats.customers?.totalValue || 0, settings?.currency || 'USD')}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Quotes */}
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Description sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6">Quotes</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.quotes?.totalQuotes || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Value: {formatCurrency(stats.quotes?.totalQuoteValue || 0, settings?.currency || 'USD')}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={`${stats.quotes?.acceptedQuotes || 0} accepted`} 
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Users */}
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="h6">Users</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.users?.totalUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Team members
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Revenue */}
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoney sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="h6">Revenue</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(stats.quotes?.totalQuoteValue || 0, settings?.currency || 'USD')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    From quotes
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default CompanyPage;
