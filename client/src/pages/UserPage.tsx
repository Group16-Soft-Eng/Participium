import { Box, Button, Checkbox, Container, FormControlLabel, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { getToken, getUserFromToken } from "../services/auth";

export function UserPage() {

    const [edit, setEdit] = useState(false);

    const user = getUserFromToken(getToken() || '');

    const userData = {
        name: user?.name,
        surname: user?.family_name,
        username: user?.username,
        email: user?.email,
        telegram: "@johndoe",
        emailNotifications: false
    }

    const confirmChanges = () => {
        userData.name = (document.getElementsByTagName('input')[0] as HTMLInputElement).value;
        userData.surname = (document.getElementsByTagName('input')[1] as HTMLInputElement).value;
        userData.username = (document.getElementsByTagName('input')[2] as HTMLInputElement).value;
        userData.email = (document.getElementsByTagName('input')[3] as HTMLInputElement).value;
        userData.telegram = (document.getElementsByTagName('input')[4] as HTMLInputElement).value;
        userData.emailNotifications = (document.getElementsByTagName('input')[5] as HTMLInputElement).checked;
    }

    return (
        <>
            <Container id="login-screen">
                <Box my={4} mx={4}>
                    <Stack spacing={1}>
                        <h1 id="login-title">Your account</h1>
                        {!edit ? (
                            <Box mt={4}>
                                <Container>
                                    <img src="../assets/userImage.png" alt="User Avatar" style={{ borderRadius: '50%', height: '10rem', width: '10rem' }} />
                                </Container>
                                <Box style={{ textAlign: 'left', fontSize: '1.2rem' }}>
                                    <p><strong>Name:</strong> {userData.name}</p>
                                    <p><strong>Surname:</strong> {userData.surname}</p>
                                    <p><strong>Username:</strong> {userData.username}</p>
                                    <p><strong>Email:</strong> {userData.email}</p>
                                    <p><strong>Telegram:</strong> {userData.telegram}</p>
                                    <p><strong>Email Notifications:</strong> {userData.emailNotifications ? 'Enabled' : 'Disabled'}</p>
                                </Box>
                            </Box>
                        ) : (
                            <Box mt={4}>
                                <form>
                                    <Box mb={2}>
                                        <TextField
                                            label="Name"
                                            defaultValue={userData.name}
                                            fullWidth
                                            required
                                        />
                                    </Box>
                                    <Box mb={2}>
                                        <TextField
                                            label="Surname"
                                            defaultValue={userData.surname}
                                            fullWidth
                                            required
                                        />
                                    </Box>
                                    <Box mb={2}>
                                        <TextField
                                            label="Username"
                                            defaultValue={userData.username}
                                            fullWidth
                                            required
                                        />
                                    </Box>
                                    <Box mb={2}>
                                        <TextField
                                            label="Email"
                                            type="email"
                                            defaultValue={userData.email}
                                            fullWidth
                                            required
                                        />
                                    </Box>
                                    <Box mb={2}>
                                        <TextField
                                            label="Telegram"
                                            defaultValue={userData.telegram}
                                            fullWidth
                                        />
                                    </Box>
                                    <Box mb={2}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    defaultChecked={userData.emailNotifications}
                                                />
                                            }
                                            label="Email Notifications"
                                        />
                                    </Box>
                                </form>
                            </Box>
                        )}
                        <Button variant="contained" onClick={() => { if (edit) { confirmChanges(); } setEdit(!edit); }}>{edit ? 'Confirm Changes' : 'Edit Info'}</Button>
                    </Stack>
                </Box>
            </Container>
        </>
    );
}
