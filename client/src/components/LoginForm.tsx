import { Alert, Box, Button, Container, Snackbar, Stack, TextField } from "@mui/material";
import './Forms.css';
import { useState } from "react";
import { userLogin, officerLogin, maintainerLogin, getUserProfile } from "../API/API";
import { setToken, setRole, getRoleFromToken, setPicture } from '../services/auth';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
    setShowLogin: (show: boolean) => void;
}

export function LoginForm({ setShowLogin }: LoginFormProps) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [snackSeverity, setSnackSeverity] = useState<'success' | 'error' | 'info'>('success');


    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const user = {
            username: (formData.get('username') as string).trim(),
            password: formData.get('password') as string
        }

        try {
            // first try officer login
            const token = await officerLogin(user);
            setToken(token);
            // try to read role from token if available
            const detected = getRoleFromToken(token);
            setRole(detected);
            console.log(token);
            window.dispatchEvent(new Event('authChange'));
            setLoading(false);

            // Redirect based on role
            if (detected === 'municipal_administrator') {
                navigate('/admin');
            } else if (detected === 'municipal_public_relations_officer') {
                navigate('/officer');
            } else if (detected === 'technical_office_staff') {
                navigate('/technical');
            } else {
                navigate('/technical'); // default fallback
            }
        } catch (e) {
            // if officer login failed, try maintainer login
            try {
                const token = await maintainerLogin(user);
                setToken(token);
                const detected = getRoleFromToken(token);
                setRole(detected || 'external_maintainer');
                window.dispatchEvent(new Event('authChange'));
                setLoading(false);
                navigate('/maintainer');
            } catch (maintainerErr) {
                // if maintainer login failed, try user login
                try {
                    const token = await userLogin(user);
                    setToken(token);
                    const details = await getUserProfile();
                    setPicture(details.avatar);
                    setRole('citizen');
                    window.dispatchEvent(new Event('authChange'));
                    setLoading(false);
                    navigate('/map');
                } catch (err) {
                    setSnackMessage('Login failed. Please check your credentials.');
                    setSnackSeverity('error');
                    setSnackOpen(true);
                    setLoading(false);
                }
            }
        }
    }

    return (
        <Container id="login-form">
            <form onSubmit={handleLogin}>
                <Stack spacing={2}>
                    <TextField fullWidth id="username" name="username" label="Username" variant="outlined" required />
                    <TextField fullWidth id="password" name="password" label="Password" variant="outlined" type="password" required />

                    {/* role auto-detection: officer login attempted first, then citizen */}

                    <Button variant="contained" type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                    <Button variant="outlined" onClick={() => setShowLogin(false)}>Go Back</Button>
                    {error && <Box className="error">{error}</Box>}
                </Stack>
            </form>
            <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
                    {snackMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}
