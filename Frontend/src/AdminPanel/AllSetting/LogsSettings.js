import React, { useState, useEffect } from 'react';
import { Paper, Typography, Button, Grid, Card, CardContent, Box, Collapse } from '@mui/material';
import { Send, Delete, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../api';

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

export default function LogsSettings({ token, handleLogout }) {
  const [log, setLog] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = () => {
    if (!token) return;
    // Assuming a generic endpoint for admin logs
    api.get('/api/server-logs')
      .then(response => {
        setLog(response.data);
      })
      .catch(error => {
        console.error('Error fetching admin logs:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [token, handleLogout]);

  const handleViewDetails = (index) => {
    setExpandedLogId(expandedLogId === index ? null : index);
  };

  if (!log) {
    return <Typography>Loading Admin Logs...</Typography>;
  }

  // Assuming the log structure is an array of log entries directly
  // If the structure is nested like TelegramLog, this part needs adjustment
  const logs = log; // Adjust this based on actual API response structure

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h6" gutterBottom>Admin Logs</Typography>
      <Box mb={2}>
        <Button variant="contained" color="primary" onClick={fetchLogs}>
          Refresh Logs
        </Button>
      </Box>
      <div style={{ maxHeight: 600, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {logs.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No logs found.</Typography>
            </Grid>
          ) : (
            logs.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Card style={{ backgroundColor: '#e0f2f7' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">{item.timestamp || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Level:</strong> {item.level || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Message:</strong> {item.message || 'N/A'}</Typography>
                    <Box mt={2}>
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
                        {formatTelegramMessage(item.details || item.message)}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </div>
    </Paper>
  );
}
