// src/LoadCard.js (Copied from WebpageDash.txt, no changes)
import React, { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Card, CardContent, Box } from '@mui/material';
import { CloudDownload, Message, CalendarToday } from '@mui/icons-material';
import api from '../api';

const CENTRAL_API_URL = process.env.REACT_APP_CENTRAL_API_URL;

const LoadCard = ({ nodeId, token, handleLogout }) => {
  const [load, setLoad] = useState(null);

  useEffect(() => {
    if (!nodeId || !token) return;
    api.get(`/nodes/${nodeId}/proxy/load`)
      .then(response => {
        setLoad(response.data);
      })
      .catch(error => {
        console.error('Error fetching load data:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
      });
  }, [nodeId, token, handleLogout]);

  if (!load) {
    return <Typography>Loading Address Info...</Typography>;
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
      <Typography variant="h6" gutterBottom>Address Information</Typography>
      <Grid container spacing={3}>
        <StatItem icon={<CloudDownload color="primary" />} title="Addresses Loaded" value={load.addresses_loaded} />
        <StatItem icon={<Message color="secondary" />} title="Message" value={load.message} />
        <StatItem icon={<CalendarToday color="action" />} title="Timestamp" value={load.timestamp_str} />
      </Grid>
    </Paper>
  );
};

export default LoadCard;