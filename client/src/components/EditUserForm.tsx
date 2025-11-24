import { Box, Button, Checkbox, Container, FormControl, FormControlLabel, Stack, TextField } from "@mui/material";
import './Forms.css';
import { useState } from "react";
import { userLogin, officerLogin, updateUserProfile } from "../API/API";
import { setToken, setRole, getRoleFromToken } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import UploadAvatar from "./UploadAvatar";

interface EditUserFormProps {
    setShowEdit: (show: boolean) => void;
    avatar: string | File;
    telegram?: string;
    emailNotifications: boolean;
}


interface UpdatedData {
    telegram?: string;
    emailNotifications?: boolean;
    avatar?: File;
}

export function EditUserForm({ setShowEdit, avatar, telegram, emailNotifications }: EditUserFormProps) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [userAvatar, setUserAvatar] = useState<string | File>(avatar);
    const navigate = useNavigate();

    const previewURL =
        userAvatar instanceof File
            ? URL.createObjectURL(userAvatar)
            : userAvatar;

    async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const form = new FormData(e.currentTarget);

        const userDetails = new FormData();

        if (userAvatar instanceof File) {
            userDetails.append("avatar", userAvatar);
        }

        const updatedData: UpdatedData = {
            telegram: form.get("telegram") as string || "",
            emailNotifications: form.get("emailNotifications") === "on" ? true : false,
            avatar: userAvatar instanceof File ? userAvatar : undefined,
        };

        console.log(updatedData);

        try {
            const response = await updateUserProfile(updatedData);
            setLoading(false);
            if (response) {
                setShowEdit(false);
            }
        } catch {
            setLoading(false);
            setError("Failed to update profile");
        }
    }

    return (
        <form onSubmit={handleEdit}>
            <Stack spacing={2}>
                <Box mt={4}>
                    <Container>
                        <div className="avatar-wrapper">
                            <img src={previewURL} alt="User Avatar" />

                            <div className="avatar-overlay">Change avatar</div>

                            <UploadAvatar
                                onPhotoSelected={(file) => {
                                    if (file) setUserAvatar(file);
                                }}
                            />
                        </div>
                    </Container>

                    <Box mb={2}>
                        <TextField
                            label="Telegram"
                            name="telegram"
                            defaultValue={telegram}
                            fullWidth
                        />
                    </Box>

                    <Box mb={2}>
                        <FormControlLabel
                            control={<Checkbox defaultChecked={emailNotifications} />}
                            name="emailNotifications"
                            label="Email Notifications"
                        />
                    </Box>

                    <Button variant="contained" type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </Button>

                    <Button variant="outlined" onClick={() => setShowEdit(false)}>
                        Undo
                    </Button>

                    {error && <Box className="error">{error}</Box>}
                </Box>
            </Stack>
        </form>
    );
}