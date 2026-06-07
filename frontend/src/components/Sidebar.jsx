import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import logoImg from '../assets/logo.png';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  FileText, 
  Settings, 
  MessageSquare,
  ClipboardList,
  Bug,
  Moon,
  Sun,
  Folder,
  CalendarDays
} from 'lucide-react';

const Sidebar = () => {
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'dark');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <img src={logoImg} alt="Logo" className="sidebar-logo" />
        <div className="sidebar-brand-text">
          <h1>Madi</h1>
          <span>SARVOPAYA</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          <Folder size={20} />
          <span>Projects</span>
        </NavLink>
          <NavLink to="/minutes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <CalendarDays size={20} />
            <span>Minutes of Meeting</span>
          </NavLink>
          <NavLink to="/documents" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <FileText size={20} />
            <span>Documents</span>
          </NavLink>
          <NavLink to="/issues" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <AlertTriangle size={20} />
            <span>Production Issues</span>
          </NavLink>
        <NavLink to="/users" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          <Users size={20} />
          <span>Users & Roles</span>
        </NavLink>
        <NavLink to="/requirements" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <ClipboardList size={18} />
          <span>Requirements</span>
        </NavLink>
        <div style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '16px', fontSize: '12px', color: 'var(--sidebar-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          QA Workspace
        </div>
        <NavLink to="/qa-issues" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          <Bug size={20} />
          <span>Issues Management</span>
        </NavLink>
        <NavLink to="/qa-reports" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          <FileText size={20} />
          <span>QA Reports</span>
        </NavLink>
        <div style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '16px', fontSize: '12px', color: 'var(--sidebar-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Settings
        </div>
        <NavLink to="/whatsapp-settings" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          <MessageSquare size={20} />
          <span>WhatsApp Integration</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={toggleTheme} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div className="copyright">
          © 2025 Madi Sarvopaya
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
