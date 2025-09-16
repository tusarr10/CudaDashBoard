// src/components/EditNodeModal.js
import React, { useState } from 'react';
import './ModalStyles.css';

export default function EditNodeModal({ node, onClose, onUpdate }) {
  const [name, setName] = useState(node.name);
  const [apiUrl, setApiUrl] = useState(node.apiUrl);
  const [wsUrl, setWsUrl] = useState(node.wsUrl);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(node.id, { name, apiUrl, wsUrl });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-edit"></i> Edit Node: {node.name}</h3>
          <button className="btn-icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="editNodeName">Node Name</label>
            <input
              id="editNodeName"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Node name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="editApiUrl">API URL</label>
            <input
              id="editApiUrl"
              type="url"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              placeholder="https://api.example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="editWsUrl">WebSocket URL</label>
            <input
              id="editWsUrl"
              type="text"
              value={wsUrl}
              onChange={e => setWsUrl(e.target.value)}
              placeholder="wss://ws.example.com"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <i className="fas fa-save"></i> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}