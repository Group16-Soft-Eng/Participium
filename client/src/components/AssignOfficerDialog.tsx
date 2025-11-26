import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, IconButton, Select, Stack, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import type { OfficerReport } from '../services/reportService';
import { getOfficersByOffice } from "../API/API";
import { useEffect } from 'react';

interface Props {
    open: boolean;
    report: OfficerReport | null;
    office: string;
    onClose: () => void;
}

const AssignOfficerDialog: React.FC<Props> = ({ open, report, onClose, office }) => {

    const [officers, setOfficers] = useState<string[]>([]);

    useEffect(() => {
        const fetchOfficers = async () => {
            const result = await getOfficersByOffice(office);
            setOfficers(result);
            console.log(result);
        };
        fetchOfficers();
    }, [office]);

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>Choose the officer to assign the report to {report?.title}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                        <Stack spacing={2}>
                            <Box>
                                {officers.length > 0 &&
                                `Available Officers for ${office} office:`}
                            </Box>
                            <FormControl fullWidth>
                                <Grid size={12}>
                                    {officers.length === 0 && <Box>No officers available for this office.</Box>}
                                    {officers.length > 0 &&
                                    <>
                                        <InputLabel id="officer-select-label">Select an officer</InputLabel>
                                        <Select id="officer" name="officer" label="Select an officer" variant="outlined" fullWidth defaultValue={''} required> {
                                            officers.map((officer) => (<MenuItem key={officer} value={officer}>{officer}</MenuItem>
                                            ))
                                        }
                                        </Select>
                                        </>
                                    }
                                </Grid>
                            </FormControl>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AssignOfficerDialog;