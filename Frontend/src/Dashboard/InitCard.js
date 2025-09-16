// src/InitCard.js (Copied from WebpageDash.txt, no changes)
import React, { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Card, CardContent, Box } from '@mui/material';
import {
  Settings,
  Info,
  Code,
  AttachMoney,
  Compress,
  Memory,
  GpsFixed,
  Input,
  Output,
  Search,
  AccessTime,
  DeveloperBoard,
  LooksTwo,
  Visibility,
} from '@mui/icons-material';
import api from '../api';

const CENTRAL_API_URL = process.env.REACT_APP_CENTRAL_API_URL;

const InitCard = ({ nodeId, token, handleLogout }) => {
  const [init, setInit] = useState(null);

  useEffect(() => {
    if (!nodeId || !token) return;
    api.get(`/nodes/${nodeId}/proxy/init`)
      .then(response => {
        setInit(response.data);
      })
      .catch(error => {
        console.error('Error fetching init data:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
      });
  }, [nodeId, token, handleLogout]);

  if (!init) {
    return <Typography>Loading Initialization Info...</Typography>;
  }

  const StatItem = ({ icon, title, value }) => (
    <Grid item xs={12} sm={6} md={4}>
      <Card style={{ height: 120 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={1}>
            {icon}
            <Typography variant="subtitle1" style={{ marginLeft: 10 }}>{title}</Typography>
          </Box>
          <Typography variant="body2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h6" gutterBottom>Initialization</Typography>
      <Grid container spacing={3}>
        <StatItem icon={<AttachMoney color="primary" />} title="Coin Type" value={init.config.coin_type} />
        <StatItem icon={<Compress color="secondary" />} title="Compression Mode" value={init.config.comp_mode} />
        <StatItem icon={<Memory color="action" />} title="Device" value={init.config.device} />
        <StatItem icon={<GpsFixed color="error" />} title="GPU Grid Size" value={init.config.gpu_gridsize} />
        <StatItem icon={<Input color="success" />} title="Input File" value={init.config.input_file} />
        <StatItem icon={<Output color="info" />} title="Output File" value={init.config.output_file} />
        <StatItem icon={<Search color="primary" />} title="Search Mode" value={init.config.search_mode} />
        <StatItem icon={<AccessTime color="secondary" />} title="Timestamp" value={init.timestamp_str} />
        <StatItem icon={<Code color="action" />} title="Version" value={init.version} />
        <StatItem icon={<Memory color="error" />} title="CPU Threads" value={init.config.cpu_threads} />
        <StatItem icon={<DeveloperBoard color="success" />} title="GPU IDs" value={init.config.gpu_ids.join(', ')} />
        <StatItem icon={<LooksTwo color="info" />} title="Range Bits" value={init.config.range_bits} />
        <StatItem icon={<Input color="primary" />} title="Range End" value={init.config.range_end} />
        <StatItem icon={<Output color="secondary" />} title="Range Start" value={init.config.range_start} />
        <StatItem icon={<LooksTwo color="action" />} title="RKey MKeys" value={init.config.rkey_mkeys} />
        <StatItem icon={<Visibility color="error" />} title="SSE" value={init.config.sse ? 'Enabled' : 'Disabled'} />
      </Grid>
    </Paper>
  );
};

export default InitCard;