import { useEffect, useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import { Box, Button, Container, Stack, TextField } from '@mui/material';
import { LoginForm } from './components/LoginForm';
import { LoginScreen } from './screens/LoginScreen';

function App() {
    return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
        </Routes>
      </Router>
    </>
    )
}


export default App
