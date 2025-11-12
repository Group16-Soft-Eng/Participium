import { Box, Button, Container, Grid, Select, Stack, TextField } from "@mui/material";
import './Forms.css';
import { Form, useNavigate } from "react-router-dom";
import { useActionState, useState } from "react";
import { officerRegister, userLogin, userRegister } from "../API/API";
import { setRole, setToken } from "../services/auth";

interface AdminFormProps {
    setShowForm: (show: boolean) => void;
}

type RegisterState = {
    success?: boolean;
    error?: string;
};

export function AdminForm({ setShowForm }: AdminFormProps) {
    const navigate = useNavigate();

    const [state, formAction] = useActionState(register, { success: false, error: '' } as RegisterState);
    const [error, setError] = useState<string | null>(null);

    async function register(prevData: RegisterState, formData: FormData) {

        const officer = {
            name: formData.get('name') as string,
            surname: formData.get('surname') as string,
            username: formData.get('username') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            office: formData.get('office') as string,
            role: formData.get('role') as string
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
            await officerRegister(officer);
            setError('Officer registered successfully');
            return { success: true }
        }
        catch (error) {
            setError('Registration failed');
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }

    return (
        <Container id="admin-form">
            <form action={formAction}>
                <Grid container spacing={2} maxWidth="sm">
                    <Grid size={6}>
                        <TextField id="name" name="name" label="Name" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={6}>
                        <TextField id="surname" name="surname" label="Surname" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={12}>
                        <TextField id="username" name="username" label="Username" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={12}>
                        <TextField id="email" name="email" label="Email" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={12}>
                        <TextField id="cemail" name="cemail" label="Confirm Email" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={6}>
                        <TextField id="password" name="password" label="Password" variant="outlined" type="password" fullWidth />
                    </Grid>
                    <Grid size={6}>
                        <TextField id="confirm-password" name="confirm-password" label="Confirm Password" variant="outlined" type="password" fullWidth />
                    </Grid>
                    <Grid size={12}>
                        <Select id="office" name="office" label="Office" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={12}>
                        <Select id="role" name="role" label="Role" variant="outlined" fullWidth />
                    </Grid>
                    {error && <Grid size={12}><p className="error">{error}</p></Grid>}
                    <Grid size={6}>
                        <Button variant="outlined" onClick={() => setShowForm(false)} fullWidth>Go Back</Button>
                    </Grid>
                    <Grid size={6}>
                        <Button variant="contained" fullWidth type="submit">Register</Button>
                    </Grid>
                </Grid>
            </form>
        </Container>
    );
}
