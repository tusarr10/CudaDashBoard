
import React, { useState, useEffect } from 'react';

export default function NodeSettings({ token }) {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [config, setConfig] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
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
      setAppSettings(null);
      return;
    }

    setLoading(true);
    setError('');
    const headers = { "Authorization": `Bearer ${token}` };
    fetch(`${process.env.REACT_APP_CENTRAL_API_URL}/nodes/${selectedNode}/proxy/config`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject("Failed to fetch config"))
      .then(data => {
        setConfig(data || {});
        setAppSettings(data.app || {});
      })
      .catch(err => {
        console.error("Error fetching config:", err);
        setError("Could not load config. Please try again.");
        setConfig({});
        setAppSettings({});
      })
      .finally(() => setLoading(false));
  }, [token, selectedNode]);

  const handleAppSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePushConfig = async () => {
    if (!selectedNode) {
      alert("Please select a node first.");
      return;
    }

    const newConfig = { ...config, app: appSettings };

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
            setAppSettings(data.app || {});
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
      <h3>⚙️ App Configuration Settings</h3>

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

      {selectedNode && appSettings && (
        <>
          <div className="form-group">
            <label>App Settings</label>
            <div className="config-box">
              {loading ? <div className="placeholder">Loading config...</div> : error ? <div className="error-message">{error}</div> : (
                <div className="form-grid">
                  <label>Coin Type:</label>
                  <input type="number" name="coinType" value={appSettings.coinType || ''} onChange={handleAppSettingChange} />
                  <label>Comp Mode:</label>
                  <input type="number" name="compMode" value={appSettings.compMode || ''} onChange={handleAppSettingChange} />
                  <label>GPU Auto Grid:</label>
                  <input type="checkbox" name="gpuAutoGrid" checked={appSettings.gpuAutoGrid || false} onChange={handleAppSettingChange} />
                  <label>GPU Enable:</label>
                  <input type="checkbox" name="gpuEnable" checked={appSettings.gpuEnable || false} onChange={handleAppSettingChange} />
                  <label>Input File:</label>
                  <input type="text" name="inputFile" value={appSettings.inputFile || ''} onChange={handleAppSettingChange} />
                  <label>Max Found:</label>
                  <input type="number" name="maxFound" value={appSettings.maxFound || ''} onChange={handleAppSettingChange} />
                  <label>Output File:</label>
                  <input type="text" name="outputFile" value={appSettings.outputFile || ''} onChange={handleAppSettingChange} />
                  <label>Search Mode:</label>
                  <input type="number" name="searchMode" value={appSettings.searchMode || ''} onChange={handleAppSettingChange} />
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
