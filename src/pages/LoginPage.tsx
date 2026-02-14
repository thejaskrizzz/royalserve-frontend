import React, { useState } from "react";
import {
  Container,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper,
} from "@mui/material";
import { Email, Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { COLORS } from "../theme/colors"; // IMPORTANT

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background: COLORS.background,
      }}
    >
      <Container maxWidth="xs">

        {/* Branding */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Box
            sx={{
              width: 90,
              height: 90,
              borderRadius: "18px",
              overflow: "hidden",
              mx: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: COLORS.surfaceAlt,
              backdropFilter: "blur(6px)",
              border: `1px solid ${COLORS.borderStrong}`,
              boxShadow: COLORS.glow,
            }}
          >
            <img
              src="/logo.png"
              alt="OptimoDesk Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: COLORS.textPrimary,
              mt: 2,
              letterSpacing: "-0.4px",
            }}
          >
            OptimoDesk
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: COLORS.textSecondary,
              mt: 0.5,
            }}
          >
            Sign in to continue
          </Typography>
        </Box>

        {/* Login Card */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: "18px",
            background: COLORS.surface,
            backdropFilter: "blur(14px)",
            border: `1px solid ${COLORS.borderStrong}`,
            boxShadow: COLORS.glow,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              textAlign: "center",
              mb: 3,
              color: COLORS.textPrimary,
            }}
          >
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

            {/* EMAIL */}
            <TextField
              label="Email Address"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              InputLabelProps={{ style: { color: COLORS.textMuted } }}
              inputProps={{ style: { color: COLORS.textPrimary } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: COLORS.accent }} />
                  </InputAdornment>
                ),
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.border,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.accent,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.accent,
                  },
                },
              }}
            />

            {/* PASSWORD */}
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              InputLabelProps={{ style: { color: COLORS.textMuted } }}
              inputProps={{ style: { color: COLORS.textPrimary } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: COLORS.accent }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <VisibilityOff sx={{ color: COLORS.accent }} />
                    ) : (
                      <Visibility sx={{ color: COLORS.accent }} />
                    )}
                  </IconButton>
                ),
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.border,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.accent,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: COLORS.accent,
                  },
                },
              }}
            />

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "1rem",
                color: COLORS.textPrimary,
                background: `linear-gradient(130deg, ${COLORS.accent}, ${COLORS.accentSecondary})`,
                boxShadow: COLORS.glowStrong,
              }}
            >
              {isLoading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Sign In"}
            </button>

            {/* REGISTER LINK */}
            {/* <Typography
              variant="body2"
              sx={{ textAlign: "center", mt: 2, color: COLORS.textSecondary }}
            >
              Don’t have an account?{" "}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  color: COLORS.accent,
                  fontWeight: 600,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Create one
              </Link>
            </Typography> */}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
