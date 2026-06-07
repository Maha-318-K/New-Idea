const appSettingsModel = require('../models/appSettingsModel');

const getSettings = (req, res) => {
  try {
    const data = appSettingsModel.getSettings();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSettings = (req, res) => {
  try {
    const updated = appSettingsModel.saveSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSettings, updateSettings };
