// src/TelegramLog.js (Copied from WebpageDash.txt, no changes)
import React, { useState, useEffect } from 'react';
import { Paper, Typography, Button, Grid, Card, CardContent, Box, Collapse } from '@mui/material';
import { Send, Delete, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../api';

const CENTRAL_API_URL = process.env.REACT_APP_CENTRAL_API_URL;

const formatTelegramMessage = (message) => {
  let formattedMessage = message;

  // Replace **text** with <strong>text</strong>
  formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Replace *text* with <em>text</em>
  formattedMessage = formattedMessage.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Replace `code` with <code>code</code>
  formattedMessage = formattedMessage.replace(/`(.*?)`/g, '<code>$1</code>');
  // Replace escaped parentheses
  formattedMessage = formattedMessage.replace(/\\\(|\\\)/g, (match) => {
    if (match === '\\(') return '(';
    if (match === '\\)') return ')';
    return match;
  });
  // Replace newlines with <br />
  formattedMessage = formattedMessage.replace(/\n/g, '<br />');

  // Replace specific patterns with emojis
  formattedMessage = formattedMessage.replace(/\?\? \*CryptoHunt Status Update\* /g, '💻 <strong>CryptoHunt Status Update</strong> ');
  formattedMessage = formattedMessage.replace(/\?\? Keys Scanned: /g, '🔑 Keys Scanned: ');
  formattedMessage = formattedMessage.replace(/\?\? Progress: /g, '🚀 Progress: ');
  formattedMessage = formattedMessage.replace(/\? Speed: /g, '⚡ Speed: ');
  formattedMessage = formattedMessage.replace(/\?\? Found Keys: /g, '💎 Found Keys: ');
  formattedMessage = formattedMessage.replace(/\?\?\? CPU: /g, '🧠 CPU: ');
  formattedMessage = formattedMessage.replace(/\?\? GPU: /g, '🖥️ GPU: ');
  formattedMessage = formattedMessage.replace(/\?\? RAM: /g, '💾 RAM: ');
  formattedMessage = formattedMessage.replace(/\?\? Match Found!/g, '🎉 <strong>Match Found!</strong>');
  formattedMessage = formattedMessage.replace(/\?\? Time: /g, '⏰ Time: ');
  formattedMessage = formattedMessage.replace(/\?\? Hex Key: /g, '🔑 Hex Key: ');
  formattedMessage = formattedMessage.replace(/\?\? Private Key \(WIF\): /g, '🔑 Private Key (WIF): ');
  formattedMessage = formattedMessage.replace(/\?\? Legacy: /g, '🔗 Legacy: ');
  formattedMessage = formattedMessage.replace(/\?\? P2SH: /g, '🔗 P2SH: ');
  formattedMessage = formattedMessage.replace(/\?\? SegWit: /g, '🔗 SegWit: ');

  return <div dangerouslySetInnerHTML={{ __html: formattedMessage }} />;
};

const TelegramLog = ({ nodeId, token, handleLogout }) => {
  const [log, setLog] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = () => {
    if (!nodeId || !token) return;
    api.get(`/nodes/${nodeId}/proxy/telegramstatus`)
      .then(response => {
        setLog(response.data);
      })
      .catch(error => {
        console.error('Error fetching telegram status:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [nodeId, token, handleLogout]);


  const handleViewDetails = (index) => {
    setExpandedLogId(expandedLogId === index ? null : index);
  };

  if (!log) {
    return <Typography>Loading Telegram Logs...</Typography>;
  }

  // Find the system and its logs
  const systemId = Object.keys(log.systems)[0];
  const systemName = Object.keys(log.systems[systemId])[0];
  const logs = log.systems[systemId][systemName];

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h6" gutterBottom>Telegram Log</Typography>
      <Box mb={2}>
        <Button variant="contained" color="primary" onClick={fetchLogs}>
          Refresh Logs
        </Button>
      </Box>
      <div style={{ maxHeight: 600, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {logs.map((item, index) => (
            <Grid item xs={12} key={index}>
              <Card style={{ backgroundColor: '#f3e5f5' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">{item.time}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {item.status}</Typography>
                  <Typography variant="body2"><strong>Current Status:</strong> {item.current_status}</Typography>
                  <Typography variant="body2"><strong>Error:</strong> {item.error}</Typography>
                  <Box mt={2}>
                    <Button variant="outlined" size="small" startIcon={<Send />} style={{ marginRight: 10 }}>
                      Send Again
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<Delete />} style={{ marginRight: 10 }}>
                      Delete This
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={expandedLogId === index ? <VisibilityOff /> : <Visibility />}
                      onClick={() => handleViewDetails(index)}
                    >
                      {expandedLogId === index ? 'Hide Details' : 'View Details'}
                    </Button>
                  </Box>
                  <Collapse in={expandedLogId === index} timeout="auto" unmountOnExit>
                    <Box mt={2}>
                      {formatTelegramMessage(item.message)}
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </div>
    </Paper>
  );
};

export default TelegramLog;