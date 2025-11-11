import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MapClusterView from '../Map/MapComponents/MapClusterView';
import type { Report } from '../Map/types/report';
import { Box, List, ListItem, Paper, Typography, Chip, CircularProgress } from '@mui/material';
import { getAllReports } from '../Map/mapApi/mapApi';

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

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await getAllReports();
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
        // Show empty array if API fails
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');
    
    if (lat && lng) {
      const location: [number, number] = [parseFloat(lat), parseFloat(lng)];
      setInitialCenter(location);
      setInitialZoom(zoom ? parseInt(zoom) : 16);
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
          reports={reports} 
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
        <Typography variant="h6" gutterBottom>Reports on map ({reports.length})</Typography>
        <List>
          {reports.map((r) => (
            <ListItem key={r.id} disablePadding sx={{ mb: 1 }}>
              <Paper sx={{ width: '100%', p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} elevation={1} onClick={() => setSelectedId(r.id)}>
                <Box>
                  <Typography variant="subtitle1">{r.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.category} • {new Date(r.createdAt).toLocaleDateString()}</Typography>
                </Box>
                <Chip label={r.category} size="small" color={getCategoryColor(r.category)} />
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default MapPage;
