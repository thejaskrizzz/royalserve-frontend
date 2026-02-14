// src/components/AppLayout.tsx
import React, { useState } from "react";
import { Box, Drawer, IconButton, useMediaQuery } from "@mui/material";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import MenuIcon from "@mui/icons-material/Menu";
import { COLORS } from "../theme/colors";

interface Props {
  children: React.ReactNode;
}

const SIDEBAR_WIDTH = 250;
const TOPNAV_HEIGHT = 70;

const AppLayout: React.FC<Props> = ({ children }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [openMobile, setOpenMobile] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: COLORS.background,
        color: COLORS.textPrimary,
      }}
    >
      {/* ----------- SIDEBAR (DESKTOP) ------------ */}
      {!isMobile && (
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            zIndex: 1200,
            borderRight: `1px solid ${COLORS.border}`,
            background: COLORS.surfaceAlt,
          }}
        >
          <Sidebar />
        </Box>
      )}

      {/* ----------- SIDEBAR (MOBILE DRAWER) ------------ */}
      {isMobile && (
        <Drawer
          open={openMobile}
          onClose={() => setOpenMobile(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: SIDEBAR_WIDTH,
              background: COLORS.surfaceAlt,
              borderRight: `1px solid ${COLORS.border}`,
            },
          }}
        >
          <Sidebar />
        </Drawer>
      )}

      {/* ----------- RIGHT SECTION ------------ */}
      <Box
        sx={{
          marginLeft: isMobile ? 0 : SIDEBAR_WIDTH,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* --------- TOP NAV --------- */}
        <Box
          sx={{
            height: TOPNAV_HEIGHT,
            position: "sticky",
            top: 0,
            zIndex: 1100,
            background: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            px: 2,
          }}
        >
          {/* HAMBURGER ONLY ON MOBILE */}
          {isMobile && (
            <IconButton
              onClick={() => setOpenMobile(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <TopNav />
        </Box>

        {/* --------- CONTENT --------- */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: { xs: 2, md: 4 },
            background: `
              linear-gradient(
                135deg,
                ${COLORS.background} 0%,
                ${COLORS.surface} 40%,
                ${COLORS.surfaceAlt} 100%
              )
            `,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
