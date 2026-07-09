import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Autocomplete,
    CircularProgress,
    Alert,
} from "@mui/material";
// Checking package.json: "@mui/x-data-grid": "^8.12.1", but NO x-date-pickers.
// I'll use native type="date" for simplicity as per "filters" requirement without extra deps.
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import apiClient from "../api/client";
import { COLORS } from "../theme/colors";

interface Customer {
    _id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
}

interface SOAInvoice {
    _id: string;
    invoiceDate: string;
    invoiceNumber: string;
    description: string;
    amount: number;       // Subtotal (excl. tax)
    taxAmount: number;    // Tax (shown separately)
    payment: number;
    runningBalance: number;
}

interface SOAData {
    customer_id: string;
    period: {
        from: string;
        to: string;
    };
    statementDate: string;
    invoices: SOAInvoice[];
    totalBalance: number;  // Subtotal (excl. tax)
    totalTax: number;      // Total tax
    grandTotal: number;    // Grand total (incl. tax)
    avgTaxRate: number;    // Effective tax rate %
}

const StatementOfAccountPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [soaData, setSoaData] = useState<SOAData | null>(null);

    // Fetch customers on mount
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                setLoading(true);
                // Assuming there's a route to get all customers or search them
                // Trying /api/customers endpoint. Usually list returns pagination.
                // I might need to fetch all or use autocomplete search.
                // For now, I'll fetch a list with a large limit or use a search endpoint if available.
                // Based on invoices.js 'populate', customer has firstName, lastName.
                const response: any = await apiClient.get('/customers?limit=1000');
                // Need to check actual response structure of /api/customers. 
                // Based on invoices.js: res.json({ invoices, pagination }).
                // Customers route likely similar: { customers, pagination } or array.
                // I'll check response structure safely.

                let customerList: Customer[] = [];
                if (Array.isArray(response)) {
                    customerList = response;
                } else if (response.customers && Array.isArray(response.customers)) {
                    customerList = response.customers;
                }

                setCustomers(customerList);
            } catch (err: any) {
                console.error("Failed to fetch customers:", err);
                setError("Failed to load customer list.");
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    const handleGenerate = async () => {
        if (!selectedCustomer || !fromDate || !toDate) {
            setError("Please select a customer and date range.");
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            setSoaData(null);

            const response = await apiClient.get<SOAData>('/soa', {
                params: {
                    customer_id: selectedCustomer._id,
                    from: fromDate,
                    to: toDate,
                }
            });

            setSoaData(response);
        } catch (err: any) {
            console.error("Error generating SOA:", err);
            setError(err.response?.data?.message || "Failed to generate Statement of Account.");
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedCustomer || !fromDate || !toDate) return;

        try {
            setDownloadingPDF(true);
            setError(null);

            // apiClient.get() returns response.data directly.
            // With responseType: 'blob', response.data is already a Blob.
            // Use a long timeout (120s) since PDF generation can take a while.
            const blobData = await apiClient.get<Blob>('/soa', {
                params: {
                    customer_id: selectedCustomer._id,
                    from: fromDate,
                    to: toDate,
                    format: 'pdf'
                },
                responseType: 'blob',
                timeout: 120000
            });

            // blobData is already a Blob (response.data)
            const url = window.URL.createObjectURL(blobData);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SOA-${selectedCustomer.firstName}-${toDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Error downloading PDF:", err);
            setError("Failed to download PDF. Please try again.");
        } finally {
            setDownloadingPDF(false);
        }
    };

    const formatCurrency = (amount: number) => {
        // Assuming AED based on prompt, or use company settings if available in context
        return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    return (
        <Box sx={{ pb: 5 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: COLORS.textPrimary }}>
                Statement of Account
            </Typography>

            {/* Filters Section */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, border: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <Box sx={{ flex: 2, minWidth: '300px' }}>
                        <Autocomplete
                            options={customers}
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName} ${option.companyName ? `(${option.companyName})` : ''}`}
                            value={selectedCustomer}
                            onChange={(_, newValue) => setSelectedCustomer(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Customer"
                                    variant="outlined"
                                    fullWidth
                                    required
                                />
                            )}
                            loading={loading}
                            disablePortal
                        />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                        <TextField
                            label="From Date"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            required
                        />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '200px' }}>
                        <TextField
                            label="To Date"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            required
                        />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '150px' }}>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                            onClick={handleGenerate}
                            disabled={generating || !selectedCustomer}
                            sx={{
                                background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentSecondary})`,
                                height: 56
                            }}
                        >
                            {generating ? "Generating..." : "Generate"}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Preview Section */}
            {soaData && (
                <Paper sx={{ p: 0, borderRadius: 2, border: `1px solid ${COLORS.border}`, overflow: 'hidden', background: COLORS.surface }}>
                    <Box sx={{ p: 3, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                SOA Preview
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Period: {formatDate(soaData.period.from)} - {formatDate(soaData.period.to)}
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={downloadingPDF ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                            onClick={handleDownloadPDF}
                            disabled={downloadingPDF}
                            sx={{ borderColor: COLORS.accent, color: COLORS.accent }}
                        >
                            {downloadingPDF ? "Generating PDF..." : "Download PDF"}
                        </Button>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: COLORS.surfaceAlt }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Invoice No</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Amount (excl. tax)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Tax</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Payment</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {soaData.invoices.length > 0 ? (
                                    soaData.invoices.map((invoice) => (
                                        <TableRow key={invoice._id} hover>
                                            <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>{invoice.invoiceNumber}</TableCell>
                                            <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {invoice.description}
                                            </TableCell>
                                            <TableCell align="right">{formatCurrency(invoice.amount)}</TableCell>
                                            <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatCurrency(invoice.taxAmount || 0)}</TableCell>
                                            <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatCurrency(invoice.payment)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(invoice.runningBalance)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                            No invoices found for this period.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Summary Rows */}
                                <TableRow>
                                    <TableCell colSpan={6} align="right" sx={{ fontWeight: 600, borderTop: `2px solid`, borderColor: 'divider', pt: 2 }}>
                                        Subtotal (excl. tax):
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, borderTop: `2px solid`, borderColor: 'divider', pt: 2 }}>
                                        {formatCurrency(soaData.totalBalance)}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={6} align="right" sx={{ color: 'text.secondary' }}>
                                        Tax ({soaData.avgTaxRate}%):
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                        {formatCurrency(soaData.totalTax)}
                                    </TableCell>
                                </TableRow>
                                <TableRow sx={{ bgcolor: COLORS.surfaceAlt }}>
                                    <TableCell colSpan={6} align="right" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Grand Total (incl. tax):
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: COLORS.accent }}>
                                        {formatCurrency(soaData.grandTotal)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
};

export default StatementOfAccountPage;
