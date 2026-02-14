import apiClient from './client';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile,
  ChangePasswordRequest,
  Customer,
  CustomerFormData,
  CustomerFilters,
  Quote,
  QuoteFormData,
  QuoteFilters,
  Company,
  CompanySettings,
  CustomerStats,
  QuoteStats,
  CompanyStats,
  PaginatedResponse,
  CustomersResponse,
  QuotesResponse,
  Invoice,
  InvoiceFormData,
  InvoicesResponse,
  InvoiceStats,
  Payment,
  SendQuoteResponse,
  SendInvoiceResponse,
  Category,
  CategoryFormData,
  CategoryFilters,
  CategoriesResponse,
  CategoryStats,
  Vendor,
  VendorFormData,
  VendorFilters,
  VendorsResponse,
  VendorStats,
  PurchaseOrder,
  PurchaseOrderFormData,
  PurchaseOrderFilters,
  PurchaseOrdersResponse,
  PurchaseOrderStats,
  Tax,
  CreateTaxRequest,
  UpdateTaxRequest,
  Product,
  ProductFormData,
  ProductFilters,
  ProductsResponse,
  Sale,
  SaleFormData,
  SaleFilters,
  SalesResponse,
  SaleStats,
  DailySalesReport,
  TopProduct,
  Expense,
  ExpenseFormData,
  ExpenseFilters,
  ExpensesResponse,
  ExpenseStats
} from '../types';

// Auth API
export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    apiClient.post('/auth/login', data),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    apiClient.post('/auth/register', data),

  getProfile: (): Promise<{ user: UserProfile }> =>
    apiClient.get('/auth/profile'),

  updateProfile: (data: Partial<UserProfile>): Promise<{ message: string; user: UserProfile }> =>
    apiClient.put('/auth/profile', data),

  changePassword: (data: ChangePasswordRequest): Promise<{ message: string }> =>
    apiClient.put('/auth/change-password', data),

  verifyToken: (): Promise<{ message: string; user: UserProfile }> =>
    apiClient.get('/auth/verify'),
};

// Customer API
export const customerApi = {
  getCustomers: async (filters?: CustomerFilters): Promise<CustomersResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/customers?${params.toString()}`) as any;
    
    // Transform _id to id for each customer
    const transformedCustomers = response.customers.map((customer: any) => ({
      ...customer,
      id: customer._id,
      createdBy: customer.createdBy ? {
        ...customer.createdBy,
        id: customer.createdBy._id
      } : undefined
    }));
    
    return {
      ...response,
      customers: transformedCustomers
    };
  },

  getCustomer: async (id: string): Promise<{ customer: Customer; recentQuotes: Quote[] }> => {
    const response = await apiClient.get(`/customers/${id}`) as any;
    
    // Transform _id to id for customer
    const transformedCustomer = {
      ...response.customer,
      id: response.customer._id,
      createdBy: response.customer.createdBy ? {
        ...response.customer.createdBy,
        id: response.customer.createdBy._id
      } : undefined
    };
    
    return {
      ...response,
      customer: transformedCustomer
    };
  },

  createCustomer: (data: CustomerFormData): Promise<{ message: string; customer: Customer }> =>
    apiClient.post('/customers', data),

  updateCustomer: (id: string, data: Partial<CustomerFormData>): Promise<{ message: string; customer: Customer }> =>
    apiClient.put(`/customers/${id}`, data),

  deleteCustomer: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/customers/${id}`),

  getCustomerStats: (id: string): Promise<CustomerStats> =>
    apiClient.get(`/customers/${id}/stats`),

  getAllTags: (): Promise<Array<{ _id: string; count: number }>> =>
    apiClient.get('/customers/tags/all'),
};

// Quote API
export const quoteApi = {
  getQuotes: async (filters?: QuoteFilters): Promise<QuotesResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/quotes?${params.toString()}`) as any;
    
    // Transform _id to id for each quote and nested objects
    const transformedQuotes = response.quotes.map((quote: any) => ({
      ...quote,
      id: quote._id,
      customer: quote.customer ? {
        ...quote.customer,
        id: quote.customer._id,
        createdBy: quote.customer.createdBy ? {
          ...quote.customer.createdBy,
          id: quote.customer.createdBy._id
        } : undefined
      } : undefined,
      createdBy: quote.createdBy ? {
        ...quote.createdBy,
        id: quote.createdBy._id
      } : undefined
    }));
    
    return {
      ...response,
      quotes: transformedQuotes
    };
  },

  getQuote: async (id: string): Promise<{ quote: Quote }> => {
    const response = await apiClient.get(`/quotes/${id}`) as any;
    
    // Transform _id to id for quote and nested objects
    const transformedQuote = {
      ...response.quote,
      id: response.quote._id,
      customer: response.quote.customer ? {
        ...response.quote.customer,
        id: response.quote.customer._id,
        createdBy: response.quote.customer.createdBy ? {
          ...response.quote.customer.createdBy,
          id: response.quote.customer.createdBy._id
        } : undefined
      } : undefined,
      createdBy: response.quote.createdBy ? {
        ...response.quote.createdBy,
        id: response.quote.createdBy._id
      } : undefined
    };
    
    return {
      ...response,
      quote: transformedQuote
    };
  },

  createQuote: (data: QuoteFormData): Promise<{ message: string; quote: Quote }> =>
    apiClient.post('/quotes', data),

  updateQuote: (id: string, data: Partial<QuoteFormData>): Promise<{ message: string; quote: Quote }> =>
    apiClient.put(`/quotes/${id}`, data),

  deleteQuote: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/quotes/${id}`),

  sendQuote: (id: string): Promise<SendQuoteResponse> =>
    apiClient.post(`/quotes/${id}/send`),

  acceptQuote: (id: string): Promise<{ message: string; quote: Quote }> =>
    apiClient.post(`/quotes/${id}/accept`),

  rejectQuote: (id: string, reason: string): Promise<{ message: string; quote: Quote }> =>
    apiClient.post(`/quotes/${id}/reject`, { reason }),

  duplicateQuote: (id: string): Promise<{ message: string; quote: Quote }> =>
    apiClient.post(`/quotes/${id}/duplicate`),

  getQuoteStats: (): Promise<QuoteStats> =>
    apiClient.get('/quotes/stats/overview'),

  generatePDF: (id: string, options: { signal?: AbortSignal } = {}): Promise<Blob> =>
    apiClient.get(`/quotes/${id}/pdf`, { 
      responseType: 'blob',
      timeout: 300000, // 5 minutes timeout
      signal: options.signal // Pass the AbortSignal to the request
    }),
};

// Company API
export const companyApi = {
  getCompany: async (): Promise<{ company: Company }> => {
    const response = await apiClient.get('/companies') as any;
    
    // Transform _id to id for company
    const transformedCompany = {
      ...response.company,
      id: response.company._id,
    };
    
    return {
      ...response,
      company: transformedCompany
    };
  },

  updateCompany: (data: Partial<Company>): Promise<{ message: string; company: Company }> =>
    apiClient.put('/companies', data),

  updateSettings: (data: Partial<CompanySettings>): Promise<{ message: string; settings: CompanySettings }> =>
    apiClient.put('/companies/settings', data),

  getUsers: (filters?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }): Promise<PaginatedResponse<UserProfile>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return apiClient.get(`/companies/users?${params.toString()}`);
  },

  addUser: (data: { firstName: string; lastName: string; email: string; password: string; role?: string }): Promise<{ message: string; user: UserProfile }> =>
    apiClient.post('/companies/users', data),

  updateUserRole: (userId: string, role: string): Promise<{ message: string; user: UserProfile }> =>
    apiClient.put(`/companies/users/${userId}/role`, { role }),

  deactivateUser: (userId: string): Promise<{ message: string; user: UserProfile }> =>
    apiClient.put(`/companies/users/${userId}/deactivate`),

  activateUser: (userId: string): Promise<{ message: string; user: UserProfile }> =>
    apiClient.put(`/companies/users/${userId}/activate`),

  getStats: (): Promise<CompanyStats> =>
    apiClient.get('/companies/stats'),
};

// Health check
export const healthApi = {
  check: (): Promise<{ status: string; message: string; timestamp: string }> =>
    apiClient.get('/health'),
};

// Export all APIs
export const invoiceApi = {
  getInvoices: async (filters: any = {}): Promise<InvoicesResponse> => {
    const response = await apiClient.get('/invoices', { params: filters }) as any;
    
    // Transform _id to id for each invoice
    const transformedInvoices = response.invoices.map((invoice: any) => ({
      ...invoice,
      id: invoice._id,
      customer: {
        ...invoice.customer,
        id: invoice.customer._id,
        createdBy: invoice.customer.createdBy ? {
          ...invoice.customer.createdBy,
          id: invoice.customer.createdBy._id
        } : undefined
      },
      createdBy: {
        ...invoice.createdBy,
        id: invoice.createdBy._id
      }
    }));
    
    return {
      ...response,
      invoices: transformedInvoices
    };
  },

  getInvoice: async (id: string): Promise<{ invoice: Invoice }> => {
    const response = await apiClient.get(`/invoices/${id}`) as any;
    
    // Transform _id to id for invoice
    const transformedInvoice = {
      ...response.invoice,
      id: response.invoice._id,
      customer: {
        ...response.invoice.customer,
        id: response.invoice.customer._id,
        createdBy: response.invoice.customer.createdBy ? {
          ...response.invoice.customer.createdBy,
          id: response.invoice.customer.createdBy._id
        } : undefined
      },
      createdBy: {
        ...response.invoice.createdBy,
        id: response.invoice.createdBy._id
      }
    };
    
    return {
      invoice: transformedInvoice
    };
  },

  createInvoice: async (invoiceData: InvoiceFormData): Promise<{ invoice: Invoice }> => {
    // Calculate subtotal and total before sending
    const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = (subtotal * invoiceData.taxRate) / 100;
    const total = subtotal + taxAmount;
    
    // Transform the data to match backend expectations
    const transformedData = {
      customer: invoiceData.customerId, // Backend expects 'customer', not 'customerId'
      title: invoiceData.title,
      description: invoiceData.description,
      items: invoiceData.items,
      tax: invoiceData.taxId || null,
      taxRate: invoiceData.taxRate,
      subtotal: subtotal,
      total: total,
      dueDate: invoiceData.dueDate,
      terms: invoiceData.terms,
      notes: invoiceData.notes,
      payments: invoiceData.payments || [],
      companySignature: invoiceData.companySignature,
      customerSignature: invoiceData.customerSignature
    };
    
    const response = await apiClient.post('/invoices', transformedData) as any;
    
    // Transform _id to id for invoice
    const transformedInvoice = {
      ...response.invoice,
      id: response.invoice._id,
      customer: {
        ...response.invoice.customer,
        id: response.invoice.customer._id,
        createdBy: response.invoice.customer.createdBy ? {
          ...response.invoice.customer.createdBy,
          id: response.invoice.customer.createdBy._id
        } : undefined
      },
      createdBy: {
        ...response.invoice.createdBy,
        id: response.invoice.createdBy._id
      }
    };
    
    return {
      invoice: transformedInvoice
    };
  },

  convertQuoteToInvoice: async (quoteId: string, dueDate?: string): Promise<{ invoice: Invoice }> => {
    const response = await apiClient.post(`/invoices/convert-from-quote/${quoteId}`, { dueDate }) as any;
    
    // Transform _id to id for invoice
    const transformedInvoice = {
      ...response.invoice,
      id: response.invoice._id,
      customer: {
        ...response.invoice.customer,
        id: response.invoice.customer._id,
        createdBy: response.invoice.customer.createdBy ? {
          ...response.invoice.customer.createdBy,
          id: response.invoice.customer.createdBy._id
        } : undefined
      },
      createdBy: {
        ...response.invoice.createdBy,
        id: response.invoice.createdBy._id
      }
    };
    
    return {
      invoice: transformedInvoice
    };
  },

  updateInvoice: async (id: string, invoiceData: Partial<InvoiceFormData>): Promise<{ invoice: Invoice }> => {
    // Calculate subtotal and total if items are provided
    let transformedData: any = { ...invoiceData };
    
    if (invoiceData.items) {
      const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxRate = invoiceData.taxRate || 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount;
      
      transformedData = {
        ...transformedData,
        subtotal: subtotal,
        total: total,
        taxAmount: taxAmount
      };
    }
    
    // Transform customerId to customer if provided
    if (invoiceData.customerId) {
      transformedData.customer = invoiceData.customerId;
      delete transformedData.customerId;
    }
    
    // Transform taxId to tax if provided
    if (invoiceData.taxId !== undefined) {
      transformedData.tax = invoiceData.taxId || null;
      delete transformedData.taxId;
    }
    
    const response = await apiClient.put(`/invoices/${id}`, transformedData) as any;
    
    // Transform _id to id for invoice
    const transformedInvoice = {
      ...response.invoice,
      id: response.invoice._id,
      customer: {
        ...response.invoice.customer,
        id: response.invoice.customer._id,
        createdBy: response.invoice.customer.createdBy ? {
          ...response.invoice.customer.createdBy,
          id: response.invoice.customer.createdBy._id
        } : undefined
      },
      createdBy: {
        ...response.invoice.createdBy,
        id: response.invoice.createdBy._id
      }
    };
    
    return {
      invoice: transformedInvoice
    };
  },

  updateInvoiceStatus: async (id: string, status: string): Promise<{ invoice: Invoice }> => {
    const response = await apiClient.patch(`/invoices/${id}/status`, { status }) as any;
    
    // Transform _id to id for invoice
    const transformedInvoice = {
      ...response.invoice,
      id: response.invoice._id,
      customer: {
        ...response.invoice.customer,
        id: response.invoice.customer._id,
        createdBy: response.invoice.customer.createdBy ? {
          ...response.invoice.customer.createdBy,
          id: response.invoice.customer.createdBy._id
        } : undefined
      },
      createdBy: {
        ...response.invoice.createdBy,
        id: response.invoice.createdBy._id
      }
    };
    
    return {
      invoice: transformedInvoice
    };
  },

  addPayment: async (id: string, paymentData: Payment): Promise<{ invoice: Invoice }> => {
    const response = await apiClient.post(`/invoices/${id}/payments`, paymentData) as any;
    
    // Transform _id to id for invoice
    const transformedInvoice = {
      ...response.invoice,
      id: response.invoice._id,
      customer: {
        ...response.invoice.customer,
        id: response.invoice.customer._id,
        createdBy: response.invoice.customer.createdBy ? {
          ...response.invoice.customer.createdBy,
          id: response.invoice.customer.createdBy._id
        } : undefined
      },
      createdBy: {
        ...response.invoice.createdBy,
        id: response.invoice.createdBy._id
      }
    };
    
    return {
      invoice: transformedInvoice
    };
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  generatePDF: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
      timeout: 60000 // 60 seconds timeout for PDF generation
    }) as Blob;
    return response;
  },

  getStats: async (): Promise<InvoiceStats> => {
    const response = await apiClient.get('/invoices/stats/overview') as any;
    return response;
  },

  sendInvoice: (id: string): Promise<SendInvoiceResponse> =>
    apiClient.post(`/invoices/${id}/send`),
};

// Vendor API
export const categoryApi = {
  getCategories: async (filters?: CategoryFilters): Promise<CategoriesResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/categories?${queryString}` : '/categories';
    const response = await apiClient.get(url) as any;
    
    // Transform _id to id for each category
    const transformedCategories = response.categories.map((category: any) => ({
      ...category,
      id: category._id,
      parentCategory: category.parentCategory ? {
        ...category.parentCategory,
        id: category.parentCategory._id
      } : undefined,
      createdBy: category.createdBy ? {
        ...category.createdBy,
        id: category.createdBy._id
      } : undefined
    }));
    
    return {
      ...response,
      categories: transformedCategories
    };
  },
  getCategory: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`) as any;
    return {
      ...response,
      id: response._id,
      parentCategory: response.parentCategory ? {
        ...response.parentCategory,
        id: response.parentCategory._id
      } : undefined,
      createdBy: response.createdBy ? {
        ...response.createdBy,
        id: response.createdBy._id
      } : undefined
    };
  },
  getCategoryTree: (): Promise<Category[]> => apiClient.get('/categories/tree'),
  createCategory: (data: CategoryFormData): Promise<{ message: string; category: Category }> => apiClient.post('/categories', data),
  updateCategory: (id: string, data: Partial<CategoryFormData>): Promise<{ message: string; category: Category }> => apiClient.put(`/categories/${id}`, data),
  deleteCategory: (id: string): Promise<{ message: string }> => apiClient.delete(`/categories/${id}`),
  getStats: (): Promise<CategoryStats> => apiClient.get('/categories/stats/overview'),
  bulkUpdate: (categoryIds: string[], updateData: Partial<CategoryFormData>): Promise<{ message: string; modifiedCount: number }> => apiClient.patch('/categories/bulk-update', { categoryIds, updateData }),
};

export const vendorApi = {
  getVendors: async (filters: VendorFilters = {}, page: number = 1, limit: number = 10): Promise<VendorsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    // Add pagination parameters
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await apiClient.get(`/vendors?${params.toString()}`) as any;
    
    // Transform _id to id for vendors and nested objects
    const transformedVendors = response.vendors.map((vendor: any) => ({
      ...vendor,
      id: vendor._id,
      createdBy: vendor.createdBy ? {
        ...vendor.createdBy,
        id: vendor.createdBy._id
      } : vendor.createdBy
    }));
    
    return {
      vendors: transformedVendors,
      pagination: response.pagination
    };
  },

  getVendor: async (id: string): Promise<Vendor> => {
    const response = await apiClient.get(`/vendors/${id}`) as any;
    return {
      ...response,
      id: response._id,
      createdBy: response.createdBy ? {
        ...response.createdBy,
        id: response.createdBy._id
      } : response.createdBy
    };
  },

  createVendor: (data: VendorFormData): Promise<{ message: string; vendor: Vendor }> =>
    apiClient.post('/vendors', data),

  updateVendor: (id: string, data: Partial<VendorFormData>): Promise<{ message: string; vendor: Vendor }> =>
    apiClient.put(`/vendors/${id}`, data),

  deleteVendor: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/vendors/${id}`),

  getStats: async (): Promise<VendorStats> => {
    const response = await apiClient.get('/vendors/stats/overview') as any;
    return response;
  },

  getTags: async (): Promise<{ tags: string[] }> => {
    const response = await apiClient.get('/vendors/tags/list') as any;
    return response;
  }
};

// Tax API
export const taxApi = {
  getTaxes: (): Promise<Tax[]> =>
    apiClient.get('/taxes'),

  createTax: (data: CreateTaxRequest): Promise<Tax> =>
    apiClient.post('/taxes', data),

  updateTax: (id: string, data: UpdateTaxRequest): Promise<Tax> =>
    apiClient.put(`/taxes/${id}`, data),

  deleteTax: (id: string): Promise<void> =>
    apiClient.delete(`/taxes/${id}`),
};

// Image API
export const imageApi = {
  uploadImage: (file: File): Promise<{ imageUrl: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteImage: (publicId: string): Promise<void> =>
    apiClient.delete(`/images/delete/${publicId}`),
};

// Purchase Order API
export const purchaseOrderApi = {
  getPurchaseOrders: async (filters: PurchaseOrderFilters = {}, page: number = 1, limit: number = 10): Promise<PurchaseOrdersResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    // Add pagination parameters
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await apiClient.get(`/purchase-orders?${params.toString()}`) as any;
    
    // Transform _id to id for purchase orders and nested objects
    const transformedPOs = response.purchaseOrders.map((po: any) => ({
      ...po,
      id: po._id,
      vendor: po.vendor ? {
        ...po.vendor,
        id: po.vendor._id
      } : po.vendor,
      client: po.client ? {
        ...po.client,
        id: po.client._id
      } : po.client,
      createdBy: po.createdBy ? {
        ...po.createdBy,
        id: po.createdBy._id
      } : po.createdBy,
      approvedBy: po.approvedBy // Now just a string, no transformation needed
    }));
    
    return {
      purchaseOrders: transformedPOs,
      pagination: response.pagination
    };
  },

  getPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get(`/purchase-orders/${id}`) as any;
    return {
      ...response,
      id: response._id,
      vendor: response.vendor ? {
        ...response.vendor,
        id: response.vendor._id
      } : response.vendor,
      client: response.client ? {
        ...response.client,
        id: response.client._id
      } : response.client,
      createdBy: response.createdBy ? {
        ...response.createdBy,
        id: response.createdBy._id
      } : response.createdBy,
      approvedBy: response.approvedBy // Now just a string, no transformation needed
    };
  },

  createPurchaseOrder: (data: PurchaseOrderFormData): Promise<{ message: string; purchaseOrder: PurchaseOrder }> =>
    apiClient.post('/purchase-orders', data),

  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrderFormData>): Promise<{ message: string; purchaseOrder: PurchaseOrder }> =>
    apiClient.put(`/purchase-orders/${id}`, data),

  deletePurchaseOrder: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/purchase-orders/${id}`),

  sendPurchaseOrder: (id: string): Promise<{ message: string; purchaseOrder: PurchaseOrder }> =>
    apiClient.post(`/purchase-orders/${id}/send`),

  confirmPurchaseOrder: (id: string): Promise<{ message: string; purchaseOrder: PurchaseOrder }> =>
    apiClient.post(`/purchase-orders/${id}/confirm`),

  completePurchaseOrder: (id: string): Promise<{ message: string; purchaseOrder: PurchaseOrder }> =>
    apiClient.post(`/purchase-orders/${id}/complete`),

  getStats: async (): Promise<PurchaseOrderStats> => {
    const response = await apiClient.get('/purchase-orders/stats/overview') as any;
    return response;
  },

  generatePDF: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/purchase-orders/${id}/pdf`, { 
      responseType: 'blob',
      timeout: 60000 // 60 seconds timeout for PDF generation
    }) as Blob;
    return response;
  }
};

// Product API
export const productApi = {
  getProducts: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/products?${params.toString()}`) as any;
    
    // Transform _id to id for each product
    const transformedProducts = response.products.map((product: any) => ({
      ...product,
      id: product._id,
      supplier: product.supplier ? {
        ...product.supplier,
        id: product.supplier._id
      } : undefined,
      createdBy: product.createdBy ? {
        ...product.createdBy,
        id: product.createdBy._id
      } : undefined
    }));
    
    return {
      ...response,
      products: transformedProducts
    };
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`) as any;
    
    // Transform _id to id for product
    const transformedProduct = {
      ...response,
      id: response._id,
      supplier: response.supplier ? {
        ...response.supplier,
        id: response.supplier._id
      } : undefined,
      createdBy: response.createdBy ? {
        ...response.createdBy,
        id: response.createdBy._id
      } : undefined
    };
    
    return transformedProduct;
  },

  createProduct: (data: ProductFormData): Promise<{ message: string; product: Product }> =>
    apiClient.post('/products', data),

  updateProduct: (id: string, data: Partial<ProductFormData>): Promise<{ message: string; product: Product }> =>
    apiClient.put(`/products/${id}`, data),

  deleteProduct: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/products/${id}`),

  updateStock: (id: string, quantity: number, operation: 'add' | 'subtract' | 'set' = 'set'): Promise<Product> =>
    apiClient.patch(`/products/${id}/stock`, { quantity, operation }),

  getCategories: (): Promise<string[]> =>
    apiClient.get('/products/categories/list'),

  getLowStockProducts: (): Promise<Product[]> =>
    apiClient.get('/products/alerts/low-stock'),

  getOutOfStockProducts: (): Promise<Product[]> =>
    apiClient.get('/products/alerts/out-of-stock'),

  bulkUpdate: (productIds: string[], updateData: Partial<ProductFormData>): Promise<{ message: string; modifiedCount: number }> =>
    apiClient.patch('/products/bulk-update', { productIds, updateData }),
};

// Sales API
export const salesApi = {
  getSales: async (filters?: SaleFilters): Promise<SalesResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/sales?${params.toString()}`) as any;
    
    // Transform _id to id for each sale
    const transformedSales = response.sales.map((sale: any) => ({
      ...sale,
      id: sale._id,
      customer: sale.customer ? {
        ...sale.customer,
        id: sale.customer._id
      } : undefined,
      createdBy: sale.createdBy ? {
        ...sale.createdBy,
        id: sale.createdBy._id
      } : undefined
    }));
    
    return {
      ...response,
      sales: transformedSales
    };
  },

  getSale: async (id: string): Promise<Sale> => {
    const response = await apiClient.get(`/sales/${id}`) as any;
    
    // Transform _id to id for sale
    const transformedSale = {
      ...response,
      id: response._id,
      customer: response.customer ? {
        ...response.customer,
        id: response.customer._id
      } : undefined,
      createdBy: response.createdBy ? {
        ...response.createdBy,
        id: response.createdBy._id
      } : undefined
    };
    
    return transformedSale;
  },

  createSale: (data: SaleFormData): Promise<{ message: string; sale: Sale }> =>
    apiClient.post('/sales', data),

  updateSale: (id: string, data: Partial<SaleFormData>): Promise<{ message: string; sale: Sale }> =>
    apiClient.put(`/sales/${id}`, data),

  deleteSale: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/sales/${id}`),

  createReturn: (id: string, data: SaleFormData): Promise<{ message: string; sale: Sale }> =>
    apiClient.post(`/sales/${id}/return`, data),

  getStats: (startDate?: string, endDate?: string): Promise<SaleStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/sales/stats/overview?${params.toString()}`);
  },

  getDailyReport: (startDate?: string, endDate?: string): Promise<DailySalesReport[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/sales/reports/daily?${params.toString()}`);
  },

  getTopProducts: (startDate?: string, endDate?: string, limit?: number): Promise<TopProduct[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());
    return apiClient.get(`/sales/reports/top-products?${params.toString()}`);
  },

  generateDeliveryOrderPDF: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/sales/${id}/delivery-order`, {
      responseType: 'blob',
      timeout: 60000
    }) as Blob;
    return response;
  },
};

// Expense API
export const expenseApi = {
  getExpenses: async (filters?: ExpenseFilters): Promise<ExpensesResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/expenses?${params.toString()}`) as any;
    
    // Transform _id to id for each expense
    const transformedExpenses = response.expenses.map((expense: any) => ({
      ...expense,
      id: expense._id,
      vendor: expense.vendor ? {
        ...expense.vendor,
        id: expense.vendor._id
      } : undefined,
      createdBy: expense.createdBy ? {
        ...expense.createdBy,
        id: expense.createdBy._id
      } : undefined,
      approvedBy: expense.approvedBy ? {
        ...expense.approvedBy,
        id: expense.approvedBy._id
      } : undefined
    }));
    
    return {
      ...response,
      expenses: transformedExpenses
    };
  },

  getExpense: async (id: string): Promise<Expense> => {
    const response = await apiClient.get(`/expenses/${id}`) as any;
    
    // Transform _id to id for expense
    const transformedExpense = {
      ...response,
      id: response._id,
      vendor: response.vendor ? {
        ...response.vendor,
        id: response.vendor._id
      } : undefined,
      createdBy: response.createdBy ? {
        ...response.createdBy,
        id: response.createdBy._id
      } : undefined,
      approvedBy: response.approvedBy ? {
        ...response.approvedBy,
        id: response.approvedBy._id
      } : undefined
    };
    
    return transformedExpense;
  },

  createExpense: (data: ExpenseFormData): Promise<{ message: string; expense: Expense }> =>
    apiClient.post('/expenses', data),

  updateExpense: (id: string, data: Partial<ExpenseFormData>): Promise<{ message: string; expense: Expense }> =>
    apiClient.put(`/expenses/${id}`, data),

  deleteExpense: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/expenses/${id}`),

  approveExpense: (id: string): Promise<{ message: string; expense: Expense }> =>
    apiClient.patch(`/expenses/${id}/approve`),

  getStats: (startDate?: string, endDate?: string): Promise<ExpenseStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/expenses/stats?${params.toString()}`);
  },
};

const api = {
  auth: authApi,
  customers: customerApi,
  quotes: quoteApi,
  company: companyApi,
  invoices: invoiceApi,
  categories: categoryApi,
  vendors: vendorApi,
  purchaseOrders: purchaseOrderApi,
  products: productApi,
  sales: salesApi,
  expenses: expenseApi,
  health: healthApi,
};

export default api;
