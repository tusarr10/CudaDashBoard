// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link, useNavigate } from 'react-router-dom';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { jwtDecode } from "jwt-decode";

// Components
import Login from './login.js';
import NodeList from './NodeList';
import NodeDashboard from './components/NodeDashboard';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel/AdminPanel'; // ✅ Correct path
import { setLogoutHandler } from './api';

const CENTRAL_API_URL = process.env.REACT_APP_CENTRAL_API_URL;

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

function MainApp() {
  const [token, setToken] = useState(localStorage.getItem("authToken") || "");
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole") || "");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    setToken("");
    setUserRole("");
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    setLogoutHandler(handleLogout);

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUsername(decodedToken.username);
        // Optional: Check for token expiry and logout
        if (decodedToken.exp * 1000 < Date.now()) {
          handleLogout();
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        handleLogout();
      }
    }
    setLoading(false);
  }, [token, handleLogout]);

  const handleLogin = (newToken, newRole) => {
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("userRole", newRole);
    setToken(newToken);
    setUserRole(newRole);
    navigate("/");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <CssBaseline />
      {token && (
        <Box
          sx={{
            ml: isSidebarActive ? 250 : 0,
            transition: 'margin-left 0.3s ease',
            backgroundColor: 'background.paper',
            zIndex: 10,
          }}
        >
          <AppBar position="static" sx={{ height: 64 }}>
            <Toolbar>
              <Typography variant="h6" sx={{ ml: 2 }}>
                🌐 CUDA Cluster Dashboard
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button color="inherit" component={Link} to="/">
                Home
              </Button>
              {userRole === 'admin' && (
                <Button color="inherit" component={Link} to="/admin">
                  Admin Panel
                </Button>
              )}
              <Typography variant="body1" sx={{ mr: 2 }}>
                Logged in as: <strong>{username}</strong>
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </Toolbar>
          </AppBar>
        </Box>
      )}

      <Box
        component="main"
        sx={{
          ml: token && isSidebarActive ? 250 : 0,
          transition: 'margin-left 0.3s ease',
          minHeight: 'calc(100vh - 64px)',
          pt: 4,
          pb: 4,
          backgroundColor: '#f5f6fa',
        }}
      >
        <Container maxWidth="lg">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route
              path="/"
              element={token ? <NodeDashboard token={token} userRole={userRole} handleLogout={handleLogout} /> : <Navigate to="/login" />}
            />
            <Route
              path="/dashboard/:nodeId"
              element={token ? <Dashboard token={token} userRole={userRole} handleLogout={handleLogout} /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin"
              element={
                token && userRole === 'admin' ? (
                  <AdminPanel
                    token={token}
                    isSidebarActive={isSidebarActive}
                    setIsSidebarActive={setIsSidebarActive}
                    handleLogout={handleLogout}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Box>
    </>
  );
}


export default App;