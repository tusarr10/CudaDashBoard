// src/components/EditUserModal.js
import React, { useState, useEffect } from 'react';
import './ModalStyles.css';

export default function EditUserModal({ user, onClose, onRoleChange, allNodes, onAssignNodes }) {
  const [role, setRole] = useState(user.role);
  const [selectedNodesWithPermissions, setSelectedNodesWithPermissions] = useState(
    user.assignedNodes || []
  );

  const handleNodeSelection = (e) => {
    const options = Array.from(e.target.selectedOptions);
    const newSelection = options.map(opt => {
      const nodeId = opt.value;
      const existing = selectedNodesWithPermissions.find(item => item.nodeId === nodeId);
      return {
        nodeId,
        permission: existing ? existing.permission : 'read'
      };
    });
    setSelectedNodesWithPermissions(newSelection);
  };

  const handlePermissionChange = (nodeId, newPermission) => {
    setSelectedNodesWithPermissions(prev =>
      prev.map(item =>
        item.nodeId === nodeId ? { ...item, permission: newPermission } : item
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRoleChange(user.username, role);
    onAssignNodes(user.username, selectedNodesWithPermissions);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-user-edit"></i> Edit User: {user.username}</h3>
          <button className="btn-icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="editUserRole">Role</label>
            <select
              id="editUserRole"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="editUserNodes">Assign Nodes</label>
            <select
              id="editUserNodes"
              multiple
              value={selectedNodesWithPermissions.map(item => item.nodeId)}
              onChange={handleNodeSelection}
              size="5"
            >
              {allNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
            <small className="form-hint">Hold Ctrl/Cmd to select multiple</small>
          </div>

          {selectedNodesWithPermissions.length > 0 && (
            <div className="permission-section">
              <h4><i className="fas fa-shield-alt"></i> Set Permissions</h4>
              <div className="permission-list">
                {selectedNodesWithPermissions.map(item => {
                  const node = allNodes.find(n => n.id === item.nodeId);
                  return (
                    <div key={item.nodeId} className="permission-item">
                      <span className="node-name">{node?.name || item.nodeId}</span>
                      <select
                        value={item.permission}
                        onChange={(e) => handlePermissionChange(item.nodeId, e.target.value)}
                        className="permission-select"
                      >
                        <option value="read">Read</option>
                        <option value="write">Write</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <i className="fas fa-sync-alt"></i> Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}