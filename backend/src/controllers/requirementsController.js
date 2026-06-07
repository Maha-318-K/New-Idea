const requirementsModel = require('../models/requirementsModel');

const getRequirements = (req, res) => {
  try {
    const data = requirementsModel.getAllRequirements();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRequirement = (req, res) => {
  try {
    const reqItem = requirementsModel.getRequirementById(req.params.id);
    if (!reqItem) return res.status(404).json({ success: false, message: 'Requirement not found' });
    res.json({ success: true, data: reqItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createRequirement = (req, res) => {
  try {
    const newReq = requirementsModel.createRequirement(req.body);
    res.status(201).json({ success: true, data: newReq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateRequirement = (req, res) => {
  try {
    const updated = requirementsModel.updateRequirement(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Requirement not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteRequirement = (req, res) => {
  try {
    const deleted = requirementsModel.deleteRequirement(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Requirement not found' });
    res.json({ success: true, message: 'Requirement deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getRequirements, getRequirement, createRequirement, updateRequirement, deleteRequirement };
