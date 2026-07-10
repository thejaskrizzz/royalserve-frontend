// User Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  lastLogin?: string;
  company: Company;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  lastLogin?: string;
  company: {
    id: string;
    name: string;
    industry?: string;
    settings: CompanySettings;
  };
}

// Company Types
export interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  email: string;
  phone?: string;
  address: Address;
  logo?: string;
  settings: CompanySettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'INR';
  timezone: string;
  dateFormat: string;
  quotePrefix: string;
  quoteNumber: number;
  taxRate: number;
  terms: string;
  quoteValidityDays: number;
  creditNotePrefix?: string;
  nextCreditNoteNumber?: number;
  creditNoteExpiryEnabled?: boolean;
  creditNoteExpiryDays?: number;
  quoteEmailSubject?: string;
  quoteEmailBody?: string;
  invoiceEmailSubject?: string;
  invoiceEmailBody?: string;
  emailServiceType?: 'smtp' | 'resend';
}

export interface Tax {
  _id: string;
  id: string;
  name: string;
  percentage: number;
  description?: string;
  isActive: boolean;
  company: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRequest {
  name: string;
  percentage: number;
  description?: string;
}

export interface UpdateTaxRequest {
  name?: string;
  percentage?: number;
  description?: string;
  isActive?: boolean;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Customer Types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  vatNumber?: string;
  address: Address;
  notes?: string;
  tags: string[];
  isActive: boolean;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lastContactDate?: string;
  totalQuotes: number;
  totalValue: number;
  creditBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  vatNumber?: string;
  address: Address;
  notes?: string;
  tags: string[];
}

// Quote Types
export interface QuoteItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image?: string; // Base64 encoded image or image URL
  productId?: string; // Reference to existing product
  product?: Product; // Full product details when selected
}

export interface Quote {
  id: string;
  customer: Customer;
  quoteNumber: string;
  title: string;
  description?: string;
  items: QuoteItem[];
  subtotal: number;
  tax?: Tax;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  terms: string;
  notes?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteFormData {
  customerId: string;
  title: string;
  description?: string;
  items: QuoteItem[];
  taxId?: string;
  taxRate: number;
  validUntil: string;
  terms: string;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
  errors?: string[];
}

export interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

// Specific response types for different endpoints
export interface CustomersResponse {
  customers: Customer[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface QuotesResponse {
  quotes: Quote[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  industry?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: UserProfile;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Statistics Types
export interface CustomerStats {
  totalCustomers: number;
  totalValue: number;
}

export interface QuoteStats {
  totalQuotes: number;
  totalQuoteValue: number;
  acceptedQuotes: number;
  draftQuotes: number;
  sentQuotes: number;
  viewedQuotes: number;
  rejectedQuotes: number;
  expiredQuotes: number;
  averageValue: number;
}

export interface CompanyStats {
  customers: CustomerStats;
  quotes: QuoteStats;
  users: {
    totalUsers: number;
  };
}

// Form Types
export interface QuoteItemFormData {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  image?: string; // Base64 encoded image or image URL
}

// Filter Types
export interface CustomerFilters {
  search?: string;
  tags?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface QuoteFilters {
  search?: string;
  status?: string;
  customerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Context Types
export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearAuthState: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  errors?: string[];
}

// Utility Types
export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: Status;
  error: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  company: string;
  title: string;
  description?: string;
  items: QuoteItem[];
  subtotal: number;
  tax?: Tax;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  terms: string;
  notes?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  originalQuote?: string;
  payments: Payment[];
  paidAmount: number;
  companySignature?: string;
  customerSignature?: string;
  creditApplied?: number;
  creditNoteRedemptions?: Array<{ creditNote: string; amount: number }>;
  finalPayable?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
  notes?: string;
}

export interface InvoiceFormData {
  customerId: string;
  title: string;
  description?: string;
  items: QuoteItem[];
  taxId?: string;
  taxRate: number;
  dueDate: string;
  terms: string;
  notes?: string;
  payments?: Payment[];
  companySignature?: string;
  customerSignature?: string;
  creditApplied?: number;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  pagination: PaginationInfo;
}

export interface InvoiceStats {
  overview: {
    totalInvoices: number;
    totalValue: number;
    paidValue: number;
    outstandingValue: number;
    averageValue: number;
  };
  statusBreakdown: Array<{
    _id: string;
    count: number;
    value: number;
  }>;
  monthlyTrends: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
    value: number;
  }>;
}

// Email Response Types
export interface EmailResponse {
  success: boolean;
  message: string;
  error?: string;
  messageId?: string;
}

// API Response Types
export interface SendQuoteResponse {
  message: string;
  quote: Quote;
  email: EmailResponse;
}

export interface SendInvoiceResponse {
  message: string;
  invoice: Invoice;
  email: EmailResponse;
}

// Category Types
export interface Category {
  _id: string;
  id: string;
  name: string;
  description?: string;
  parentCategory?: Category;
  color: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  tags: string[];
  company: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  subcategories?: Category[];
  productCount?: number;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  parentCategory?: string | null;
  color: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  tags: string[];
}

export interface CategoryFilters {
  search?: string;
  isActive?: string;
  parentCategory?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CategoriesResponse {
  categories: Category[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  parentCategories: number;
  subcategories: number;
}

// Vendor Types
export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactPerson?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  businessInfo?: {
    taxId?: string;
    registrationNumber?: string;
    industry?: string;
    description?: string;
  };
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Due on Receipt' | 'Custom';
  customPaymentTerms?: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD' | 'AUD' | 'INR';
  status: 'active' | 'inactive' | 'suspended';
  tags?: string[];
  notes?: string;
  company: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  fullAddress?: string;
  contactPersonInfo?: string;
}

export interface VendorFormData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactPerson?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  businessInfo?: {
    taxId?: string;
    registrationNumber?: string;
    industry?: string;
    description?: string;
  };
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Due on Receipt' | 'Custom';
  customPaymentTerms?: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD' | 'AUD' | 'INR';
  status: 'active' | 'inactive' | 'suspended';
  tags?: string[];
  notes?: string;
}

export interface VendorFilters {
  search?: string;
  status?: string;
  tags?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VendorsResponse {
  vendors: Vendor[];
  pagination: PaginationInfo;
}

export interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  suspendedVendors: number;
}

// Purchase Order Types
export interface PurchaseOrderItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    contactPerson?: {
      name?: string;
      title?: string;
      email?: string;
      phone?: string;
    };
  };
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  company: string;
  title: string;
  description?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Due on Receipt' | 'Custom';
  customPaymentTerms?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  terms?: string;
  notes?: string;
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
  }>;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  fullShippingAddress?: string;
  fullBillingAddress?: string;
}

export interface PurchaseOrderFormData {
  vendor: string;
  client: string;
  title: string;
  description?: string;
  items: PurchaseOrderItem[];
  taxId?: string;
  taxRate: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedDeliveryDate?: string;
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Due on Receipt' | 'Custom';
  customPaymentTerms?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  terms?: string;
  notes?: string;
  approvedBy?: string;
}

export interface PurchaseOrderFilters {
  search?: string;
  status?: string;
  priority?: string;
  vendorId?: string;
  clientId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PurchaseOrdersResponse {
  purchaseOrders: PurchaseOrder[];
  pagination: PaginationInfo;
}

export interface PurchaseOrderStats {
  totalPOs: number;
  totalValue: number;
  draftPOs: number;
  sentPOs: number;
  confirmedPOs: number;
  inProgressPOs: number;
  completedPOs: number;
  cancelledPOs: number;
  averageValue: number;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  unit: 'piece' | 'kg' | 'g' | 'liter' | 'ml' | 'box' | 'pack' | 'dozen' | 'meter' | 'cm' | 'other';
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint: number;
  location?: string;
  supplier?: {
    id: string;
    name: string;
    email: string;
  };
  images?: string[];
  isActive: boolean;
  isTrackable: boolean;
  tags?: string[];
  notes?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  profitMargin?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  unit: 'piece' | 'kg' | 'g' | 'liter' | 'ml' | 'box' | 'pack' | 'dozen' | 'meter' | 'cm' | 'other';
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint: number;
  location?: string;
  supplier?: string;
  images?: string[];
  isActive: boolean;
  isTrackable: boolean;
  tags?: string[];
  notes?: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

export interface ProductStats {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  averagePrice: number;
}

// Sales Types
export interface SaleItem {
  product?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  costPrice?: number;
  profit?: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  tax?: Tax;
  taxRate: number;
  taxAmount: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'credit' | 'other';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  status: 'completed' | 'cancelled' | 'returned';
  saleDate: string;
  notes?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  isReturn: boolean;
  originalSale?: string;
  returnReason?: string;
  creditApplied?: number;
  creditNoteRedemptions?: Array<{ creditNote: string; amount: number }>;
  finalPayable?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleFormData {
  customer?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  total: number;
  taxId?: string;
  taxRate: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'credit' | 'other';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  saleDate: string;
  notes?: string;
  creditApplied?: number;
}

export interface SaleFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SalesResponse {
  sales: Sale[];
  pagination: PaginationInfo;
}

export interface SaleStats {
  totalSales: number;
  totalProfit: number;
  totalCost: number;
  totalTransactions: number;
  averageSaleValue: number;
}

export interface DailySalesReport {
  _id: {
    year: number;
    month: number;
    day: number;
  };
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
}

export interface TopProduct {
  _id: string;
  productName: string;
  productSku: string;
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
}

// Expense Types
export interface Expense {
  id: string;
  expenseNumber: string;
  title: string;
  description?: string;
  category: 'office_supplies' | 'utilities' | 'rent' | 'marketing' | 'travel' | 'equipment' | 'maintenance' | 'professional_services' | 'insurance' | 'other';
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'INR';
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other';
  paymentStatus: 'pending' | 'paid' | 'reimbursed';
  vendor?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  expenseDate: string;
  receiptNumber?: string;
  receiptImage?: string;
  tags?: string[];
  notes?: string;
  company: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  title: string;
  description?: string;
  category: 'office_supplies' | 'utilities' | 'rent' | 'marketing' | 'travel' | 'equipment' | 'maintenance' | 'professional_services' | 'insurance' | 'other';
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'INR';
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other';
  paymentStatus: 'pending' | 'paid' | 'reimbursed';
  vendor?: string | null;
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  expenseDate: string;
  receiptNumber?: string;
  receiptImage?: string;
  tags?: string[];
  notes?: string;
}

export interface ExpenseFilters {
  search?: string;
  category?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ExpensesResponse {
  expenses: Expense[];
  pagination: PaginationInfo;
}

export interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  pendingExpenses: number;
  paidExpenses: number;
  reimbursedExpenses: number;
  averageAmount: number;
  categoryBreakdown: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  monthlyTrends: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
    totalAmount: number;
  }>;
}

// Credit Note Types
export interface CreditNoteItem {
  product?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreditNoteRedemption {
  id?: string;
  _id?: string;
  invoice?: {
    id: string;
    _id: string;
    invoiceNumber: string;
    total: number;
  };
  sale?: {
    id: string;
    _id: string;
    saleNumber: string;
    total: number;
  };
  amount: number;
  date: string;
  notes?: string;
}

export interface CreditNote {
  id: string;
  _id?: string;
  creditNoteNumber: string;
  company: string;
  customer: {
    id: string;
    _id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
    phone?: string;
    address?: Address;
  };
  originalInvoice?: {
    id: string;
    _id: string;
    invoiceNumber: string;
    total: number;
  };
  originalSale?: {
    id: string;
    _id: string;
    saleNumber: string;
    total: number;
  };
  sourceType: 'invoice' | 'sale';
  returnedItems: CreditNoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  creditAmount: number;
  usedAmount: number;
  remainingBalance: number;
  status: 'unused' | 'partially_used' | 'fully_used' | 'expired';
  returnReason?: string;
  redemptions: CreditNoteRedemption[];
  expiryDate?: string;
  notes?: string;
  createdBy: {
    id: string;
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreditNoteFormData {
  sourceType: 'invoice' | 'sale';
  sourceId: string;
  returnedItems: Array<{
    product?: string;
    productName: string;
    productSku?: string;
    quantity: number;
    unitPrice: number;
  }>;
  returnReason?: string;
  notes?: string;
}

export interface CreditNoteFilters {
  search?: string;
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreditNotesResponse {
  creditNotes: CreditNote[];
  pagination: PaginationInfo;
}

export interface CreditNoteStats {
  overview: {
    totalCreditNotes: number;
    totalCreditAmount: number;
    totalUsed: number;
    totalOutstanding: number;
  };
  statusBreakdown: {
    [key: string]: {
      count: number;
      amount: number;
      remaining: number;
    };
  };
}

export interface CustomerCreditBalance {
  balance: {
    totalCredit: number;
    totalUsed: number;
    remainingBalance: number;
  };
  availableCreditNotes: CreditNote[];
}

