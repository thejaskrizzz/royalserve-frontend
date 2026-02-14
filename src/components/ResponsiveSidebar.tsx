import React from "react";
import { Box, Drawer, useMediaQuery } from "@mui/material";
import Sidebar from "./Sidebar";
import { COLORS } from "../theme/colors";

interface Props {
  mobileOpen: boolean;
  onMobileClose: () => void;
  width?: number;
}

const ResponsiveSidebar: React.FC<Props> = ({
  mobileOpen,
  onMobileClose,
  width = 260,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const sharedStyles = {
    width,
    bgcolor: COLORS.surfaceAlt,
    borderRight: `1px solid ${COLORS.border}`,
    backdropFilter: "blur(22px)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    overflowY: "auto",
  };

  // ---------------- MOBILE ----------------
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            ...sharedStyles,
            boxShadow: "4px 0 22px rgba(0,0,0,0.45)",
          },
        }}
      >
        <Sidebar width={width} />
      </Drawer>
    );
  }

  // ---------------- DESKTOP ----------------
  return (
    <Box
      sx={{
        ...sharedStyles,
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        flexShrink: 0,
        zIndex: 1200,
      }}
    >
      <Sidebar width={width} />
    </Box>
  );
};

export default ResponsiveSidebar;
