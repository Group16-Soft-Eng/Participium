import React, { useEffect, useState, useMemo } from 'react';
import { getAssignedReports, reviewReport } from '../services/reportService';
import type { OfficerReport } from '../services/reportService';
import { Box, Button, Chip, DialogActions, DialogContentText, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Snackbar, Alert, Dialog, DialogContent } from '@mui/material';
import ReportDetailDialog from './ReportDetailDialog';
import AssignOfficerDialog from './AssignOfficerDialog';
import { Select, Container, Stack } from '@mui/material';
import { CategoryFilter } from './filters';
import type { ReportCategory } from './filters';
import { getAllMaintainers, getAllOfficers } from '../API/API';

// Category colors matching the map
const CATEGORY_COLORS: Record<string, string> = {
    infrastructure: '#8b5cf6',
    environment: '#10b981',
    safety: '#ef4444',
    sanitation: '#f59e0b',
    transport: '#3b82f6',
    public: '#955c51ff',
    other: '#6b7280',
};

const getCategoryColor = (category?: string): string => {
    return (category && CATEGORY_COLORS[category.toLowerCase()]) || '#6b7280';
};

type Officer = {
    email: string;
    name: string;
    surname: string;
    password: string;
    roles:
    {
        office: string;
        role: string;
    }[];
}

type Maintainer = {
    name: string;
    email: string;
    password: string;
    categories:
    string[];
    active: boolean
}

interface EditOfficersFormProps {
    setShowForm: (show: boolean) => void;
}

function formatString(str: string) {
  return str
    .replace(/_/g, " ")            
    .toLowerCase()                 
    .replace(/\b\w/g, c => c.toUpperCase());
}

const EditOfficersForm: React.FC<EditOfficersFormProps> = ({ setShowForm }) => {
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [maintainers, setMaintainers] = useState<Maintainer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selected, setSelected] = useState<OfficerReport | null>(null);
    const [view, setView] = useState(false);
    // image/lightbox is handled in the shared ReportDetailDialog
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [snackSeverity, setSnackSeverity] = useState<'success' | 'error' | 'info'>('success');
    const [showingAssign, setShowingAssign] = useState(false);
    // Filter state
    const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'all' | null>('all');

    useEffect(() => {
        fetchOfficers();
    }, []);

    const fetchOfficers = async () => {
        setLoading(true);
        const officersData = await getAllOfficers();
        setOfficers(officersData);
        const maintainersData = await getAllMaintainers();
        setMaintainers(maintainersData);
        setLoading(false);
    };

    const openAssign = (report: OfficerReport) => {
        setSelected(report);
        setShowingAssign(true);
    }

    const closeAssign = () => {
        setSelected(null);
        setShowingAssign(false);
    }


    // Filtered reports based on category only
    const filteredReports = useMemo(() => {
        return officers.filter(officer => {
            // Category filter
            if (categoryFilter && categoryFilter !== 'all' && !officer.roles.some(role => role.office === categoryFilter)) {
                return false;
            }
            return true;
        });
    }, [officers, categoryFilter]);

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Available Officers</Typography>

            {loading && <div>Loading...</div>}

            {!loading && officers.length === 0 && (
                <Typography>No officers created.</Typography>
            )}

            {!loading && officers.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <CategoryFilter
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        variant="chips"
                        size="small"
                    />
                </Box>
            )}

            {!loading && filteredReports.length > 0 && (
                <Paper elevation={1} sx={{ p: 2 }}>
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }} size="medium">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Offices & Roles</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredReports.map((officer) => (
                                    <TableRow key={officer.email} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{officer.name} {officer.surname}</TableCell>
                                        <TableCell>{officer.email}</TableCell>
                                        <TableCell>
                                            {officer.roles.map((r, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={`${formatString(r.role)}
                                                    ${r.role === 'technical_office_staff' ? `in ${formatString(r.office)} Office` : ''}`}
                                                    size="small"
                                                    sx={{ mr: 1, mb: 0.5 }}
                                                />
                                            ))}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button variant="contained" color="primary" size="small" sx={{ mr: 1 }}>Edit</Button>
                                            <Button variant="outlined" color="error" size="small">Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
                    {snackMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default EditOfficersForm;