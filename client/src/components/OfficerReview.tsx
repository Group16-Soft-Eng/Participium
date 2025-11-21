import React, { useEffect, useState } from 'react';
import { getAssignedReports, reviewReport } from '../services/reportService';
import type { OfficerReport } from '../services/reportService';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton } from '@mui/material';

interface RejectState {
  open: boolean;
  reportId: number | null;
  reason: string;
}

interface ApproveState {
  open: boolean;
  reportId: number | null;
  message: string;
}

// Category colors matching the map
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

const OfficerReview: React.FC = () => {
  const [reports, setReports] = useState<OfficerReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reject, setReject] = useState<RejectState>({ open: false, reportId: null, reason: '' });
  const [approve, setApprove] = useState<ApproveState>({ open: false, reportId: null, message: '' });
  const [selected, setSelected] = useState<OfficerReport | null>(null);
  const [openImageIndex, setOpenImageIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const data = await getAssignedReports();
    setReports(data);
    setLoading(false);
  };

  const openApproveDialog = (id: number) => setApprove({ open: true, reportId: id, message: '' });

  const handleConfirmApprove = async () => {
    if (!approve.reportId) return;
    const report = reports.find(r => r.id === approve.reportId);
    const ok = await reviewReport(approve.reportId, 'APPROVED', undefined, {
      title: report?.title || 'Your report',
      authorId: report?.author?.id,
      authorUsername: report?.author?.username
    }, approve.message.trim() || undefined);
    if (ok) setReports((r) => r.filter((x) => x.id !== approve.reportId));
    setApprove({ open: false, reportId: null, message: '' });
  };

  const openRejectDialog = (id: number) => setReject({ open: true, reportId: id, reason: '' });

    const handleConfirmReject = async () => {
    if (!reject.reportId) return;
    if ((reject.reason || '').trim().length < 30) {
      alert('The rejection reason must be at least 30 characters long.');
      return;
    }
    const report = reports.find(r => r.id === reject.reportId);
    const ok = await reviewReport(reject.reportId, 'DECLINED', reject.reason.trim(), {
      title: report?.title || 'Your report',
      authorId: report?.author?.id,
      authorUsername: report?.author?.username
    });
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
                  </TableCell>
                  <TableCell sx={{ width: 160 }}>
                    <Chip 
                      label={r.category || 'Unknown'} 
                      size="small"
                      sx={{ 
                        backgroundColor: getCategoryColor(r.category),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ width: 160 }}>
                    {r.anonymity 
                      ? 'Anonymous' 
                      : (r.author ? `${r.author.firstName || ''} ${r.author.lastName || ''}`.trim() : '—')}
                  </TableCell>
                  <TableCell sx={{ width: 180 }}>{r.date ? new Date(r.date).toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">
                    <Button variant="contained" color="primary" size="small" onClick={() => setSelected(r)} sx={{ mr: 1 }}>View</Button>
                    <Button variant="contained" color="success" size="small" onClick={() => openApproveDialog(r.id)} sx={{ mr: 1 }}>Approve</Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => openRejectDialog(r.id)}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={approve.open} onClose={() => setApprove({ open: false, reportId: null, message: '' })} fullWidth maxWidth="sm">
        <DialogTitle>Approve Report</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You can optionally send a message to the user about this approval.
          </DialogContentText>
          <TextField
            autoFocus
            margin="normal"
            id="message"
            label="Message to User (Optional)"
            type="text"
            fullWidth
            multiline
            minRows={4}
            value={approve.message}
            onChange={(e) => setApprove((s) => ({ ...s, message: e.target.value }))}
            placeholder="e.g., Your report has been approved. Our team will address this issue within 5 business days..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprove({ open: false, reportId: null, message: '' })}>Cancel</Button>
          <Button color="success" variant="contained" onClick={handleConfirmApprove}>Confirm Approve</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reject.open} onClose={() => setReject({ open: false, reportId: null, reason: '' })} fullWidth maxWidth="sm">
        <DialogTitle>Reject Report</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting this report (required, minimum 30 characters).
          </DialogContentText>
          <TextField
            autoFocus
            margin="normal"
            id="reason"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            minRows={4}
            value={reject.reason}
            onChange={(e) => setReject((s) => ({ ...s, reason: e.target.value }))}
            placeholder="Explain why this report is being rejected..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReject({ open: false, reportId: null, reason: '' })}>Cancel</Button>
          <Button color="error" onClick={handleConfirmReject}>Confirm Reject</Button>
        </DialogActions>
      </Dialog>

            <Dialog open={selected !== null} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Report: {selected?.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <strong>Category:</strong> {selected?.category}
            </Box>
            <Box>
              <strong>Reported by:</strong> {' '}
              {selected?.anonymity 
                ? 'Anonymous' 
                : (selected?.author ? `${selected.author.firstName || ''} ${selected.author.lastName || ''}`.trim() : 'Unknown')}
            </Box>
            <Box>
              <strong>Description:</strong> {selected?.document?.description || selected?.description || 'No description'}
            </Box>
            {/* Photos (if any) */}
            {selected?.document?.photos && selected.document.photos.length > 0 && (
              <Box>
                <strong>Photos:</strong>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {selected.document.photos.map((p, idx) => {
                    // backend returns paths like "/uploads/reports/xxxx.jpg" - convert to absolute server URL
                    const apiBase = (import.meta.env.VITE_API_BASE ?? 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/i, '');
                    const src = p.startsWith('http') ? p : `${apiBase}${p}`;
                    return (
                      <img
                        key={idx}
                        src={src}
                        alt={`report-photo-${idx}`}
                        style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}
                        onClick={() => setOpenImageIndex(idx)}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
            <Box>
              <strong>Location:</strong> {selected?.location?.Coordinates?.latitude}, {selected?.location?.Coordinates?.longitude}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              if (selected?.location?.Coordinates) {
                const { latitude, longitude } = selected.location.Coordinates;
                window.open(`/map?lat=${latitude}&lng=${longitude}&zoom=16`, '_blank');
              }
            }}
            variant="contained"
            color="primary"
          >
            View on Map
          </Button>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox dialog for viewing photos */}
      <Dialog open={openImageIndex !== null} onClose={() => setOpenImageIndex(null)} maxWidth="md" fullWidth>
        <DialogContent sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 0, bgcolor: 'black' }}>
          {selected && selected.document?.photos && openImageIndex !== null && (
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '60vh' }}>
              <IconButton
                onClick={() => setOpenImageIndex(i => (i !== null ? (i - 1 + selected.document!.photos!.length) % selected.document!.photos!.length : null))}
                sx={{ color: 'white', position: 'absolute', left: 8, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, fontSize: '2rem' }}
              >
                ‹
              </IconButton>

              <img
                src={(import.meta.env.VITE_API_BASE ?? 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/i, '') + selected.document.photos[openImageIndex]}
                alt={`full-${openImageIndex}`}
                style={{ maxWidth: '100%', maxHeight: '80vh', margin: '0 auto', display: 'block' }}
              />

              <IconButton
                onClick={() => setOpenImageIndex(i => (i !== null ? (i + 1) % selected.document!.photos!.length : null))}
                sx={{ color: 'white', position: 'absolute', right: 8, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, fontSize: '2rem' }}
              >
                ›
              </IconButton>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'black' }}>
          <Button onClick={() => setOpenImageIndex(null)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfficerReview;
