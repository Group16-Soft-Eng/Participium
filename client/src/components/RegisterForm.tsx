import { Box, Button, Container, Grid, Stack, TextField } from "@mui/material";
import './Forms.css';
import { Form, useNavigate, useLocation } from "react-router-dom";
import { useActionState, useState } from "react";
import { userLogin, userRegister } from "../API/API";
import { setRole, setToken } from "../services/auth";

interface RegisterFormProps {
    setShowRegister: (show: boolean) => void;
}

type RegisterState = {
    success?: boolean;
    error?: string;
};

export function RegisterForm({ setShowRegister }: RegisterFormProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const fromPath = (location && (location as any).state && (location as any).state.from && (location as any).state.from.pathname) ? (location as any).state.from.pathname : null;

    const [state, formAction] = useActionState(register, { success: false, error: '' } as RegisterState);
    const [error, setError] = useState<string | null>(null);

    async function register(prevData: RegisterState, formData: FormData) {

        const user = {
            firstName: formData.get('name') as string,
            lastName: formData.get('surname') as string,
            username: formData.get('username') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string
        }
        if (formData.get('email') !== formData.get('cemail')) {
            setError('Emails do not match');
            return { error: 'Emails do not match' };
        }
        if (formData.get('password') !== formData.get('confirm-password')) {
            setError('Passwords do not match');
            return { error: 'Passwords do not match' };
        }
        try {
            await userRegister(user);
            const token = await userLogin({ username: user.username, password: user.password });
            setToken(token);
            setRole('citizen')
            window.dispatchEvent(new Event('authChange'));
            // If a pending location exists, redirect to the submit report page so the selection is preserved
            const pending = localStorage.getItem('pendingReportLocation');
            if (pending) {
                navigate('/submitReport');
            } else if (fromPath) {
                navigate(fromPath);
            } else {
                navigate('/map');
            }
            return { success: true }
        }
        catch (error) {
            setError('Registration failed');
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }

    return (
        <Container id="login-form">
            <form action={formAction}>
                <Grid container spacing={2} maxWidth="sm">
                    <Grid size={6}>
                        <TextField id="name" name="name" label="Name" variant="outlined" fullWidth required/>
                    </Grid>
                    <Grid size={6}>
                        <TextField id="surname" name="surname" label="Surname" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={12}>
                        <TextField id="username" name="username" label="Username" variant="outlined" fullWidth required/>
                    </Grid>
                    <Grid size={12}>
                        <TextField id="email" name="email" label="Email" variant="outlined" fullWidth required/>
                    </Grid>
                    <Grid size={12}>
                        <TextField id="cemail" name="cemail" label="Confirm Email" variant="outlined" fullWidth required/>
                    </Grid>
                    <Grid size={6}>
                        <TextField id="password" name="password" label="Password" variant="outlined" type="password" fullWidth required/>
                    </Grid>
                    <Grid size={6}>
                        <TextField id="confirm-password" name="confirm-password" label="Confirm Password" variant="outlined" type="password" fullWidth required/>
                    </Grid>
                    {error && <Grid size={12}><p className="error">{error}</p></Grid>}
                    <Grid size={6}>
                        <Button variant="outlined" onClick={() => setShowRegister(false)} fullWidth>Go Back</Button>
                    </Grid>
                    <Grid size={6}>
                        <Button variant="contained" fullWidth type="submit">Register</Button>
                    </Grid>
                </Grid>
            </form>
        </Container>
    );
}
