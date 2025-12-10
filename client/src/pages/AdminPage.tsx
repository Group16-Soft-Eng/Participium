import { Box, Button, Container, Stack } from "@mui/material";
import { useState } from "react";

import { AdminForm } from "../components/AdminForm";
import EditOfficersForm from "../components/EditOfficersForm";

export function AdminScreen() {

    const [showForm, setShowForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);

    return (
        <>
            {!showForm && !showEditForm && (
            <Container id="login-screen">
                <Box my={4} mx={4}>
                    <Stack spacing={5}>
                        <h1 id="login-title">Admin Dashboard</h1>
                        <Stack spacing={2}>
                            <Button variant="contained" onClick={() => setShowForm(true)}>Register new officer</Button>
                            <Button variant="outlined" onClick={() => setShowEditForm(true)}>Update officer accounts</Button>
                        </Stack>
                        {/* reverted to original simple login screen (no mock buttons) */}
                    </Stack>
                </Box>
            </Container>
            )}
            {showForm && (<AdminForm setShowForm={setShowForm} />)}
            {showEditForm && (<EditOfficersForm setShowForm={setShowEditForm}/>)}
        </>
    );
}
