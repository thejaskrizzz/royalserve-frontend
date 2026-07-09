import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Pagination
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Email,
  Phone,
  Business,
} from '@mui/icons-material';
import { customerApi } from '../api';
import { Customer, CustomerFormData, CustomerFilters } from '../types';
import { formatCurrency } from '../utils/currency';
import { useCompany } from '../contexts/CompanyContext';
import CustomerForm from '../components/CustomerForm';

const CustomersPage: React.FC = () => {
  const { settings } = useCompany();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    tags: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await customerApi.getCustomers(filters);
      setCustomers(response.customers);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCustomers();
  }, [filters, fetchCustomers]);

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleSort = (sortBy: string) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters({ ...filters, sortBy, sortOrder, page: 1 });
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setFilters({ ...filters, page });
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setOpenDialog(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerApi.deleteCustomer(id);
        fetchCustomers();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete customer');
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async (data: CustomerFormData) => {
    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, data);
      } else {
        await customerApi.createCustomer(data);
      }
      handleCloseDialog();
      fetchCustomers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save customer');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddCustomer}
        >
          Add Customer
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              placeholder="Search customers..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => handleSort(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="lastName">Last Name</MenuItem>
                <MenuItem value="firstName">First Name</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="totalValue">Total Value</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <FormControl fullWidth>
              <InputLabel>Order</InputLabel>
              <Select
                value={filters.sortOrder || 'desc'}
                onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
                label="Order"
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Customers Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Total Quotes</TableCell>
                <TableCell>Total Value</TableCell>
                <TableCell>Wallet Credit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No customers found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {customer.firstName} {customer.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Email sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        {customer.email}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {customer.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Phone sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          {customer.phone}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.companyName && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Business sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          {customer.companyName}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(customer.tags || []).slice(0, 2).map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                        {(customer.tags || []).length > 2 && (
                          <Chip key="more" label={`+${(customer.tags || []).length - 2}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{customer.totalQuotes}</TableCell>
                    <TableCell>{formatCurrency(customer.totalValue, settings?.currency || 'USD')}</TableCell>
                    <TableCell sx={{ color: customer.creditBalance && customer.creditBalance > 0 ? 'success.main' : 'inherit', fontWeight: customer.creditBalance && customer.creditBalance > 0 ? 600 : 'normal' }}>
                      {customer.creditBalance && customer.creditBalance > 0 ? formatCurrency(customer.creditBalance, settings?.currency || 'USD') : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.isActive ? 'Active' : 'Inactive'}
                        color={getStatusColor(customer.isActive)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(customer.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={pagination.pages}
              page={pagination.current}
              onChange={(event, page) => handlePageChange(event, page)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Customer Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <CustomerForm
            customer={editingCustomer}
            onSave={handleSaveCustomer}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;
