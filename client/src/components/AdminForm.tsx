import { Alert, Box, Button, Container, FormControl, Grid, InputLabel, MenuItem, Select, Snackbar, Stack, TextField } from "@mui/material";
import './Forms.css';
import { Form, useNavigate } from "react-router-dom";
import { useActionState, useEffect, useState } from "react";
import { getAvailableOfficerTypes, maintainerRegister, officerRegister, userLogin, userRegister } from "../API/API";
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
    const [officeTypes, setOfficeTypes] = useState<string[]>([]);
    const [officerTypes, setOfficerTypes] = useState<string[]>([]);

    const [role, setRole] = useState("");


    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [snackSeverity, setSnackSeverity] = useState<'success' | 'error' | 'info'>('success');

    useEffect(() => {
        const fetchOfficerTypes = async () => {
            try {
                const types = await getAvailableOfficerTypes();
                setOfficeTypes(types.officeTypes || []);
                setOfficerTypes(types.officerRoles || []);
            } catch (error) {
                console.error("Error fetching officer types:", error);
            }
        };

        fetchOfficerTypes();
    }, []);

    const [state, formAction] = useActionState(register, { success: false, error: '' } as RegisterState);
    const [error, setError] = useState<string | null>(null);

    async function register(prevData: RegisterState, formData: FormData) {
        let officer, maintainer;
        const role = formData.get('role');

        if (role === 'external_maintainer') {
            maintainer = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                password: formData.get('password') as string,
                categories: [
                    formData.get('office') as string
                ],
                active: true
            }
        } else {
            officer = {
                name: formData.get('name') as string,
                surname: formData.get('surname') as string,
                username: formData.get('username') as string,
                email: formData.get('email') as string,
                password: formData.get('password') as string,
                roles: [
                    {
                        office: formData.get('office') as string,
                        role: formData.get('role') as string
                    }
                ] as { office: string; role: string }[]
            }

            if (officer.roles[0].role === 'municipal_public_relations_officer' || officer.roles[0].role === 'municipal_administrator') {
                officer.roles[0].office = 'organization';
            }
        }

        if (formData.get('email') !== formData.get('cemail')) {
            setSnackMessage('Emails do not match');
            setSnackSeverity('error');
            setSnackOpen(true);
            return { error: 'Emails do not match' };
        }
        if (formData.get('password') !== formData.get('confirm-password')) {
            setSnackMessage('Passwords do not match');
            setSnackSeverity('error');
            setSnackOpen(true);
            return { error: 'Passwords do not match' };
        }
        try {
            if (role === 'external_maintainer') {
                await maintainerRegister(maintainer);
            } else {
                await officerRegister(officer);
            }
            setSnackMessage('Officer registered successfully');
            setSnackSeverity('success');
            setSnackOpen(true);
            return { success: true }
        }
        catch (error) {

            if (error instanceof Error && error.message.includes('409')) {
                setSnackMessage('Username or email already in use');
                setSnackSeverity('error');
                setSnackOpen(true);
                return { error: 'Username or email already in use' };
            }
            if (error instanceof Error && error.message.includes('400')) {
                setSnackMessage('Invalid email. Please use a valid email address.');
                setSnackSeverity('error');
                setSnackOpen(true);
                return { error: 'Invalid email. Please use a valid email address.' };
            }

            setSnackMessage('Registration failed');
            setSnackSeverity('error');
            setSnackOpen(true);
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }

    return (
        <Container id="admin-form">
            <form action={formAction}>
                <Grid container spacing={2} maxWidth="sm">
                    <Grid size={6}>
                        <TextField id="name" name="name" label="Name" variant="outlined" fullWidth required />
                    </Grid>
                    <Grid size={6}>
                        <TextField id="surname" name="surname" label="Surname" variant="outlined" fullWidth required />
                    </Grid>
                    <Grid size={12}>
                        <TextField id="username" name="username" label="Username" variant="outlined" fullWidth required />
                    </Grid>
                    <Grid size={12}>
                        <TextField id="email" name="email" label="Email" variant="outlined" fullWidth required />
                    </Grid>
                    <Grid size={12}>
                        <TextField id="cemail" name="cemail" label="Confirm Email" variant="outlined" fullWidth required />
                    </Grid>
                    <Grid size={6}>
                        <TextField id="password" name="password" label="Password" variant="outlined" type="password" fullWidth required />
                    </Grid>
                    <Grid size={6}>
                        <TextField id="confirm-password" name="confirm-password" label="Confirm Password" variant="outlined" type="password" fullWidth required />
                    </Grid>
                    <FormControl fullWidth>
                        <InputLabel id="role-select-label">Officer Role</InputLabel>
                        <Grid size={12}>
                            <Select id="role" name="role" label="Officer Role" variant="outlined" fullWidth defaultValue={''} required
                                onChange={(e) => setRole(e.target.value)}> {
                                    officerTypes.map((type) => (<MenuItem key={type} value={type}>{type.replaceAll('_', ' ')}</MenuItem>
                                    ))
                                }
                            </Select>
                        </Grid>
                    </FormControl>
                    {(role === 'technical_office_staff' || role === 'external_maintainer') && (
                        <FormControl fullWidth>
                            <InputLabel id="office-select-label">{role === 'technical_office_staff' ? 'Office' : 'Category'}</InputLabel>
                            <Grid size={12}>
                                <Select id="office" name="office" label={role === 'technical_office_staff' ? 'Office' : 'Category'} variant="outlined" fullWidth defaultValue={''} required> {
                                    officeTypes.map((type) => (<MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))
                                }
                                </Select>
                            </Grid>
                        </FormControl>
                    )}
                    {error && <Grid size={12}><p className="error">{error}</p></Grid>}
                    <Grid size={6}>
                        <Button variant="outlined" onClick={() => setShowForm(false)} fullWidth>Go Back</Button>
                    </Grid>
                    <Grid size={6}>
                        <Button variant="contained" fullWidth type="submit">Register</Button>
                    </Grid>
                </Grid>
            </form>
            <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
                    {snackMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}
