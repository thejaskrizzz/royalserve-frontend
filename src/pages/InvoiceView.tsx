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
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  GetApp,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { invoiceApi } from '../api';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/currency';
import { useCompany } from '../contexts/CompanyContext';

const InvoiceView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useCompany();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setPaymentDialogOpen] = useState(false);

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

  const handleDownloadPDF = async () => {
    if (invoice) {
      try {
        const blob = await invoiceApi.generatePDF(invoice.id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err: any) {
        setError('Failed to download PDF');
      }
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
              {invoice.paidAmount > 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Paid Amount:</Typography>
                    <Typography>{formatCurrency(invoice.paidAmount, settings?.currency || 'USD')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="primary">Balance Due:</Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(invoice.total - invoice.paidAmount, settings?.currency || 'USD')}
                    </Typography>
                  </Box>
                </>
              )}
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
    </Box>
  );
};

export default InvoiceView;
