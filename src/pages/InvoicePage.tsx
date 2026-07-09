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
  InputAdornment,
  Menu,
  Pagination,
  Tooltip
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Receipt,
  MoreVert,
  Visibility,
  GetApp,
  FilterList,
  Send,
  Payment as PaymentIcon,
  AssignmentReturn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../api';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { Invoice } from '../types';
import { useCompany } from '../contexts/CompanyContext';

const InvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  // Filters and Pagination state
  interface InvoiceFilters {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    limit: number;
  }

  const [filters, setFilters] = useState<InvoiceFilters>({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'cash' | 'check' | 'credit_card' | 'other',
    notes: ''
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await invoiceApi.getInvoices({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      setInvoices(response.invoices);
      setPagination(prev => ({
        ...prev,
        current: response.pagination.current,
        pages: response.pagination.pages,
        total: response.pagination.total
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoice: Invoice) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    
    try {
      await invoiceApi.deleteInvoice(selectedInvoice.id);
      setSuccess('Invoice deleted successfully');
      setDeleteDialogOpen(false);
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete invoice');
    }
    handleMenuClose();
  };

  const handleSendInvoice = async () => {
    if (!selectedInvoice) return;
    
    try {
      const response = await invoiceApi.sendInvoice(selectedInvoice.id);
      console.log('Send invoice response:', response);
      
      // Show success message with email status
      if (response.email?.success) {
        setSuccess('Invoice sent successfully! Email delivered to customer.');
      } else if (response.email?.message) {
        setSuccess(`Invoice marked as sent. ${response.email.message}`);
      } else {
        setSuccess('Invoice sent successfully!');
      }
      
      fetchInvoices();
      handleMenuClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invoice');
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    console.log('handleDownloadPDF called for invoice:', invoice.id, invoice.invoiceNumber);
    try {
      setError('');
      const blob = await invoiceApi.generatePDF(invoice.id);
      console.log('PDF generation response received, blob size:', blob.size, 'type:', blob.type);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('Invoice PDF download triggered successfully');
    } catch (err: any) {
      console.error('Invoice PDF download error:', err);
      setError(err.response?.data?.message || 'Failed to download PDF');
    }
  };

  const handleAddPayment = async () => {
    if (!selectedInvoice) return;
    
    try {
      await invoiceApi.addPayment(selectedInvoice.id, {
        amount: paymentForm.amount,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes
      });
      setSuccess('Payment added successfully');
      setPaymentDialogOpen(false);
      setPaymentForm({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        notes: ''
      });
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add payment');
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'info';
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    // Update both filters and pagination to keep them in sync
    setFilters(prev => ({ ...prev, page }));
    // The pagination state will be updated when fetchInvoices completes
  };


  const handlePaymentMethodChange = (method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other') => {
    setPaymentForm(prev => ({ ...prev, paymentMethod: method }));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt sx={{ color: 'primary.main' }} />
          Invoices
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/invoices/new')}
        >
          Create Invoice
        </Button>
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search invoices..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev as InvoiceFilters, search: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters(prev => ({ ...prev as InvoiceFilters, status: e.target.value }))}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="date"
              label="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev as InvoiceFilters, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              type="date"
              label="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev as InvoiceFilters, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={fetchInvoices}
            >
              Apply Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No invoices found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {invoice.customer.firstName} {invoice.customer.lastName}
                      </Typography>
                      {invoice.customer.companyName && (
                        <Typography variant="caption" color="text.secondary">
                          {invoice.customer.companyName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(invoice.total, settings?.currency || 'USD')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(invoice.paidAmount, settings?.currency || 'USD')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(invoice.total - invoice.paidAmount, settings?.currency || 'USD')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadPDF(invoice)}
                          >
                            <GetApp />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, invoice)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </Box>
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
              page={filters.page}  // Use filters.page instead of pagination.current
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/invoices/${selectedInvoice?.id}`); }}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/invoices/${selectedInvoice?.id}/edit`); }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {selectedInvoice && ['paid', 'sent'].includes(selectedInvoice.status) && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(`/credit-notes/new?sourceType=invoice&sourceId=${selectedInvoice.id}`); }}>
            <AssignmentReturn sx={{ mr: 1 }} />
            Return Items
          </MenuItem>
        )}
        <MenuItem onClick={handleSendInvoice} disabled={selectedInvoice?.status === 'paid'}>
          <Send sx={{ mr: 1 }} />
          Send Invoice
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); setPaymentDialogOpen(true); }}>
          <PaymentIcon sx={{ mr: 1 }} />
          Add Payment
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); setDeleteDialogOpen(true); }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setSelectedInvoice(null); }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => { setPaymentDialogOpen(false); setSelectedInvoice(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">{getCurrencySymbol(settings?.currency || 'USD')}</InputAdornment>
              }}
            />
            <TextField
              fullWidth
              label="Payment Date"
              type="date"
              value={paymentForm.paymentDate}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentForm.paymentMethod}
                label="Payment Method"
                onChange={(e) => handlePaymentMethodChange(e.target.value as 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other')}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPaymentDialogOpen(false); setSelectedInvoice(null); }}>Cancel</Button>
          <Button onClick={handleAddPayment} variant="contained">
            Add Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoicePage;
