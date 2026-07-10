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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Menu,
  Tooltip,
  Pagination,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Description,
  Send,
  FileCopy,
  CheckCircle,
  Cancel,
  MoreVert,
  Receipt
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { quoteApi, customerApi, invoiceApi } from '../api';
import { Quote, QuoteFilters, Customer, QuoteFormData } from '../types';
import { formatCurrency } from '../utils/currency';
import { useCompany } from '../contexts/CompanyContext';
import QuoteForm from '../components/QuoteForm';
import { ActionLoader } from '../components';

const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useCompany();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionSubMessage, setActionSubMessage] = useState('');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [filters, setFilters] = useState<QuoteFilters>({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const fetchQuotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await quoteApi.getQuotes(filters);
      setQuotes(response.quotes || []);
      setPagination(response.pagination || { current: 1, pages: 1, total: 0 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch quotes');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customerApi.getCustomers({ limit: 1000 });
      setCustomers(response.customers || []);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    fetchCustomers();
  }, [filters, fetchQuotes, fetchCustomers]);

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleSort = (sortBy: string) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters({ ...filters, sortBy, sortOrder, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleAddQuote = () => {
    setEditingQuote(null);
    setOpenDialog(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setOpenDialog(true);
  };

  const handleDeleteQuote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await quoteApi.deleteQuote(id);
        fetchQuotes();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete quote');
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuote(null);
  };

  const handleSaveQuote = async (data: QuoteFormData) => {
    try {
      if (editingQuote) {
        await quoteApi.updateQuote(editingQuote.id, data);
      } else {
        await quoteApi.createQuote(data);
      }
      handleCloseDialog();
      fetchQuotes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save quote');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, quote: Quote) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuote(quote);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuote(null);
  };

  const handleSendQuote = async () => {
    if (selectedQuote) {
      try {
        setActionMessage('Sending Quote Email...');
        setActionSubMessage('Generating PDF attachment and sending to customer. Please wait.');
        setActionLoading(true);
        setError('');
        setSuccess('');
        const response = await quoteApi.sendQuote(selectedQuote.id);
        console.log('Send quote response:', response);
        
        // Show success message with email status
        if (response.email?.success) {
          setSuccess('Quote sent successfully! Email delivered to customer.');
        } else if (response.email?.message) {
          setSuccess(`Quote marked as sent. ${response.email.message}`);
        } else {
          setSuccess('Quote sent successfully!');
        }
        
        fetchQuotes();
        handleMenuClose();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send quote');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleAcceptQuote = async () => {
    if (selectedQuote) {
      try {
        setActionMessage('Accepting Quote...');
        setActionSubMessage('Updating quote status. Please wait.');
        setActionLoading(true);
        setError('');
        setSuccess('');
        await quoteApi.acceptQuote(selectedQuote.id);
        setSuccess('Quote accepted successfully!');
        fetchQuotes();
        handleMenuClose();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to accept quote');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRejectQuote = async () => {
    if (selectedQuote) {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason) {
        try {
          setActionMessage('Rejecting Quote...');
          setActionSubMessage('Updating quote status. Please wait.');
          setActionLoading(true);
          setError('');
          setSuccess('');
          await quoteApi.rejectQuote(selectedQuote.id, reason);
          setSuccess('Quote rejected successfully!');
          fetchQuotes();
          handleMenuClose();
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to reject quote');
        } finally {
          setActionLoading(false);
        }
      }
    }
  };

  const handleDuplicateQuote = async () => {
    if (selectedQuote) {
      try {
        setActionMessage('Duplicating Quote...');
        setActionSubMessage('Creating a duplicate of this quote. Please wait.');
        setActionLoading(true);
        setError('');
        setSuccess('');
        await quoteApi.duplicateQuote(selectedQuote.id);
        setSuccess('Quote duplicated successfully!');
        fetchQuotes();
        handleMenuClose();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to duplicate quote');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleConvertToInvoice = async () => {
    if (selectedQuote) {
      try {
        setActionMessage('Converting Quote...');
        setActionSubMessage('Creating a new invoice from this quote. Please wait.');
        setActionLoading(true);
        setError('');
        setSuccess('');
        const response = await invoiceApi.convertQuoteToInvoice(selectedQuote.id);
        setSuccess(`Quote "${selectedQuote.title}" converted to invoice ${response.invoice.invoiceNumber} successfully! Redirecting to invoices...`);
        handleMenuClose();
        
        // Navigate to invoices page after a short delay
        setTimeout(() => {
          navigate('/invoices');
        }, 2000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to convert quote to invoice');
        handleMenuClose();
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedQuote) return;

    try {
      setActionMessage('Generating PDF...');
      setActionSubMessage('Creating quote PDF document. Please wait.');
      setActionLoading(true);
      console.log('Starting PDF download for quote:', selectedQuote.id);
      setError(''); // Clear any previous errors
      setSuccess('Generating PDF... Please wait, this may take a moment for large quotes.');
      
      // Set a timeout for the PDF generation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      try {
        const blob = await quoteApi.generatePDF(selectedQuote.id, { signal: controller.signal });
        clearTimeout(timeoutId); // Clear the timeout if the request completes in time
        
        console.log('PDF blob received:', blob);
        console.log('Blob size:', blob.size, 'bytes');
        console.log('Blob type:', blob.type);
        
        if (blob.size === 0) {
          throw new Error('Received empty PDF file');
        }
        
        const url = window.URL.createObjectURL(blob);
        console.log('Created object URL:', url);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `quote-${selectedQuote.quoteNumber}.${blob.type.includes('pdf') ? 'pdf' : 'html'}`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        console.log('Triggering download...');
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          console.log('Cleanup completed');
        }, 1000);
        
        setSuccess('PDF downloaded successfully!');
      } catch (err: any) {
        clearTimeout(timeoutId); // Clear the timeout if there's an error
        throw err; // Re-throw to be caught by the outer catch
      }
      
      handleMenuClose();
    } catch (err: any) {
      console.error('PDF download error:', err);
      
      let errorMessage = 'Failed to generate PDF';
      if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
        errorMessage = 'PDF generation is taking too long. Please try again or contact support if the issue persists.';
      } else if (err.response?.status === 504) {
        errorMessage = 'The server is taking too long to generate the PDF. Please try again later.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSuccess('');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      draft: 'default',
      sent: 'info',
      viewed: 'warning',
      accepted: 'success',
      rejected: 'error',
      expired: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Quotes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddQuote}
        >
          Create Quote
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
            <TextField
              fullWidth
              placeholder="Search quotes..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="viewed">Viewed</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <FormControl fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select
                value={filters.customerId || ''}
                onChange={(e) => setFilters({ ...filters, customerId: e.target.value || undefined, page: 1 })}
                label="Customer"
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => handleSort(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="quoteNumber">Quote Number</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="total">Total Amount</MenuItem>
                <MenuItem value="validUntil">Valid Until</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 120px', minWidth: '120px' }}>
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

      {/* Quotes Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Quote #</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Item Names</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Valid Until</TableCell>
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
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No quotes found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {quote.quoteNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {quote.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {quote.customer.firstName} {quote.customer.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {quote.customer.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{quote.items.length}</TableCell>
                    <TableCell>
                      <Box sx={{ maxWidth: 200 }}>
                        {quote.items.length > 0 ? (
                          <Box>
                            {quote.items.slice(0, 2).map((item, index) => (
                              <Typography 
                                key={index}
                                variant="body2" 
                                sx={{ 
                                  fontSize: '0.75rem',
                                  lineHeight: 1.2,
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                • {item.description}
                              </Typography>
                            ))}
                            {quote.items.length > 2 && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: '0.7rem' }}
                              >
                                +{quote.items.length - 2} more
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No items
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(quote.total, settings?.currency || 'USD')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(quote.status)}
                        color={getStatusColor(quote.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(quote.validUntil)}</TableCell>
                    <TableCell>{formatDate(quote.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {(quote.status === 'sent' || quote.status === 'accepted' || quote.status === 'draft') && (
                          <Tooltip title="Can be converted to invoice">
                            <Receipt sx={{ color: 'primary.main', fontSize: 16 }} />
                          </Tooltip>
                        )}
                        {(quote.status === 'sent' || quote.status === 'accepted' || quote.status === 'draft') && (
                          <Tooltip title="Convert to Invoice">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedQuote(quote);
                                handleConvertToInvoice();
                              }}
                              color="primary"
                            >
                              <Receipt />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditQuote(quote)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, quote)}
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
              page={pagination.current}
              onChange={(_, page) => handlePageChange(page)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedQuote?.status === 'draft' && (
          <MenuItem onClick={handleSendQuote}>
            <ListItemIcon>
              <Send fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send Quote</ListItemText>
          </MenuItem>
        )}
        {selectedQuote?.status === 'sent' && (
          <MenuItem onClick={handleAcceptQuote}>
            <ListItemIcon>
              <CheckCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Accept Quote</ListItemText>
          </MenuItem>
        )}
        {selectedQuote?.status === 'sent' && (
          <MenuItem onClick={handleRejectQuote}>
            <ListItemIcon>
              <Cancel fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reject Quote</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDuplicateQuote}>
          <ListItemIcon>
            <FileCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate Quote</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadPDF}>
          <ListItemIcon>
            <Description fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download PDF</ListItemText>
        </MenuItem>
        {(selectedQuote?.status === 'sent' || selectedQuote?.status === 'accepted' || selectedQuote?.status === 'draft') && (
          <MenuItem onClick={handleConvertToInvoice}>
            <ListItemIcon>
              <Receipt fontSize="small" />
            </ListItemIcon>
            <ListItemText>Convert to Invoice</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          handleDeleteQuote(selectedQuote!.id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Quote</ListItemText>
        </MenuItem>
      </Menu>

      {/* Quote Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingQuote ? 'Edit Quote' : 'Create New Quote'}
        </DialogTitle>
        <DialogContent>
          <QuoteForm
            quote={editingQuote}
            customers={customers}
            onSave={handleSaveQuote}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
      <ActionLoader open={actionLoading} message={actionMessage} subMessage={actionSubMessage} />
    </Box>
  );
};

export default QuotesPage;
