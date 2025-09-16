import React, { useState, useEffect } from "react";
import "./AdminPanel.css";
import Sidebar from "./Sidebar";
import EditNodeModal from "./EditNodeModal";
import EditUserModal from "./EditUserModal";
import AddNodeModal from "./AddNodeModal";
import AddUserModal from "./AddUserModal";
import api from '../api';

import NodeSettings from "./AllSetting/NodeSettings";
import WebServerSettings from "./AllSetting/WebServerSettings";
import NotificationSettings from "./AllSetting/NotificationSettings";
import LogsSettings from "./AllSetting/LogsSettings";
import StartupSettings from "./AllSetting/StartupSettings";
import ProxySettings from "./AllSetting/ProxySettings";
import SystemSettings from "./AllSetting/SystemSettings";
import ApiManagement from "./AllSetting/ApiManagement";
import SecurityAudit from "./AllSetting/SecurityAudit";
import NodeConfig from "./AllSetting/NodeConfig";
import NodeStatus from "./AllSetting/NodeStatus";
import LogMonitor from "./AllSetting/LogMonitor"; // Make sure you have this component
import ChangePasswordModal from "./ChangePasswordModal"; // Import the ChangePasswordModal

export default function AdminPanel({ token, handleLogout }) {
  const [nodes, setNodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [showEditNodeModal, setShowEditNodeModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false); // New state for password modal
  const [isSidebarActive, setIsSidebarActive] = useState(false); // For mobile toggle
  const [activeSection, setActiveSection] = useState('nodes'); // Default section

  useEffect(() => {
    Promise.all([
      api.get("/nodes").then(r => r.data),
      api.get("/users").then(r => r.data)
    ]).then(([n, u]) => {
      setNodes(n);
      setUsers(u.map(user => ({ ...user, assignedNodes: user.assignedNodes || [] })));
    }).catch(error => {
      console.error("Error fetching initial admin data:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
      }
    });
  }, [handleLogout]);

  // === All your handler functions ===
  const handleEditNodeClick = (node) => {
    setSelectedNode(node);
    setShowEditNodeModal(true);
  };

  const handleCloseNodeModal = () => {
    setShowEditNodeModal(false);
    setSelectedNode(null);
  };

  const handleUpdateNode = async (id, updatedData) => {
    try {
      const response = await api.put(`/nodes/${id}`, updatedData);
      if (response.status === 200) {
        setNodes(nodes.map((node) => (node.id === id ? { ...node, ...updatedData } : node)));
      } else {
        console.error("Failed to update node");
      }
    } catch (error) {
      console.error("Error updating node:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
      }
    }
  };

  const handleDeleteNode = async (id) => {
    if (window.confirm("Are you sure you want to delete this node?")) {
      try {
        const response = await api.delete(`/nodes/${id}`);
        if (response.status === 200) {
          setNodes(nodes.filter((node) => node.id !== id));
        } else {
          console.error("Failed to delete node");
        }
      } catch (error) {
        console.error("Error deleting node:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
      }
    }
  };

  const handleAddNode = async (newNodeData) => {
    try {
      const response = await api.post("/nodes", newNodeData);
      if (response.status === 201) {
        const newNode = response.data;
        setNodes([...nodes, newNode]);
      } else {
        console.error("Failed to add node");
      }
    } catch (error) {
      console.error("Error adding node:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
      }
    }
  };

  const handleEditUserClick = (user) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowEditUserModal(false);
    setSelectedUser(null);
  };

  const handleUpdateUserRole = async (username, newRole) => {
    if (!username) return;
    try {
      const response = await api.put(`/users/${username}/role`, { role: newRole });
      if (response.status === 200) {
        const updatedUser = response.data;
        setUsers(users.map((user) =>
          user.username === username ? { ...user, ...updatedUser } : user
        ));
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
      }
    }
  };

  const handleAssignNodesToUser = async (username, assignedNodesWithPermissions) => {
    if (!username) return;
    try {
      const response = await api.put(`/users/${username}/assign-nodes`, { assignedNodes: assignedNodesWithPermissions });
      if (response.status === 200) {
        const usersResponse = await api.get("/users");
        setUsers(usersResponse.data.map(user => ({ ...user, assignedNodes: user.assignedNodes || [] })));
      }
    } catch (error) {
      console.error("Error assigning nodes:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
      }
    }
  };

  const handleDeleteUser = async (username) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await api.delete(`/users/${username}`);
        if (response.status === 200) {
          setUsers(users.filter((user) => user.username !== username));
        } else {
          console.error("Failed to delete user");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
      }
    }
  };

  const handleAddUser = async (newUserData) => {
    try {
      const response = await api.post("/users", newUserData);
      if (response.status === 201) {
        const newUserResponse = response.data;
        setUsers([...users, { ...newUserResponse.user, assignedNodes: [] }]);
      } else {
        console.error("Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
      }
    }
  };

  const handleChangePasswordClick = (user) => {
    setSelectedUser(user);
    setShowChangePasswordModal(true);
  };

  const handleCloseChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setSelectedUser(null);
  };

  const handleUpdatePassword = async (username, password) => {
    try {
      const response = await api.put(`/users/${username}/password`, password);
      if (response.status === 200) {
        alert("Password updated successfully");
      } else {
        console.error("Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout();
      }
    }
  };

  

  // Render content based on active section
  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <h2>📊 Dashboard</h2>
            <p>Welcome to the Admin Dashboard.</p>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>{nodes.length}</h3>
                <p>Total Nodes</p>
              </div>
              <div className="stat-card">
                <h3>{users.length}</h3>
                <p>Total Users</p>
              </div>
            </div>
          </div>
        );
      case 'nodes':
        return (
          <>
            <div className="admin-actions">
              <button onClick={() => setShowAddNodeModal(true)} className="btn-primary">Add New Node</button>
            </div>
            <h3>📋 Registered Nodes ({nodes.length})</h3>
            <div className="card-container">
              {nodes.map(n => (
                <div className="card" key={n.id}>
                  <div>
                    <h4>{n.name}</h4>
                    <p><strong>API URL:</strong> {n.apiUrl}</p>
                    <p><strong>Assigned To:</strong> {n.assignedTo?.join(', ') || 'None'}</p>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => handleEditNodeClick(n)} className="btn-secondary">Edit</button>
                    <button onClick={() => handleDeleteNode(n.id)} className="btn-delete">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      case 'users':
        return (
          <>
            <div className="admin-actions">
              <button onClick={() => setShowAddUserModal(true)} className="btn-primary">Add New User</button>
            </div>
            <h3>👥 Users ({users.length})</h3>
            <div className="card-container">
              {users.map(u => (
                <div className="card" key={u.username}>
                  <div>
                    <h4>{u.username}</h4>
                    <p><strong>Role:</strong> {u.role}</p>
                    <p><strong>Assigned Nodes:</strong> {
                      u.assignedNodes?.map(item => {
                        const node = nodes.find(n => n.id === item.nodeId);
                        return node ? `${node.name} (${item.permission})` : item.nodeId;
                      }).join(', ') || 'None'
                    }</p>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => handleEditUserClick(u)} className="btn-secondary">Edit</button>
                    <button onClick={() => handleDeleteUser(u.username)} className="btn-delete">Delete</button>
                    <button onClick={() => handleChangePasswordClick(u)} className="btn-secondary">Change Password</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      
       case 'app-setting':
        return <NodeSettings token={token} handleLogout={handleLogout} />;
      case 'server-config':
        return <WebServerSettings token={token} handleLogout={handleLogout} />;
      case 'notification':
        return <NotificationSettings token={token} handleLogout={handleLogout} />;
      case 'log-config':
        return <LogsSettings token={token} handleLogout={handleLogout} />;
      case 'performance':
        return <StartupSettings token={token} handleLogout={handleLogout} />; 

    case 'node-status':
        return <NodeStatus token={token} handleLogout={handleLogout} />;

    case 'proxy-config':
        return <ProxySettings token={token} handleLogout={handleLogout} />;
      case 'system-config':
        return <SystemSettings token={token} handleLogout={handleLogout} />;
      case 'api-management':
        return <ApiManagement token={token} handleLogout={handleLogout} />;
      case 'security-audit':
        return <SecurityAudit token={token} handleLogout={handleLogout} />;
      case 'node-config':
        return <NodeConfig token={token} handleLogout={handleLogout} />;
      case 'log-monitor':
        return <LogMonitor token={token} handleLogout={handleLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-panel-container">
      {/* Toggle Button for Mobile */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsSidebarActive(!isSidebarActive)}
        aria-label="Toggle sidebar"
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isActive={isSidebarActive}
      />

      {/* Main Content */}
      <main className="main-content">
        <h2>🔐 Admin Panel</h2>
        {renderMainContent()}
      </main>

      {/* Modals */}
      {showEditNodeModal && selectedNode && (
        <EditNodeModal
          node={selectedNode}
          onClose={handleCloseNodeModal}
          onUpdate={handleUpdateNode}
          handleLogout={handleLogout}
        />
      )}
      {showEditUserModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={handleCloseUserModal}
          onRoleChange={handleUpdateUserRole}
          allNodes={nodes}
          onAssignNodes={handleAssignNodesToUser}
          handleLogout={handleLogout}
        />
      )}
      {showAddNodeModal && (
        <AddNodeModal
          onClose={() => setShowAddNodeModal(false)}
          onAdd={handleAddNode}
          handleLogout={handleLogout}
        />
      )}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onAdd={handleAddUser}
          handleLogout={handleLogout}
        />
      )}

      {showChangePasswordModal && selectedUser && (
        <ChangePasswordModal
          user={selectedUser}
          onClose={handleCloseChangePasswordModal}
          onUpdate={handleUpdatePassword}
          handleLogout={handleLogout}
        />
      )}
    </div>
  );
}