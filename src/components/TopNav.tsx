// src/components/TopNav.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { COLORS } from "../theme/colors";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  height?: number;
}

const TopNav: React.FC<Props> = ({ height = 70 }) => {
  const { user, logout } = useAuth();

  // --- Dropdown state ---
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    logout(); // your AuthContext logout function
  };

  return (
    <Box
      sx={{
        width: "100%",
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 1.5, md: 3 },
        gap: 2,
        bgcolor: COLORS.surface,
        backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${COLORS.border}`,
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* LEFT */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: 16, md: 18 },
            color: COLORS.textPrimary,
            whiteSpace: "nowrap",
          }}
        >
          Dashboard
        </Typography>

        <Box
          sx={{
            ml: { xs: 1, md: 2 },
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: { xs: 1, md: 1.5 },
            py: { xs: 0.3, md: 0.6 },
            borderRadius: 2,
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${COLORS.border}`,
            minWidth: { xs: 140, sm: 200, md: 280 },
            flex: { xs: 1, md: 0 },
          }}
        >
          <SearchIcon sx={{ color: COLORS.textMuted, fontSize: { xs: 18, md: 20 } }} />

          <InputBase
            placeholder="Search customers, products..."
            sx={{
              ml: 1,
              color: COLORS.textMuted,
              fontSize: { xs: 12, md: 14 },
              width: "100%",
            }}
          />
        </Box>
      </Box>

      {/* RIGHT */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        <IconButton
          size="small"
          sx={{
            bgcolor: "transparent",
            color: COLORS.textMuted,
            border: `1px solid ${COLORS.border}`,
            mr: { xs: 0.5, md: 1 },
            width: { xs: 34, md: 38 },
            height: { xs: 34, md: 38 },
          }}
        >
          <NotificationsNoneIcon />
        </IconButton>

        {/* PROFILE DROPDOWN */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            sx={{
              fontSize: 14,
              color: COLORS.textMuted,
              display: { xs: "none", sm: "block" },
              whiteSpace: "nowrap",
            }}
          >
            {user?.firstName} {user?.lastName}
          </Typography>

          <Avatar
            onClick={handleAvatarClick}
            sx={{
              bgcolor: COLORS.accent,
              color: COLORS.background,
              width: { xs: 32, md: 36 },
              height: { xs: 32, md: 36 },
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: `0 6px 18px ${COLORS.accent}22`,
            }}
          >
            {user?.firstName?.[0] ?? "U"}
          </Avatar>

          {/* Menu */}
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 160,
                border: `1px solid ${COLORS.border}`,
                bgcolor: COLORS.surfaceAlt,
              },
            }}
          >
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
};

export default TopNav;
