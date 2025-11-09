import React, { useEffect, useState } from 'react';
import { getAssignedReports, reviewReport, getOfficeForCategory } from '../services/reportService';
import type { OfficerReport } from '../services/reportService';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';

interface RejectState {
  open: boolean;
  reportId: number | null;
  reason: string;
}

const OfficerReview: React.FC = () => {
  const [reports, setReports] = useState<OfficerReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reject, setReject] = useState<RejectState>({ open: false, reportId: null, reason: '' });
  const [selected, setSelected] = useState<OfficerReport | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const data = await getAssignedReports();
    setReports(data);
    setLoading(false);
  };

  const handleApprove = async (id: number) => {
    const rep = reports.find((x) => x.id === id);
    const office = getOfficeForCategory(rep?.category);
    const ok = await reviewReport(id, 'APPROVED', undefined, office);
    if (ok) setReports((r) => r.filter((x) => x.id !== id));
  };

  const openRejectDialog = (id: number) => setReject({ open: true, reportId: id, reason: '' });

  const handleConfirmReject = async () => {
    if (!reject.reportId) return;
    if ((reject.reason || '').trim().length < 30) {
      alert('La motivazione per il rifiuto deve essere di almeno 30 caratteri.');
      return;
    }
    const ok = await reviewReport(reject.reportId, 'DECLINED', reject.reason.trim());
    if (ok) setReports((r) => r.filter((x) => x.id !== reject.reportId));
    setReject({ open: false, reportId: null, reason: '' });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Pending Reports for Review</Typography>

      {loading && <div>Loading...</div>}

      {!loading && reports.length === 0 && (
        <Typography>No pending reports assigned.</Typography>
      )}

      {!loading && reports.length > 0 && (
        <Paper elevation={1} sx={{ p: 2 }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} size="medium">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Reporter</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ width: 60, fontWeight: 'bold' }}>{r.id}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{r.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.description?.slice(0, 120) || 'No description'}</Typography>
                  </TableCell>
                  <TableCell sx={{ width: 160 }}><Typography variant="body2">{r.category}</Typography></TableCell>
                  <TableCell sx={{ width: 160 }}>{r.anonymity ? 'anonymous' : r.authorName ?? '—'}</TableCell>
                  <TableCell sx={{ width: 180 }}>{r.date ? new Date(r.date).toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">
                    <Button variant="contained" color="primary" size="small" onClick={() => setSelected(r)} sx={{ mr: 1 }}>View</Button>
                    <Button variant="contained" color="success" size="small" onClick={() => handleApprove(r.id)} sx={{ mr: 1 }}>Approve</Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => openRejectDialog(r.id)}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={reject.open} onClose={() => setReject({ open: false, reportId: null, reason: '' })} fullWidth maxWidth="sm">
        <DialogTitle>Reject Report</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Inserisci la motivazione del rifiuto (obbligatoria, minimo 30 caratteri).
          </DialogContentText>
          <TextField
            autoFocus
            margin="normal"
            id="reason"
            label="Reason"
            type="text"
            fullWidth
            multiline
            minRows={4}
            value={reject.reason}
            onChange={(e) => setReject((s) => ({ ...s, reason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReject({ open: false, reportId: null, reason: '' })}>Cancel</Button>
          <Button color="error" onClick={handleConfirmReject}>Confirm Reject</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Category: {selected?.category}</Typography>
          <Typography paragraph>{selected?.description || 'No description provided.'}</Typography>
          {selected?.location && (
            <Typography variant="body2">Location: {selected.location.Coordinates.latitude}, {selected.location.Coordinates.longitude}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfficerReview;
