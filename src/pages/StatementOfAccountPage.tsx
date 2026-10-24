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
    Chip,
    FormControlLabel,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaymentIcon from "@mui/icons-material/Payment";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import apiClient from "../api/client";
import { creditNoteApi } from "../api";
import { COLORS } from "../theme/colors";
import { useCompany } from "../contexts/CompanyContext";
import { CreditNote } from "../types";

interface Customer {
    _id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
}

interface SOAInvoice {
    _id: string;
    type?: 'invoice' | 'credit_note';
    invoiceDate: string;
    invoiceNumber: string;
    description: string;
    subtotal?: number;
    amount: number;       // For invoice: grand total; for credit note: negative amount
    taxAmount: number;
    payment: number;      // Paid amount + credit applied
    paidAmount?: number;
    creditApplied?: number;
    balance: number;
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
    totalInvoiced: number;
    totalTax: number;
    totalSubtotal: number;
    totalPayments: number;
    totalPaidCash: number;
    totalCreditApplied: number;
    totalOutstandingInvoices: number;
    availableCreditBalance: number;
    deductCredit: boolean;
    creditDeducted: number;
    netBalanceDue: number;
    remainingCreditAfterSOA: number;
    totalBalance: number;
    grandTotal: number;
    avgTaxRate: number;
    availableCreditNotes?: Array<{
        _id: string;
        creditNoteNumber: string;
        creditAmount: number;
        usedAmount: number;
        remainingBalance: number;
        createdAt: string;
        status: string;
    }>;
}

const StatementOfAccountPage: React.FC = () => {
    const { settings } = useCompany();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [soaData, setSoaData] = useState<SOAData | null>(null);

    // Credit Note states
    const [customerCredit, setCustomerCredit] = useState<{
        totalCredit: number;
        totalUsed: number;
        remainingBalance: number;
    } | null>(null);
    const [availableCreditNotes, setAvailableCreditNotes] = useState<CreditNote[]>([]);
    const [deductCredit, setDeductCredit] = useState<boolean>(true);

    // Apply Credit Dialog states
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);
    const [applyAmount, setApplyAmount] = useState<number | string>("");
    const [applyingCredit, setApplyingCredit] = useState(false);

    const formatCurrency = (amount: number) => {
        const currency = settings?.currency || 'AED';
        try {
            return new Intl.NumberFormat(currency === 'AED' ? 'en-AE' : 'en-US', {
                style: 'currency',
                currency: currency
            }).format(amount || 0);
        } catch {
            return `${currency} ${(amount || 0).toFixed(2)}`;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    // Fetch customers on mount
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                setLoading(true);
                const response: any = await apiClient.get('/customers?limit=1000');

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

    // Fetch customer credit balance when customer is selected
    useEffect(() => {
        if (selectedCustomer) {
            creditNoteApi.getCustomerBalance(selectedCustomer._id)
                .then((res: any) => {
                    setCustomerCredit(res.balance || null);
                    setAvailableCreditNotes(res.availableCreditNotes || []);
                })
                .catch((err) => {
                    console.error("Failed to fetch customer credit balance:", err);
                    setCustomerCredit(null);
                    setAvailableCreditNotes([]);
                });
        } else {
            setCustomerCredit(null);
            setAvailableCreditNotes([]);
            setSoaData(null);
        }
    }, [selectedCustomer]);

    const handleGenerate = async (deductOverride?: boolean) => {
        if (!selectedCustomer || !fromDate || !toDate) {
            setError("Please select a customer and date range.");
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            setSuccessMessage(null);

            const deduct = deductOverride !== undefined ? deductOverride : deductCredit;

            const response = await apiClient.get<SOAData>('/soa', {
                params: {
                    customer_id: selectedCustomer._id,
                    from: fromDate,
                    to: toDate,
                    deduct_credit: deduct ? 'true' : 'false'
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

            const blobData = await apiClient.get<Blob>('/soa', {
                params: {
                    customer_id: selectedCustomer._id,
                    from: fromDate,
                    to: toDate,
                    format: 'pdf',
                    deduct_credit: deductCredit ? 'true' : 'false'
                },
                responseType: 'blob',
                timeout: 120000
            });

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

    // Open apply credit modal with precalculated amount
    const handleOpenApplyDialog = () => {
        if (!customerCredit || customerCredit.remainingBalance <= 0) return;

        const maxOutstanding = soaData?.totalOutstandingInvoices !== undefined 
            ? soaData.totalOutstandingInvoices 
            : customerCredit.remainingBalance;

        const defaultAmount = Math.min(customerCredit.remainingBalance, maxOutstanding > 0 ? maxOutstanding : customerCredit.remainingBalance);
        setApplyAmount(defaultAmount > 0 ? defaultAmount : customerCredit.remainingBalance);
        setApplyDialogOpen(true);
    };

    const handleApplyCreditSubmit = async () => {
        if (!selectedCustomer) return;
        const numAmount = Number(applyAmount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError("Please enter a valid credit amount to apply.");
            return;
        }

        try {
            setApplyingCredit(true);
            setError(null);

            const res: any = await apiClient.post('/soa/apply-credit', {
                customer_id: selectedCustomer._id,
                amount: numAmount
            });

            setSuccessMessage(res.message || `Successfully applied ${formatCurrency(numAmount)} credit to customer invoices.`);
            setApplyDialogOpen(false);

            // Refresh customer credit balance
            const balanceRes: any = await creditNoteApi.getCustomerBalance(selectedCustomer._id);
            setCustomerCredit(balanceRes.balance || null);
            setAvailableCreditNotes(balanceRes.availableCreditNotes || []);

            // Regenerate SOA to reflect newly applied credits on invoices
            await handleGenerate();
        } catch (err: any) {
            console.error("Failed to apply credit via SOA:", err);
            setError(err.response?.data?.message || "Failed to apply credit notes to customer invoices.");
        } finally {
            setApplyingCredit(false);
        }
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
                            onClick={() => handleGenerate()}
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

                {/* Customer Wallet / Credit Note Balance Banner */}
                {selectedCustomer && customerCredit && customerCredit.remainingBalance > 0 && (
                    <Box
                        sx={{
                            mt: 3,
                            p: 2.5,
                            borderRadius: 2,
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <AccountBalanceWalletIcon sx={{ color: '#10b981', fontSize: 32 }} />
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                                        Customer Wallet Credits Available:
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981' }}>
                                        {formatCurrency(customerCredit.remainingBalance)}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={`${availableCreditNotes.length} Credit Note${availableCreditNotes.length !== 1 ? 's' : ''}`}
                                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#047857', fontWeight: 600 }}
                                    />
                                </Box>
                                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                                    This customer has unused balance credits from returns / credit notes that can reduce their statement balance.
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={deductCredit}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setDeductCredit(checked);
                                            if (soaData) {
                                                handleGenerate(checked);
                                            }
                                        }}
                                        color="success"
                                    />
                                }
                                label={
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
                                        Reduce from Statement Balance
                                    </Typography>
                                }
                            />

                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<PaymentIcon />}
                                onClick={handleOpenApplyDialog}
                                sx={{
                                    bgcolor: '#10b981',
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: '#059669' }
                                }}
                            >
                                Apply Credit to Invoices
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Preview Section */}
            {soaData && (
                <Paper sx={{ p: 0, borderRadius: 2, border: `1px solid ${COLORS.border}`, overflow: 'hidden', background: COLORS.surface }}>
                    <Box sx={{ p: 3, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    SOA Preview
                                </Typography>
                                {soaData.creditDeducted > 0 && (
                                    <Chip
                                        size="small"
                                        icon={<CheckCircleIcon />}
                                        label={`Credit Note Reduced: -${formatCurrency(soaData.creditDeducted)}`}
                                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#047857', fontWeight: 600 }}
                                    />
                                )}
                            </Box>
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
                                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Ref / Invoice No</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Amount (excl. tax)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Tax</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Payment / Credit</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {soaData.invoices.length > 0 ? (
                                    soaData.invoices.map((item) => (
                                        <TableRow key={item._id} hover>
                                            <TableCell>{formatDate(item.invoiceDate)}</TableCell>
                                            <TableCell>
                                                {item.type === 'credit_note' ? (
                                                    <Chip
                                                        size="small"
                                                        label="Credit Note"
                                                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#047857', fontWeight: 600 }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        size="small"
                                                        label="Invoice"
                                                        sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#1d4ed8', fontWeight: 600 }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                {item.invoiceNumber}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.description}
                                            </TableCell>
                                            <TableCell align="right">
                                                {item.type === 'credit_note' ? (
                                                    <Typography component="span" sx={{ color: '#047857', fontWeight: 600 }}>
                                                        -{formatCurrency(Math.abs(item.subtotal || item.amount))}
                                                    </Typography>
                                                ) : (
                                                    formatCurrency(item.subtotal || item.amount)
                                                )}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                                {item.type === 'credit_note' ? '-' : formatCurrency(item.taxAmount || 0)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: item.payment > 0 ? '#10b981' : 'text.secondary', fontWeight: item.payment > 0 ? 600 : 400 }}>
                                                {formatCurrency(item.payment || 0)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                {formatCurrency(item.runningBalance)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                            No invoices or credit notes found for this period.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Summary Breakdown */}
                                <TableRow>
                                    <TableCell colSpan={7} align="right" sx={{ fontWeight: 600, borderTop: `2px solid`, borderColor: 'divider', pt: 2 }}>
                                        Subtotal (excl. tax):
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, borderTop: `2px solid`, borderColor: 'divider', pt: 2 }}>
                                        {formatCurrency(soaData.totalSubtotal)}
                                    </TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell colSpan={7} align="right" sx={{ color: 'text.secondary' }}>
                                        Tax ({soaData.avgTaxRate}%):
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                        {formatCurrency(soaData.totalTax)}
                                    </TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell colSpan={7} align="right" sx={{ fontWeight: 600 }}>
                                        Total Invoiced (incl. tax):
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                                        {formatCurrency(soaData.totalInvoiced)}
                                    </TableCell>
                                </TableRow>

                                {(soaData.totalPayments > 0) && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="right" sx={{ color: 'text.secondary' }}>
                                            Payments & Credits Applied:
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                            -{formatCurrency(soaData.totalPayments)}
                                        </TableCell>
                                    </TableRow>
                                )}

                                <TableRow>
                                    <TableCell colSpan={7} align="right" sx={{ fontWeight: 600 }}>
                                        Outstanding Invoice Balance:
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                                        {formatCurrency(soaData.totalOutstandingInvoices)}
                                    </TableCell>
                                </TableRow>

                                {/* Credit Note Deduction Highlight */}
                                {soaData.creditDeducted > 0 && (
                                    <TableRow sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)' }}>
                                        <TableCell colSpan={7} align="right" sx={{ fontWeight: 700, color: '#047857' }}>
                                            Less: Customer Available Credit Notes:
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#047857' }}>
                                            -{formatCurrency(soaData.creditDeducted)}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Grand Total (Net Payable) */}
                                <TableRow sx={{ bgcolor: COLORS.surfaceAlt }}>
                                    <TableCell colSpan={7} align="right" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                                        Net Balance Due:
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.05rem', color: COLORS.accent }}>
                                        {formatCurrency(soaData.netBalanceDue)}
                                    </TableCell>
                                </TableRow>

                                {soaData.remainingCreditAfterSOA > 0 && (
                                    <TableRow sx={{ bgcolor: 'rgba(16, 185, 129, 0.04)' }}>
                                        <TableCell colSpan={7} align="right" sx={{ fontStyle: 'italic', color: '#059669', fontSize: '0.85rem' }}>
                                            Remaining Customer Wallet Credit (Available for future):
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontStyle: 'italic', color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
                                            {formatCurrency(soaData.remainingCreditAfterSOA)}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Apply Credit Modal */}
            <Dialog
                open={applyDialogOpen}
                onClose={() => !applyingCredit && setApplyDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalanceWalletIcon sx={{ color: '#10b981' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Apply Credit Note to Customer Invoices
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setApplyDialogOpen(false)} disabled={applyingCredit}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        This action will redeem the selected credit note amount against the customer's oldest outstanding invoices (FIFO).
                        The credit note balance and invoice balances will be permanently updated.
                    </Alert>

                    <Paper sx={{ p: 2, mb: 3, bgcolor: COLORS.surfaceAlt, borderRadius: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Customer:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : ''}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Available Credit Notes Balance:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981' }}>
                                {customerCredit ? formatCurrency(customerCredit.remainingBalance) : 0}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Outstanding Invoice Balance:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.accent }}>
                                {soaData ? formatCurrency(soaData.totalOutstandingInvoices) : 'N/A'}
                            </Typography>
                        </Box>
                    </Paper>

                    <TextField
                        label="Credit Amount to Apply"
                        type="number"
                        fullWidth
                        value={applyAmount}
                        onChange={(e) => setApplyAmount(e.target.value)}
                        inputProps={{
                            min: 0.01,
                            max: customerCredit ? customerCredit.remainingBalance : 0,
                            step: 0.01
                        }}
                        helperText={`Max applicable credit: ${customerCredit ? formatCurrency(customerCredit.remainingBalance) : 0}`}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setApplyDialogOpen(false)} disabled={applyingCredit} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleApplyCreditSubmit}
                        disabled={applyingCredit || !applyAmount || Number(applyAmount) <= 0}
                        startIcon={applyingCredit ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                        sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                    >
                        {applyingCredit ? "Applying..." : "Apply & Settle Invoices"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StatementOfAccountPage;

