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
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Storefront as StorefrontIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { purchaseOrderApi, vendorApi, categoryApi, customerApi } from '../api';
import { PurchaseOrder, PurchaseOrderFilters, Vendor, Category, Customer } from '../types';
import { formatCurrency } from '../utils/currency';
import { useCompany } from '../contexts/CompanyContext';

const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useCompany();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [filters, setFilters] = useState<PurchaseOrderFilters>({
    search: '',
    status: '',
    priority: '',
    vendorId: '',
    clientId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // UI states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load purchase orders
  const loadPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Create a copy of filters without pagination properties
      const apiFilters = { ...filters };
      const response = await purchaseOrderApi.getPurchaseOrders(apiFilters, pagination.page, pagination.limit);
      setPurchaseOrders(response.purchaseOrders);
      setPagination({
        page: response.pagination.current,
        pages: response.pagination.pages,
        limit: response.pagination.limit,
        total: response.pagination.total
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const loadFilterData = useCallback(async () => {
    try {
      const [vendorsRes, categoriesRes, customersRes] = await Promise.all([
        vendorApi.getVendors({}, 1, 100),
        categoryApi.getCategories({ limit: 1000 }),
        customerApi.getCustomers({ limit: 1000 })
      ]);
      setVendors(vendorsRes.vendors);
      setCategories(categoriesRes.categories);
      setCustomers(customersRes.customers);
    } catch (err: any) {
      console.error('Failed to load filter data:', err);
    }
  }, []);

  useEffect(() => {
    loadPurchaseOrders();
    loadFilterData();
  }, [filters, pagination.page, loadPurchaseOrders, loadFilterData]);

  // Handle filter changes
  const handleFilterChange = (key: keyof PurchaseOrderFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle actions menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, po: PurchaseOrder) => {
    setAnchorEl(event.currentTarget);
    setSelectedPO(po);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPO(null);
  };

  // Handle delete
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPO) return;

    try {
      await purchaseOrderApi.deletePurchaseOrder(selectedPO.id);
      setSuccess('Purchase order deleted successfully');
      setDeleteDialogOpen(false);
      loadPurchaseOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete purchase order');
    }
  };

  // Handle status changes
  const handleStatusChange = async (po: PurchaseOrder, action: 'send' | 'confirm' | 'complete') => {
    try {
      switch (action) {
        case 'send':
          await purchaseOrderApi.sendPurchaseOrder(po.id);
          setSuccess('Purchase order sent successfully');
          break;
        case 'confirm':
          await purchaseOrderApi.confirmPurchaseOrder(po.id);
          setSuccess('Purchase order confirmed successfully');
          break;
        case 'complete':
          await purchaseOrderApi.completePurchaseOrder(po.id);
          setSuccess('Purchase order completed successfully');
          break;
      }
      loadPurchaseOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} purchase order`);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async (po: PurchaseOrder) => {
    try {
      setLoading(true);
      const pdfBlob = await purchaseOrderApi.generatePDF(po.id);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchase-order-${po.poNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Purchase order PDF downloaded successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download purchase order PDF');
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

  // Clear error message
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'info';
      case 'confirmed': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '📝';
      case 'sent': return '📤';
      case 'confirmed': return '✅';
      case 'in_progress': return '🔄';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📝';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'urgent': return 'error';
      default: return 'default';
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
          Purchase Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/purchase-orders/new')}
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
          Create PO
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
              placeholder="Search purchase orders..."
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
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                label="Priority"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Vendor</InputLabel>
              <Select
                value={filters.vendorId || ''}
                onChange={(e) => handleFilterChange('vendorId', e.target.value)}
                label="Vendor"
              >
                <MenuItem value="">All Vendors</MenuItem>
                {vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Client</InputLabel>
              <Select
                value={filters.clientId || ''}
                onChange={(e) => handleFilterChange('clientId', e.target.value)}
                label="Client"
              >
                <MenuItem value="">All Clients</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.companyName || `${customer.firstName} ${customer.lastName}`}
                  </MenuItem>
                ))}
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
                <MenuItem value="poNumber">PO Number</MenuItem>
                <MenuItem value="total">Total Amount</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
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

            <IconButton onClick={loadPurchaseOrders} sx={{ color: '#99D9F9' }}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card sx={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Expected Delivery</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: '#99D9F9' }} />
                  </TableCell>
                </TableRow>
              ) : purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No purchase orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((po) => (
                  <TableRow key={po.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShoppingCartIcon sx={{ color: '#99D9F9' }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          {po.poNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StorefrontIcon sx={{ fontSize: 16, color: '#99D9F9' }} />
                        <Typography variant="body2">{po.vendor.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon sx={{ fontSize: 16, color: '#99D9F9' }} />
                        <Typography variant="body2">
                          {po.client.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={po.status.replace('_', ' ')}
                        color={getStatusColor(po.status) as any}
                        size="small"
                        icon={<span>{getStatusIcon(po.status)}</span>}
                        sx={{ borderRadius: '15px', textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={po.priority}
                        color={getPriorityColor(po.priority) as any}
                        size="small"
                        sx={{ borderRadius: '15px', textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(po.total, settings?.currency || 'USD')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {po.expectedDeliveryDate ? 
                          new Date(po.expectedDeliveryDate).toLocaleDateString() : 
                          'Not set'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, po)}
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
        <MenuItem onClick={() => { navigate(`/purchase-orders/${selectedPO?.id}/edit`); handleMenuClose(); }}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/purchase-orders/${selectedPO?.id}`); handleMenuClose(); }}>
          <ShoppingCartIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => { handleDownloadPDF(selectedPO!); handleMenuClose(); }}>
          <DownloadIcon sx={{ mr: 1 }} />
          Download PDF
        </MenuItem>
        {selectedPO?.status === 'draft' && (
          <MenuItem onClick={() => { handleStatusChange(selectedPO, 'send'); handleMenuClose(); }}>
            <SendIcon sx={{ mr: 1 }} />
            Send PO
          </MenuItem>
        )}
        {selectedPO?.status === 'sent' && (
          <MenuItem onClick={() => { handleStatusChange(selectedPO, 'confirm'); handleMenuClose(); }}>
            <CheckCircleIcon sx={{ mr: 1 }} />
            Confirm PO
          </MenuItem>
        )}
        {['confirmed', 'in_progress'].includes(selectedPO?.status || '') && (
          <MenuItem onClick={() => { handleStatusChange(selectedPO!, 'complete'); handleMenuClose(); }}>
            <CheckCircleIcon sx={{ mr: 1 }} />
            Mark Complete
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
        <DialogTitle>Delete Purchase Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedPO?.poNumber}"? This action cannot be undone.
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

export default PurchaseOrdersPage;
