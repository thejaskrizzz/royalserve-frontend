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
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Card,
  CardContent,
  GridLegacy as Grid,
  InputAdornment,
  Menu,
  Pagination,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Receipt,
  MoreVert,
  Undo,
  ShoppingCart,
  Visibility,
  DateRange,
  TrendingUp,
  AttachMoney,
  AssignmentReturn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '../api';
import { Sale, SaleFilters } from '../types';
import { formatCurrency } from '../utils/currency';
import { useCompany } from '../contexts/CompanyContext';

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useCompany();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, limit: 10 });
  
  // Filters
  const [filters, setFilters] = useState<SaleFilters>({
    search: '',
    status: '',
    paymentStatus: '',
    startDate: '',
    endDate: '',
    sortBy: 'saleDate',
    sortOrder: 'desc'
  });

  // Stats
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalCost: 0,
    totalTransactions: 0,
    averageSaleValue: 0
  });

  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await salesApi.getSales({
        ...filters,
        page: pagination.current,
        limit: pagination.limit
      });
      setSales(response.sales);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sales');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.current, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await salesApi.getStats(filters.startDate, filters.endDate);
      setStats(response);
    } catch (err: any) {
      console.error('Failed to fetch sales stats:', err);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchSales();
    fetchStats();
  }, [fetchSales, fetchStats]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sale: Sale) => {
    setAnchorEl(event.currentTarget);
    setSelectedSale(sale);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSale(null);
  };

  const handleDelete = async () => {
    if (!selectedSale) return;
    
    try {
      await salesApi.deleteSale(selectedSale.id);
      setSuccess('Sale deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedSale(null);
      fetchSales();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete sale');
    }
  };

  const handleView = () => {
    if (selectedSale) {
      navigate(`/sales/${selectedSale.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedSale) {
      navigate(`/sales/${selectedSale.id}/edit`);
    }
    handleMenuClose();
  };

  const handleReturn = () => {
    setReturnDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDownloadDeliveryOrder = async () => {
    if (!selectedSale) return;
    try {
      const blob = await salesApi.generateDeliveryOrderPDF(selectedSale.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-order-${selectedSale.saleNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate delivery order');
    } finally {
      handleMenuClose();
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'cancelled':
        return <Chip label="Cancelled" color="error" size="small" />;
      case 'returned':
        return <Chip label="Returned" color="warning" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  const getPaymentStatusChip = (status: string) => {
    switch (status) {
      case 'paid':
        return <Chip label="Paid" color="success" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'partial':
        return <Chip label="Partial" color="info" size="small" />;
      case 'refunded':
        return <Chip label="Refunded" color="error" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'bank_transfer':
        return '🏦';
      case 'cheque':
        return '📝';
      case 'credit':
        return '📊';
      default:
        return '💰';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Sales Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/sales/new')}
          sx={{ 
            background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #388E3C 30%, #689F38 90%)',
            }
          }}
        >
          New Sale
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Receipt color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Sales
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stats.totalSales, settings?.currency || 'USD')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Profit
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stats.totalProfit, settings?.currency || 'USD')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Cost
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stats.totalCost, settings?.currency || 'USD')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCart color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Transactions
                  </Typography>
                  <Typography variant="h6">
                    {stats.totalTransactions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DateRange color="secondary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg. Sale Value
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stats.averageSaleValue, settings?.currency || 'USD')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search sales..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="returned">Returned</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Payment</InputLabel>
              <Select
                value={filters.paymentStatus || ''}
                onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                label="Payment"
              >
                <MenuItem value="">All Payments</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="partial">Partial</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              onClick={() => setFilters({ 
                search: '', 
                status: '', 
                paymentStatus: '', 
                startDate: '', 
                endDate: '', 
                sortBy: 'saleDate', 
                sortOrder: 'desc' 
              })}
              fullWidth
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

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

      {/* Sales Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sale #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Profit</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No sales found
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontFamily="monospace">
                        {sale.saleNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {sale.customerName || 'Walk-in Customer'}
                        </Typography>
                        {sale.customerEmail && (
                          <Typography variant="body2" color="textSecondary">
                            {sale.customerEmail}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {formatCurrency(sale.total, settings?.currency || 'USD')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={sale.totalProfit >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatCurrency(sale.totalProfit, settings?.currency || 'USD')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {getPaymentStatusChip(sale.paymentStatus)}
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {getPaymentMethodIcon(sale.paymentMethod)} {sale.paymentMethod.replace('_', ' ')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(sale.status)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, sale)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
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
              onChange={(_, page) => setPagination({ ...pagination, current: page })}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadDeliveryOrder}>
          <ListItemIcon>
            <Receipt fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download Delivery Order</ListItemText>
        </MenuItem>
        {selectedSale?.status === 'completed' && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Sale</ListItemText>
          </MenuItem>
        )}
        {selectedSale?.status === 'completed' && (
          <MenuItem onClick={handleReturn}>
            <ListItemIcon>
              <Undo fontSize="small" />
            </ListItemIcon>
            <ListItemText>Create Cash Return</ListItemText>
          </MenuItem>
        )}
        {selectedSale?.status === 'completed' && selectedSale.customer && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(`/credit-notes/new?sourceType=sale&sourceId=${selectedSale.id}`); }}>
            <ListItemIcon>
              <AssignmentReturn fontSize="small" />
            </ListItemIcon>
            <ListItemText>Return to Credit Note</ListItemText>
          </MenuItem>
        )}
        {selectedSale?.status !== 'completed' && (
          <MenuItem onClick={() => { setAnchorEl(null); setDeleteDialogOpen(true); }}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Sale</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setSelectedSale(null); }}>
        <DialogTitle>Delete Sale</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete sale "{selectedSale?.saleNumber}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setSelectedSale(null); }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => { setReturnDialogOpen(false); setSelectedSale(null); }} maxWidth="md" fullWidth>
        <DialogTitle>Create Return</DialogTitle>
        <DialogContent>
          <Typography>
            Return functionality will be implemented in the SalesForm component.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setReturnDialogOpen(false); setSelectedSale(null); }}>Cancel</Button>
          <Button onClick={() => {
            if (selectedSale) {
              navigate(`/sales/${selectedSale.id}/return`);
            }
            setReturnDialogOpen(false);
            setSelectedSale(null);
          }} variant="contained">
            Create Return
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesPage;
