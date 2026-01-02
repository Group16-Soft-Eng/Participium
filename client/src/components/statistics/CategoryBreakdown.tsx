import { Card, CardContent, Typography, Box, LinearProgress, Chip } from '@mui/material';
import { ReactElement } from 'react';
import {
  Build,
  Park,
  Security,
  CleaningServices,
  DirectionsBus,
  Business,
  Category as CategoryIcon
} from '@mui/icons-material';

interface CategoryData {
  category: string;
  count: number;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
}

const categoryConfig: Record<string, { label: string; icon: ReactElement; color: string }> = {
  infrastructure: {
    label: 'Infrastructure',
    icon: <Build />,
    color: '#f57c00'
  },
  environment: {
    label: 'Environment',
    icon: <Park />,
    color: '#388e3c'
  },
  safety: {
    label: 'Safety',
    icon: <Security />,
    color: '#d32f2f'
  },
  sanitation: {
    label: 'Sanitation',
    icon: <CleaningServices />,
    color: '#1976d2'
  },
  transport: {
    label: 'Transport',
    icon: <DirectionsBus />,
    color: '#7b1fa2'
  },
  organization: {
    label: 'Organization',
    icon: <Business />,
    color: '#0288d1'
  },
  other: {
    label: 'Other',
    icon: <CategoryIcon />,
    color: '#616161'
  }
};

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const totalReports = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Reports by Category</Typography>
          <Chip
            label={`${totalReports} total`}
            color="primary"
            size="small"
          />
        </Box>

        {data.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No reports available
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {data
              .sort((a, b) => b.count - a.count)
              .map((item) => {
                const config = categoryConfig[item.category] || categoryConfig.other;
                const percentage = totalReports > 0 ? (item.count / totalReports) * 100 : 0;

                return (
                  <Box key={item.category}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: config.color, display: 'flex', alignItems: 'center' }}>
                          {config.icon}
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                          {config.label}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {percentage.toFixed(0)}%
                        </Typography>
                        <Chip
                          label={item.count}
                          size="small"
                          sx={{
                            bgcolor: `${config.color}20`,
                            color: config.color,
                            fontWeight: 'bold',
                            minWidth: '40px'
                          }}
                        />
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: `${config.color}15`,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: config.color,
                          borderRadius: 4,
                        }
                      }}
                    />
                  </Box>
                );
              })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
