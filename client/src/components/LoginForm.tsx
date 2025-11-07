import { Box, Button, Container, Stack, TextField } from "@mui/material";
import './Forms.css';
import { useActionState, useState } from "react";
import { userLogin } from "../API/API";

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

    async function register(prevData: LoginState, formData: FormData) {

        const user = {
            username: formData.get('username') as string,
            password: formData.get('password') as string
        }
        try {
            await userLogin(user);
            return { success: true }
        }
        catch (error) {
            setError('Login failed');
            return { error: 'Login failed' };
        }
    }
    return (
        <Container id="login-form">
            <form action={formAction}>
                <Stack spacing={2}>
                    <TextField fullWidth id="username" name="username" label="Username" variant="outlined" />
                    <TextField fullWidth id="password" name="password" label="Password" variant="outlined" type="password" />
                    <Button variant="contained" type="submit">Login</Button>
                    <Button variant="outlined" onClick={() => setShowLogin(false)}>Go Back</Button>
                    {error && <Box className="error">{error}</Box>}
                </Stack>
            </form>
        </Container>
    );
}
