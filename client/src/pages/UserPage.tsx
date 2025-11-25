import { Box, Button, Checkbox, Container, FormControlLabel, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { getToken, getUserFromToken } from "../services/auth";
import { getUserProfile } from "../API/API";
import UploadAvatar from "../components/UploadAvatar";
import { EditUserForm } from "../components/EditUserForm";

import {static_ip_address} from "../API/API"

export interface User {
    id?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    email?: string;
    avatar?: string;
    telegramUsername?: string;
    emailNotifications?: boolean;
}


export function UserPage() {

    const [edit, setEdit] = useState(false);
    const [user, setUser] = useState<User>({});

    useEffect(() => {
        getUserProfile().then((data) => {
            setUser(data);
        });
    }, [edit]);

    const setShowEdit = (show: boolean) => {
        setEdit(show);
    }

    const userData = {
        avatar: static_ip_address + user?.avatar || '../assets/userImage.png',
        name: user?.firstName,
        surname: user?.lastName,
        username: user?.username,
        email: user?.email,
        telegram: user?.telegramUsername,
        emailNotifications: user?.emailNotifications || false
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
                                    <img src={userData.avatar} alt="User Avatar" style={{ borderRadius: '50%', height: '10rem', width: '10rem' }} />
                                </Container>
                                <Box style={{ textAlign: 'left', fontSize: '1.2rem' }}>
                                    <p><strong>Name:</strong> {userData.name}</p>
                                    <p><strong>Surname:</strong> {userData.surname}</p>
                                    <p><strong>Username:</strong> {userData.username}</p>
                                    <p><strong>Email:</strong> {userData.email}</p>
                                    <p><strong>Telegram:</strong> {userData.telegram != null ? "@" + userData.telegram : 'None'}</p>
                                    <p><strong>Email Notifications:</strong> {userData.emailNotifications ? 'Enabled' : 'Disabled'}</p>
                                </Box>
                            <Button variant="contained" onClick={() => setEdit(true)}>Edit Profile</Button>
                            </Box>
                        ) : (
                            <EditUserForm setShowEdit={setEdit} avatar={userData.avatar} telegram={userData.telegram} emailNotifications={userData.emailNotifications} />
                        )
                    }
                    </Stack>
                </Box>
            </Container>
        </>
    );
}
