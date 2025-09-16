
import React, { useState, useEffect } from 'react';

export default function WebServerSettings({ token }) {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [config, setConfig] = useState(null);
  const [serverSettings, setServerSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const headers = { "Authorization": `Bearer ${token}` };
    fetch(`${process.env.REACT_APP_CENTRAL_API_URL}/nodes`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject("Failed to fetch nodes"))
      .then(setNodes)
      .catch(err => console.error("Error fetching nodes:", err));
  }, [token]);

  useEffect(() => {
    if (!selectedNode) {
      setConfig(null);
      setServerSettings(null);
      return;
    }

    setLoading(true);
    setError('');
    const headers = { "Authorization": `Bearer ${token}` };
    fetch(`${process.env.REACT_APP_CENTRAL_API_URL}/nodes/${selectedNode}/proxy/config`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject("Failed to fetch config"))
      .then(data => {
        setConfig(data || {});
        setServerSettings(data.server || {});
      })
      .catch(err => {
        console.error("Error fetching config:", err);
        setError("Could not load config. Please try again.");
        setConfig({});
        setServerSettings({});
      })
      .finally(() => setLoading(false));
  }, [token, selectedNode]);

  const handleServerSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setServerSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePushConfig = async () => {
    if (!selectedNode) {
      alert("Please select a node first.");
      return;
    }

    const newConfig = { ...config, server: serverSettings };

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_CENTRAL_API_URL}/push-config/${selectedNode}`, {
        method: "POST",
        headers,
        body: JSON.stringify(newConfig),
      });

      if (response.ok) {
        alert("✅ Config pushed successfully!");
        // Refresh config
        fetch(`${process.env.REACT_APP_CENTRAL_API_URL}/nodes/${selectedNode}/proxy/config`, { headers })
          .then(r => r.json())
          .then(data => {
            setConfig(data || {});
            setServerSettings(data.server || {});
          });
      } else {
        throw new Error(await response.text() || "Unknown error");
      }
    } catch (error) {
      console.error("Error pushing config:", error);
      alert(`❌ Failed to push config: ${error.message}`);
    }
  };

  return (
    <div className="settings-container">
      <h3>⚙️ Web Server Configuration Settings</h3>

      <div className="form-group">
        <label htmlFor="nodeSelect">Select Node</label>
        <select
          id="nodeSelect"
          value={selectedNode}
          onChange={e => setSelectedNode(e.target.value)}
          className="form-select"
        >
          <option value="">-- Choose a Node --</option>
          {nodes.map(n => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
      </div>

      {selectedNode && serverSettings && (
        <>
          <div className="form-group">
            <label>Server Settings</label>
            <div className="config-box">
              {loading ? <div className="placeholder">Loading config...</div> : error ? <div className="error-message">{error}</div> : (
                <div className="form-grid">
                  <label>Enable API:</label>
                  <input type="checkbox" name="enableApi" checked={serverSettings.enableApi || false} onChange={handleServerSettingChange} />
                  <label>Host:</label>
                  <input type="text" name="host" value={serverSettings.host || ''} onChange={handleServerSettingChange} />
                  <label>Port:</label>
                  <input type="number" name="port" value={serverSettings.port || ''} onChange={handleServerSettingChange} />
                </div>
              )}
            </div>
          </div>

          <div className="button-group">
            <button onClick={handlePushConfig} disabled={loading} className="btn-primary">
              {loading ? 'Pushing...' : '🚀 Push Config'}
            </button>
          </div>
        </>
      )}

      {!selectedNode && <div className="info-box"><p>Please select a node to view and update its configuration.</p></div>}
    </div>
  );
}
