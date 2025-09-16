import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Accordion, AccordionSummary, AccordionDetails, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../../api';

export default function ApiManagement({ token, handleLogout }) {
  const [centralEndpoints, setCentralEndpoints] = useState([]);
  const [nodeEndpoints, setNodeEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const [centralRes, nodeRes] = await Promise.all([
          api.get('/central-endpoints'),
          api.get('/node-endpoints'),
        ]);
        setCentralEndpoints(centralRes.data);
        setNodeEndpoints(nodeRes.data);
      } catch (err) {
        console.error("Error fetching API endpoints:", err);
        setError("Failed to load API endpoints.");
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEndpoints();
  }, [token, handleLogout]);

  const renderEndpointDetails = (endpoint) => (
    <Box sx={{ mt: 2, ml: 2 }}>
      <Typography variant="body2"><strong>Description:</strong> {endpoint.description}</Typography>
      {endpoint.payload && (
        <Box mt={1}>
          <Typography variant="body2"><strong>Payload Example:</strong></Typography>
          <pre style={{ backgroundColor: '#eee', padding: '10px', borderRadius: '5px' }}>
            {JSON.stringify(endpoint.payload, null, 2)}
          </pre>
        </Box>
      )}
      {endpoint.response && (
        <Box mt={1}>
          <Typography variant="body2"><strong>Response Example:</strong></Typography>
          <pre style={{ backgroundColor: '#eee', padding: '10px', borderRadius: '5px' }}>
            {JSON.stringify(endpoint.exampleResponse || endpoint.response, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );

  if (loading) {
    return <Typography>Loading API Endpoints...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h6" gutterBottom>API Management & Documentation</Typography>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>Central Server Endpoints</Typography>
        {centralEndpoints.length === 0 ? (
          <Typography>No central server endpoints found.</Typography>
        ) : (
          centralEndpoints.map((endpoint, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Chip label={endpoint.method} color={endpoint.method === 'GET' ? 'success' : endpoint.method === 'POST' ? 'primary' : endpoint.method === 'PUT' ? 'warning' : 'error'} size="small" sx={{ mr: 1 }} />
                <Typography>{endpoint.path}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderEndpointDetails(endpoint)}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>Node Endpoints (Common)</Typography>
        {nodeEndpoints.length === 0 ? (
          <Typography>No common node endpoints found.</Typography>
        ) : (
          nodeEndpoints.map((endpoint, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Chip label={endpoint.method} color={endpoint.method === 'GET' ? 'success' : endpoint.method === 'POST' ? 'primary' : endpoint.method === 'PUT' ? 'warning' : 'error'} size="small" sx={{ mr: 1 }} />
                <Typography>{endpoint.path}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderEndpointDetails(endpoint)}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Paper>
  );
}