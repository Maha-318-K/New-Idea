const issuesModel = require('../models/issuesModel');
const appSettingsModel = require('../models/appSettingsModel');
const requirementsModel = require('../models/requirementsModel');

// GET /api/v1/issues
const getIssues = (req, res) => {
  try {
    const data = issuesModel.getAllIssues();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/issues/:id
const getIssue = (req, res) => {
  try {
    const issue = issuesModel.getIssueById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/issues
const createIssue = (req, res) => {
  try {
    const issue = issuesModel.createIssue(req.body);
    res.status(201).json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/issues/:id
const updateIssue = (req, res) => {
  try {
    const updated = issuesModel.updateIssue(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Issue not found' });

    // Auto-create requirement if status matches trigger
    const settings = appSettingsModel.getSettings();
    const triggerStatuses = settings.requirementTriggerStatuses || [];
    if (triggerStatuses.includes(updated.status) && !updated.movedToRequirement) {
      requirementsModel.createRequirement({
        title: updated.issue,
        module: updated.pageName,
        description: `Imported from Production Issue ${updated.id}: ${updated.issue}`,
        requestedBy: updated.assignee || 'System',
        priority: updated.priority || 'Medium',
        status: 'Under Review'
      });
      // Mark as moved so it doesn't trigger again
      issuesModel.updateIssue(req.params.id, { movedToRequirement: true });
      updated.movedToRequirement = true;
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/issues/:id
const deleteIssue = (req, res) => {
  try {
    const deleted = issuesModel.deleteIssue(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json({ success: true, message: 'Issue deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getIssues, getIssue, createIssue, updateIssue, deleteIssue };
