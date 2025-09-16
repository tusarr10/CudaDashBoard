import React, { useState } from 'react';
import './Sidebar.css';

export default function Sidebar({ activeSection, setActiveSection, isActive }) {
  const [openMenus, setOpenMenus] = useState({
    settings: false,
    nodeSetting: false,
    admin: false
  });

  const toggleMenu = (menuKey) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    window.location.href = '/';
  };

  return (
    <nav className={`sidebar ${isActive ? 'active' : ''}`}>
      <div className="sidebar-header">
        <h3>Admin Panel</h3>
      </div>
      <ul className="sidebar-menu">
        <li 
          className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveSection('dashboard')}
        >
          <i className="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </li>
        
        <li 
          className={`menu-item ${activeSection === 'nodes' ? 'active' : ''}`}
          onClick={() => setActiveSection('nodes')}
        >
          <i className="fas fa-server"></i>
          <span>Nodes</span>
        </li>
        
        <li 
          className={`menu-item ${activeSection === 'users' ? 'active' : ''}`}
          onClick={() => setActiveSection('users')}
        >
          <i className="fas fa-users"></i>
          <span>Users</span>
        </li>
        
        {/* ===== SETTINGS TREE ===== */}
        <li className="menu-item has-submenu">
          <ul className="submenu">
          <div 
            className={`submenu-toggle ${openMenus.settings ? 'active' : ''}`}
            onClick={() => toggleMenu('settings')}
          >
            <i className="fas fa-cog"></i>
            <span>Settings</span>
            <i className={`fas fa-chevron-${openMenus.settings ? 'up' : 'down'} submenu-arrow`}></i>
          </div>
          
          {openMenus.settings && (
            <ul className="submenu">
              {/* 1. Node Setting */}
              <li className="submenu-item has-submenu">
                <div 
                  className="submenu-toggle"
                  onClick={() => toggleMenu('nodeSetting')}
                >
                  <i className="fas fa-sitemap"></i>
                  <span>1. Node Setting</span>
                  <i className={`fas fa-chevron-${openMenus.nodeSetting ? 'up' : 'down'} submenu-arrow`}></i>
                </div>
                
                {openMenus.nodeSetting && (
                  <ul className="submenu">
                    <li 
                      className={`submenu-item ${activeSection === 'app-setting' ? 'active' : ''}`}
                      onClick={() => setActiveSection('app-setting')}
                    >
                      <i className="far fa-dot-circle"></i>
                      <span>i. App Setting</span>
                    </li>
                    <li 
                      className={`submenu-item ${activeSection === 'server-config' ? 'active' : ''}`}
                      onClick={() => setActiveSection('server-config')}
                    >
                      <i className="far fa-dot-circle"></i>
                      <span>ii. Server</span>
                    </li>
                    <li 
                      className={`submenu-item ${activeSection === 'notification' ? 'active' : ''}`}
                      onClick={() => setActiveSection('notification')}
                    >
                      <i className="far fa-dot-circle"></i>
                      <span>iii. Notification</span>
                    </li>
                    <li 
                      className={`submenu-item ${activeSection === 'log-config' ? 'active' : ''}`}
                      onClick={() => setActiveSection('log-config')}
                    >
                      <i className="far fa-dot-circle"></i>
                      <span>iv. Log</span>
                    </li>
                    <li 
                      className={`submenu-item ${activeSection === 'performance' ? 'active' : ''}`}
                      onClick={() => setActiveSection('performance')}
                    >
                      <i className="far fa-dot-circle"></i>
                      <span>v. Node Server</span>
                    </li>
                    <li 
                      className={`submenu-item ${activeSection === 'node-config' ? 'active' : ''}`}
                      onClick={() => setActiveSection('node-config')}
                    >
                      <i className="far fa-dot-circle"></i>
                      <span>vi. Node Config</span>
                    </li>
                  </ul>
                )}
                
              </li>
              
              {/* 2. Node Status */}
              <li 
                className={`submenu-item ${activeSection === 'node-status' ? 'active' : ''}`}
                onClick={() => setActiveSection('node-status')}
              >
                <i className="fas fa-chart-line"></i>
                <span>2. Node Status</span>
              </li>
              
              {/* 3. Admin */}
              <li className="submenu-item has-submenu">
                <div 
                  className="submenu-toggle"
                  onClick={() => toggleMenu('admin')}
                >
                  <i className="fas fa-user-shield"></i>
                  <span>3. Admin</span>
                  <i className={`fas fa-chevron-${openMenus.admin ? 'up' : 'down'} submenu-arrow`}></i>
                </div>
                
                {openMenus.admin && (
                  <ul className="submenu">
                    <li 
                      className={`submenu-item ${activeSection === 'proxy-config' ? 'active' : ''}`}
                      onClick={() => setActiveSection('proxy-config')}
                    >
                      <i className="far fa-dot-circle"></i>
                      <span>i. Proxy</span>
                    </li>
                    <li 
                      className={`submenu-item ${activeSection === 'system-config' ? 'active' : ''}`}
                      onClick={() => setActiveSection('system-config')}
                    >
                      <i className="far fa-dot-circle"></i>
                      <span>ii. System</span>
                    </li>
                    <li 
                      className={`submenu-item ${activeSection === 'api-management' ? 'active' : ''}`}
                      onClick={() => setActiveSection('api-management')}
                    >
                      <i className="far fa-dot-circle"></i>
                      <span>iii. API</span>
                    </li>
                    <li 
                      className={`submenu-item ${activeSection === 'security-audit' ? 'active' : ''}`}
                      onClick={() => setActiveSection('security-audit')}
                    >
                      <i className="far fa-dot-circle"></i>
                      <span>iv. Security & Audit</span>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          )}
          </ul>
        </li>
        
        <li 
          className={`menu-item ${activeSection === 'log-monitor' ? 'active' : ''}`}
          onClick={() => setActiveSection('log-monitor')}
        >
          <i className="fas fa-file-alt"></i>
          <span>Log Monitor</span>
        </li>
        
        <li 
          className="menu-item mt-auto"
          onClick={handleLogout}
        >
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </li>
      </ul>
    </nav>
  );
}
