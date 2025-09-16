// src/Found.js (Copied from WebpageDash.txt, no changes)
import React, { useState } from 'react';
import { Paper, Typography, Grid, Card, CardContent, Box, Link as MuiLink, Button, Collapse, IconButton, Tooltip } from '@mui/material';
import { VpnKey, Link, AccessTime, Fingerprint, Visibility, VisibilityOff, ContentCopy } from '@mui/icons-material';
import { motion } from 'framer-motion';

const Found = ({ found = [] }) => {
  const BLOCKCHAIN_EXPLORER_URL = "https://www.blockchain.com/explorer/addresses/btc/";

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const FoundItemCard = ({ item }) => {
    const [expanded, setExpanded] = useState(false);

    const handleExpandClick = () => {
      setExpanded(!expanded);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#e0f2f7' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Found Key #{item.id}</Typography>
            <Box display="flex" alignItems="center" mb={1}>
              <AccessTime style={{ marginRight: 10 }} color="info" />
              <Typography variant="body2">Timestamp: {item.timestamp_str}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <VpnKey style={{ marginRight: 10 }} color="primary" />
              <Typography variant="body2">Private Key: {item.private_key_hex.substring(0, 10)}...</Typography>
              <Tooltip title="Copy Private Key">
                <IconButton size="small" onClick={() => handleCopy(item.private_key_hex)}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Fingerprint style={{ marginRight: 10 }} color="secondary" />
              <Typography variant="body2">WIF Compressed: {item.wif_compressed.substring(0, 10)}...</Typography>
              <Tooltip title="Copy WIF Compressed">
                <IconButton size="small" onClick={() => handleCopy(item.wif_compressed)}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box mt={2}>
              <Button
                variant="outlined"
                size="small"
                startIcon={expanded ? <VisibilityOff /> : <Visibility />}
                onClick={handleExpandClick}
              >
                {expanded ? 'Hide Details' : 'View Details'}
              </Button>
            </Box>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box mt={2}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Link style={{ marginRight: 10 }} color="action" />
                  <Typography variant="body2">Bech32: <MuiLink href={`${BLOCKCHAIN_EXPLORER_URL}${item.bech32}`} target="_blank" rel="noopener">{item.bech32}</MuiLink></Typography>
                  <Tooltip title="Copy Bech32">
                    <IconButton size="small" onClick={() => handleCopy(item.bech32)}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <Link style={{ marginRight: 10 }} color="error" />
                  <Typography variant="body2">P2PKH: <MuiLink href={`${BLOCKCHAIN_EXPLORER_URL}${item.p2pkh}`} target="_blank" rel="noopener">{item.p2pkh}</MuiLink></Typography>
                  <Tooltip title="Copy P2PKH">
                    <IconButton size="small" onClick={() => handleCopy(item.p2pkh)}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <Link style={{ marginRight: 10 }} color="success" />
                  <Typography variant="body2">P2SH: <MuiLink href={`${BLOCKCHAIN_EXPLORER_URL}${item.p2sh}`} target="_blank" rel="noopener">{item.p2sh}</MuiLink></Typography>
                  <Tooltip title="Copy P2SH">
                    <IconButton size="small" onClick={() => handleCopy(item.p2sh)}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h6" gutterBottom>Found Items</Typography>
      <Grid container spacing={3}>
        {found.length === 0 ? (
          <Grid item xs={12}>
            <Typography>No items found yet.</Typography>
          </Grid>
        ) : (
          found.map(item => (
            <Grid item xs={12} sm={6} md={6} key={item.id}>
              <FoundItemCard item={item} />
            </Grid>
          ))
        )}
      </Grid>
    </Paper>
  );
};

export default Found;