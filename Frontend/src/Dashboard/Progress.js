// src/Progress.js
import React, { useState, useEffect } from 'react';
import { Paper, Typography, LinearProgress, Grid, Box, Card, CardContent } from '@mui/material';
import { Speed, VpnKey, FindInPage, Update, Lock } from '@mui/icons-material';

const Progress = ({ apiUrl }) => {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!apiUrl) return;

    const eventSource = new EventSource(`${apiUrl}/live/progress`);
    eventSource.onmessage = (event) => {
      try {
        const progressData = JSON.parse(event.data);
        setProgress(progressData);
      } catch (e) {
        console.error("Progress: Error parsing SSE data:", e);
      }
    };
    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
    };
    return () => {
      eventSource.close();
    };
  }, [apiUrl]);

  if (!progress) {
    return <Typography>Loading Progress...</Typography>;
  }

  const formattedMKeys = progress.mkeys_per_second.toFixed(2);
  const formattedProgress = (progress.progress_percent * 100).toFixed(2);

  const StatCard = ({ icon, title, value, color }) => (
    <Card style={{ backgroundColor: color, color: 'white', height: 150 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" style={{ marginLeft: 10 }}>{title}</Typography>
        </Box>
        <Typography variant="h5" style={{ fontSize: title === 'Keys Scanned' || title === 'Last Key' ? '1.2rem' : '2.125rem' }}>{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h6" gutterBottom>Progress</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<VpnKey />} title="Keys Scanned" value={progress.keys_scanned} color="#2196f3" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Speed />} title="MKeys/s" value={formattedMKeys} color="#4caf50" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<FindInPage />} title="Found" value={progress.found_count} color="#ff9800" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Lock />} title="Last Key" value={progress.last_key} color="#f44336" />
        </Grid>
      </Grid>
      <Box mt={3}>
        <Typography>Last Update: {progress.last_update_str}</Typography>
        <Typography>Progress: {formattedProgress}%</Typography>
        <LinearProgress variant="determinate" value={progress.progress_percent} />
      </Box>
    </Paper>
  );
};

export default Progress;