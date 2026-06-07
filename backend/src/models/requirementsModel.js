const { loadData, saveData } = require('../utils/dataUtils');

let requirements = loadData('requirements.json', [
  { id: 'REQ-2025-0086', title: 'Add Bulk Upload for Product Images', module: 'Inventory', description: 'Users should be able to upload multiple product images at once using excel import.', priority: 'High', status: 'In Progress', requestedBy: 'Ravi Kumar', requestedDate: '30 May 2025 11:45 AM', targetDate: '10 Jun 2025' },
  { id: 'REQ-2025-0085', title: 'Generate PDF Report with Filters', module: 'Reports', description: 'Allow users to generate PDF reports with applied filters.', priority: 'Medium', status: 'Under Review', requestedBy: 'Sneha Reddy', requestedDate: '29 May 2025 04:20 PM', targetDate: '07 Jun 2025' },
  { id: 'REQ-2025-0084', title: 'Dashboard Data Refresh Issue', module: 'Dashboard', description: 'Dashboard data not auto refreshing after 30 mins.', priority: 'High', status: 'In Progress', requestedBy: 'Anjali Mehta', requestedDate: '28 May 2025 12:10 PM', targetDate: '05 Jun 2025' },
  { id: 'REQ-2025-0083', title: 'Role Based Access Control', module: 'Users & Roles', description: 'Implement role based access for all modules.', priority: 'High', status: 'Approved', requestedBy: 'Vikram Singh', requestedDate: '27 May 2025 09:15 AM', targetDate: '15 Jun 2025' },
  { id: 'REQ-2025-0082', title: 'Add Export to Excel Option', module: 'Production Issues', description: 'Provide option to export issues data to excel.', priority: 'Low', status: 'Approved', requestedBy: 'Priya Nair', requestedDate: '26 May 2025 06:50 PM', targetDate: '02 Jun 2025' },
]);

const saveRequirements = () => {
  saveData('requirements.json', requirements);
};

module.exports = {
  getAllRequirements: () => requirements,
  getRequirementById: (id) => requirements.find(r => r.id === id),
  
  createRequirement: (data) => {
    // Generate REQ-YYYY-XXXX ID
    const year = new Date().getFullYear();
    const currentYearReqs = requirements.filter(r => r.id.startsWith(`REQ-${year}-`));
    const maxNum = currentYearReqs.reduce((max, r) => {
      const num = parseInt(r.id.split('-')[2], 10);
      return num > max ? num : max;
    }, 0);
    const newIdNum = maxNum > 0 ? maxNum + 1 : 1;
    const formattedId = `REQ-${year}-${String(newIdNum).padStart(4, '0')}`;

    const newReq = {
      id: formattedId,
      title: data.title || 'Untitled Requirement',
      module: data.module || 'General',
      description: data.description || '',
      priority: data.priority || 'Medium',
      status: data.status || 'Under Review',
      requestedBy: data.requestedBy || 'System',
      requestedDate: data.requestedDate || new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      targetDate: data.targetDate || '-',
      history: []
    };
    requirements.unshift(newReq);
    saveRequirements();
    return newReq;
  },

  updateRequirement: (id, data) => {
    const idx = requirements.findIndex(r => r.id === id);
    if (idx === -1) return null;
    
    const historyEntry = data.historyEntry;
    const existing = requirements[idx];
    requirements[idx] = { 
      ...existing, 
      ...data, 
      id,
      history: historyEntry ? [...(existing.history || []), historyEntry] : (existing.history || [])
    };
    delete requirements[idx].historyEntry;
    saveRequirements();
    return requirements[idx];
  },

  deleteRequirement: (id) => {
    const before = requirements.length;
    requirements = requirements.filter(r => r.id !== id);
    if (requirements.length < before) {
      saveRequirements();
      return true;
    }
    return false;
  }
};
