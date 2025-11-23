import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Snackbar, Alert } from '@mui/material';
import ReportDetailDialog from '../components/ReportDetailDialog';
import { getMyAssignedReports } from '../services/reportService';
import type { OfficerReport } from '../services/reportService';

// Category colors matching the map (kept small and consistent)
const CATEGORY_COLORS: Record<string, string> = {
  infrastructure: '#8b5cf6',
  environment: '#10b981',
  safety: '#ef4444',
  sanitation: '#f59e0b',
  transport: '#3b82f6',
  other: '#6b7280',
};

const getCategoryColor = (category?: string): string => {
  return (category && CATEGORY_COLORS[category.toLowerCase()]) || '#6b7280';
};

const TechnicalOfficerPage: React.FC = () => {
  const [reports, setReports] = useState<OfficerReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<OfficerReport | null>(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success'|'error'|'info'>('success');
  

  useEffect(() => {
    fetchAssigned();
  }, []);

  const fetchAssigned = async () => {
    setLoading(true);
    const data = await getMyAssignedReports();
    setReports(data);
    setLoading(false);
  };

  // group reports by category for a compact overview
  const grouped = reports.reduce((acc: Record<string, OfficerReport[]>, r) => {
    const key = (r.category || 'other').toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, OfficerReport[]>);
  const categories = Object.keys(grouped);
  const singleCategory = categories.length === 1 ? categories[0] : null;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <Typography variant="h5" gutterBottom>Technical Officer Workspace</Typography>
        <Typography variant="body2" color="text.secondary">This view shows reports that were assigned to you by the review process.</Typography>
      </Paper>

      <Paper sx={{ p: 2 }} elevation={0}>
        {loading && <div>Loading...</div>}
        {!loading && reports.length === 0 && <Typography>No reports assigned to you.</Typography>}

        {!loading && reports.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {singleCategory ? (
              // single category: show one chip and a single table
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip label={singleCategory} size="small" sx={{ backgroundColor: getCategoryColor(singleCategory), color: 'white', fontWeight: 'bold', textTransform: 'capitalize' }} />
                  <Typography variant="body2" color="text.secondary">{reports.length} report{reports.length > 1 ? 's' : ''}</Typography>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Submitted</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map(r => (
                        <TableRow key={r.id} hover>
                          <TableCell sx={{ width: 60 }}>{r.id}</TableCell>
                          <TableCell>{r.title}</TableCell>
                          <TableCell>{r.date ? new Date(r.date).toLocaleString() : '—'}</TableCell>
                          <TableCell align="right">
                            <Button variant="contained" size="small" onClick={() => setSelected(r)} sx={{ mr: 1 }}>View</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              // multiple categories: keep grouped layout
              categories.map(cat => (
                <Box key={cat}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={cat} size="small" sx={{ backgroundColor: getCategoryColor(cat), color: 'white', fontWeight: 'bold', textTransform: 'capitalize' }} />
                    <Typography variant="body2" color="text.secondary">{grouped[cat].length} report{grouped[cat].length > 1 ? 's' : ''}</Typography>
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Title</TableCell>
                          <TableCell>Submitted</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {grouped[cat].map(r => (
                          <TableRow key={r.id} hover>
                            <TableCell sx={{ width: 60 }}>{r.id}</TableCell>
                            <TableCell>{r.title}</TableCell>
                            <TableCell>{r.date ? new Date(r.date).toLocaleString() : '—'}</TableCell>
                            <TableCell align="right">
                              <Button variant="contained" size="small" onClick={() => setSelected(r)} sx={{ mr: 1 }}>View</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))
            )}
          </Box>
        )}
      </Paper>
      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
          {snackMessage}
        </Alert>
      </Snackbar>

      <ReportDetailDialog open={selected !== null} report={selected} onClose={() => setSelected(null)} />
    </Box>
  );
};

export default TechnicalOfficerPage;
