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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { vendorApi } from '../api';
import { Vendor, VendorFilters } from '../types';

const VendorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    limit: 10,
    total: 0
  });

  // Filter states
  const [filters, setFilters] = useState<VendorFilters>({
    search: '',
    status: '',
    tags: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // UI states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load vendors
  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await vendorApi.getVendors(filters, pagination.page, pagination.limit);
      setVendors(response.vendors);
      setPagination(prev => ({
        ...prev,
        ...response.pagination
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    loadVendors();
  }, [filters, pagination.page, loadVendors]);

  // Handle filter changes
  const handleFilterChange = (key: keyof VendorFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle actions menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, vendor: Vendor) => {
    setAnchorEl(event.currentTarget);
    setSelectedVendor(vendor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVendor(null);
  };

  // Handle delete
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVendor) return;

    try {
      await vendorApi.deleteVendor(selectedVendor.id);
      setSuccess('Vendor deleted successfully');
      setDeleteDialogOpen(false);
      loadVendors();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vendor');
    }
  };

  // Handle status change
  const handleStatusChange = async (vendor: Vendor, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      await vendorApi.updateVendor(vendor.id, { status: newStatus });
      setSuccess(`Vendor ${newStatus === 'active' ? 'activated' : newStatus} successfully`);
      loadVendors();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update vendor status');
    }
  };

  // Clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error message
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✓';
      case 'inactive': return '○';
      case 'suspended': return '⚠';
      default: return '○';
    }
  };

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
          Vendors
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/vendors/new')}
          sx={{
            background: 'linear-gradient(45deg, #99D9F9, #FDD9DB)',
            borderRadius: '25px',
            px: 3,
            py: 1,
            '&:hover': {
              background: 'linear-gradient(45deg, #7BC8F0, #FBC4C7)',
            }
          }}
        >
          Add Vendor
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

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search vendors..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#99D9F9' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                label="Sort By"
              >
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Order</InputLabel>
              <Select
                value={filters.sortOrder || 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                label="Order"
              >
                <MenuItem value="asc">Asc</MenuItem>
                <MenuItem value="desc">Desc</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={loadVendors} sx={{ color: '#99D9F9' }}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Terms</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: '#99D9F9' }} />
                  </TableCell>
                </TableRow>
              ) : vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No vendors found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow key={vendor.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#99D9F9', color: 'white' }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {vendor.name}
                          </Typography>
                          {vendor.businessInfo?.industry && (
                            <Typography variant="caption" color="text.secondary">
                              {vendor.businessInfo.industry}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 16, color: '#99D9F9' }} />
                          <Typography variant="body2">{vendor.email}</Typography>
                        </Box>
                        {vendor.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: '#99D9F9' }} />
                            <Typography variant="body2">{vendor.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vendor.status}
                        color={getStatusColor(vendor.status) as any}
                        size="small"
                        icon={<span>{getStatusIcon(vendor.status)}</span>}
                        sx={{ borderRadius: '15px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {vendor.paymentTerms === 'Custom' ? vendor.customPaymentTerms : vendor.paymentTerms}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {(vendor.tags || []).slice(0, 2).map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{ borderRadius: '10px', fontSize: '0.7rem' }}
                          />
                        ))}
                        {(vendor.tags || []).length > 2 && (
                          <Chip
                            label={`+${(vendor.tags || []).length - 2}`}
                            size="small"
                            sx={{ borderRadius: '10px', fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, vendor)}
                        sx={{ color: '#99D9F9' }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              sx={{ borderRadius: '15px' }}
            >
              Previous
            </Button>
            <Typography sx={{ alignSelf: 'center', px: 2 }}>
              Page {pagination.page} of {pagination.pages}
            </Typography>
            <Button
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              sx={{ borderRadius: '15px' }}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{ '& .MuiPaper-root': { borderRadius: '15px' } }}
      >
        <MenuItem onClick={() => { navigate(`/vendors/${selectedVendor?.id}/edit`); handleMenuClose(); }}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/vendors/${selectedVendor?.id}`); handleMenuClose(); }}>
          <BusinessIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedVendor?.status === 'active' && (
          <MenuItem onClick={() => { handleStatusChange(selectedVendor, 'inactive'); handleMenuClose(); }}>
            <Chip label="Deactivate" size="small" sx={{ mr: 1 }} />
            Deactivate
          </MenuItem>
        )}
        {selectedVendor?.status === 'inactive' && (
          <MenuItem onClick={() => { handleStatusChange(selectedVendor, 'active'); handleMenuClose(); }}>
            <Chip label="Activate" size="small" color="success" sx={{ mr: 1 }} />
            Activate
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{ '& .MuiPaper-root': { borderRadius: '20px' } }}
      >
        <DialogTitle>Delete Vendor</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedVendor?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: '15px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ borderRadius: '15px' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorsPage;
