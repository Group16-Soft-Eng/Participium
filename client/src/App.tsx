import { useEffect, useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import { Box, Button, Container, Stack, TextField } from '@mui/material';
import { LoginForm } from './components/LoginForm';
import { LoginScreen } from './screens/LoginScreen';

import ReportForm from '../Map/MapComponents/ReportForm';

function App() {
    return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/submitReport" element={<ReportForm />} />
        </Routes>
      </Router>
    </>
    )
}


export default App
