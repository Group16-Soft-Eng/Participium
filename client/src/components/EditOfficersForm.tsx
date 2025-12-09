import React, { useEffect, useState, useMemo } from 'react';
import { getAssignedReports, reviewReport } from '../services/reportService';
import type { OfficerReport } from '../services/reportService';
import { Box, Button, Chip, DialogActions, DialogContentText, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Snackbar, Alert, Dialog, DialogContent, Select, Container, Stack, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ReportDetailDialog from './ReportDetailDialog';
import AssignOfficerDialog from './AssignOfficerDialog';
import { CategoryFilter } from './filters';
import type { ReportCategory } from './filters';
import { getAllMaintainers, getAllOfficers, getAvailableOfficerTypes, updateOfficer, deleteOfficer } from '../API/API'; // <--- AGGIUNTA deleteOfficer

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
    id: number;
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
    id: number;
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
    const [selected, setSelected] = useState<Officer | null>(null);
    const [view, setView] = useState(false);
    // image/lightbox is handled in the shared ReportDetailDialog
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [snackSeverity, setSnackSeverity] = useState<'success' | 'error' | 'info'>('success');
    const [showingAssign, setShowingAssign] = useState(false);
    const [showingDelete, setShowingDelete] = useState(false); // <--- NUOVO STATO PER IL DELETE

    // Stato dinamico per i tipi di ufficio e i ruoli
    const [officeTypes, setOfficeTypes] = useState<string[]>([]);
    const [officerRoles, setOfficerRoles] = useState<string[]>([]);

    // State for role assignment in the dialog
    const [currentRoles, setCurrentRoles] = useState<Officer['roles']>([]);
    // Inizializza con una stringa vuota, i valori verranno impostati in base ai dati caricati
    const [newOffice, setNewOffice] = useState('');
    const [newRole, setNewRole] = useState('');


    // Filter state
    const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'all' | null>('all');

    useEffect(() => {
        fetchOfficers();

        // Funzione asincrona per recuperare i tipi di office e i ruoli degli officer
        const fetchOfficerTypes = async () => {
            try {
                const types = await getAvailableOfficerTypes();
                const fetchedOfficeTypes = types.officeTypes || [];
                const fetchedOfficerRoles = types.officerRoles || [];

                setOfficeTypes(fetchedOfficeTypes);
                setOfficerRoles(fetchedOfficerRoles);

                // Imposta i valori iniziali per i selettori se i dati sono disponibili
                if (fetchedOfficeTypes.length > 0) {
                    setNewOffice(fetchedOfficeTypes[0]);
                }
                if (fetchedOfficerRoles.length > 0) {
                    setNewRole(fetchedOfficerRoles[0]);
                }

            } catch (error) {
                console.error("Error fetching officer types:", error);
            }
        };

        fetchOfficerTypes();
    }, []);

    // Set roles when the selected officer changes
    useEffect(() => {
        if (selected) {
            setCurrentRoles(selected.roles);
        } else {
            setCurrentRoles([]);
        }
        // Resetta/inizializza i selettori per il nuovo ruolo
        setNewOffice(officeTypes[0] || '');
        setNewRole(officerRoles[0] || '');
    }, [selected, officeTypes, officerRoles]); // Aggiunte le dipendenze officeTypes e officerRoles


    const fetchOfficers = async () => {
        setLoading(true);
        try {
            const officersData = await getAllOfficers();
            setOfficers(officersData);
            const maintainersData = await getAllMaintainers();
            setMaintainers(maintainersData);
        } catch (error) {
            console.error("Error fetching data:", error);
            setSnackMessage('Failed to fetch officer or maintainer data.');
            setSnackSeverity('error');
            setSnackOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (officer: Officer) => {
        setSelected(officer);
        setShowingAssign(true);
    }

    const closeEdit = () => {
        setSelected(null);
        setShowingAssign(false);
    }

    const openDelete = (officer: Officer) => {
        setSelected(officer);
        setShowingDelete(true); // <--- APRE IL DIALOG DI DELETE
    }

    const closeDelete = () => {
        setSelected(null);
        setShowingDelete(false); // <--- CHIUDE IL DIALOG DI DELETE
    }

    // Role Management Functions
    const handleRemoveRole = (index: number) => {
        setCurrentRoles(prevRoles => prevRoles.filter((_, i) => i !== index));
    };

    const handleAddRole = () => {
        const isDuplicate = currentRoles.some(r => r.office === newOffice && r.role === newRole);

        if (newOffice && newRole && !isDuplicate) {
            setCurrentRoles(prevRoles => [...prevRoles, { office: newRole === 'municipal_public_relations_officer' || newRole === 'municipal_administrator' ? 'organization' : newOffice, role: newRole }]);
            // Optional: Reset selects after adding
            setNewOffice(officeTypes[0] || '');
            setNewRole(officerRoles[0] || '');
        } else if (isDuplicate) {
            setSnackMessage(`Role "${formatString(newRole)}" in "${formatString(newOffice)}" Office is already assigned.`);
            setSnackSeverity('info');
            setSnackOpen(true);
        }
    };

    const handleSaveRoles = async () => {
        if (!selected) return;
        selected.roles = currentRoles;
        try {
            await updateOfficer(selected);
            fetchOfficers();

            setSnackMessage('Officer roles updated successfully!');
            setSnackSeverity('success');
            setSnackOpen(true);
            closeEdit();
        } catch (error) {
            console.error("Failed to save roles:", error);
            setSnackMessage('Failed to update officer roles.');
            setSnackSeverity('error');
            setSnackOpen(true);
        }
    };

    // Funzione di gestione dell'eliminazione
    const handleDeleteOfficer = async () => {
        if (!selected) return;

        try {
            // Assicurati che deleteOfficer sia implementata nel tuo API/API.ts
            await deleteOfficer(selected.id);
            await fetchOfficers(); // Ricarica la lista dopo l'eliminazione

            setSnackMessage(`Officer ${selected.name} ${selected.surname} successfully deleted.`);
            setSnackSeverity('success');
            setSnackOpen(true);
            closeDelete();
        } catch (error) {
            console.error("Failed to delete officer:", error);
            setSnackMessage('Failed to delete officer.');
            setSnackSeverity('error');
            setSnackOpen(true);
            closeDelete();
        }
    };


    // Filtered officers based on category only
    const filteredOfficers = useMemo(() => {
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
            {/* Dialog per l'Assegnazione Ruoli (Edit) */}
            <Dialog open={showingAssign} onClose={closeEdit} fullWidth maxWidth="sm">
                <DialogTitle>Assign Officer Roles</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Select the offices and roles for this officer.
                    </DialogContentText>
                    {selected && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Officer: {selected.name} {selected.surname}
                            </Typography>

                            {/* Current Roles Display */}
                            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                                Current Assignments
                            </Typography>
                            {currentRoles.length === 0 ? (
                                <Typography color="textSecondary">No roles assigned yet.</Typography>
                            ) : (
                                <Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 1 }}>
                                    {currentRoles.map((assignment, index) => (
                                        <Paper key={index} elevation={1} sx={{ p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography>
                                                {assignment.office != null && formatString(assignment.office) + " - "} {formatString(assignment.role)}
                                            </Typography>
                                            <IconButton
                                                edge="end"
                                                aria-label="remove"
                                                onClick={() => handleRemoveRole(index)}
                                                size="small"
                                                color="error"
                                            >
                                                <RemoveCircleOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Paper>
                                    ))}
                                </Box>
                            )}

                            {/* Add New Role Section */}
                            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                                Assign New Role
                            </Typography>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={newRole == 'technical_office_staff' || newRole == 'external_maintainer' ? 5 : 9}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Role</InputLabel>
                                        <Select
                                            value={newRole}
                                            label="Role"
                                            onChange={(e) => setNewRole(e.target.value)}
                                            disabled={officerRoles.length === 0}
                                        >
                                            {officerRoles.map(role => (
                                                <MenuItem key={role} value={role}>{formatString(role)}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {
                                    (newRole === 'technical_office_staff' || newRole === 'external_maintainer') && <Grid item xs={5}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Office</InputLabel>
                                            <Select
                                                value={newOffice}
                                                label="Office"
                                                onChange={(e) => setNewOffice(e.target.value)}
                                                disabled={officeTypes.length === 0}
                                            >
                                                {officeTypes.map(office => (
                                                    <MenuItem key={office} value={office}>{formatString(office)}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                }
                                <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <IconButton
                                        aria-label="add role"
                                        onClick={handleAddRole}
                                        color="primary"
                                        disabled={!newOffice || !newRole || currentRoles.some(r => r.office === (newRole === 'municipal_public_relations_officer' || newRole === 'municipal_administrator' ? 'organization' : newOffice) && r.role === newRole) || officeTypes.length === 0 || officerRoles.length === 0}
                                    >
                                        <AddCircleOutlineIcon fontSize="large" />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeEdit}>Cancel</Button>
                    <Button onClick={handleSaveRoles} variant="contained" color="primary" disabled={!selected || currentRoles.length === 0}>Save Changes</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog di Conferma Eliminazione */}
            <Dialog
                open={showingDelete}
                onClose={closeDelete}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the officer **{selected?.name} {selected?.surname}**?
                        This action is irreversible.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDelete} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteOfficer} color="error" variant="contained" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Typography variant="h5" gutterBottom>Available Officers</Typography>
            <hr />
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

            {!loading && filteredOfficers.length > 0 && (
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
                                {filteredOfficers.map((officer) => (
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
                                                    sx={{ mr: 1, mb: 0.5, backgroundColor: getCategoryColor(r.office), color: '#fff' }}
                                                />
                                            ))}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button variant="contained" color="primary" size="small" sx={{ mr: 1 }} onClick={() => openEdit(officer)}>Edit</Button>
                                            <Button variant="outlined" color="error" size="small" onClick={() => openDelete(officer)}>Delete</Button>
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