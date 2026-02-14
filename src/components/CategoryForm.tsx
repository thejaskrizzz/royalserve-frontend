import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  GridLegacy as Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { categoryApi } from '../api';
import { CategoryFormData, Category } from '../types';

const CategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parentCategory: '',
    color: '#1976d2',
    icon: '',
    isActive: true,
    sortOrder: 0,
    tags: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTag, setNewTag] = useState('');

  const predefinedColors = [
    '#1976d2', '#dc004e', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b', '#e91e63', '#f44336'
  ];

  const predefinedIcons = [
    'Category', 'Inventory', 'Electronics', 'Clothing', 'Food',
    'Books', 'Sports', 'Home', 'Beauty', 'Toys', 'Automotive',
    'Health', 'Office', 'Garden', 'Music', 'Movies', 'Games'
  ];

  const fetchCategory = useCallback(async () => {
    try {
      setLoading(true);
      const category = await categoryApi.getCategory(id!);
      setFormData({
        name: category.name,
        description: category.description || '',
        parentCategory: category.parentCategory?._id || '',
        color: category.color,
        icon: category.icon || '',
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        tags: category.tags || []
      });
    } catch (err) {
      setError('Failed to fetch category');
      console.error('Error fetching category:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit && id) {
      fetchCategory();
    }
    fetchCategories();
  }, [id, isEdit, fetchCategory]);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories({ limit: 1000 });
      setCategories(response.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleInputChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Convert empty string to null for parentCategory
      const submitData = {
        ...formData,
        parentCategory: formData.parentCategory === '' ? null : formData.parentCategory
      };

      if (isEdit) {
        await categoryApi.updateCategory(id!, submitData);
      } else {
        await categoryApi.createCategory(submitData);
      }

      navigate('/categories');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category');
      console.error('Error saving category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/categories');
  };

  if (loading && isEdit) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon />
          {isEdit ? 'Edit Category' : 'Add New Category'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CategoryIcon sx={{ mr: 1 }} />
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Category Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      error={!formData.name}
                      helperText={!formData.name ? 'Category name is required' : ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Sort Order"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Category Hierarchy */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Hierarchy
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Parent Category</InputLabel>
                      <Select
                        value={formData.parentCategory}
                        onChange={(e) => handleInputChange('parentCategory', e.target.value)}
                        label="Parent Category"
                      >
                        <MenuItem value="">None (Top Level)</MenuItem>
                        {categories
                          .filter(cat => cat.id !== id) // Don't allow self as parent
                          .map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                              {category.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Appearance */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PaletteIcon sx={{ mr: 1 }} />
                  Appearance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Color
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {predefinedColors.map((color) => (
                        <Box
                          key={color}
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: color,
                            borderRadius: 1,
                            cursor: 'pointer',
                            border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                            '&:hover': {
                              border: '2px solid #000'
                            }
                          }}
                          onClick={() => handleInputChange('color', color)}
                        />
                      ))}
                    </Box>
                    <TextField
                      fullWidth
                      label="Custom Color (Hex)"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      placeholder="#1976d2"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Icon</InputLabel>
                      <Select
                        value={formData.icon}
                        onChange={(e) => handleInputChange('icon', e.target.value)}
                        label="Icon"
                      >
                        <MenuItem value="">None</MenuItem>
                        {predefinedIcons.map((icon) => (
                          <MenuItem key={icon} value={icon}>
                            {icon}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
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
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="Add Tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      size="small"
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddTag}
                      startIcon={<AddIcon />}
                      disabled={!newTag.trim()}
                    >
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        deleteIcon={<DeleteIcon />}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
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
                      label="Active"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                startIcon={<CancelIcon />}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading || !formData.name}
              >
                {loading ? <CircularProgress size={20} /> : isEdit ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CategoryForm;
