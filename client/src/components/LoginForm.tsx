import { Box, Button, Container, Stack, TextField } from "@mui/material";
import './Forms.css';

interface LoginFormProps {
  setShowLogin: (show: boolean) => void;
}

export function LoginForm({ setShowLogin }: LoginFormProps) {
    return (
        <Container id="login-form">
                <Stack spacing={2}>
                    <TextField fullWidth id="username" label="Username" variant="outlined" />
                    <TextField fullWidth id="password" label="Password" variant="outlined" type="password" />
                    <Button variant="contained">Login</Button>
                    <Button variant="outlined" onClick={() => setShowLogin(false)}>Go Back</Button>
                </Stack>
        </Container>
    );
}
