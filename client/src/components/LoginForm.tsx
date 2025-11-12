import { Box, Button, Container, Stack, TextField } from "@mui/material";
import './Forms.css';
import { useActionState, useState } from "react";
import { userLogin, officerLogin } from "../API/API";
import { setToken, setRole, getRoleFromToken } from '../services/auth';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
    setShowLogin: (show: boolean) => void;
}
type LoginState = {
    success?: boolean;
    error?: string;
};

export function LoginForm({ setShowLogin }: LoginFormProps) {
    const [state, formAction] = useActionState(register, { success: false, error: '' } as LoginState);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function register(prevData: LoginState, formData: FormData) {

        const officer = {
            email: formData.get('username') as string,
            password: formData.get('password') as string
        }

        const user = {
            username: formData.get('username') as string,
            password: formData.get('password') as string
        }

        try {
            // first try officer login
            const token = await officerLogin(officer);
            if (token !== undefined) {
                setToken(token);
                const role = getRoleFromToken(token);
                if (role?.includes('office')) {
                    setRole('officer');
                    window.dispatchEvent(new Event('authChange'));
                    navigate('/officer');
                } else if (role?.includes('administrator')) {
                    setRole('municipal_administrator');
                    window.dispatchEvent(new Event('authChange'));
                    navigate('/admin');
                }
                return { success: true };
            } else {
                try {
                    const token = await userLogin(user);
                    if (token !== undefined) {
                        setToken(token);
                        setRole('citizen');
                        window.dispatchEvent(new Event('authChange'));
                        navigate('/submitReport');
                        return { success: true };
                    } else {
                        setError('Unknown username or password, please try again');
                        return { error: 'Login failed' };
                    }
                } catch (err) {
                    setError('Login failed');
                    return { error: 'Login failed' };
                }
            }
        } catch (e) {
            setError('Login failed');
            return { error: 'Login failed' };
        }
    }

    return (
        <Container id="login-form">
            <form action={formAction}>
                <Stack spacing={2}>
                    <TextField fullWidth id="username" name="username" label="Username" variant="outlined" required/>
                    <TextField fullWidth id="password" name="password" label="Password" variant="outlined" type="password" required/>

                    {/* role auto-detection: officer login attempted first, then citizen */}

                    <Button variant="contained" type="submit">Login</Button>
                    <Button variant="outlined" onClick={() => setShowLogin(false)}>Go Back</Button>
                    {error && <Box className="error">{error}</Box>}
                </Stack>
            </form>
        </Container>
    );
}
