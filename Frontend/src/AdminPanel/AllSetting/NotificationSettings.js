
import React, { useState, useEffect } from 'react';

export default function NotificationSettings({ token }) {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [config, setConfig] = useState(null);
  const [telegramSettings, setTelegramSettings] = useState(null);
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
      setTelegramSettings(null);
      return;
    }

    setLoading(true);
    setError('');
    const headers = { "Authorization": `Bearer ${token}` };
    fetch(`${process.env.REACT_APP_CENTRAL_API_URL}/nodes/${selectedNode}/proxy/config`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject("Failed to fetch config"))
      .then(data => {
        setConfig(data || {});
        setTelegramSettings(data.telegram || {});
      })
      .catch(err => {
        console.error("Error fetching config:", err);
        setError("Could not load config. Please try again.");
        setConfig({});
        setTelegramSettings({});
      })
      .finally(() => setLoading(false));
  }, [token, selectedNode]);

  const handleTelegramSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTelegramSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePushConfig = async () => {
    if (!selectedNode) {
      alert("Please select a node first.");
      return;
    }

    const newConfig = { ...config, telegram: telegramSettings };

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
            setTelegramSettings(data.telegram || {});
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
      <h3>⚙️ Telegram Notification Settings</h3>

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

      {selectedNode && telegramSettings && (
        <>
          <div className="form-group">
            <label>Telegram Settings</label>
            <div className="config-box">
              {loading ? <div className="placeholder">Loading config...</div> : error ? <div className="error-message">{error}</div> : (
                <div className="form-grid">
                  <label>Enabled:</label>
                  <input type="checkbox" name="enabled" checked={telegramSettings.enabled || false} onChange={handleTelegramSettingChange} />
                  <label>Bot Token:</label>
                  <input type="text" name="botToken" value={telegramSettings.botToken || ''} onChange={handleTelegramSettingChange} />
                  <label>Chat ID:</label>
                  <input type="text" name="chatId" value={telegramSettings.chatId || ''} onChange={handleTelegramSettingChange} />
                  <label>Progress Updates:</label>
                  <input type="checkbox" name="progressUpdates" checked={telegramSettings.progressUpdates || false} onChange={handleTelegramSettingChange} />
                  <label>Progress Interval (Minutes):</label>
                  <input type="number" name="progressIntervalMinutes" value={telegramSettings.progressIntervalMinutes || ''} onChange={handleTelegramSettingChange} />
                  <label>Alert High Temp:</label>
                  <input type="checkbox" name="alertHighTemp" checked={telegramSettings.alertHighTemp || false} onChange={handleTelegramSettingChange} />
                  <label>Temp Threshold:</label>
                  <input type="number" name="tempThreshold" value={telegramSettings.tempThreshold || ''} onChange={handleTelegramSettingChange} />
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
