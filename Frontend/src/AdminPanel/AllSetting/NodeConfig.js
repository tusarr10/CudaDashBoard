
import React, { useState, useEffect } from 'react';

export default function NodeConfig({ token }) {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [config, setConfig] = useState(null); // null = not loaded, {} = empty/valid
  const [newConfig, setNewConfig] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch nodes on mount
  useEffect(() => {
    const headers = { "Authorization": `Bearer ${token}` };
    fetch("http://localhost:2225/api/nodes", { headers })
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch nodes");
        return r.json();
      })
      .then(setNodes)
      .catch(err => {
        console.error("Error fetching nodes:", err);
        setNodes([]);
      });
  }, [token]);

  // Fetch config when node changes
  useEffect(() => {
    if (!selectedNode) {
      setConfig(null);
      return;
    }

    setLoading(true);
    setError('');
    const headers = { "Authorization": `Bearer ${token}` };
    fetch(`http://localhost:2225/api/nodes/${selectedNode}/proxy/config`, { headers })
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch config");
        return r.json();
      })
      .then(data => {
        setConfig(data || {});
        setNewConfig(JSON.stringify(data, null, 2));
      })
      .catch(err => {
        console.error("Error fetching config:", err);
        setError("Could not load config. Please try again.");
        setConfig({});
      })
      .finally(() => setLoading(false));
  }, [token, selectedNode]);

  const handlePushConfig = async () => {
    if (!selectedNode) {
      alert("Please select a node first.");
      return;
    }

    // Validate JSON
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(newConfig);
    } catch (e) {
      alert("Invalid JSON format. Please check your input.");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    try {
      const response = await fetch(`http://localhost:2225/api/push-config/${selectedNode}`, {
        method: "POST",
        headers,
        body: newConfig,
      });

      if (response.ok) {
        alert("✅ Config pushed successfully!");
        // Optionally refresh current config
        fetch(`http://localhost:2225/api/nodes/${selectedNode}/proxy/config`, { headers })
          .then(r => r.json())
          .then(data => {
            setConfig(data || {});
            setNewConfig(JSON.stringify(data, null, 2));
          });
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Unknown error");
      }
    } catch (error) {
      console.error("Error pushing config:", error);
      alert(`❌ Failed to push config: ${error.message}`);
    }
  };

  return (
    <div className="settings-container">
      <h3>⚙️ Node Configuration Settings</h3>

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

      {selectedNode && (
        <>
          <div className="form-group">
            <label>Current Configuration</label>
            <div className="config-box">
              {loading ? (
                <div className="placeholder">Loading config...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : config !== null ? (
                <textarea
                  value={newConfig}
                  onChange={e => setNewConfig(e.target.value)}
                  className="config-textarea"
                  placeholder="No configuration data available."
                />
              ) : (
                <div className="placeholder">Select a node to load config.</div>
              )}
            </div>
          </div>

          <div className="button-group">
            <button
              onClick={handlePushConfig}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Pushing...' : '🚀 Push Config'}
            </button>
          </div>
        </>
      )}

      {!selectedNode && (
        <div className="info-box">
          <p>Please select a node to view and update its configuration.</p>
        </div>
      )}
    </div>
  );
}
