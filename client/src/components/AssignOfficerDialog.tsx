import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, IconButton, Select, Stack, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import type { OfficerReport } from '../services/reportService';

interface Props {
    open: boolean;
    report: OfficerReport | null;
    office: string;
    onClose: () => void;
}

const officers = [
    'Pietro Pantani',
    'Luca Marchetti',
    'Giulia Bianchi',
    'Francesca Rossi',
    'Marco Verdi',
    'Sara Neri'
];

const AssignOfficerDialog: React.FC<Props> = ({ open, report, onClose, office }) => {

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>Choose the officer to assign the report to {report?.title}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                        <Stack spacing={2}>
                            <Box>
                            Available Officers for {office} office:
                            </Box>
                            <FormControl fullWidth>
                                <InputLabel id="officer-select-label">Select an officer</InputLabel>
                                <Grid size={12}>
                                    <Select id="officer" name="officer" label="Select an officer" variant="outlined" fullWidth defaultValue={''} required> {
                                        officers.map((officer) => (<MenuItem key={officer} value={officer}>{officer}</MenuItem>
                                        ))
                                    }
                                    </Select>
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