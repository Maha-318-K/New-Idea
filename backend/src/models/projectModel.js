const { loadData, saveData } = require('../utils/dataUtils');

let projects = loadData('projects.json', [
  { id: 1, name: 'Default Project', description: 'Initial default project', status: 'Active', createdAt: new Date().toISOString() }
]);

module.exports = {
  getAllProjects: () => projects,
  getProjectById: (id) => projects.find(p => p.id === parseInt(id)),
  createProject: (data) => {
    const newProject = {
      id: Date.now(),
      name: data.name,
      description: data.description || '',
      status: data.status || 'Active',
      createdAt: new Date().toISOString()
    };
    projects.unshift(newProject);
    saveData('projects.json', projects);
    return newProject;
  },
  updateProject: (id, updateData) => {
    const index = projects.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updateData, id: parseInt(id) };
      saveData('projects.json', projects);
      return projects[index];
    }
    return null;
  },
  deleteProject: (id) => {
    const index = projects.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      projects.splice(index, 1);
      saveData('projects.json', projects);
      return { success: true };
    }
    return { success: false, error: 'Project not found' };
  }
};
