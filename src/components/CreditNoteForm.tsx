import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  GridLegacy as Grid,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Divider
} from '@mui/material';
import { Save, Cancel, AssignmentReturn } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { creditNoteApi, invoiceApi, salesApi } from '../api';
import { Invoice, Sale } from '../types';
import { COLORS } from '../theme/colors';
import { useCompany } from '../contexts/CompanyContext';

interface ReturnItemState {
  product?: string;
  productName: string;
  productSku?: string;
  quantity: number;        // Selected return quantity
  maxReturnable: number;   // Max allowed to return
  unitPrice: number;
  total: number;
  isSelected: boolean;
  itemIndex?: number;      // For invoice matching
}

const CreditNoteForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useCompany();

  // URL Params pre-fill
  const paramSourceType = searchParams.get('sourceType') as 'invoice' | 'sale' | null;
  const paramSourceId = searchParams.get('sourceId');

  const [sourceType, setSourceType] = useState<'invoice' | 'sale'>(paramSourceType || 'invoice');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(paramSourceId || null);
  const [selectedSourceObj, setSelectedSourceObj] = useState<Invoice | Sale | null>(null);

  const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrencyLocal = (amount: number) => {
    const symbol = settings?.currency === 'USD' ? '$' : settings?.currency === 'EUR' ? '€' : settings?.currency === 'GBP' ? '£' : settings?.currency === 'AED' ? 'AED ' : settings?.currency === 'INR' ? '₹' : '₹';
    return `${symbol}${Number(amount || 0).toFixed(2)}`;
  };

  // Fetch recent source documents
  const loadSources = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (sourceType === 'invoice') {
        const res = await invoiceApi.getInvoices({ limit: 100 });
        setInvoices(res.invoices || []);
      } else {
        const res = await salesApi.getSales({ limit: 100 });
        setSales(res.sales || []);
      }
    } catch (err) {
      setError('Failed to load invoices/sales source documents');
    } finally {
      setIsLoading(false);
    }
  }, [sourceType]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  // Load details of the selected source document and calculate already-returned quantities
  const loadSourceDetails = useCallback(async () => {
    if (!selectedSourceId) {
      setSelectedSourceObj(null);
      setReturnItems([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch the selected invoice or sale object
      let sourceObj: Invoice | Sale;
      if (sourceType === 'invoice') {
        const res = await invoiceApi.getInvoice(selectedSourceId);
        sourceObj = res.invoice;
      } else {
        sourceObj = await salesApi.getSale(selectedSourceId);
      }
      setSelectedSourceObj(sourceObj);

      // 2. Fetch existing credit notes for this source to calculate returned quantities
      const cnRes = await creditNoteApi.getCreditNotes({
        limit: 100,
        customerId: sourceType === 'invoice' ? (sourceObj as Invoice).customer.id : (sourceObj as Sale).customer?.id
      });
      
      const cnList = cnRes.creditNotes.filter(cn => 
        cn.sourceType === sourceType && 
        (sourceType === 'invoice' 
          ? cn.originalInvoice?.id === selectedSourceId 
          : cn.originalSale?.id === selectedSourceId)
      );

      const returnedQtyMap: { [key: string]: number } = {};
      cnList.forEach(cn => {
        cn.returnedItems.forEach(item => {
          const key = item.product || item.productName;
          returnedQtyMap[key] = (returnedQtyMap[key] || 0) + item.quantity;
        });
      });

      // 3. Map items to return items state
      const mappedItems = sourceObj.items.map((item, idx) => {
        const pId = sourceType === 'invoice' 
          ? (item as any).productId || (item as any).product?._id || (item as any).product?.id 
          : (item as any).product?.id || (item as any).product?._id;
        const key = pId || (item as any).name || (item as any).productName;
        const previouslyReturned = returnedQtyMap[key] || 0;
        const maxReturnable = Math.max(0, item.quantity - previouslyReturned);

        return {
          product: pId,
          productName: sourceType === 'invoice' ? (item as any).name : (item as any).productName,
          productSku: sourceType === 'invoice' ? (item as any).productSku || '' : (item as any).productSku || '',
          quantity: maxReturnable, // Default to return all remaining
          maxReturnable,
          unitPrice: item.unitPrice,
          total: maxReturnable * item.unitPrice,
          isSelected: maxReturnable > 0, // Select by default if returnable
          itemIndex: idx
        };
      });

      setReturnItems(mappedItems);
    } catch (err) {
      setError('Failed to fetch source document details');
    } finally {
      setIsLoading(false);
    }
  }, [sourceType, selectedSourceId]);

  useEffect(() => {
    loadSourceDetails();
  }, [loadSourceDetails]);

  // If sourceType changes, reset selected document
  const handleSourceTypeChange = (e: any) => {
    setSourceType(e.target.value);
    setSelectedSourceId(null);
    setSelectedSourceObj(null);
    setReturnItems([]);
  };

  const handleCheckboxChange = (index: number) => {
    setReturnItems(prev => prev.map((item, idx) => 
      idx === index ? { ...item, isSelected: !item.isSelected } : item
    ));
  };

  const handleQtyChange = (index: number, val: number) => {
    setReturnItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const qty = Math.min(item.maxReturnable, Math.max(0.01, val));
        return {
          ...item,
          quantity: qty,
          total: qty * item.unitPrice
        };
      }
      return item;
    }));
  };

  // Calculate totals
  const selectedItems = returnItems.filter(item => item.isSelected && item.quantity > 0);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = selectedSourceObj?.taxRate || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const creditAmount = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!selectedSourceId) {
      setError('Please select a source document');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please select at least one item to return');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const payload = {
        sourceType,
        sourceId: selectedSourceId,
        returnedItems: selectedItems.map(item => ({
          product: item.product,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        returnReason,
        notes
      };

      const res = await creditNoteApi.createCreditNote(payload);
      navigate(`/credit-notes/${res.creditNote.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate credit note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssignmentReturn sx={{ color: COLORS.accent, fontSize: '2.5rem' }} /> Return Items & Generate Credit Note
        </Typography>
        <Typography sx={{ color: COLORS.textMuted }}>
          Deduct items from an invoice or sale, update inventory levels, and deposit credit into customer balance wallet.
        </Typography>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ bgcolor: `${COLORS.danger}15`, color: COLORS.danger, border: `1px solid ${COLORS.danger}` }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Step 1: Select source */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
              Step 1: Select Source Document
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel id="source-type-label" sx={{ color: COLORS.textMuted }}>Document Type</InputLabel>
              <Select
                labelId="source-type-label"
                value={sourceType}
                label="Document Type"
                onChange={handleSourceTypeChange}
                sx={{
                  color: COLORS.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.borderStrong },
                  '&.Mui-focused .MuiOutchedInput-notchedOutline': { borderColor: COLORS.accent },
                }}
              >
                <MenuItem value="invoice">Sales Invoice</MenuItem>
                <MenuItem value="sale">POS Sale</MenuItem>
              </Select>
            </FormControl>

            {sourceType === 'invoice' ? (
              <Autocomplete
                options={invoices}
                getOptionLabel={(option) => `${option.invoiceNumber} - ${option.customer ? `${option.customer.firstName} ${option.customer.lastName}` : ''} (${formatCurrencyLocal(option.total)})`}
                value={invoices.find(inv => inv.id === selectedSourceId) || null}
                onChange={(event, newValue) => {
                  setSelectedSourceId(newValue ? newValue.id : null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Invoice #"
                    size="small"
                    variant="outlined"
                    sx={{
                      '& .MuiInputLabel-root': { color: COLORS.textMuted },
                      '& .MuiOutlinedInput-root': {
                        color: COLORS.textPrimary,
                        '& fieldset': { borderColor: COLORS.border },
                        '&:hover fieldset': { borderColor: COLORS.borderStrong },
                        '&.Mui-focused fieldset': { borderColor: COLORS.accent },
                      }
                    }}
                  />
                )}
              />
            ) : (
              <Autocomplete
                options={sales}
                getOptionLabel={(option) => `${option.saleNumber} - ${option.customerName || ''} (${formatCurrencyLocal(option.total)})`}
                value={sales.find(s => s.id === selectedSourceId) || null}
                onChange={(event, newValue) => {
                  setSelectedSourceId(newValue ? newValue.id : null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search POS Sale #"
                    size="small"
                    variant="outlined"
                    sx={{
                      '& .MuiInputLabel-root': { color: COLORS.textMuted },
                      '& .MuiOutlinedInput-root': {
                        color: COLORS.textPrimary,
                        '& fieldset': { borderColor: COLORS.border },
                        '&:hover fieldset': { borderColor: COLORS.borderStrong },
                        '&.Mui-focused fieldset': { borderColor: COLORS.accent },
                      }
                    }}
                  />
                )}
              />
            )}

            {selectedSourceObj && (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Customer Info</Typography>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                  Name: {sourceType === 'invoice' 
                    ? `${(selectedSourceObj as Invoice).customer.firstName} ${(selectedSourceObj as Invoice).customer.lastName}`
                    : (selectedSourceObj as Sale).customerName || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                  Total: {formatCurrencyLocal(selectedSourceObj.total)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Step 2: Select returned items */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
              Step 2: Select Items and Quantities to Return
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: COLORS.accent }} />
              </Box>
            ) : returnItems.length === 0 ? (
              <Typography sx={{ color: COLORS.textMuted, py: 2 }}>
                Please select a source document first.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ borderBottom: `2px solid ${COLORS.border}` }}>
                      <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700, width: 50 }}>Return?</TableCell>
                      <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Item Name</TableCell>
                      <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="right">Max Returnable</TableCell>
                      <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="right">Qty to Return</TableCell>
                      <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="right">Unit Price</TableCell>
                      <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="right">Total Credit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {returnItems.map((item, index) => (
                      <TableRow key={index} sx={{ borderBottom: `1px solid ${COLORS.border}`, opacity: item.maxReturnable === 0 ? 0.5 : 1 }}>
                        <TableCell>
                          <Checkbox
                            checked={item.isSelected}
                            disabled={item.maxReturnable === 0}
                            onChange={() => handleCheckboxChange(index)}
                            sx={{ color: COLORS.accent, '&.Mui-checked': { color: COLORS.accent } }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: COLORS.textPrimary, fontWeight: 600 }}>{item.productName}</TableCell>
                        <TableCell sx={{ color: COLORS.textSecondary }} align="right">{item.maxReturnable}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            disabled={!item.isSelected || item.maxReturnable === 0}
                            onChange={(e) => handleQtyChange(index, parseFloat(e.target.value))}
                            inputProps={{ min: 0.01, max: item.maxReturnable, step: 1 }}
                            sx={{
                              width: 100,
                              '& .MuiOutlinedInput-root': {
                                color: COLORS.textPrimary,
                                '& fieldset': { borderColor: COLORS.border },
                                '&:hover fieldset': { borderColor: COLORS.borderStrong },
                                '&.Mui-focused fieldset': { borderColor: COLORS.accent },
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: COLORS.textPrimary }} align="right">{formatCurrencyLocal(item.unitPrice)}</TableCell>
                        <TableCell sx={{ color: COLORS.textPrimary, fontWeight: 600 }} align="right">{formatCurrencyLocal(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Refund Total Summary */}
            {selectedSourceObj && selectedItems.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Total Refund Value</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: COLORS.textMuted }}>Returned Items Subtotal:</Typography>
                  <Typography sx={{ color: COLORS.textPrimary }}>{formatCurrencyLocal(subtotal)}</Typography>
                </Box>
                {taxRate > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: COLORS.textMuted }}>Tax ({taxRate}%):</Typography>
                    <Typography sx={{ color: COLORS.textPrimary }}>{formatCurrencyLocal(taxAmount)}</Typography>
                  </Box>
                )}
                <Divider sx={{ borderColor: COLORS.border }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: COLORS.textPrimary, fontWeight: 700 }}>Total Credit Amount:</Typography>
                  <Typography sx={{ color: COLORS.accent, fontWeight: 700, fontSize: '1.2rem' }}>
                    {formatCurrencyLocal(creditAmount)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Reasons and notes */}
            {selectedItems.length > 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Reason for Return"
                    multiline
                    rows={2}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiInputLabel-root': { color: COLORS.textMuted },
                      '& .MuiOutlinedInput-root': {
                        color: COLORS.textPrimary,
                        '& fieldset': { borderColor: COLORS.border },
                        '&.Mui-focused fieldset': { borderColor: COLORS.accent },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Notes / Terms"
                    multiline
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiInputLabel-root': { color: COLORS.textMuted },
                      '& .MuiOutlinedInput-root': {
                        color: COLORS.textPrimary,
                        '& fieldset': { borderColor: COLORS.border },
                        '&.Mui-focused fieldset': { borderColor: COLORS.accent },
                      }
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/credit-notes')}
                sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                disabled={isSubmitting || selectedItems.length === 0}
                onClick={handleSubmit}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Save />}
                sx={{
                  background: `linear-gradient(135deg, ${COLORS.accentSecondary}, ${COLORS.accent})`,
                  color: '#000',
                  fontWeight: 700,
                  boxShadow: COLORS.glow,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentSecondary})`,
                  }
                }}
              >
                Generate Credit Note
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreditNoteForm;
