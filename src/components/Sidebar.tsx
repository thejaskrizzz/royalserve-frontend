// src/components/Sidebar.tsx
import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  Dashboard,
  People,
  Description,
  Receipt,
  Inventory,
  PointOfSale,
  ShoppingCart,
  Category,
  Storefront,
  AttachMoney,
  Business,
  Settings,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { COLORS } from "../theme/colors";

interface Props {
  width?: number;
}

const menu = [
  { label: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
  { label: "Customers", icon: <People />, path: "/customers" },
  { label: "Quotes", icon: <Description />, path: "/quotes" },
  { label: "Invoices", icon: <Receipt />, path: "/invoices" },
  { label: "Inventory", icon: <Inventory />, path: "/products" },
  { label: "Sales", icon: <PointOfSale />, path: "/sales" },
  { label: "Expenses", icon: <AttachMoney />, path: "/expenses" },
  { label: "Categories", icon: <Category />, path: "/categories" },
  { label: "Vendors", icon: <Storefront />, path: "/vendors" },
  { label: "Purchase Orders", icon: <ShoppingCart />, path: "/purchase-orders" },
  { label: "Company", icon: <Business />, path: "/company" },
  { label: "Settings", icon: <Settings />, path: "/settings" },
];

const Sidebar: React.FC<Props> = ({ width = 260 }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        width,
        height: "100%",          // FIXED (no extra scrolling layer)
        overflow: "hidden",      // FIXED (removes double scrollbar)
        p: 2,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: COLORS.surface,
        backdropFilter: "blur(22px)",
        borderRight: `1px solid ${COLORS.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >

      {/* BRAND */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1,
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="OptimoDesk Logo"
          sx={{
            width: 80,
            height: 80,
            objectFit: "contain",
          }}
        />

        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              color: COLORS.accent,
              fontSize: 18,
            }}
          >
            OptimoDesk
          </Typography>

          <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
            Inventory • Pro
          </Typography>
        </Box>
      </Box>

      {/* MENU — the only scrollable area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",   // ONLY scrollbar
          pr: 1,
        }}
      >
        <List disablePadding>
          {menu.map((item) => {
            const active = location.pathname === item.path;

            return (
              <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 1.5,
                    px: 2,
                    py: 1.1,
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    background: active
                      ? `linear-gradient(90deg, ${COLORS.accent}18, transparent)`
                      : "transparent",
                    borderLeft: active
                      ? `3px solid ${COLORS.accent}`
                      : "3px solid transparent",
                    transition: "all 160ms ease",

                    "&:hover": {
                      background: `linear-gradient(90deg, ${COLORS.accent}12, transparent)`,
                      transform: "translateX(6px)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: active ? COLORS.accent : COLORS.textMuted,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      sx: {
                        color: active ? COLORS.textPrimary : COLORS.textMuted,
                        fontWeight: active ? 700 : 500,
                        fontSize: 14,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* FOOTER */}
      <Box sx={{ pt: 1, mt: 1 }}>
        <Tooltip title="App version">
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
              v1.0.0
            </Typography>
            <Typography sx={{ fontSize: 12, color: COLORS.textMuted }}>
              © OptimoDesk
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Sidebar;
