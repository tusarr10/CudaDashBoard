// src/Dashboard.js (Copied from WebpageDash.txt, no changes)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, Typography, Tab, Tabs } from '@mui/material';
import api from './api';
import SystemInfo from './Dashboard/SystemInfo';
import Progress from './Dashboard/Progress';
import Found from './Dashboard/Found';
import Config from './Dashboard/Config';
import TelegramLog from './Dashboard/TelegramLog';
import BloomCard from './Dashboard/BloomCard';
import InitCard from './Dashboard/InitCard';
import LoadCard from './Dashboard/LoadCard';

const CENTRAL_API_URL = process.env.REACT_APP_CENTRAL_API_URL;

function Dashboard({ token, userRole, handleLogout }) {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [systemIdentifier, setSystemIdentifier] = useState(nodeId);
  const [tabValue, setTabValue] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [apiUrl, setApiUrl] = useState(null);

  useEffect(() => {
    const fetchNodeAndData = async () => {
      try {
        setErrorMessage(null); // Clear previous errors

        // Fetch node details to get apiUrl
        const nodesResponse = await api.get(`/nodes`);
        const currentNode = nodesResponse.data.find(node => node.id === nodeId);
        if (!currentNode) {
          setErrorMessage("Node not found.");
          return;
        }
        setApiUrl(currentNode.apiUrl);

        // Fetch dashboard data via proxy
        const dataResponse = await api.get(`/nodes/${nodeId}/proxy/data`);
        setData(dataResponse.data);
        setSystemIdentifier(dataResponse.data.system_identifier || nodeId);
      } catch (error) {
        console.error(`Error fetching data for ${nodeId}:`, error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        } else if (error.response && error.response.status === 403) {
          setErrorMessage("Access Restricted: You are not authorized to view this node.");
        } else {
          const msg = "Failed to load dashboard data.";
          setErrorMessage(msg);
          if (userRole === "admin") {
            setTimeout(() => {
              navigate("/admin");
            }, 3000); // Redirect after 3 seconds
          }
        }
      }
    };

    if (token && nodeId) {
      fetchNodeAndData();
    }
  }, [nodeId, token, userRole, navigate, handleLogout]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (errorMessage) {
    return (
      <Typography variant="h5" color="error" align="center" style={{ marginTop: 50 }}>
        {errorMessage}
      </Typography>
    );
  }

  if (!data) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>Dashboard for {systemIdentifier}</Typography>
      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Dashboard" />
        <Tab label="Found" />
        <Tab label="Config" />
        <Tab label="Telegram Log" />
      </Tabs>
      {tabValue === 0 && (
        <Grid container spacing={3} style={{ marginTop: 20 }}>
          <Grid item xs={12}>
            <SystemInfo apiUrl={apiUrl} />
          </Grid>
          <Grid item xs={12}>
            <Progress apiUrl={apiUrl} />
          </Grid>
          <Grid item xs={12}>
            <BloomCard nodeId={nodeId} token={token} handleLogout={handleLogout} />
          </Grid>
          <Grid item xs={12}>
            <InitCard nodeId={nodeId} token={token} handleLogout={handleLogout} />
          </Grid>
          <Grid item xs={12}>
            <LoadCard nodeId={nodeId} token={token} handleLogout={handleLogout} />
          </Grid>
        </Grid>
      )}
      {tabValue === 1 && (
        <Found found={data.found} />
      )}
      {tabValue === 2 && (
        <Config nodeId={nodeId} token={token} handleLogout={handleLogout} />
      )}
      {tabValue === 3 && (
        <TelegramLog nodeId={nodeId} token={token} handleLogout={handleLogout} />
      )}
    </div>
  );
}

export default Dashboard;