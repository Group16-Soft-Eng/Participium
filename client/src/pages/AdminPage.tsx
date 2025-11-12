import { Box, Button, Container, Stack } from "@mui/material";
import { useState } from "react";
import { LoginForm } from "../components/LoginForm";
import { RegisterForm } from "../components/RegisterForm";
import { AdminForm } from "../components/AdminForm";

export function AdminScreen() {

    const [showForm, setShowForm] = useState(false);

    return (
        <>
            {!showForm && (
            <Container id="login-screen">
                <Box my={4} mx={4}>
                    <Stack spacing={5}>
                        <h1 id="login-title">Admin Dashboard</h1>
                        <Stack spacing={2}>
                            <Button variant="contained" onClick={() => setShowForm(true)}>Register new officer</Button>
                        </Stack>
                        {/* reverted to original simple login screen (no mock buttons) */}
                    </Stack>
                </Box>
            </Container>
            )}
            {showForm && (<AdminForm setShowForm={setShowForm} />)}
        </>
    );
}
