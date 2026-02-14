import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  GridLegacy as Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Autocomplete,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  Save,
  Cancel,
  Add,
  Delete,
  CloudUpload,
  Inventory,
  AttachMoney,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { productApi, vendorApi, categoryApi, imageApi } from '../api';
import { ProductFormData, Vendor, Category } from '../types';
import BarcodeDisplay from './BarcodeDisplay';

const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    unit: 'piece',
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    reorderPoint: 0,
    location: '',
    supplier: '',
    images: [],
    isActive: true,
    isTrackable: true,
    tags: [],
    notes: '',
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newTag, setNewTag] = useState('');
  const [showBarcodeSection, setShowBarcodeSection] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const product = await productApi.getProduct(id);
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        barcode: product.barcode || '',
        category: product.category,
        brand: product.brand || '',
        unit: product.unit,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        minStockLevel: product.minStockLevel,
        maxStockLevel: product.maxStockLevel || 0,
        reorderPoint: product.reorderPoint,
        location: product.location || '',
        supplier: product.supplier?.id || '',
        images: product.images || [],
        isActive: product.isActive,
        isTrackable: product.isTrackable,
        tags: product.tags || [],
        notes: product.notes || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch product');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
    fetchVendors();
    fetchCategories();
  }, [id, isEditing, fetchProduct]);

  const fetchVendors = async () => {
    try {
      const response = await vendorApi.getVendors({}, 1, 100);
      setVendors(response.vendors);
    } catch (err: any) {
      console.error('Failed to fetch vendors:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      setCategories(response.categories);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleBarcodeGenerated = (barcode: string) => {
    // Update the form data with the generated barcode
    setFormData(prev => ({
      ...prev,
      barcode: barcode
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      const response = await imageApi.uploadImage(file);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), response.imageUrl]
      }));
    } catch (error) {
      console.error('Image upload error:', error);
      setError('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (isEditing) {
        await productApi.updateProduct(id!, formData);
        setSuccess('Product updated successfully');
      } else {
        await productApi.createProduct(formData);
        setSuccess('Product created successfully');
        // Show barcode section after successful creation
        setShowBarcodeSection(true);
      }
      
      setTimeout(() => {
        navigate('/products');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateProfitMargin = () => {
    if (formData.costPrice === 0) return 0;
    return ((formData.sellingPrice - formData.costPrice) / formData.costPrice) * 100;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          onClick={() => navigate('/products')}
        >
          Cancel
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

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Inventory sx={{ mr: 1 }} />
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Product Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="SKU"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                      required
                      helperText="Stock Keeping Unit - unique identifier"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Barcode"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Product Images */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CloudUpload sx={{ mr: 1 }} />
                  Product Images
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Image Upload Area */}
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <input
                      type="file"
                      hidden
                      id="image-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      disabled={isUploadingImage}
                    />
                    <label htmlFor="image-upload" style={{ cursor: 'pointer', width: '100%' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        {isUploadingImage ? (
                          <CircularProgress size={40} />
                        ) : (
                          <CloudUpload sx={{ fontSize: 40, color: 'text.secondary' }} />
                        )}
                        <Typography variant="body1" color="text.secondary">
                          {isUploadingImage ? 'Uploading...' : 'Click to upload product images'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Supports JPG, PNG, GIF, WebP (Max 5MB)
                        </Typography>
                      </Box>
                    </label>
                  </Box>

                  {/* Display Uploaded Images */}
                  {formData.images && formData.images.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {formData.images.map((image, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            width: 120,
                            height: 120,
                            borderRadius: 1,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'grey.300',
                          }}
                        >
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'error.main',
                              color: 'white',
                              width: 24,
                              height: 24,
                              '&:hover': {
                                backgroundColor: 'error.dark',
                              },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Category and Classification */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CategoryIcon sx={{ mr: 1 }} />
                  Category and Classification
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      freeSolo
                      options={categories}
                      getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                      value={categories.find(cat => cat.name === formData.category) || formData.category}
                      onChange={(_, newValue) => {
                        const categoryName = typeof newValue === 'string' ? newValue : newValue?.name || '';
                        handleInputChange('category', categoryName);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Category"
                          required
                          helperText="Select existing or create new category"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Unit of Measurement</InputLabel>
                      <Select
                        value={formData.unit}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                        label="Unit of Measurement"
                      >
                        <MenuItem value="piece">Piece</MenuItem>
                        <MenuItem value="kg">Kilogram</MenuItem>
                        <MenuItem value="g">Gram</MenuItem>
                        <MenuItem value="liter">Liter</MenuItem>
                        <MenuItem value="ml">Milliliter</MenuItem>
                        <MenuItem value="box">Box</MenuItem>
                        <MenuItem value="pack">Pack</MenuItem>
                        <MenuItem value="dozen">Dozen</MenuItem>
                        <MenuItem value="meter">Meter</MenuItem>
                        <MenuItem value="cm">Centimeter</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Supplier</InputLabel>
                      <Select
                        value={formData.supplier}
                        onChange={(e) => handleInputChange('supplier', e.target.value)}
                        label="Supplier"
                      >
                        <MenuItem value="">No Supplier</MenuItem>
                        {vendors.map((vendor) => (
                          <MenuItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      helperText="Warehouse location or shelf"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Pricing */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ mr: 1 }} />
                  Pricing Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Cost Price"
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Selling Price"
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Profit Margin"
                      value={`${calculateProfitMargin().toFixed(2)}%`}
                      disabled
                      helperText="Calculated automatically"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Inventory Management */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Inventory Management
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Current Stock"
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                      required
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Minimum Stock Level"
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Maximum Stock Level"
                      type="number"
                      value={formData.maxStockLevel}
                      onChange={(e) => handleInputChange('maxStockLevel', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Reorder Point"
                      type="number"
                      value={formData.reorderPoint}
                      onChange={(e) => handleInputChange('reorderPoint', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Tags */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TextField
                    label="Add Tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.tags?.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Settings */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        />
                      }
                      label="Active Product"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isTrackable}
                          onChange={(e) => handleInputChange('isTrackable', e.target.checked)}
                        />
                      }
                      label="Track Stock"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Notes
                </Typography>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  multiline
                  rows={4}
                  placeholder="Any additional information about this product..."
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/products')}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
                disabled={isSaving}
                sx={{ 
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                  }
                }}
              >
                {isSaving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Barcode Generation Section */}
      {showBarcodeSection && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <BarcodeDisplay
                  sku={formData.sku}
                  productName={formData.name}
                  barcodeValue={formData.barcode}
                  onBarcodeGenerated={handleBarcodeGenerated}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ProductForm;
