const { loadData, saveData } = require('../utils/dataUtils');
const QA_ISSUES_FILE = 'qaIssues.json';

const getAllQAIssues = () => {
  return loadData(QA_ISSUES_FILE);
};

const getQAIssueById = (id) => {
  const issues = loadData(QA_ISSUES_FILE);
  return issues.find(i => i.id === id);
};

const createQAIssue = (issueData) => {
  const issues = loadData(QA_ISSUES_FILE);
  // QA-2025-00100 format
  const baseId = 100;
  const maxExisting = issues.reduce((max, i) => {
    const num = parseInt(i.issueId.replace('QA-2025-', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, baseId);
  
  const newId = `QA-2025-${String(maxExisting + 1).padStart(5, '0')}`;
  
  const newIssue = {
    id: Date.now().toString(),
    issueId: newId,
    project: issueData.project || '',
    module: issueData.module || '',
    pageName: issueData.pageName || '',
    issueTitle: issueData.issueTitle || '',
    type: issueData.type || 'Functional',
    severity: issueData.severity || 'Medium',
    priority: issueData.priority || 'P3',
    status: issueData.status || 'Open',
    assignedTo: issueData.assignedTo || '',
    raisedBy: issueData.raisedBy || '',
    raisedDate: issueData.raisedDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    attachmentsCount: issueData.attachmentsCount || 0,
    issueDetails: issueData.issueDetails || '',
    attachments: issueData.attachments || [],
    comments: issueData.comments || [],
    history: issueData.history || [{
      action: 'Created',
      by: issueData.raisedBy || 'System',
      date: new Date().toISOString()
    }],
    resolvedDate: issueData.resolvedDate || ''
  };

  issues.unshift(newIssue);
  saveData(QA_ISSUES_FILE, issues);
  return newIssue;
};

const updateQAIssue = (id, updates) => {
  const issues = loadData(QA_ISSUES_FILE);
  const index = issues.findIndex(i => i.id === id);
  if (index === -1) return null;

  const oldStatus = issues[index].status;
  const newStatus = updates.status || oldStatus;
  let resolvedDate = updates.resolvedDate !== undefined ? updates.resolvedDate : issues[index].resolvedDate;

  if (oldStatus !== 'Resolved' && newStatus === 'Resolved') {
    const d = new Date();
    resolvedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Update history
  const history = issues[index].history || [];
  if (updates.historyEntry) {
    history.push(updates.historyEntry);
    delete updates.historyEntry;
  }

  // Add comment
  const comments = issues[index].comments || [];
  if (updates.newComment) {
    comments.push(updates.newComment);
    delete updates.newComment;
  }

  issues[index] = { ...issues[index], ...updates, history, comments, resolvedDate };
  saveData(QA_ISSUES_FILE, issues);
  return issues[index];
};

const deleteQAIssue = (id) => {
  const issues = loadData(QA_ISSUES_FILE);
  const index = issues.findIndex(i => i.id === id);
  if (index === -1) return false;

  issues.splice(index, 1);
  saveData(QA_ISSUES_FILE, issues);
  return true;
};

// Seed initial data if empty
const issues = loadData(QA_ISSUES_FILE);
if (issues.length === 0) {
  const seed = [
    { id: '1', issueId: 'QA-2025-00124', project: 'Evergreen Farms', module: 'POS', pageName: 'Checkout', issueTitle: 'Payment validation failed', type: 'Functional', severity: 'Critical', priority: 'P1', status: 'Open', assignedTo: 'Ravi Kumar', raisedBy: 'Mohananda', raisedDate: '30 May 2025', attachmentsCount: 3 },
    { id: '2', issueId: 'QA-2025-00123', project: 'Evergreen Farms', module: 'Payment', pageName: 'Card Details', issueTitle: 'Card number not masked', type: 'UI', severity: 'High', priority: 'P2', status: 'In Progress', assignedTo: 'Vikram Singh', raisedBy: 'Sneha Reddy', raisedDate: '30 May 2025', attachmentsCount: 2 },
    { id: '3', issueId: 'QA-2025-00122', project: 'Evergreen Farms', module: 'Dashboard', pageName: 'Home', issueTitle: 'Total sales data mismatch', type: 'Functional', severity: 'Medium', priority: 'P3', status: 'In Progress', assignedTo: 'Priya Nair', raisedBy: 'Anjali Mehta', raisedDate: '29 May 2025', attachmentsCount: 2 },
    { id: '4', issueId: 'QA-2025-00121', project: 'Evergreen Farms', module: 'Profile', pageName: 'Edit Profile', issueTitle: 'Profile image upload issue', type: 'UI', severity: 'Low', priority: 'P3', status: 'Retesting', assignedTo: 'Arjun Patel', raisedBy: 'Ravi Kumar', raisedDate: '28 May 2025', attachmentsCount: 1 },
    { id: '5', issueId: 'QA-2025-00120', project: 'Evergreen Farms', module: 'Search', pageName: 'Search Page', issueTitle: 'Search results not relevant', type: 'Functional', severity: 'High', priority: 'P2', status: 'Open', assignedTo: 'Sneha Reddy', raisedBy: 'Priya Nair', raisedDate: '27 May 2025', attachmentsCount: 1 },
    { id: '6', issueId: 'QA-2025-00119', project: 'Evergreen Farms', module: 'Settings', pageName: 'Notification', issueTitle: 'Push notification delay', type: 'Functional', severity: 'Medium', priority: 'P2', status: 'Blocked', assignedTo: 'Ravi Kumar', raisedBy: 'Vikram Singh', raisedDate: '26 May 2025', attachmentsCount: 2 },
    { id: '7', issueId: 'QA-2025-00118', project: 'Evergreen Farms', module: 'Cart', pageName: 'Cart Page', issueTitle: 'Item quantity not updating', type: 'Functional', severity: 'High', priority: 'P1', status: 'Open', assignedTo: 'Priya Nair', raisedBy: 'Anjali Mehta', raisedDate: '25 May 2025', attachmentsCount: 3 },
    { id: '8', issueId: 'QA-2025-00117', project: 'Evergreen Farms', module: 'Reports', pageName: 'Sales Report', issueTitle: 'Report export mismatch', type: 'Functional', severity: 'Medium', priority: 'P3', status: 'Resolved', assignedTo: 'Arjun Patel', raisedBy: 'Mohananda', raisedDate: '24 May 2025', attachmentsCount: 1 },
    { id: '9', issueId: 'QA-2025-00116', project: 'Evergreen Farms', module: 'Login', pageName: 'Login Page', issueTitle: 'Login button not working', type: 'Functional', severity: 'Critical', priority: 'P1', status: 'In Progress', assignedTo: 'Vikram Singh', raisedBy: 'Ravi Kumar', raisedDate: '23 May 2025', attachmentsCount: 4 },
    { id: '10', issueId: 'QA-2025-00115', project: 'Evergreen Farms', module: 'Payment', pageName: 'UPI Payment', issueTitle: 'UPI payment failure', type: 'Functional', severity: 'High', priority: 'P1', status: 'Retesting', assignedTo: 'Sneha Reddy', raisedBy: 'Priya Nair', raisedDate: '22 May 2025', attachmentsCount: 3 }
  ];
  saveData(QA_ISSUES_FILE, seed);
}

module.exports = { getAllQAIssues, getQAIssueById, createQAIssue, updateQAIssue, deleteQAIssue };
