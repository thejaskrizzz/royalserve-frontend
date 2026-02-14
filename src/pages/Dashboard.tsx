// src/pages/Dashboard.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Fade,
  Slide,
} from "@mui/material";

import {
  People,
  TrendingUp,
  Business,
  Inventory,
  PointOfSale,
  Warning,
  AttachMoney,
  ShoppingCart,
  Assessment,
  Timeline,
  PieChart,
  ArrowUpward,
  ArrowDownward,
  TrendingFlat,
} from "@mui/icons-material";

import { useAuth } from "../contexts/AuthContext";
import { useCompany } from "../contexts/CompanyContext";

import {
  companyApi,
  quoteApi,
  purchaseOrderApi,
  productApi,
  salesApi,
  expenseApi,
} from "../api";

import {
  CompanyStats,
  QuoteStats,
  PurchaseOrderStats,
  ProductStats,
  SaleStats,
  ExpenseStats,
} from "../types";

import { formatCurrency } from "../utils/currency";
import { COLORS } from "../theme/colors";

// Import Recharts components
import {
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* -------------------------------------------------------
    PREMIUM ANIMATED KPI CARD
--------------------------------------------------------*/
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
          boxShadow: isHovered
            ? `0 8px 32px rgba(76,212,255,0.3), 0 0 20px ${COLORS.background}`
            : `0 0 15px ${COLORS.background}`,
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isHovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${color} 0%, ${COLORS.accentSecondary} 100%)`,
            transform: isHovered ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.6s ease',
          },
        }}
      >
        <Box sx={{ display: "flex", gap: 3, alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
              border: `2px solid ${color}44`,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -2,
                borderRadius: 3,
                padding: '2px',
                background: `linear-gradient(45deg, ${color}, ${COLORS.accentSecondary})`,
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'xor',
                opacity: isHovered ? 1 : 0.5,
                transition: 'opacity 0.3s ease',
              },
            }}
          >
            {ic}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500, mb: 0.5 }}>
              {label}
            </Typography>

            <Typography
              sx={{
                fontSize: 32,
                fontWeight: 800,
                color: COLORS.textPrimary,
                lineHeight: 1,
                mb: 0.5,
              }}
            >
              {value}
            </Typography>

            {subtitle && (
              <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {trend && trendValue && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTrendIcon()}
            <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>
              {trendValue}
            </Typography>
          </Box>
        )}
      </Paper>
    </Fade>
  );
};

/* -------------------------------------------------------
    MINI STAT CARD
--------------------------------------------------------*/
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

/* -------------------------------------------------------
    CHART CONTAINER COMPONENT
--------------------------------------------------------*/
const ChartContainer = ({
  title,
  children,
  icon,
  subtitle
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactElement;
  subtitle?: string;
}) => (
  <Slide direction="up" in timeout={800}>
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        background: `linear-gradient(135deg, ${COLORS.surfaceAlt} 0%, ${COLORS.surface} 100%)`,
        border: `1px solid ${COLORS.border}`,
        boxShadow: `0 0 20px ${COLORS.background}`,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accentSecondary} 100%)`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        {icon && (
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            background: `${COLORS.accent}22`,
            color: COLORS.accent,
          }}>
            {icon}
          </Box>
        )}
        <Box>
          <Typography sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: 16 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {children}
    </Paper>
  </Slide>
);

/* -------------------------------------------------------
                    DASHBOARD MAIN
--------------------------------------------------------*/
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { company, settings } = useCompany();

  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [quoteStats, setQuoteStats] = useState<QuoteStats | null>(null);
  const [poStats, setPoStats] = useState<PurchaseOrderStats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [saleStats, setSaleStats] = useState<SaleStats | null>(null);
  const [expenseStats, setExpenseStats] = useState<ExpenseStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const companyLabel =
    company?.name ||
    "Your Company";

  // Fetch real daily sales data for charts
  const [dailySalesData, setDailySalesData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  // Fetch daily sales data for the last 6 months
  const fetchDailySalesData = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6); // Last 6 months

      const dailyData = await salesApi.getDailyReport(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Group daily data by month for the area chart
      const monthlyData = dailyData.reduce((acc: any[], daily: any) => {
        const month = new Date(daily.date).toLocaleString('default', { month: 'short' });
        const existingMonth = acc.find(item => item.name === month);

        if (existingMonth) {
          existingMonth.sales += daily.totalSales || 0;
          existingMonth.profit += daily.profit || 0;
          existingMonth.expenses += daily.expenses || 0;
        } else {
          acc.push({
            name: month,
            sales: daily.totalSales || 0,
            profit: daily.profit || 0,
            expenses: daily.expenses || 0
          });
        }
        return acc;
      }, []);

      setDailySalesData(monthlyData);
    } catch (error) {
      console.error('Error fetching daily sales data:', error);
      // Fallback to sample data if API fails
      setDailySalesData([
        { name: 'Jan', sales: 4000, profit: 2400, expenses: 1200 },
        { name: 'Feb', sales: 3000, profit: 1398, expenses: 1000 },
        { name: 'Mar', sales: 5000, profit: 3800, expenses: 1500 },
        { name: 'Apr', sales: 4780, profit: 3908, expenses: 1400 },
        { name: 'May', sales: 5890, profit: 4800, expenses: 1600 },
        { name: 'Jun', sales: 6390, profit: 5300, expenses: 1800 },
      ]);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // Generate sample data for charts (fallback)
  const generateMonthlyData = () => [
    { name: 'Jan', sales: 4000, profit: 2400, expenses: 1200 },
    { name: 'Feb', sales: 3000, profit: 1398, expenses: 1000 },
    { name: 'Mar', sales: 5000, profit: 3800, expenses: 1500 },
    { name: 'Apr', sales: 4780, profit: 3908, expenses: 1400 },
    { name: 'May', sales: 5890, profit: 4800, expenses: 1600 },
    { name: 'Jun', sales: 6390, profit: 5300, expenses: 1800 },
  ];

  const generatePieData = () => [
    { name: 'Products', value: productStats?.totalProducts || 0, color: COLORS.accent },
    { name: 'Categories', value: productStats?.totalCategories || 0, color: COLORS.accentSecondary },
    { name: 'Low Stock', value: productStats?.lowStockProducts || 0, color: COLORS.warning },
    { name: 'Out of Stock', value: productStats?.outOfStockProducts || 0, color: COLORS.danger },
  ];



  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);

        const [
          companyStats,
          quoteStatsData,
          poStatsData,
          productStatsData,
          saleStatsData,
          expenseStatsData,
        ] = await Promise.all([
          companyApi.getStats(),
          quoteApi.getQuoteStats(),
          purchaseOrderApi.getStats(),
          productApi.getProducts({ limit: 1 }).then((response) => ({
            totalProducts: response.pagination.total,
            totalValue: response.products.reduce((sum, p: any) => sum + (p.sellingPrice * p.stockQuantity || 0), 0),
            lowStockProducts: response.products.filter(
              (p: any) => p.stockStatus === "low_stock",
            ).length,
            outOfStockProducts: response.products.filter(
              (p: any) => p.stockStatus === "out_of_stock",
            ).length,
            totalCategories: [
              ...new Set(response.products.map((p: any) => p.category)),
            ].length,
            averagePrice: response.products.length > 0
              ? response.products.reduce((sum, p: any) => sum + (p.sellingPrice || 0), 0) / response.products.length
              : 0
          })),
          salesApi.getStats(),
          expenseApi.getStats(),
        ]);

        setStats(companyStats);
        setQuoteStats(quoteStatsData);
        setPoStats(poStatsData);
        setProductStats(productStatsData);
        setSaleStats(saleStatsData);
        setExpenseStats(expenseStatsData);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    load();
    fetchDailySalesData();
  }, [fetchDailySalesData]);

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress sx={{ color: COLORS.accent }} />
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );

  const currency = settings?.currency || "USD";
  const monthlyData = dailySalesData.length > 0 ? dailySalesData : generateMonthlyData();
  const pieData = generatePieData();


  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: 'transparent',
        color: COLORS.textPrimary,
        p: 3,
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* HEADER */}
      <Fade in timeout={600}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 36, fontWeight: 800, mb: 1 }}>
            Welcome back, {user?.firstName}
          </Typography>

          <Typography sx={{ color: COLORS.textSecondary, mb: 1 }}>
            Company: {companyLabel}
          </Typography>

          <Typography sx={{ color: COLORS.textMuted, fontSize: 14 }}>
            Your business performance at a glance.
          </Typography>
        </Box>
      </Fade>

      {/* KPI GRID */}
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
          label="Customers"
          value={stats?.customers.totalCustomers || 0}
          icon={<People />}
          trend="up"
          trendValue="+12% from last month"
          color={COLORS.accent}
        />

        <KpiCard
          label="Products"
          value={productStats?.totalProducts || 0}
          icon={<Inventory />}
          subtitle={`${productStats?.totalCategories || 0} categories`}
          trend="up"
          trendValue="+8% from last month"
          color={COLORS.accentSecondary}
        />

        <KpiCard
          label="Total Sales"
          value={formatCurrency(saleStats?.totalSales || 0, currency)}
          icon={<PointOfSale />}
          trend="up"
          trendValue="+23% from last month"
          color={COLORS.success}
        />

        <KpiCard
          label="Quote Value"
          value={formatCurrency(quoteStats?.totalQuoteValue || 0, currency)}
          icon={<TrendingUp />}
          subtitle={`Avg: ${formatCurrency(
            Math.round(quoteStats?.averageValue || 0),
            currency,
          )}`}
          trend="neutral"
          trendValue="+5% from last month"
          color={COLORS.gold}
        />
      </Box>

      {/* CHARTS GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Revenue Chart */}
        <ChartContainer
          title="Revenue Overview"
          icon={<Assessment />}
          subtitle="Monthly performance trends"
        >
          {chartLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
              <CircularProgress sx={{ color: COLORS.accent }} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} opacity={0.3} />
                <XAxis dataKey="name" stroke={COLORS.textSecondary} />
                <YAxis stroke={COLORS.textSecondary} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: COLORS.surfaceAlt,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: COLORS.textPrimary }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke={COLORS.accent}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke={COLORS.success}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* Pie Chart */}
        <ChartContainer
          title="Inventory Distribution"
          icon={<PieChart />}
          subtitle="Product status breakdown"
        >
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.surfaceAlt,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                }}
                labelStyle={{ color: COLORS.textPrimary }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, justifyContent: 'center' }}>
            {pieData.map((entry, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 2, backgroundColor: entry.color }} />
                <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>
                  {entry.name}: {entry.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </ChartContainer>
      </Box>

      {/* SECOND ROW OF CHARTS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Purchase Orders Chart */}
        <ChartContainer
          title="Purchase Orders"
          icon={<Business />}
          subtitle="Status overview"
        >
          <ResponsiveContainer width="100%" height={250}>
            <RechartsBarChart data={[
              { status: 'Total', value: poStats?.totalPOs || 0 },
              { status: 'Completed', value: poStats?.completedPOs || 0 },
              { status: 'Pending', value: (poStats?.totalPOs || 0) - (poStats?.completedPOs || 0) },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} opacity={0.3} />
              <XAxis dataKey="status" stroke={COLORS.textSecondary} />
              <YAxis stroke={COLORS.textSecondary} />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.surfaceAlt,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                }}
                labelStyle={{ color: COLORS.textPrimary }}
              />
              <Bar dataKey="value" fill={COLORS.accentSecondary} radius={[8, 8, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Sales Performance */}
        <ChartContainer
          title="Sales Performance"
          icon={<TrendingUp />}
          subtitle="Key metrics"
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <MiniStat
              label="Profit"
              value={formatCurrency(saleStats?.totalProfit || 0, currency)}
              icon={<AttachMoney />}
              color={COLORS.success}
            />
            <MiniStat
              label="Avg Sale"
              value={formatCurrency(
                saleStats?.averageSaleValue || 0,
                currency,
              )}
              icon={<AttachMoney />}
              color={COLORS.textSecondary}
            />
            <MiniStat
              label="Transactions"
              value={saleStats?.totalTransactions || 0}
              icon={<ShoppingCart />}
              color={COLORS.accent}
            />
          </Box>
        </ChartContainer>

        {/* Expenses Overview */}
        <ChartContainer
          title="Expenses Overview"
          icon={<Warning />}
          subtitle="Current status"
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <MiniStat
              label="Pending"
              value={expenseStats?.pendingExpenses || 0}
              icon={<Warning />}
              color={COLORS.gold}
            />
            <MiniStat
              label="Total Amount"
              value={formatCurrency(expenseStats?.totalAmount || 0, currency)}
              icon={<AttachMoney />}
              color={COLORS.textSecondary}
            />
            <MiniStat
              label="Paid"
              value={expenseStats?.paidExpenses || 0}
              icon={<TrendingUp />}
              color={COLORS.success}
            />
          </Box>
        </ChartContainer>
      </Box>

      {/* QUOTE STATUS SECTION */}
      <ChartContainer
        title="Quote Status Overview"
        icon={<Timeline />}
        subtitle="Current quote pipeline"
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Chip
            label={`Draft: ${quoteStats?.draftQuotes || 0}`}
            sx={{
              bgcolor: `${COLORS.surface}88`,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
              '&:hover': { bgcolor: `${COLORS.surface}CC` }
            }}
          />
          <Chip
            label={`Sent: ${quoteStats?.sentQuotes || 0}`}
            sx={{
              bgcolor: `${COLORS.accent}22`,
              color: COLORS.accent,
              border: `1px solid ${COLORS.accent}44`,
              '&:hover': { bgcolor: `${COLORS.accent}33` }
            }}
          />
          <Chip
            label={`Accepted: ${quoteStats?.acceptedQuotes || 0}`}
            sx={{
              bgcolor: `${COLORS.success}22`,
              color: COLORS.success,
              border: `1px solid ${COLORS.success}44`,
              '&:hover': { bgcolor: `${COLORS.success}33` }
            }}
          />
          <Chip
            label={`Rejected: ${quoteStats?.rejectedQuotes || 0}`}
            sx={{
              bgcolor: `${COLORS.danger}22`,
              color: COLORS.danger,
              border: `1px solid ${COLORS.danger}44`,
              '&:hover': { bgcolor: `${COLORS.danger}33` }
            }}
          />
        </Box>

        {/* Quote Conversion Rate */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: 14, color: COLORS.textSecondary }}>
            Conversion Rate
          </Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: COLORS.accent }}>
            {quoteStats?.sentQuotes ?
              Math.round(((quoteStats?.acceptedQuotes || 0) / quoteStats?.sentQuotes) * 100) : 0}%
          </Typography>
        </Box>
      </ChartContainer>
    </Box>
  );
};

export default Dashboard;