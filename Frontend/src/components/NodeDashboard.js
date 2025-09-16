import React, { useState, useEffect } from "react";
import NodeCard from "./NodeCard";
import api from '../api';

export default function NodeDashboard({ token, userRole, handleLogout }) {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    api.get(`/nodes`)
      .then(response => setNodes(response.data))
      .catch(err => {
        console.error("Fetch nodes error:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          handleLogout();
        }
      });
  }, [token, handleLogout]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Node Status</h2>
      {nodes.length === 0 ? (
        <p>No nodes registered yet. Add one in Admin Panel.</p>
      ) : (
        nodes.map(node => (
          <NodeCard key={node.id} node={{ ...node, wsUrl: node.wsUrl.startsWith('ws://') || node.wsUrl.startsWith('wss://') ? node.wsUrl : `ws://${node.wsUrl}` }} userRole={userRole} />
        ))
      )}
    </div>
  );
}