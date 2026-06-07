import React, { useState, useContext, useEffect, useRef } from 'react';
import './Navbar.css';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown,
  Folder,
  LogOut,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjectContext } from '../context/ProjectContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { projects, activeProject, setActiveProject } = useContext(ProjectContext);
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="menu-btn">
          <Menu size={20} />
        </button>
        <div className="project-selector">
          <Folder size={16} className="folder-icon" />
          <select 
            value={activeProject} 
            onChange={(e) => setActiveProject(e.target.value)}
            className="project-select"
          >
            <option value="All">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="navbar-right">
        <div className="search-bar">
          <input type="text" placeholder="Search anything..." />
          <Search size={16} className="search-icon" />
        </div>
        
        <div className="nav-actions">
          <div className="notif-wrapper" ref={notifRef}>
            <button className="icon-btn" onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
              <Bell size={20} />
              <span className="badge">3</span>
            </button>
            {showNotifDropdown && (
              <div className="dropdown-menu notif-dropdown">
                <h4>Notifications</h4>
                <div className="notif-list">
                  <div className="notif-item">
                    <span className="notif-dot"></span>
                    <div className="notif-content">
                      <p>New Production Issue reported in Payment Gateway</p>
                      <small>2 mins ago</small>
                    </div>
                  </div>
                  <div className="notif-item">
                    <span className="notif-dot"></span>
                    <div className="notif-content">
                      <p>Requirement 'Mobile App V2' updated</p>
                      <small>1 hour ago</small>
                    </div>
                  </div>
                  <div className="notif-item">
                    <span className="notif-dot"></span>
                    <div className="notif-content">
                      <p>MOM for 'Sprint Planning' created</p>
                      <small>3 hours ago</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="user-profile-wrapper" ref={profileRef}>
          <div className="user-profile" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
            <div className="avatar">
              <img src={user?.avatar || "https://ui-avatars.com/api/?name=User"} alt="User Avatar" />
            </div>
            <div className="user-info">
              <span className="user-id">{user?.empId || 'EMP0000'}</span>
              <span className="user-name">{user?.name || 'Guest'}</span>
            </div>
            <ChevronDown size={14} className="chevron" />
          </div>

          {showProfileDropdown && (
            <div className="dropdown-menu profile-dropdown">
              <div className="profile-header">
                <div className="profile-avatar">
                  <img src={user?.avatar || "https://ui-avatars.com/api/?name=User"} alt="Avatar" />
                </div>
                <div className="profile-details">
                  <strong>{user?.name || 'Guest User'}</strong>
                  <span>{user?.empId || 'EMP0000'}</span>
                </div>
              </div>
              <div className="profile-meta">
                <div className="meta-row">
                  <User size={14} /> <span>{user?.role || 'User'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Designation:</span> <span>{user?.designation || 'Employee'}</span>
                </div>
              </div>
              <div className="profile-footer">
                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
