// src/components/AddNodeModal.js
import React, { useState } from 'react';
import api from '../api'; // Import the API instance
import axios from 'axios'; // Import axios directly for CancelToken
import './ModalStyles.css';

export default function AddNodeModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({name, apiUrl, wsUrl });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    let apiStatus = false;
    let wsStatus = false;

    // Test API URL
    try {
      // Use a timeout for the API request
      const source = axios.CancelToken.source();
      const timeout = setTimeout(() => {
        source.cancel('API test timed out');
      }, 5000); // 5 seconds timeout

      const res = await api.get(`${apiUrl}/system`, { cancelToken: source.token });
      console.log("API Test Response:", res);
      console.log("API URL:", apiUrl + "/system");
      clearTimeout(timeout);
      if (res.status === 200) {
        apiStatus = true;
        // Fetch system_identifier after successful API test
        try {
          const idRes = await api.get(`${apiUrl}/system_identifier`);
          if (idRes.status === 200 && idRes.data && idRes.data.system_identifier) {
            setName(idRes.data.system_identifier);
          }
        } catch (idError) {
          console.error("Error fetching system identifier after API test:", idError);
        }
      }
    } catch (error) {
      console.error("API Test Error:", error);
      apiStatus = false;
    }

    // Test WebSocket URL
    try {
      const ws = new WebSocket(wsUrl);
      const wsPromise = new Promise((resolve, reject) => {
        ws.onopen = () => {
          ws.close();
          resolve(true);
        };
        ws.onerror = () => {
          ws.close();
          reject(false);
        };
        ws.onmessage = () => {}; // No-op
        setTimeout(() => {
          reject(false); // WebSocket test timeout
        }, 5000);
      });
      wsStatus = await wsPromise;
    } catch (error) {
      console.error("WebSocket Test Error:", error);
      wsStatus = false;
    }

    setTestResult({ api: apiStatus, ws: wsStatus });
    setTesting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-user-plus"></i> Add New Node</h3>
          <button className="btn-icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">

          <div className="form-group">
            <label htmlFor="node_Name">Node Name:</label>
            <input
              id="Name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter Node Name "
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="nodeApiUrl">API URL:</label>
            <input
              id="nodeApiUrl"
              type="text"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              placeholder="e.g., http://localhost:8080"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="nodeWsUrl">WebSocket URL:</label>
            <input
              id="nodeWsUrl"
              type="text"
              value={wsUrl}
              onChange={e => setWsUrl(e.target.value)}
              placeholder="e.g., ws://localhost:8080"
              required
            />
          </div>

          {testResult && (
            <div className="form-group">
              <label>Test Results:</label>
              <p style={{ color: testResult.api ? 'green' : 'red' }}>API: {testResult.api ? 'Online' : 'Offline'}</p>
              <p style={{ color: testResult.ws ? 'green' : 'red' }}>WebSocket: {testResult.ws ? 'Online' : 'Offline'}</p>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={handleTestConnection} disabled={testing} className="btn-secondary">
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button type="submit" className="btn-primary">Add Node</button>
          </div>
        </form>
      </div>
    </div>
  );
}