import React, { useState } from 'react';
import MapClusterView from '../Map/MapComponents/MapClusterView';
import type { Report } from '../Map/types/report';
import { Box, List, ListItem, Paper, Typography, Chip } from '@mui/material';

// generate many mock reports around Turin for testing clustering and list
const createMockReports = (count = 80): Report[] => {
  const baseLat = 45.0703;
  const baseLng = 7.6869;
  const cats = ['infrastructure', 'environment', 'safety', 'sanitation', 'transport', 'other'];
  const statuses: Report['status'][] = ['pending', 'in-progress', 'resolved'];
  const arr: Report[] = [];
  for (let i = 0; i < count; i++) {
    const lat = baseLat + (Math.random() - 0.5) * 0.03; // ~3km radius
    const lng = baseLng + (Math.random() - 0.5) * 0.03;
    arr.push({
      id: `${i + 1}`,
      title: `Sample report #${i + 1}`,
      description: `Auto-generated mock report number ${i + 1}`,
      category: cats[i % cats.length],
      photos: [],
      latitude: lat,
      longitude: lng,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30)),
      status: statuses[i % statuses.length],
    });
  }
  return arr;
};

const sampleReports = createMockReports(80);

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Box sx={{ display: 'flex', gap: 0, alignItems: 'stretch', flexDirection: { xs: 'column', md: 'row' }, width: '100%', height: 'calc(100vh - 64px)' }}>
      {/* Map: 2/3 width on md+ screens, full width on xs */}
      <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 66.666%' }, minWidth: 0 }}>
        <MapClusterView reports={sampleReports} selectedId={selectedId} />
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
        <Typography variant="h6" gutterBottom>Reports on map</Typography>
        <List>
          {sampleReports.map((r) => (
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
