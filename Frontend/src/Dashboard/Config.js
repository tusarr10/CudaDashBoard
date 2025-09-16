// src/Config.js (Copied from WebpageDash.txt, no changes)
import React, { useState, useEffect } from 'react';
import { Paper, Typography, Button, Grid, TextField, Box, Switch, FormControlLabel, Card, CardContent } from '@mui/material';
import api from '../api';

const CENTRAL_API_URL = process.env.REACT_APP_CENTRAL_API_URL;

// Helper function to get a nested value from an object
const getNestedValue = (obj, path) => {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

// Helper function to set a nested value in an object (immutably)
const setNestedValue = (obj, path, value) => {
  const newObj = { ...obj };
  let current = newObj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]] || typeof current[path[i]] !== 'object') {
      current[path[i]] = Array.isArray(getNestedValue(obj, path.slice(0, i + 1))) ? [] : {};
    }
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
  return newObj;
};

const Config = ({ nodeId, token, handleLogout }) => {
  const [config, setConfig] = useState(null);
  const [editedConfig, setEditedConfig] = useState({});
  const [consoleOutput, setConsoleOutput] = useState('');
  const [showConsole, setShowConsole] = useState(false);

  const fetchConfig = () => {
    if (!nodeId || !token) return;
    api.get(`/nodes/${nodeId}/proxy/config`)
      .then(response => {
        setConfig(response.data);
        setEditedConfig(response.data);
      })
      .catch(error => {
        console.error('Error fetching config:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
        alert('Error fetching config');
      });
  };

  useEffect(() => {
    fetchConfig();
  }, [nodeId, token, handleLogout]);

  const handleChange = (path, value) => {
    setEditedConfig(prevConfig => setNestedValue(prevConfig, path, value));
  };

  const handleSave = () => {
    if (!nodeId || !token) return;
    api.put(`/nodes/${nodeId}/proxy/config`, editedConfig)
      .then(response => {
        alert('Config saved successfully');
      })
      .catch(error => {
        console.error('Error saving config:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
        alert('Error saving config');
      });
  };

  const handleServerAction = (action) => {
    if (!nodeId || !token) return;
    setShowConsole(true);
    setConsoleOutput(`Executing ${action}...
`);
    api.get(`/nodes/${nodeId}/proxy/serverstatus`)
      .then(response => {
        setConsoleOutput(prev => prev + `
${action} successful!
Status: ${response.data.status}
Message: ${response.data.message}
Uptime: ${response.data.uptime}
CPU Usage: ${response.data.cpu_usage}
Memory Usage: ${response.data.memory_usage}
`);
      })
      .catch(error => {
        console.error('Error executing server action:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
        setConsoleOutput(prev => prev + `
Error executing ${action}: ${error.message}
`);
      });
  };


  const renderConfigFields = (obj, path = []) => {
    return Object.keys(obj).map(key => {
      const currentPath = [...path, key];
      const value = getNestedValue(editedConfig, currentPath); // Get value from editedConfig state
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
          <Grid item xs={12} key={key}>
            <Paper elevation={1} style={{ padding: 15, marginBottom: 15, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom>{key}</Typography>
              <Grid container spacing={2}>
                {renderConfigFields(value, currentPath)}
              </Grid>
            </Paper>
          </Grid>
        );
      } else if (Array.isArray(value)) {
        return (
          <Grid item xs={12} key={key}>
            <Paper elevation={1} style={{ padding: 15, marginBottom: 15, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom>{key} (Array)</Typography>
              {value.map((item, index) => (
                <TextField
                  key={index}
                  label={`${key}[${index}]`}
                  value={item}
                  onChange={(e) => {
                    const newArray = [...value];
                    newArray[index] = e.target.value;
                    handleChange(currentPath, newArray);
                  }}
                  fullWidth
                  margin="normal"
                />
              ))}
            </Paper>
          </Grid>
        );
      } else {
        // Handle boolean values with Switch
        if (typeof value === 'boolean') {
          return (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <FormControlLabel
                control={
                  <Switch
                    checked={value}
                    onChange={(e) => handleChange(currentPath, e.target.checked)}
                    name={key}
                    color="primary"
                  />
                }
                label={key}
              />
            </Grid>
          );
        }
        // Handle other types with TextField
        return (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <TextField
              label={key}
              value={value}
              onChange={(e) => handleChange(currentPath, e.target.value)}
              fullWidth
              margin="normal"
            />
          </Grid>
        );
      }
    });
  };

  if (!config) {
    return <Typography>Loading Configuration...</Typography>;
  }

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h6" gutterBottom>Configuration</Typography>
      <Box mb={2}>
        <Button variant="contained" color="primary" onClick={fetchConfig} style={{ marginRight: 10 }}>
          Refresh
        </Button>
        <Button variant="contained" color="secondary" onClick={handleSave} style={{ marginRight: 10 }}>
          Save
        </Button>
        <Button variant="contained" onClick={() => handleServerAction('Start')} style={{ marginRight: 10 }}>
          Start
        </Button>
        <Button variant="contained" onClick={() => handleServerAction('Restart')} style={{ marginRight: 10 }}>
          Restart
        </Button>
        <Button variant="contained" onClick={() => handleServerAction('Stop')} style={{ marginRight: 10 }}>
          Stop
        </Button>
        <Button variant="contained" onClick={() => handleServerAction('Get Current Status')}> 
          Get Current Status
        </Button>
      </Box>
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
      <Grid container spacing={2}>
        {renderConfigFields(config)}
      </Grid>
    </Paper>
  );
};

export default Config;