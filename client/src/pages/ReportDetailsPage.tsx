import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Skeleton, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEffect, useState } from 'react';
import { getReportById } from '../API/API';
import { ReportDetailsSection } from '../components/report-details/ReportDetailsSection';
import { InternalChatSection } from '../components/report-details/InternalChatSection';

export function ReportDetailsPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await getReportById(reportId!);
      setReport(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 3, px: 2 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 120px)' }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rectangular" height="100%" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rectangular" height="100%" />
          </Box>
        </Box>
      </Box>
    );
  }

  if (error || !report) {
    return (
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 3, px: 2 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          variant="outlined"
          sx={{ mb: 3 }}
        >
          Back to Reports
        </Button>
        <Alert severity="error">
          {error || 'Report not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ py: 2, px: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Back to Reports
        </Button>
      </Box>

      {/* Main content - full height */}
      <Box sx={{ display: 'flex', gap: 0, flex: 1, overflow: 'hidden' }}>
        {/* Left: Report Details - scrollable */}
        <Box sx={{ flex: '0 0 45%', overflowY: 'auto', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
          <Box sx={{ p: 3 }}>
            <ReportDetailsSection 
              report={report} 
              onUpdate={fetchReport}
            />
          </Box>
        </Box>

        {/* Right: Internal Chat - full height */}
        <Box sx={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
          <InternalChatSection reportId={parseInt(reportId!)} />
        </Box>
      </Box>
    </Box>
  );
}
