const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/appSettings.json');

// Ensure directory and file exist
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

const DEFAULT_DATA = {
  requirementTriggerStatuses: ['Future Implementation']
};

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
}

const getSettings = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading app settings:', error);
    return DEFAULT_DATA;
  }
};

const saveSettings = (newData) => {
  try {
    const currentData = getSettings();
    const updatedData = { ...currentData, ...newData };
    fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2));
    return updatedData;
  } catch (error) {
    console.error('Error writing app settings:', error);
    return null;
  }
};

module.exports = {
  getSettings,
  saveSettings
};
