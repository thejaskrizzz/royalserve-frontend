import React, { useState, useEffect } from 'react';
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
  IconButton,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  GetApp,
  Payment as PaymentIcon,
  AssignmentReturn,
  Send
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { invoiceApi } from '../api';
import { Invoice } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { useCompany } from '../contexts/CompanyContext';
import { COLORS } from '../theme/colors';

const InvoiceView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useCompany();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'cash' | 'check' | 'credit_card' | 'other',
    notes: ''
  });

  const handleAddPayment = async () => {
    if (!invoice) return;
    try {
      await invoiceApi.addPayment(invoice.id, {
        amount: paymentForm.amount,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes
      });
      setPaymentDialogOpen(false);
      setPaymentForm({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        notes: ''
      });
      fetchInvoice(invoice.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add payment');
    }
  };
  
  const handleSendInvoice = async () => {
    if (!invoice) return;
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const response = await invoiceApi.sendInvoice(invoice.id);
      if (response.email?.success) {
        setSuccess('Invoice sent successfully! Email delivered to customer.');
      } else if (response.email?.message) {
        setSuccess(`Invoice marked as sent. ${response.email.message}`);
      } else {
        setSuccess('Invoice sent successfully!');
      }
      fetchInvoice(invoice.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invoice');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoice(id);
    }
  }, [id]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setIsLoading(true);
      const response = await invoiceApi.getInvoice(invoiceId);
      setInvoice(response.invoice);
    } catch (err: any) {
      setError('Failed to fetch invoice');
    } finally {
      setIsLoading(false);
    }
  };

  // const handleDownloadPDF = async () => {
  //   if (invoice) {
  //     console.log('handleDownloadPDF called in InvoiceView for invoice:', invoice.id, invoice.invoiceNumber);
  //     try {
  //       setError('');
  //       const blob = await invoiceApi.generatePDF(invoice.id);
  //       console.log('PDF generation response received, blob size:', blob.size, 'type:', blob.type);
  //       const url = window.URL.createObjectURL(blob);
  //       const link = document.createElement('a');
  //       link.href = url;
  //       link.download = `invoice-${invoice.invoiceNumber}.pdf`;
  //       document.body.appendChild(link);
  //       link.click();
  //       document.body.removeChild(link);
  //       window.URL.revokeObjectURL(url);
  //       console.log('Invoice PDF download triggered successfully in InvoiceView');
  //     } catch (err: any) {
  //       console.error('Invoice PDF download error in InvoiceView:', err);
  //       setError('Failed to download PDF');
  //     }
  //   }
  // };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      setError('');

      const blob = await invoiceApi.generatePDF(invoice.id);

      console.log('========== PDF DEBUG ==========');
      console.log('Blob:', blob);
      console.log('Blob type:', blob.type);
      console.log('Blob size:', blob.size);
      console.log('Is Blob:', blob instanceof Blob);

      // Create a new blob with an explicit MIME type
      const pdfBlob = new Blob([blob], {
        type: 'application/pdf'
      });

      console.log('New Blob type:', pdfBlob.type);

      const url = window.URL.createObjectURL(pdfBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error(err);
      setError('Failed to download PDF');
    }
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Invoice not found'}</Alert>
        <Button onClick={() => navigate('/invoices')} sx={{ mt: 2 }}>
          Back to Invoices
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>{success}</Alert>}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/invoices')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Invoice {invoice.invoiceNumber}
          </Typography>
          <Chip
            label={invoice.status}
            color={getStatusColor(invoice.status) as any}
            size="small"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {invoice.status !== 'paid' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Send />}
              onClick={handleSendInvoice}
            >
              Send Invoice
            </Button>
          )}
          {['paid', 'sent'].includes(invoice.status) && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<AssignmentReturn />}
              onClick={() => navigate(`/credit-notes/new?sourceType=invoice&sourceId=${invoice.id}`)}
              sx={{ textTransform: 'none' }}
            >
              Return Items
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<GetApp />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      {/* Invoice Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Invoice Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Customer</Typography>
              <Typography variant="body1">
                {invoice.customer.firstName} {invoice.customer.lastName}
                {invoice.customer.companyName && ` - ${invoice.customer.companyName}`}
              </Typography>
              {invoice.customer.vatNumber && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  VAT: {invoice.customer.vatNumber}
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Invoice Date</Typography>
              <Typography variant="body1">{formatDate(invoice.createdAt)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Due Date</Typography>
              <Typography variant="body1">{formatDate(invoice.dueDate)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip
                label={invoice.status}
                color={getStatusColor(invoice.status) as any}
                size="small"
              />
            </Box>
          </Box>
          {invoice.description && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">Description</Typography>
              <Typography variant="body1">{invoice.description}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Items
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.unitPrice, settings?.currency || 'USD')}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.total, settings?.currency || 'USD')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Totals
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ minWidth: 300 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>{formatCurrency(invoice.subtotal, settings?.currency || 'USD')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax ({invoice.taxRate}%):</Typography>
                <Typography>{formatCurrency(invoice.taxAmount, settings?.currency || 'USD')}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">{formatCurrency(invoice.total, settings?.currency || 'USD')}</Typography>
              </Box>
              {(invoice.creditApplied || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: COLORS.success }}>
                  <Typography>Credit Applied:</Typography>
                  <Typography>-{formatCurrency(invoice.creditApplied || 0, settings?.currency || 'USD')}</Typography>
                </Box>
              )}
              {(invoice.creditApplied || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Final Payable:</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(invoice.finalPayable || (invoice.total - (invoice.creditApplied || 0)), settings?.currency || 'USD')}
                  </Typography>
                </Box>
              )}
              {invoice.paidAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Paid Amount:</Typography>
                  <Typography>{formatCurrency(invoice.paidAmount, settings?.currency || 'USD')}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" color="primary">Balance Due:</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(Math.max(0, invoice.total - (invoice.creditApplied || 0) - invoice.paidAmount), settings?.currency || 'USD')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Payment History
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PaymentIcon />}
              onClick={() => setPaymentDialogOpen(true)}
            >
              Add Payment
            </Button>
          </Box>

          {invoice.payments && invoice.payments.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.payments.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>{formatCurrency(payment.amount, settings?.currency || 'USD')}</TableCell>
                      <TableCell>{payment.paymentMethod.replace('_', ' ')}</TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No payments recorded yet
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Terms and Notes */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Additional Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Terms & Conditions
              </Typography>
              <Typography variant="body1">{invoice.terms}</Typography>
            </Box>
            {invoice.notes && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Notes
                </Typography>
                <Typography variant="body1">{invoice.notes}</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
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
                onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
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
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPayment} variant="contained">
            Add Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceView;
