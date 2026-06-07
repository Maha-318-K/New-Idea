const qaIssuesModel = require('../models/qaIssuesModel');

const getQAIssues = (req, res) => {
  try {
    const data = qaIssuesModel.getAllQAIssues();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getQAIssue = (req, res) => {
  try {
    const issue = qaIssuesModel.getQAIssueById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'QA Issue not found' });
    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createQAIssue = (req, res) => {
  try {
    const issue = qaIssuesModel.createQAIssue(req.body);
    res.status(201).json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateQAIssue = (req, res) => {
  try {
    const updated = qaIssuesModel.updateQAIssue(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'QA Issue not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteQAIssue = (req, res) => {
  try {
    const deleted = qaIssuesModel.deleteQAIssue(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'QA Issue not found' });
    res.json({ success: true, message: 'QA Issue deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getQAIssues, getQAIssue, createQAIssue, updateQAIssue, deleteQAIssue };
