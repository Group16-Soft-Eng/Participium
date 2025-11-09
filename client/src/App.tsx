import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import { AppBar, Container, Toolbar, Typography } from '@mui/material';
import UserMenu from './components/UserMenu';
import { useEffect, useState } from 'react';
import { getToken, getRole } from './services/auth';
import { LoginScreen } from './screens/LoginScreen';

import ReportForm from '../Map/MapComponents/ReportForm';
import OfficerPage from './pages/OfficerPage';
import RequireAuth from './components/RequireAuth';

function App() {
  const [, setAuth] = useState<{ token: string | null; role: string | null }>({ token: getToken(), role: getRole() });

    useEffect(() => {
      const onAuth = () => setAuth({ token: getToken(), role: getRole() });
      window.addEventListener('authChange', onAuth);
      return () => window.removeEventListener('authChange', onAuth);
    }, []);

    return (
    <>
      <Router>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" component="div" sx={{ color: '#333' }}>
              Participium
            </Typography>
            {/* hide avatar on login screen */}
            {typeof window !== 'undefined' && window.location.pathname !== '/' && <UserMenu />}
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 3 }}>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/submitReport" element={<ReportForm />} />
          <Route path="/officer" element={<RequireAuth><OfficerPage /></RequireAuth>} />
        </Routes>
        </Container>
      </Router>
    </>
    )
}


export default App
