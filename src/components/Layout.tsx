// src/components/Layout.tsx
import React, { useState } from "react";
import { Box, Drawer, IconButton, useMediaQuery } from "@mui/material";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import MenuIcon from "@mui/icons-material/Menu";
import { COLORS } from "../theme/colors";

interface Props {
  children: React.ReactNode;
}

const SIDEBAR_WIDTH = 260;
const TOPNAV_HEIGHT = 70;

const Layout: React.FC<Props> = ({ children }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",                     // FIXED
        background: COLORS.background,
        overflow: "hidden",                  // ROOT can hide overflow
      }}
    >
      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            height: "100vh",
            background: COLORS.surfaceAlt,
            borderRight: `1px solid ${COLORS.border}`,
            flexShrink: 0,
            overflowY: "auto",               // Sidebar scrollable if needed
          }}
        >
          <Sidebar width={SIDEBAR_WIDTH} />
        </Box>
      )}

      {/* MOBILE SIDEBAR */}
      {isMobile && (
        <Drawer
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          PaperProps={{
            sx: {
              width: SIDEBAR_WIDTH,
              background: COLORS.surfaceAlt,
              borderRight: `1px solid ${COLORS.border}`,
            },
          }}
        >
          <Sidebar width={SIDEBAR_WIDTH} />
        </Drawer>
      )}

      {/* MAIN PANEL */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",                   // IMPORTANT
          overflow: "hidden",                // Panel itself hides overflow
        }}
      >
        {/* TOP NAV */}
        <Box
          sx={{
            height: TOPNAV_HEIGHT,
            background: COLORS.surfaceAlt,
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            px: 2,
            flexShrink: 0,
          }}
        >
          {isMobile && (
            <IconButton onClick={() => setOpenDrawer(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <TopNav />
        </Box>

        {/* SCROLLABLE CONTENT */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",                // THIS IS NOW ACTIVE
            p: { xs: 2, md: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
