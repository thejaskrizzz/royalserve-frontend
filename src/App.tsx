// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";

// NEW — uses COLORS.background instead of old gradients
import { COLORS } from "./theme/colors";

// MUI theme (keep your custom theme)
import futuristicTheme from "./theme/futuristicTheme";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import CustomersPage from "./pages/CustomersPage";
import QuotesPage from "./pages/QuotesPage";
import InvoicePage from "./pages/InvoicePage";
import InvoiceForm from "./pages/InvoiceForm";
import InvoiceView from "./pages/InvoiceView";
import CategoriesPage from "./pages/CategoriesPage";
import CategoryForm from "./components/CategoryForm";
import VendorsPage from "./pages/VendorsPage";
import VendorForm from "./components/VendorForm";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import PurchaseOrderForm from "./components/PurchaseOrderForm";
import ProductsPage from "./pages/ProductsPage";
import ProductForm from "./components/ProductForm";
import SalesPage from "./pages/SalesPage";
import SalesForm from "./components/SalesForm";
import ExpensesPage from "./pages/ExpensesPage";
import ExpenseForm from "./components/ExpenseForm";
import SettingsPage from "./pages/SettingsPage";
import TaxSettingsPage from "./pages/TaxSettingsPage";
import CompanyPage from "./pages/CompanyPage";
import StatementOfAccountPage from "./pages/StatementOfAccountPage";
import CreditNotesPage from "./pages/CreditNotesPage";
import CreditNoteView from "./pages/CreditNoteView";
import CreditNoteForm from "./components/CreditNoteForm";

import Layout from "./components/Layout";

// ---------------- ROUTE PROTECTION ----------------
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

// ---------------- MAIN APP CONTENT ----------------
const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* PROTECTED ROUTES */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomersPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/quotes"
        element={
          <ProtectedRoute>
            <Layout>
              <QuotesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <Layout>
              <InvoicePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/statement-of-account"
        element={
          <ProtectedRoute>
            <Layout>
              <StatementOfAccountPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices/new"
        element={
          <ProtectedRoute>
            <Layout>
              <InvoiceForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <InvoiceForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <InvoiceView />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/company"
        element={
          <ProtectedRoute>
            <Layout>
              <CompanyPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tax-settings"
        element={
          <ProtectedRoute>
            <Layout>
              <TaxSettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Layout>
              <CategoriesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories/new"
        element={
          <ProtectedRoute>
            <Layout>
              <CategoryForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <CategoryForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendors"
        element={
          <ProtectedRoute>
            <Layout>
              <VendorsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendors/new"
        element={
          <ProtectedRoute>
            <Layout>
              <VendorForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendors/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <VendorForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchase-orders"
        element={
          <ProtectedRoute>
            <Layout>
              <PurchaseOrdersPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchase-orders/new"
        element={
          <ProtectedRoute>
            <Layout>
              <PurchaseOrderForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchase-orders/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <PurchaseOrderForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchase-orders/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <PurchaseOrderForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products/new"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <Layout>
              <SalesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/new"
        element={
          <ProtectedRoute>
            <Layout>
              <SalesForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/credit-notes"
        element={
          <ProtectedRoute>
            <Layout>
              <CreditNotesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/credit-notes/new"
        element={
          <ProtectedRoute>
            <Layout>
              <CreditNoteForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/credit-notes/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <CreditNoteView />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Layout>
              <ExpensesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses/new"
        element={
          <ProtectedRoute>
            <Layout>
              <ExpenseForm mode="create" />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

// ---------------- ROOT APP ----------------
const App: React.FC = () => {
  return (
    <ThemeProvider theme={futuristicTheme}>
      <CssBaseline />

      {/* New global gradient */}
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          background: COLORS.background,
          backgroundAttachment: "fixed",
        }}
      >
        <Router>
          <AuthProvider>
            <CompanyProvider>
              <AppContent />
            </CompanyProvider>
          </AuthProvider>
        </Router>
      </div>
    </ThemeProvider>
  );
};

export default App;
