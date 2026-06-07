const automationModel = require('../models/automationModel');

const getAutomations = (req, res) => {
  try {
    const data = automationModel.getAllAutomation();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAutomation = (req, res) => {
  try {
    const record = automationModel.getAutomationById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAutomation = (req, res) => {
  try {
    const record = automationModel.createAutomation(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateAutomation = (req, res) => {
  try {
    const updated = automationModel.updateAutomation(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAutomation = (req, res) => {
  try {
    const deleted = automationModel.deleteAutomation(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAutomations, getAutomation, createAutomation, updateAutomation, deleteAutomation };
