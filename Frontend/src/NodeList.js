// src/NodeList.js
import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Box, Typography, Button, CircularProgress, Link as RouterLink } from '@mui/material';
import api from './api';

const CENTRAL_API_URL = process.env.REACT_APP_CENTRAL_API_URL;

const NodeList = ({ token, userRole, handleLogout }) => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const nodesResponse = await api.get(`/nodes`);
      
      const nodesWithSystemInfo = await Promise.all(nodesResponse.data.map(async (node) => {
        try {
          const systemInfoResponse = await fetch(`${node.apiUrl}/system`);
          if (!systemInfoResponse.ok) {
            if (systemInfoResponse.status === 401 || systemInfoResponse.status === 403) {
              handleLogout();
            }
            throw new Error(`HTTP error! status: ${systemInfoResponse.status}`);
          }
          const systemInfo = await systemInfoResponse.json();
          return { ...node, systemInfo: systemInfo };
        } catch (error) {
          console.error(`Error fetching system info for node ${node.name}:`, error);
          return { ...node, systemInfo: null }; // Return node with null systemInfo on error
        }
      }));
      setNodes(nodesWithSystemInfo);
    } catch (error) {
      console.error('Error fetching nodes:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
      }
      alert('Failed to fetch node list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, [token, handleLogout]);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {userRole === 'admin' ? 'All Registered Nodes' : 'Your Assigned Nodes'}
      </Typography>
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Button
          variant="contained"
          onClick={fetchNodes}
          disabled={loading}
          style={{ marginRight: 10 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Refresh'}
        </Button>
        {userRole === 'admin' && (
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/admin"
          >
            Admin Panel
          </Button>
        )}
      </Box>
      <Grid container spacing={3}>
        {nodes.length === 0 ? (
          <Grid item xs={12}>
            <Typography>No nodes available.</Typography>
          </Grid>
        ) : (
          nodes.map(node => (
            <Grid item xs={12} sm={6} md={4} key={node.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {node.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    API: {node.apiUrl}
                  </Typography>
                  {node.systemInfo && (
                    <Box mt={1}>
                      <Typography variant="body2">CPU: {node.systemInfo.cpu.usage_percent}%</Typography>
                      <Typography variant="body2">GPU: {node.systemInfo.gpu.usage_percent.toFixed(0)}%</Typography>
                      <Typography variant="body2">RAM: {node.systemInfo.memory.ram_usage_percent.toFixed(2)}%</Typography>
                    </Box>
                  )}
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      component={RouterLink}
                      to={`/dashboard/${encodeURIComponent(node.name)}?apiServer=${encodeURIComponent(node.apiUrl)}`}
                    >
                      View Dashboard
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </div>
  );
};

export default NodeList;