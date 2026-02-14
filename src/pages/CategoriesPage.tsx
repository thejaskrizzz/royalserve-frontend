import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Fade,
  Chip,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Business,
  Warning,
  Timeline,
  ArrowUpward,
  ArrowDownward,
  TrendingFlat
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { categoryApi, companyApi, quoteApi, purchaseOrderApi, salesApi, expenseApi } from '../api';
import { Category, CategoryFilters, CategoryStats } from '../types';
import { formatCurrency } from '../utils/currency';
import { COLORS } from '../theme/colors';

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CategoryStats | null>(null);

  // Additional metrics from Dashboard
  const [poStats, setPoStats] = useState<any>(null);
  const [quoteStats, setQuoteStats] = useState<any>(null);
  const [saleStats, setSaleStats] = useState<any>(null);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [generalStats, setGeneralStats] = useState<any>(null);

  const [filters, setFilters] = useState<CategoryFilters>({
    search: '',
    isActive: '',
    parentCategory: '',
    sortBy: 'sortOrder',
    sortOrder: 'asc',
    page: 1,
    limit: 10
  });
  const [, setPagination] = useState({
    page: 1,
    pages: 1,
    limit: 10,
    total: 0
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryApi.getCategories(filters);
      setCategories(response.categories);
      setPagination({
        page: response.pagination.current,
        pages: response.pagination.pages,
        limit: 10, // Default limit since it's not in the response
        total: response.pagination.total
      });
    } catch (err) {
      setError('Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await categoryApi.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const fetchAdditionalMetrics = useCallback(async () => {
    try {
      const [poData, salesData, expenseData, companyData] = await Promise.all([
        purchaseOrderApi.getStats(),
        salesApi.getStats(),
        expenseApi.getStats(),
        companyApi.getStats()
      ]);

      setPoStats(poData);
      setSaleStats(salesData);
      setExpenseStats(expenseData);
      setGeneralStats(companyData);

      // For quotes, we'll calculate from the quotes list
      const quotesResponse = await quoteApi.getQuotes();
      const quotes = quotesResponse.quotes;
      const quoteStatsData = {
        totalQuotes: quotes.length,
        draftQuotes: quotes.filter((q: any) => q.status === 'draft').length,
        sentQuotes: quotes.filter((q: any) => q.status === 'sent').length,
        viewedQuotes: quotes.filter((q: any) => q.status === 'viewed').length,
        acceptedQuotes: quotes.filter((q: any) => q.status === 'accepted').length,
        rejectedQuotes: quotes.filter((q: any) => q.status === 'rejected').length,
        activeQuotes: quotes.filter((q: any) => ['draft', 'sent', 'viewed'].includes(q.status)).length
      };
      setQuoteStats(quoteStatsData);
    } catch (err) {
      console.error('Error fetching additional metrics:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchStats();
    fetchAdditionalMetrics();
  }, [filters, fetchCategories, fetchStats, fetchAdditionalMetrics]);

  /* -------------------------------------------------------
    KPI CARD COMPONENT
  --------------------------------------------------------- */
  const KpiCard = ({
    label,
    value,
    icon,
    subtitle,
    trend,
    trendValue,
    color = COLORS.accent,
  }: {
    label: string;
    value: string | number;
    icon: React.ReactElement<{ sx?: any }>;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: string;
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    const ic = React.cloneElement(icon, {
      sx: {
        fontSize: 32,
        color: color,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      },
    });

    const getTrendIcon = () => {
      switch (trend) {
        case 'up':
          return <ArrowUpward sx={{ fontSize: 16, color: COLORS.success }} />;
        case 'down':
          return <ArrowDownward sx={{ fontSize: 16, color: COLORS.danger }} />;
        default:
          return <TrendingFlat sx={{ fontSize: 16, color: COLORS.textSecondary }} />;
      }
    };

    return (
      <Fade in timeout={800}>
        <Paper
          elevation={0}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            p: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${COLORS.surfaceAlt} 0%, ${COLORS.surface} 100%)`,
            border: `1px solid ${COLORS.border}`,
            boxShadow: isHovered ? `0 8px 32px ${COLORS.background}` : `0 2px 16px ${COLORS.background}`,
            transition: "all 0.3s ease",
            transform: isHovered ? "translateY(-4px)" : "translateY(0)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  background: `${color}22`,
                  border: `1px solid ${color}44`,
                }}
              >
                {ic}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 14, color: COLORS.textSecondary, fontWeight: 500, mb: 0.5 }}>
                  {label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.2 }}>
                  {value}
                </Typography>
              </Box>
            </Box>
            {trend && trendValue && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {getTrendIcon()}
                <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>
                  {trendValue}
                </Typography>
              </Box>
            )}
          </Box>
          {subtitle && (
            <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Paper>
      </Fade>
    );
  };

  /* -------------------------------------------------------
    MINI STAT COMPONENT
  --------------------------------------------------------- */
  const MiniStat = ({
    label,
    value,
    icon,
    color = COLORS.textSecondary,
    trend,
  }: {
    label: string;
    value: string | number;
    icon: React.ReactElement<{ sx?: any }>;
    color?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    const ic = React.cloneElement(icon, {
      sx: {
        fontSize: 24,
        color: color,
        transition: 'all 0.3s ease',
      },
    });

    return (
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            p: 2.5,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${COLORS.surface} 0%, ${COLORS.surfaceAlt} 100%)`,
            border: `1px solid ${COLORS.border}`,
            boxShadow: isHovered ? `0 4px 20px ${COLORS.background}` : `0 0 10px ${COLORS.background}`,
            transition: "all 0.3s ease",
            transform: isHovered ? "translateY(-2px)" : "translateY(0)",
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Box
              sx={{
                width: 45,
                height: 45,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                background: `${color}22`,
                border: `1px solid ${color}44`,
              }}
            >
              {ic}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500 }}>
                {label}
              </Typography>
              <Typography
                sx={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}
              >
                {value}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Fade>
    );
  };

  const handleFilterChange = (key: keyof CategoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, category: Category) => {
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const handleEdit = () => {
    if (selectedCategory) {
      navigate(`/categories/${selectedCategory.id}/edit`);
    }
    handleMenuClose();
  };

  const handleView = () => {
    if (selectedCategory) {
      navigate(`/categories/${selectedCategory.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (selectedCategory) {
      try {
        await categoryApi.deleteCategory(selectedCategory.id);
        setDeleteDialogOpen(false);
        fetchCategories();
        fetchStats();
      } catch (err) {
        setError('Failed to delete category');
        console.error('Error deleting category:', err);
      }
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon />
          Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/categories/new')}
        >
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 3,
            mb: 4,
          }}
        >
          <KpiCard
            label="Total Categories"
            value={stats.totalCategories || 0}
            icon={<CategoryIcon />}
            color={COLORS.accent}
          />
          <KpiCard
            label="Active Categories"
            value={stats.activeCategories || 0}
            icon={<CategoryIcon />}
            color={COLORS.success}
          />
          <KpiCard
            label="Inactive Categories"
            value={stats.inactiveCategories || 0}
            icon={<CategoryIcon />}
            color={COLORS.danger}
          />
          <KpiCard
            label="Parent Categories"
            value={stats.parentCategories || 0}
            icon={<CategoryIcon />}
            color={COLORS.warning}
          />
        </Box>
      )}

      {/* Additional KPI Cards */}
      {(poStats || quoteStats || saleStats || expenseStats || generalStats) && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
              gap: 3,
              mb: 4,
            }}
          >
            {/* Purchase Orders Overview */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              <MiniStat
                label="Draft POs"
                value={poStats?.draftPurchaseOrders || 0}
                icon={<Business />}
                color={COLORS.warning}
              />
              <MiniStat
                label="Sent POs"
                value={poStats?.sentPurchaseOrders || 0}
                icon={<Business />}
                color={COLORS.accentSecondary}
              />
              <MiniStat
                label="Accepted POs"
                value={poStats?.acceptedPurchaseOrders || 0}
                icon={<Business />}
                color={COLORS.success}
              />
              <MiniStat
                label="Total POs"
                value={poStats?.totalPurchaseOrders || 0}
                icon={<Business />}
                color={COLORS.accent}
              />
            </Box>

            {/* Customer Value */}
            <KpiCard
              label="Customer Value"
              value={generalStats?.totalCustomers || 0}
              icon={<People />}
              subtitle="Total registered customers"
              color={COLORS.accent}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
              gap: 3,
              mb: 4,
            }}
          >
            {/* Quotes Stats */}
            <MiniStat
              label="Draft Quotes"
              value={quoteStats?.draftQuotes || 0}
              icon={<AttachMoney />}
              color={COLORS.warning}
            />
            <MiniStat
              label="Sent Quotes"
              value={quoteStats?.sentQuotes || 0}
              icon={<AttachMoney />}
              color={COLORS.accentSecondary}
            />
            <MiniStat
              label="Accepted Quotes"
              value={quoteStats?.acceptedQuotes || 0}
              icon={<AttachMoney />}
              color={COLORS.success}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
              gap: 3,
              mb: 4,
            }}
          >
            {/* Sales and Expenses */}
            <MiniStat
              label="Total Sales"
              value={formatCurrency(saleStats?.totalSales || 0)}
              icon={<TrendingUp />}
              color={COLORS.success}
            />
            <MiniStat
              label="Total Expenses"
              value={formatCurrency(expenseStats?.totalExpenses || 0)}
              icon={<TrendingDown />}
              color={COLORS.danger}
            />
            <MiniStat
              label="Active Sales"
              value={saleStats?.activeSales || 0}
              icon={<Timeline />}
              color={COLORS.accent}
            />
            <MiniStat
              label="Pending Expenses"
              value={expenseStats?.pendingExpenses || 0}
              icon={<Warning />}
              color={COLORS.warning}
            />
          </Box>
        </>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 33.333%' } }}>
            <TextField
              fullWidth
              placeholder="Search categories..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 auto' } }}>
            <FormControl variant="outlined" size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                label="Status"
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 auto' } }}>
            <FormControl variant="outlined" size="small">
              <InputLabel>Parent Category</InputLabel>
              <Select
                value={filters.parentCategory}
                onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                label="Parent Category"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="none">No Parent</MenuItem>
                {categories.filter(cat => !cat.parentCategory).map((parent) => (
                  <MenuItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 auto' } }}>
            <Button
              variant="outlined"
              onClick={() => setFilters({ search: '', isActive: '', parentCategory: '', sortBy: 'sortOrder', sortOrder: 'asc', page: 1, limit: 10 })}
              startIcon={<FilterIcon />}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Categories Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Parent Category</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sort Order</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: category.color,
                            borderRadius: 1,
                            mr: 2
                          }}
                        />
                        <Typography variant="subtitle2" fontWeight="bold">
                          {category.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {category.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {category.parentCategory?.name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          width: 30,
                          height: 20,
                          backgroundColor: category.color,
                          borderRadius: 1,
                          border: '1px solid #ccc'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(category.isActive)}
                        color={getStatusColor(category.isActive) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {category.sortOrder}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {category.productCount || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, category)}
                        size="small"
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
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} />
          View
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the category "{selectedCategory?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesPage;
