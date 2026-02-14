import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { taxApi } from '../api';
import { Tax, CreateTaxRequest, UpdateTaxRequest } from '../types';

const TaxSettingsPage: React.FC = () => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [formData, setFormData] = useState<CreateTaxRequest>({
    name: '',
    percentage: 0,
    description: ''
  });

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const data = await taxApi.getTaxes();
      setTaxes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch taxes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tax?: Tax) => {
    if (tax) {
      setEditingTax(tax);
      setFormData({
        name: tax.name,
        percentage: tax.percentage,
        description: tax.description || ''
      });
    } else {
      setEditingTax(null);
      setFormData({
        name: '',
        percentage: 0,
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTax(null);
    setFormData({
      name: '',
      percentage: 0,
      description: ''
    });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (editingTax) {
        await taxApi.updateTax(editingTax._id, formData as UpdateTaxRequest);
        setSuccess('Tax updated successfully');
      } else {
        await taxApi.createTax(formData);
        setSuccess('Tax created successfully');
      }
      
      handleCloseDialog();
      fetchTaxes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save tax');
    }
  };

  const handleDelete = async (tax: Tax) => {
    if (window.confirm(`Are you sure you want to delete "${tax.name}"?`)) {
      try {
        await taxApi.deleteTax(tax._id);
        setSuccess('Tax deleted successfully');
        fetchTaxes();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete tax');
      }
    }
  };

  const handleInputChange = (field: keyof CreateTaxRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon color="primary" />
          Tax Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Tax
        </Button>
      </Box>

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

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Custom Taxes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create and manage custom taxes that can be applied to quotes and invoices.
          </Typography>

          {taxes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <MoneyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No taxes configured
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create your first custom tax to get started.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add First Tax
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tax Name</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taxes.map((tax) => (
                    <TableRow key={tax._id}>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {tax.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight="medium">
                          {tax.percentage}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {tax.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={tax.isActive ? 'Active' : 'Inactive'}
                          color={tax.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Tax">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(tax)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Tax">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(tax)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Tax Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTax ? 'Edit Tax' : 'Add New Tax'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Tax Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              margin="normal"
              required
              placeholder="e.g., VAT, Sales Tax, GST"
            />
            
            <TextField
              fullWidth
              label="Percentage"
              type="number"
              value={formData.percentage}
              onChange={(e) => handleInputChange('percentage', parseFloat(e.target.value) || 0)}
              margin="normal"
              required
              inputProps={{ min: 0, max: 100, step: 0.01 }}
              placeholder="e.g., 15.5"
            />
            
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              margin="normal"
              multiline
              rows={3}
              placeholder="Optional description for this tax"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || formData.percentage < 0}
          >
            {editingTax ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaxSettingsPage;
