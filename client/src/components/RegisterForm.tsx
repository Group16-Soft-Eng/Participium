import { Box, Button, Container, Grid, Stack, TextField } from "@mui/material";
import './Forms.css';

export function RegisterForm(props) {
    return (
        <Container id="login-form">
                <Grid container spacing={2} maxWidth="sm">
                    <Grid size={6}>
                        <TextField id="name" label="Name" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={6}>
                        <TextField id="surname" label="Surname" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={12}>
                        <TextField id="username" label="Username" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={12}>
                        <TextField id="email" label="Email" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={12}>
                        <TextField id="cemail" label="Confirm Email" variant="outlined" fullWidth />
                    </Grid>
                    <Grid size={6}>
                        <TextField id="password" label="Password" variant="outlined" type="password" fullWidth />
                    </Grid>
                    <Grid size={6}>
                        <TextField id="confirm-password" label="Confirm Password" variant="outlined" type="password" fullWidth />
                    </Grid>
                    <Grid size={6}>
                        <Button variant="outlined" onClick={() => props.setShowRegister(false)} fullWidth>Go Back</Button>
                    </Grid>
                    <Grid size={6}>
                        <Button variant="contained" fullWidth>Register</Button>
                    </Grid>
                </Grid>
        </Container>
    );
}
