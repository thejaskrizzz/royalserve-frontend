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
  Tooltip,
  Stack,
  Pagination,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { expenseApi } from '../api';
import { Expense, ExpenseFilters } from '../types';
import { formatCurrency } from '../utils/currency';
import { GlassmorphismCard, GlowingButton } from '../components';

const ExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>({
    page: 1,
    limit: 10,
    sortBy: 'expenseDate',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    expense: Expense | null;
  }>({ open: false, expense: null });

  const categoryLabels: Record<string, string> = {
    office_supplies: 'Office Supplies',
    utilities: 'Utilities',
    rent: 'Rent',
    marketing: 'Marketing',
    travel: 'Travel',
    equipment: 'Equipment',
    maintenance: 'Maintenance',
    professional_services: 'Professional Services',
    insurance: 'Insurance',
    other: 'Other'
  };

  const paymentStatusColors: Record<string, string> = {
    pending: '#ff9800',
    paid: '#4caf50',
    reimbursed: '#2196f3'
  };


  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await expenseApi.getExpenses(filters);
      setExpenses(response.expenses);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [filters, fetchExpenses]);

  const handleFilterChange = (key: keyof ExpenseFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    handleFilterChange('page', page);
  };

  const handleDeleteExpense = async () => {
    if (!deleteDialog.expense) return;

    try {
      await expenseApi.deleteExpense(deleteDialog.expense.id);
      setDeleteDialog({ open: false, expense: null });
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense');
    }
  };

  const handleApproveExpense = async (expenseId: string) => {
    try {
      await expenseApi.approveExpense(expenseId);
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || 'Failed to approve expense');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && expenses.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'white' }}>
          Expense Management
        </Typography>
        <GlowingButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/expenses/new')}
        >
          Add Expense
        </GlowingButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <GlassmorphismCard sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search expenses..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="Category"
                  sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.paymentStatus || ''}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  label="Status"
                  sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="reimbursed">Reimbursed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilters({ page: 1, limit: 10, sortBy: 'expenseDate', sortOrder: 'desc' })}
                fullWidth
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </GlassmorphismCard>

      {/* Expenses Table */}
      <GlassmorphismCard>
        <CardContent>
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Expense #</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vendor</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {expense.expenseNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {expense.title}
                      </Typography>
                      {expense.description && (
                        <Typography variant="caption" color="text.secondary">
                          {expense.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Chip
                        label={categoryLabels[expense.category]}
                        size="small"
                        icon={<CategoryIcon />}
                        sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(expense.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      <Chip
                        label={expense.paymentStatus.charAt(0).toUpperCase() + expense.paymentStatus.slice(1)}
                        size="small"
                        sx={{
                          backgroundColor: paymentStatusColors[expense.paymentStatus],
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {formatDate(expense.expenseDate)}
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {expense.vendorName || expense.vendor?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {expense.paymentStatus === 'pending' && (
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              onClick={() => handleApproveExpense(expense.id)}
                              sx={{ color: 'success.main' }}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, expense })}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {expenses.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No expenses found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Start by adding your first expense
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/expenses/new')}
              >
                Add Expense
              </Button>
            </Box>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={pagination.pages}
                page={pagination.current}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </GlassmorphismCard>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, expense: null })}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the expense "{deleteDialog.expense?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, expense: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteExpense} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpensesPage;
