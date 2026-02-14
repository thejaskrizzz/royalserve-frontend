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
  Pagination,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Inventory,
  Warning,
  TrendingUp,
  Category,
  MoreVert,
  VisibilityOff,
  QrCode,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productApi, categoryApi } from '../api';
import { Product, ProductFilters, Category as CategoryType } from '../types';
import { useCompany } from '../contexts/CompanyContext';
import { formatCurrency } from '../utils/currency';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useCompany();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalCategories: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  const [categories, setCategories] = useState<CategoryType[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await productApi.getProducts({
        ...filters,
        page: pagination.current,
        limit: pagination.limit
      });
      setProducts(response.products);
      setPagination(response.pagination);
      
      // Calculate stats
      const totalProducts = response.products.length;
      const lowStockProducts = response.products.filter(p => p.stockStatus === 'low_stock').length;
      const outOfStockProducts = response.products.filter(p => p.stockStatus === 'out_of_stock').length;
      const categories = [...new Set(response.products.map(p => p.category))].length;
      
      setStats({
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalCategories: categories
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.current, pagination.limit]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryApi.getCategories();
      setCategories(response.categories);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      await productApi.deleteProduct(selectedProduct.id);
      setSuccess('Product deleted successfully');
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleEdit = () => {
    if (selectedProduct) {
      navigate(`/products/${selectedProduct.id}/edit`);
    }
    handleMenuClose();
  };

  const handleView = () => {
    if (selectedProduct) {
      navigate(`/products/${selectedProduct.id}`);
    }
    handleMenuClose();
  };

  const handleToggleActive = async () => {
    if (!selectedProduct) return;
    
    try {
      await productApi.updateProduct(selectedProduct.id, {
        isActive: !selectedProduct.isActive
      });
      setSuccess(`Product ${selectedProduct.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
    handleMenuClose();
  };

  const getStockStatusChip = (product: Product) => {
    const status = product.stockStatus || 'in_stock';
    switch (status) {
      case 'out_of_stock':
        return <Chip label="Out of Stock" color="error" size="small" />;
      case 'low_stock':
        return <Chip label="Low Stock" color="warning" size="small" />;
      case 'overstock':
        return <Chip label="Overstock" color="info" size="small" />;
      default:
        return <Chip label="In Stock" color="success" size="small" />;
    }
  };

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 50) return 'success.main';
    if (margin >= 25) return 'warning.main';
    return 'error.main';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Inventory Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/products/new')}
          sx={{ 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
            }
          }}
        >
          Add Product
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Inventory color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Products
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalProducts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock
                  </Typography>
                  <Typography variant="h5">
                    {stats.lowStockProducts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Out of Stock
                  </Typography>
                  <Typography variant="h5">
                    {stats.outOfStockProducts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Category color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Categories
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalCategories}
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
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search products..."
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="in_stock">In Stock</MenuItem>
                <MenuItem value="low_stock">Low Stock</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                <MenuItem value="overstock">Overstock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={() => setFilters({ search: '', category: '', status: '', sortBy: 'createdAt', sortOrder: 'desc' })}
              fullWidth
            >
              Clear Filters
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

      {/* Products Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <QrCode sx={{ mr: 1, fontSize: 16 }} />
                    Barcode
                  </Box>
                </TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Cost Price</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell>Profit Margin</TableCell>
                <TableCell>Status</TableCell>
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
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {product.name}
                        </Typography>
                        {product.description && (
                          <Typography variant="body2" color="textSecondary">
                            {product.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {product.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" color="primary">
                        {product.barcode || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {product.stockQuantity} {product.unit}
                        </Typography>
                        {getStockStatusChip(product)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.costPrice, settings?.currency || 'USD')}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.sellingPrice, settings?.currency || 'USD')}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={getProfitMarginColor(product.profitMargin || 0)}
                        fontWeight="bold"
                      >
                        {product.profitMargin?.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={product.isActive ? 'Active' : 'Inactive'} 
                        color={product.isActive ? 'success' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, product)}
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
        {selectedProduct?.barcode && (
          <MenuItem onClick={() => {
            // Copy barcode to clipboard
            navigator.clipboard.writeText(selectedProduct.barcode || '');
            setSuccess('Barcode copied to clipboard');
            handleMenuClose();
          }}>
            <ListItemIcon>
              <QrCode fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy Barcode</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Product</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleToggleActive}>
          <ListItemIcon>
            {selectedProduct?.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedProduct?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setDeleteDialogOpen(true)}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Product</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
