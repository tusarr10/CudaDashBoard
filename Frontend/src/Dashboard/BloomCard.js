// src/BloomCard.js (Copied from WebpageDash.txt, no changes)
import React, { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Card, CardContent, Box } from '@mui/material';
import { FilterTiltShift, DataUsage, Functions, CalendarToday } from '@mui/icons-material';
import api from '../api';

const CENTRAL_API_URL = process.env.REACT_APP_CENTRAL_API_URL;

const BloomCard = ({ nodeId, token, handleLogout }) => {
  const [bloom, setBloom] = useState(null);

  useEffect(() => {
    if (!nodeId || !token) return;
    api.get(`/nodes/${nodeId}/proxy/bloom`)
      .then(response => {
        setBloom(response.data);
      })
      .catch(error => {
        console.error('Error fetching bloom data:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
      });
  }, [nodeId, token, handleLogout]);

  if (!bloom) {
    return <Typography>Loading Bloom Filter Info...</Typography>;
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
      <Typography variant="h6" gutterBottom>Bloom Filter</Typography>
      <Grid container spacing={3}>
        <StatItem icon={<FilterTiltShift color="primary" />} title="Bits" value={bloom.bits} />
        <StatItem icon={<DataUsage color="secondary" />} title="Bytes" value={bloom.bytes} />
        <StatItem icon={<Functions color="action" />} title="Entries" value={bloom.entries} />
        <StatItem icon={<FilterTiltShift color="error" />} title="Error Rate" value={bloom.error_rate} />
        <StatItem icon={<Functions color="success" />} title="Hash Functions" value={bloom.hash_functions} />
        <StatItem icon={<CalendarToday color="info" />} title="Timestamp" value={bloom.timestamp_str} />
      </Grid>
    </Paper>
  );
};

export default BloomCard;