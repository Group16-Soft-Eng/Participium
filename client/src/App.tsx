import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import UserMenu from './components/UserMenu';
import { useEffect, useState } from 'react';
import { getToken, getRole } from './services/auth';
import { LoginScreen } from './screens/LoginScreen';

import ReportForm from './Map/MapComponents/ReportForm';
import MapPage from './pages/MapPage';
import OfficerPage from './pages/OfficerPage';
import RequireAuth from './components/RequireAuth';

function App() {
  const [, setAuth] = useState<{ token: string | null; role: string | null }>({ token: getToken(), role: getRole() });

    useEffect(() => {
      const onAuth = () => setAuth({ token: getToken(), role: getRole() });
      window.addEventListener('authChange', onAuth);
      return () => window.removeEventListener('authChange', onAuth);
    }, []);

  const isLoggedIn = Boolean(getToken());

    return (
    <>
      <Router>
        <AppBar position="fixed" color="default" elevation={1} className="app-bar">
          <Toolbar sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* small inline logo */}
              <Box className="app-logo" component={Link} to="/map" sx={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <circle cx="12" cy="12" r="10" fill="#1976d2" />
                  <text x="12" y="16" textAnchor="middle" fontSize="12" fontFamily="Poppins, sans-serif" fill="#fff" fontWeight="600">P</text>
                </svg>
              </Box>

              <Box component={Link} to="/map" sx={{ textDecoration: 'none' }}>
                <Typography variant="h6" component="div" sx={{ color: '#222', fontWeight: 700 }}>
                  Participium
                </Typography>
                <Typography variant="caption" component="div" sx={{ color: '#666', mt: '-4px' }}>
                  Turin civic reports
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button component={Link} to="/map" color="inherit">Map</Button>
              <Button
                component={Link}
                to="/submitReport"
                variant="contained"
                color="secondary"
                sx={{
                  px: 2.2,
                  py: 0.7,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  boxShadow: '0 6px 18px rgba(25,118,210,0.18)',
                  background: 'linear-gradient(90deg,#ff6b35,#ff3d00)'
                }}
              >
                Write a report
              </Button>
              {/* show login button when not authenticated; transform into UserMenu (avatar) after login */}
              {isLoggedIn ? <UserMenu /> : (
                <Button variant="contained" color="primary" component={Link} to="/login">Login / Register</Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ pt: '64px', width: '100%', minHeight: 'calc(100vh - 64px)' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/submitReport" element={<ReportForm />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/officer" element={<RequireAuth><OfficerPage /></RequireAuth>} />
          </Routes>
        </Box>
      </Router>
    </>
    )
}


export default App
