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
  Delete,
  MoreVert,
  Visibility,
  DateRange,
  AssignmentReturn,
  MonetizationOn,
  History,
  TrendingDown,
  Print
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { creditNoteApi } from '../api';
import { CreditNote, CreditNoteFilters, CreditNoteStats } from '../types';
import { COLORS } from '../theme/colors';
import { useCompany } from '../contexts/CompanyContext';

const CreditNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useCompany();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCN, setSelectedCN] = useState<CreditNote | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, limit: 10 });

  // Filters
  const [filters, setFilters] = useState<CreditNoteFilters>({
    search: '',
    status: '',
    customerId: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Stats
  const [stats, setStats] = useState<CreditNoteStats['overview']>({
    totalCreditNotes: 0,
    totalCreditAmount: 0,
    totalUsed: 0,
    totalOutstanding: 0
  });

  const [statusStats, setStatusStats] = useState<CreditNoteStats['statusBreakdown']>({});

  const formatCurrencyLocal = (amount: number) => {
    const symbol = settings?.currency === 'USD' ? '$' : settings?.currency === 'EUR' ? '€' : settings?.currency === 'GBP' ? '£' : settings?.currency === 'AED' ? 'AED ' : settings?.currency === 'INR' ? '₹' : '₹';
    return `${symbol}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchCreditNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await creditNoteApi.getCreditNotes({
        ...filters,
        page: pagination.current,
        limit: pagination.limit
      });
      setCreditNotes(response.creditNotes);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch credit notes');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.current, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await creditNoteApi.getStats();
      setStats(response.overview);
      setStatusStats(response.statusBreakdown || {});
    } catch (err) {
      console.error('Failed to fetch credit note statistics', err);
    }
  }, []);

  useEffect(() => {
    fetchCreditNotes();
    fetchStats();
  }, [fetchCreditNotes, fetchStats]);

  const handleFilterChange = (field: keyof CreditNoteFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // reset to page 1 on filter change
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, current: value }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, cn: CreditNote) => {
    setAnchorEl(event.currentTarget);
    setSelectedCN(cn);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    if (selectedCN) {
      navigate(`/credit-notes/${selectedCN.id}`);
    }
    handleMenuClose();
  };

  const handlePrint = async (cn?: CreditNote) => {
    const targetCn = cn || selectedCN;
    if (!targetCn) return;

    try {
      handleMenuClose();
      setIsLoading(true);
      const blob = await creditNoteApi.generatePDF(targetCn.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credit-note-${targetCn.creditNoteNumber}.pdf`;
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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCN) return;
    try {
      setIsLoading(true);
      setError(null);
      await creditNoteApi.deleteCreditNote(selectedCN.id);
      setSuccess('Credit note deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedCN(null);
      fetchCreditNotes();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete credit note');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'unused':
        return <Chip label="Unused" size="small" sx={{ bgcolor: `${COLORS.success}20`, color: COLORS.success, border: `1px solid ${COLORS.success}` }} />;
      case 'partially_used':
        return <Chip label="Partially Used" size="small" sx={{ bgcolor: `${COLORS.warning}20`, color: COLORS.warning, border: `1px solid ${COLORS.warning}` }} />;
      case 'fully_used':
        return <Chip label="Fully Used" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }} />;
      case 'expired':
        return <Chip label="Expired" size="small" sx={{ bgcolor: `${COLORS.danger}20`, color: COLORS.danger, border: `1px solid ${COLORS.danger}` }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Title & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
            Credit Notes
          </Typography>
          <Typography sx={{ color: COLORS.textMuted }}>
            Manage customer credit, item returns, and credit balance wallets.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/credit-notes/new')}
          sx={{
            background: `linear-gradient(135deg, ${COLORS.accentSecondary}, ${COLORS.accent})`,
            color: '#000',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            boxShadow: COLORS.glow,
            '&:hover': {
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentSecondary})`,
              boxShadow: COLORS.glowStrong,
            }
          }}
        >
          Create Credit Note
        </Button>
      </Box>

      {/* Notifications */}
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ bgcolor: `${COLORS.danger}15`, color: COLORS.danger, border: `1px solid ${COLORS.danger}` }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ bgcolor: `${COLORS.success}15`, color: COLORS.success, border: `1px solid ${COLORS.success}` }}>{success}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${COLORS.accent}15`, color: COLORS.accent }}>
              <AssignmentReturn />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: COLORS.textMuted, display: 'block' }}>Total Credit Notes</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{stats.totalCreditNotes || 0}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${COLORS.accentSecondary}15`, color: COLORS.accentSecondary }}>
              <MonetizationOn />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: COLORS.textMuted, display: 'block' }}>Issued Credit</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrencyLocal(stats.totalCreditAmount || 0)}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${COLORS.success}15`, color: COLORS.success }}>
              <History />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: COLORS.textMuted, display: 'block' }}>Redeemed Credit</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrencyLocal(stats.totalUsed || 0)}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${COLORS.warning}15`, color: COLORS.warning }}>
              <TrendingDown />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: COLORS.textMuted, display: 'block' }}>Outstanding Balance</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrencyLocal(stats.totalOutstanding || 0)}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Filter and Table Panel */}
      <Box sx={{ p: 3, bgcolor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 3 }}>
        {/* Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            placeholder="Search by Credit Note #..."
            size="small"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: COLORS.textMuted }}>
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{
              flexGrow: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                color: COLORS.textPrimary,
                '& fieldset': { borderColor: COLORS.border },
                '&:hover fieldset': { borderColor: COLORS.borderStrong },
                '&.Mui-focused fieldset': { borderColor: COLORS.accent },
              }
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label" sx={{ color: COLORS.textMuted }}>Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
              sx={{
                color: COLORS.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.borderStrong },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.accent },
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="unused">Unused</MenuItem>
              <MenuItem value="partially_used">Partially Used</MenuItem>
              <MenuItem value="fully_used">Fully Used</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none', border: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ borderBottom: `2px solid ${COLORS.border}` }}>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Credit Note #</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Source Type</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Original Doc</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="right">Outstanding</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ color: COLORS.textMuted, fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress sx={{ color: COLORS.accent }} />
                  </TableCell>
                </TableRow>
              ) : creditNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: COLORS.textMuted }}>
                    No credit notes found.
                  </TableCell>
                </TableRow>
              ) : (
                creditNotes.map((cn) => {
                  const sourceDoc = cn.sourceType === 'invoice'
                    ? cn.originalInvoice?.invoiceNumber
                    : cn.originalSale?.saleNumber;

                  return (
                    <TableRow key={cn.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }, borderBottom: `1px solid ${COLORS.border}` }}>
                      <TableCell sx={{ color: COLORS.accent, fontWeight: 700 }}>{cn.creditNoteNumber}</TableCell>
                      <TableCell sx={{ color: COLORS.textPrimary }}>
                        {cn.customer ? `${cn.customer.firstName} ${cn.customer.lastName}` : 'N/A'}
                        {cn.customer?.companyName && (
                          <Typography variant="caption" sx={{ display: 'block', color: COLORS.textMuted }}>
                            {cn.customer.companyName}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize', color: COLORS.textPrimary }}>{cn.sourceType}</TableCell>
                      <TableCell sx={{ color: COLORS.textPrimary }}>{sourceDoc || '-'}</TableCell>
                      <TableCell sx={{ color: COLORS.textPrimary, fontWeight: 600 }} align="right">
                        {formatCurrencyLocal(cn.creditAmount)}
                      </TableCell>
                      <TableCell sx={{ color: cn.remainingBalance > 0 ? COLORS.success : COLORS.textMuted, fontWeight: 600 }} align="right">
                        {formatCurrencyLocal(cn.remainingBalance)}
                      </TableCell>
                      <TableCell>{getStatusChip(cn.status)}</TableCell>
                      <TableCell sx={{ color: COLORS.textPrimary }}>
                        {new Date(cn.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={(e) => handleMenuOpen(e, cn)} sx={{ color: COLORS.textMuted }}>
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Pagination
              count={pagination.pages}
              page={pagination.current}
              onChange={handlePageChange}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': { color: COLORS.textSecondary },
                '& .Mui-selected': { bgcolor: `${COLORS.accent}20`, color: COLORS.accent }
              }}
            />
          </Box>
        )}
      </Box>

      {/* Row Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#121829',
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textPrimary
          }
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon sx={{ color: COLORS.accent }}><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePrint()}>
          <ListItemIcon sx={{ color: COLORS.success }}><Print fontSize="small" /></ListItemIcon>
          <ListItemText>Print Credit Note</ListItemText>
        </MenuItem>
        {selectedCN?.status === 'unused' && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: COLORS.danger }}>
            <ListItemIcon sx={{ color: COLORS.danger }}><Delete fontSize="small" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#121829',
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textPrimary
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: COLORS.textSecondary }}>
            Are you sure you want to delete credit note <strong>{selectedCN?.creditNoteNumber}</strong>?
            This will reverse the stock changes for the returned items. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: COLORS.textMuted }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={isLoading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreditNotesPage;
