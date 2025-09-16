import React, { useState, useEffect } from 'react';
import { Paper, Typography, Button, Grid, Box, Card, CardContent } from '@mui/material';
import axios from 'axios';

const CENTRAL_API_URL = process.env.REACT_APP_CENTRAL_API_URL;

const NodeStatus = ({ token }) => {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [showConsole, setShowConsole] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios.get(`${CENTRAL_API_URL}/nodes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        setNodes(response.data);
      })
      .catch(error => {
        console.error('Error fetching nodes:', error);
      });
  }, [token]);

  const handleServerAction = (action) => {
    if (!selectedNode || !token) return;
    setShowConsole(true);
    setConsoleOutput(`Executing ${action}\n`);
    axios.post(`${CENTRAL_API_URL}/nodes/${selectedNode}/proxy/service-control`, { action }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        setConsoleOutput(prev => prev + `\n${action} successful!\nStatus: ${response.data.status}\nMessage: ${response.data.message}\n`);
      })
      .catch(error => {
        setConsoleOutput(prev => prev + `\nError executing ${action}: ${error.response.data.message}\n`);
      });
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h6" gutterBottom>Node Service Control</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <select
            value={selectedNode}
            onChange={e => setSelectedNode(e.target.value)}
            className="form-select"
          >
            <option value="">-- Choose a Node --</option>
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box>
            <Button variant="contained" onClick={() => handleServerAction('start')} style={{ marginRight: 10 }} disabled={!selectedNode}>
              Start
            </Button>
            <Button variant="contained" onClick={() => handleServerAction('restart')} style={{ marginRight: 10 }} disabled={!selectedNode}>
              Restart
            </Button>
            <Button variant="contained" onClick={() => handleServerAction('stop')} style={{ marginRight: 10 }} disabled={!selectedNode}>
              Stop
            </Button>
            <Button variant="contained" onClick={() => handleServerAction('status')} disabled={!selectedNode}>
              Get Current Status
            </Button>
          </Box>
        </Grid>
      </Grid>
      {showConsole && (
        <Card style={{ marginTop: 20, backgroundColor: '#212121', color: '#e0e0e0' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Console Output</Typography>
            <Box style={{ maxHeight: 200, overflow: 'auto', fontFamily: 'monospace' }}>
              <pre>{consoleOutput}</pre>
            </Box>
            <Button variant="outlined" color="inherit" onClick={() => setShowConsole(false)} style={{ marginTop: 10 }}>
              Close Console
            </Button>
          </CardContent>
        </Card>
      )}
    </Paper>
  );
};

export default NodeStatus;