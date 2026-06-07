import React, { useState, useEffect } from 'react';
import { Plus, Folder, Calendar, ArrowRight, Search, Activity, MoreVertical } from 'lucide-react';
import './Projects.css';
import { ProjectContext } from '../context/ProjectContext';

const Projects = () => {
  const { projects, refreshProjects } = React.useContext(ProjectContext);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Active' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({ name: '', description: '', status: 'Active' });
        refreshProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>Manage and organize your release management projects</p>
        </div>
        <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Project
        </button>
      </div>

      <div className="projects-grid">
        {loading ? (
          <div className="loading-state">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">No projects found. Create one to get started!</div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div className="project-icon">
                  <Folder size={24} />
                </div>
                <div className={`status-badge ${project.status.toLowerCase()}`}>
                  {project.status}
                </div>
              </div>
              <div className="project-info">
                <h3>{project.name}</h3>
                <p>{project.description || 'No description provided.'}</p>
              </div>
              <div className="project-footer">
                <div className="project-meta">
                  <Calendar size={14} />
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <button className="view-btn">
                  Manage <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Project</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g. Q4 Release, Mobile App Revamp"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the project..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Planned">Planned</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
