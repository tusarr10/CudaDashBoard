import React, { useState, useEffect } from 'react';

export default function LogMonitor({ token }) {
  const [logs, setLogs] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState('central-server');

  useEffect(() => {
    const headers = { "Authorization": `Bearer ${token}` };
    fetch(`${process.env.REACT_APP_CENTRAL_API_URL}/nodes`, { headers })
      .then(r => r.json())
      .then(setNodes);
  }, [token]);

  useEffect(() => {
    const headers = { "Authorization": `Bearer ${token}` };
    let url = `${process.env.REACT_APP_CENTRAL_API_URL}/logs`;
    if (selectedNode !== 'central-server') {
      url = `${process.env.REACT_APP_CENTRAL_API_URL}/logs/${selectedNode}`;
    }
    fetch(url, { headers })
      .then(r => r.json())
      .then(setLogs);
  }, [token, selectedNode]);

  return (
    <div>
      <h3>Log Monitor</h3>
      <select value={selectedNode} onChange={e => setSelectedNode(e.target.value)}>
        <option value="central-server">Central Server</option>
        {nodes.map(n => (
          <option key={n.id} value={n.id}>{n.name}</option>
        ))}
      </select>
      <pre>{JSON.stringify(logs, null, 2)}</pre>
    </div>
  );
}