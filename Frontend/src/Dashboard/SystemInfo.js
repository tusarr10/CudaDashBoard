// src/SystemInfo.js
import React, { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, Card, CardContent } from '@mui/material';
import { Memory, DeveloperBoard, Speed, Whatshot, Power } from '@mui/icons-material';

const SystemInfo = ({ apiUrl }) => {
  const [system, setSystem] = useState(null);

  useEffect(() => {
    if (!apiUrl) return;

    const eventSource = new EventSource(`${apiUrl}/live/system`);
    eventSource.onmessage = (event) => {
      try {
        const systemData = JSON.parse(event.data);
        setSystem(systemData);
      } catch (e) {
        console.error("SystemInfo: Error parsing SSE data:", e);
      }
    };
    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
    };
    return () => {
      eventSource.close();
    };
  }, [apiUrl]);

  if (!system) {
    return <Typography>Loading System Info...</Typography>;
  }

  const StatCard = ({ icon, title, value, color }) => (
    <Card style={{ backgroundColor: color, color: 'white', height: 120 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          {icon}
          <Typography variant="subtitle1" style={{ marginLeft: 10 }}>{title}</Typography>
        </Box>
        <Typography variant="h5">{value}</Typography>
      </CardContent>
    </Card>
  );

  const DetailCard = ({ icon, title, value }) => (
    <Card style={{ height: 80 }}>
      <CardContent>
        <Box display="flex" alignItems="center">
          {icon}
          <Typography variant="subtitle2" style={{ marginLeft: 10 }}>{title}</Typography>
        </Box>
        <Typography variant="body2">{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h6" gutterBottom>System Info</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Memory />} title="CPU Usage" value={`${system.cpu.usage_percent}%`} color="#673ab7" />
          <Grid container spacing={1} style={{ marginTop: 10 }}>
            <Grid item xs={12}><DetailCard icon={<Whatshot />} title="CPU Temp" value={`${system.cpu.temp_c}°C`} /></Grid>
            <Grid item xs={12}><DetailCard icon={<Speed />} title="Cores" value={system.cpu.cores} /></Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <StatCard icon={<DeveloperBoard />} title="GPU Usage" value={`${system.gpu.usage_percent.toFixed(0)}%`} color="#009688" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard icon={<DeveloperBoard />} title="GPU Name" value={system.gpu.name} color="#009688" />
            </Grid>
          </Grid>
          <Grid container spacing={1} style={{ marginTop: 10 }}>
            <Grid item xs={6}><DetailCard icon={<Whatshot />} title="GPU Temp" value={`${system.gpu.temp_c}°C`} /></Grid>
            <Grid item xs={6}><DetailCard icon={<Power />} title="GPU Power" value={`${system.gpu.power_w.toFixed(2)}W`} /></Grid>
            <Grid item xs={6}><DetailCard icon={<Speed />} title="Clock" value={`${system.gpu.clock_mhz} MHz`} /></Grid>
            <Grid item xs={6}><DetailCard icon={<Speed />} title="Fan" value={`${system.gpu.fan_percent}%`} /></Grid>
            <Grid item xs={12}><DetailCard icon={<Memory />} title="Memory" value={`${system.gpu.memory_used_mb} / ${system.gpu.memory_total_mb} MB`} /></Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Speed />} title="RAM Usage" value={`${system.memory.ram_usage_percent.toFixed(2)}%`} color="#ff5722" />
          <Grid container spacing={1} style={{ marginTop: 10 }}>
            <Grid item xs={12}><DetailCard icon={<Memory />} title="Usage" value={`${system.memory.ram_used_mb} / ${system.memory.ram_total_mb} MB`} /></Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SystemInfo;