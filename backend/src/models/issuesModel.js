const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../data/issues.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(dataPath))) {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
}

const loadIssues = () => {
  if (fs.existsSync(dataPath)) {
    try {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse issues.json:', e);
      return [];
    }
  }
  return [];
};

const saveIssues = (issues) => {
  fs.writeFileSync(dataPath, JSON.stringify(issues, null, 2));
};

let issues = loadIssues();

module.exports = {
  getAllIssues: () => issues,
  getIssueById: (id) => issues.find(i => String(i.id) === String(id)),

  createIssue: (data) => {
    // Generate PI-000X ID
    const maxNum = issues.reduce((max, i) => {
      if (typeof i.id === 'string' && i.id.startsWith('PI-')) {
        const num = parseInt(i.id.replace('PI-', ''), 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const newIdNum = maxNum > 0 ? maxNum + 1 : issues.length + 1;
    const formattedId = `PI-${String(newIdNum).padStart(4, '0')}`;

    const newIssue = {
      id: formattedId,
      pageName:    data.pageName   || '',
      issue:       data.issue      || '',
      status:      data.status     || 'Open',
      assignee:    data.assignee   || '',
      deployDate:  data.deployDate || '-',
      raisedDate:  data.raisedDate || new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      raisedSrc:   data.raisedSrc  || '',
      attachments: data.attachments || [],
      history:     [],
      priority:    data.priority   || 'Medium',
      duplicateCount: 0,
      logs:        []
    };
    issues.unshift(newIssue);
    saveIssues(issues);
    return newIssue;
  },

  updateIssue: (id, data) => {
    const idx = issues.findIndex(i => String(i.id) === String(id));
    if (idx === -1) return null;
    // Append history entry if provided
    const historyEntry = data.historyEntry;
    const existing = issues[idx];
    issues[idx] = {
      ...existing,
      ...data,
      id: existing.id,
      history: historyEntry
        ? [...(existing.history || []), historyEntry]
        : existing.history
    };
    delete issues[idx].historyEntry;
    saveIssues(issues);
    return issues[idx];
  },

  deleteIssue: (id) => {
    const before = issues.length;
    issues = issues.filter(i => String(i.id) !== String(id));
    if (issues.length < before) {
      saveIssues(issues);
      return true;
    }
    return false;
  }
};
