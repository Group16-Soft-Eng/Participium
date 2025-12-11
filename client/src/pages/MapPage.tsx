import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MapClusterView from '../Map/MapComponents/MapClusterView';
import type { Report } from '../Map/types/report';
import { Box, List, ListItem, Paper, Typography, Chip, CircularProgress } from '@mui/material';
import { getAllReports } from '../Map/mapApi/mapApi';
import { getToken } from '../services/auth';

const getCategoryColor = (cat: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (cat) {
    case 'infrastructure': return 'secondary';
    case 'environment': return 'success';
    case 'safety': return 'error';
    case 'sanitation': return 'warning';
    case 'transport': return 'info';
    default: return 'default';
  }
};

const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
  const [initialZoom, setInitialZoom] = useState<number | null>(null);
  const [highlightLocation, setHighlightLocation] = useState<[number, number] | null>(null);

  const logged = getToken() !== null;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await getAllReports();
        // Show only APPROVED, IN_PROGRESS, and SUSPENDED reports on map
        let visibleReports = data.filter(report => {
          const status = report.status?.toLowerCase();
          return status === 'approved' || status === 'in_progress' || status === 'suspended';
        });

        // If there's a specific report ID in the URL, ensure it's included even if filtered
        const reportIdParam = searchParams.get('id');
        if (reportIdParam) {
          const specificReport = data.find(r => r.id === reportIdParam);
          if (specificReport && !visibleReports.some(r => r.id === reportIdParam)) {
            visibleReports = [...visibleReports, specificReport];
          }
          setSelectedId(reportIdParam);
        }

        setReports(visibleReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        // Show empty array if API fails
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [searchParams]);

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');

    if (lat && lng) {
      const location: [number, number] = [Number.parseFloat(lat), Number.parseFloat(lng)];
      setInitialCenter(location);
      setInitialZoom(zoom ? Number.parseInt(zoom) : 16);
      setHighlightLocation(location);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 0, alignItems: 'stretch', flexDirection: { xs: 'column', md: 'row' }, width: '100%', height: 'calc(100vh - 64px)' }}>
      {/* Map: 2/3 width on md+ screens, full width on xs */}
      <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 66.666%' }, minWidth: 0 }}>
          <MapClusterView
            reports={logged ? reports : []}
            selectedId={selectedId}
            initialCenter={initialCenter}
            initialZoom={initialZoom}
            highlightLocation={highlightLocation}
          />
      </Box>

      {/* Sidebar list: 1/3 width on md+ screens, full width on xs */}
      <Paper sx={{
        flex: { xs: '0 0 100%', md: '0 0 33.333%' },
        minWidth: { xs: '100%', md: 280 },
        height: 'calc(100vh - 64px)',
        overflow: 'auto',
        p: 2,
        bgcolor: '#f8f9fa'
      }} elevation={2}>
        { logged ? 
        <>
        <Typography variant="h6" gutterBottom>Reports on map ({reports.length})</Typography>
        <List>
          {reports.map((r) => {
            const status = r.status?.toLowerCase();
            const isInProgress = status === 'in_progress';
            const isSuspended = status === 'suspended';
            return (
              <ListItem key={r.id} disablePadding sx={{ mb: 1 }}>
                <Paper
                  sx={{
                    width: '100%',
                    p: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    bgcolor: (() => {
                      if (isInProgress) {
                        return '#e3f2fd';
                      } else if (isSuspended) {
                        return '#fff3e0';
                      } else {
                        return 'white';
                      }
                    })(),
                    borderLeft: (() => {
                      if (isInProgress) {
                        return '4px solid #1976d2';
                      } else if (isSuspended) {
                        return '4px solid #f57c00';
                      } else {
                        return 'none';
                      }
                    })()
                  }}
                  elevation={1}
                  onClick={() => setSelectedId(r.id)}
                >
                  <Box>
                    <Typography variant="subtitle1">{r.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {/* Show reporter: anonymous when report.anonymity is true, otherwise show author name if available */}
                      {r.anonymity ? 'Anonymous' : (() => {
                        const authorDisplayName = r.author ? `${r.author.firstName || ''} ${r.author.lastName || ''}`.trim() : 'Unknown';
                        return authorDisplayName;
                      })()}
                      {` • ${new Date(r.createdAt).toLocaleDateString()}`}
                    </Typography>
                  </Box>
                  <Chip label={r.category} size="small" color={getCategoryColor(r.category)} />
                </Paper>
              </ListItem>
            );
          })}
        </List>
        </>
        : <>
        <Typography variant="h6" gutterBottom>Please log in to view the available reports.</Typography>
        </>}
      </Paper>
    </Box>
  );
};

export default MapPage;
