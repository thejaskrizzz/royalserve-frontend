import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  GridLegacy as Grid,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Divider,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  Print,
  AssignmentReturn,
  Person,
  Receipt,
  CalendarToday,
  AccessTime,
  Notes
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { creditNoteApi } from '../api';
import { CreditNote } from '../types';
import { COLORS } from '../theme/colors';
import { useCompany } from '../contexts/CompanyContext';

const CreditNoteView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useCompany();
  const [creditNote, setCreditNote] = useState<CreditNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditNote = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await creditNoteApi.getCreditNote(id);
      setCreditNote(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load credit note');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditNote();
  }, [id]);

  const handlePrint = async () => {
    if (!creditNote) return;
    try {
      setIsLoading(true);
      const blob = await creditNoteApi.generatePDF(creditNote.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credit-note-${creditNote.creditNoteNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrencyLocal = (amount: number) => {
    const symbol = settings?.currency === 'USD' ? '$' : settings?.currency === 'EUR' ? '€' : settings?.currency === 'GBP' ? '£' : settings?.currency === 'AED' ? 'AED ' : settings?.currency === 'INR' ? '₹' : '₹';
    return `${symbol}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'unused':
        return <Chip label="Unused" sx={{ bgcolor: `${COLORS.success}20`, color: COLORS.success, border: `1px solid ${COLORS.success}` }} />;
      case 'partially_used':
        return <Chip label="Partially Used" sx={{ bgcolor: `${COLORS.warning}20`, color: COLORS.warning, border: `1px solid ${COLORS.warning}` }} />;
      case 'fully_used':
        return <Chip label="Fully Used" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }} />;
      case 'expired':
        return <Chip label="Expired" sx={{ bgcolor: `${COLORS.danger}20`, color: COLORS.danger, border: `1px solid ${COLORS.danger}` }} />;
      default:
        return <Chip label={status} />;
    }
  };

  if (isLoading && !creditNote) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: COLORS.accent }} />
      </Box>
    );
  }

  if (error || !creditNote) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ bgcolor: `${COLORS.danger}15`, color: COLORS.danger, border: `1px solid ${COLORS.danger}` }}>
          {error || 'Credit note not found'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/credit-notes')} sx={{ mt: 2, color: COLORS.accent }}>
          Back to Credit Notes
        </Button>
      </Box>
    );
  }

  const sourceDocNumber = creditNote.sourceType === 'invoice'
    ? creditNote.originalInvoice?.invoiceNumber
    : creditNote.originalSale?.saleNumber;

  const sourceLink = creditNote.sourceType === 'invoice'
    ? `/invoices/${creditNote.originalInvoice?.id}`
    : `/sales/${creditNote.originalSale?.id}`;

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/credit-notes')} sx={{ color: COLORS.textPrimary }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 2 }}>
              {creditNote.creditNoteNumber}
              {getStatusChip(creditNote.status)}
            </Typography>
            <Typography sx={{ color: COLORS.textMuted }}>
              Credit Note details and redemptions audit log.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={handlePrint}
          sx={{
            borderColor: COLORS.accent,
            color: COLORS.accent,
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': {
              borderColor: COLORS.accentSecondary,
              bgcolor: `${COLORS.accent}10`
            }
          }}
        >
          Print PDF
        </Button>
      </Box>

      {/* Info Boxes */}
      <Grid container spacing={3}>
        {/* CN Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentReturn sx={{ color: COLORS.accent }} /> General Info
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: COLORS.textMuted }}>Source Doc:</Typography>
                <Typography sx={{ color: COLORS.accent, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(sourceLink)}>
                  {creditNote.sourceType.toUpperCase()} ({sourceDocNumber})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: COLORS.textMuted }}>Issued Date:</Typography>
                <Typography sx={{ color: COLORS.textPrimary }}>{new Date(creditNote.createdAt).toLocaleDateString()}</Typography>
              </Box>
              {creditNote.expiryDate && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: COLORS.textMuted }}>Expiry Date:</Typography>
                  <Typography sx={{ color: COLORS.textPrimary }}>{new Date(creditNote.expiryDate).toLocaleDateString()}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: COLORS.textMuted }}>Issued By:</Typography>
                <Typography sx={{ color: COLORS.textPrimary }}>
                  {creditNote.createdBy ? `${creditNote.createdBy.firstName} ${creditNote.createdBy.lastName}` : '-'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Customer Wallet Details */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ color: COLORS.accent }} /> Customer Wallet
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
                {creditNote.customer ? `${creditNote.customer.firstName} ${creditNote.customer.lastName}` : 'N/A'}
              </Typography>
              {creditNote.customer?.companyName && (
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{creditNote.customer.companyName}</Typography>
              )}
              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{creditNote.customer?.email}</Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{creditNote.customer?.phone}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Credit Breakdown */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Receipt sx={{ color: COLORS.accent }} /> Credit Breakdown
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: COLORS.textMuted }}>Total Credit Amount:</Typography>
                <Typography sx={{ color: COLORS.textPrimary, fontWeight: 700 }}>{formatCurrencyLocal(creditNote.creditAmount)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: COLORS.textMuted }}>Redeemed Amount:</Typography>
                <Typography sx={{ color: COLORS.textPrimary }}>-{formatCurrencyLocal(creditNote.usedAmount)}</Typography>
              </Box>
              <Divider sx={{ my: 0.5, borderColor: COLORS.border }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: COLORS.textPrimary, fontWeight: 700 }}>Remaining Balance:</Typography>
                <Typography sx={{ color: COLORS.success, fontWeight: 700, fontSize: '1.1rem' }}>
                  {formatCurrencyLocal(creditNote.remainingBalance)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Returned Items */}
      <Paper sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 2 }}>
          Returned Items
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ borderBottom: `2px solid ${COLORS.border}` }}>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Item Name</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="right">Quantity Returned</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="right">Unit Price</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {creditNote.returnedItems.map((item, idx) => (
                <TableRow key={idx} sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <TableCell sx={{ color: COLORS.textPrimary, fontWeight: 600 }}>{item.productName}</TableCell>
                  <TableCell sx={{ color: COLORS.textSecondary }}>{item.productSku || '-'}</TableCell>
                  <TableCell sx={{ color: COLORS.textPrimary }} align="right">{item.quantity}</TableCell>
                  <TableCell sx={{ color: COLORS.textPrimary }} align="right">{formatCurrencyLocal(item.unitPrice)}</TableCell>
                  <TableCell sx={{ color: COLORS.textPrimary, fontWeight: 600 }} align="right">{formatCurrencyLocal(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Totals Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: COLORS.textMuted }}>Subtotal</Typography>
              <Typography sx={{ color: COLORS.textPrimary }}>{formatCurrencyLocal(creditNote.subtotal)}</Typography>
            </Box>
            {creditNote.taxRate > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: COLORS.textMuted }}>Tax ({creditNote.taxRate}%)</Typography>
                <Typography sx={{ color: COLORS.textPrimary }}>{formatCurrencyLocal(creditNote.taxAmount)}</Typography>
              </Box>
            )}
            <Divider sx={{ my: 1, borderColor: COLORS.border }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: COLORS.textPrimary, fontWeight: 700 }}>Total Credit</Typography>
              <Typography sx={{ color: COLORS.accent, fontWeight: 700, fontSize: '1.1rem' }}>
                {formatCurrencyLocal(creditNote.creditAmount)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Return Reason & Notes */}
      {(creditNote.returnReason || creditNote.notes) && (
        <Grid container spacing={3}>
          {creditNote.returnReason && (
            <Grid item xs={12} md={creditNote.notes ? 6 : 12}>
              <Paper sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentReturn sx={{ color: COLORS.warning }} /> Return Reason
                </Typography>
                <Typography sx={{ color: COLORS.textSecondary, whiteSpace: 'pre-wrap' }}>
                  {creditNote.returnReason}
                </Typography>
              </Paper>
            </Grid>
          )}
          {creditNote.notes && (
            <Grid item xs={12} md={creditNote.returnReason ? 6 : 12}>
              <Paper sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notes sx={{ color: COLORS.accent }} /> Notes
                </Typography>
                <Typography sx={{ color: COLORS.textSecondary, whiteSpace: 'pre-wrap' }}>
                  {creditNote.notes}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Redemption History */}
      <Paper sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 2 }}>
          Redemption History (Audit Trail)
        </Typography>
        {creditNote.redemptions.length === 0 ? (
          <Typography sx={{ color: COLORS.textMuted, py: 2 }}>No redemptions logged for this credit note.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: `2px solid ${COLORS.border}` }}>
                  <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Redeemed Against</TableCell>
                  <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="right">Amount Redeemed</TableCell>
                  <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {creditNote.redemptions.map((redemption) => {
                  const targetNum = redemption.invoice ? redemption.invoice.invoiceNumber : redemption.sale ? redemption.sale.saleNumber : 'N/A';
                  const targetLink = redemption.invoice ? `/invoices/${redemption.invoice.id}` : redemption.sale ? `/sales/${redemption.sale.id}` : '#';

                  return (
                    <TableRow key={redemption.id || redemption._id} sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <TableCell>
                        <Typography sx={{ color: COLORS.accent, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(targetLink)}>
                          {redemption.invoice ? 'Invoice' : 'Sale'} ({targetNum})
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: COLORS.textPrimary, fontWeight: 600 }} align="right">
                        {formatCurrencyLocal(redemption.amount)}
                      </TableCell>
                      <TableCell sx={{ color: COLORS.textPrimary }}>
                        {new Date(redemption.date).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary }}>{redemption.notes || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default CreditNoteView;
