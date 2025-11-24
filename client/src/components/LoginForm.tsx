import { Box, Button, Container, Stack, TextField } from "@mui/material";
import './Forms.css';
import { useState } from "react";
import { userLogin, officerLogin, getUserProfile } from "../API/API";
import { setToken, setRole, getRoleFromToken, setPicture } from '../services/auth';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
    setShowLogin: (show: boolean) => void;
}

export function LoginForm({ setShowLogin }: LoginFormProps) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const user = {
            username: (formData.get('username') as string).trim(),
            password: formData.get('password') as string
        }

        console.log('Attempting login for:', user.username);

        try {
            // first try officer login
            console.log('Trying officer login...');
            const token = await officerLogin(user);
            console.log('Officer login successful');
            setToken(token);
                const details = await getUserProfile();
                setPicture(details.avatar);
            // try to read role from token if available
            const detected = getRoleFromToken(token);
            if (detected === 'municipal_administrator') {
                setRole('municipal_administrator');
                window.dispatchEvent(new Event('authChange'));
                setLoading(false);
                navigate('/admin');
            }
            else {
                setRole('officer');
                window.dispatchEvent(new Event('authChange'));
                setLoading(false);
                navigate('/officer');
            }
        } catch (e) {
            // if officer login failed, try user login
            console.log('Officer login failed, trying user login...');
            try {
                const token = await userLogin(user);
                console.log('User login successful, token:', token);
                setToken(token);
                const detected = getRoleFromToken(token);
                const details = await getUserProfile();
                setPicture(details.avatar);
                console.log('Detected role:', detected);
                setRole('citizen');
                window.dispatchEvent(new Event('authChange'));
                console.log('Navigating to /map');
                setLoading(false);
                navigate('/map');
            } catch (err) {
                console.error('Both login attempts failed:', err);
                setError('Login failed. Please check your credentials.');
                setLoading(false);
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
        </Container>
    );
}
