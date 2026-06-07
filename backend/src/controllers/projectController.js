const Project = require('../models/projectModel');

const getAllProjects = (req, res) => {
  try {
    const projects = Project.getAllProjects();
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getProjectById = (req, res) => {
  try {
    const project = Project.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const createProject = (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }
    const newProject = Project.createProject(req.body);
    res.status(201).json({ success: true, data: newProject });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const updateProject = (req, res) => {
  try {
    const updatedProject = Project.updateProject(req.params.id, req.body);
    if (!updatedProject) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const deleteProject = (req, res) => {
  try {
    const result = Project.deleteProject(req.params.id);
    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
