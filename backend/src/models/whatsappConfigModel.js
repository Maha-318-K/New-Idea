const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/whatsappConfig.json');

// Ensure directory and file exist
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

const DEFAULT_DATA = {
  monitoredGroups: [],
  lastSyncTime: null,
  lastProcessedMessageTime: null,
  processedMessageIds: [],
  issueDefaultGroup: null,
  connectedDeviceId: null,
  lastMessageSent: null,
  messagesSentCount: 0,
  auditLogs: []
};

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
}

const getConfig = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading WhatsApp config:', error);
    return DEFAULT_DATA;
  }
};

const saveConfig = (newData) => {
  try {
    const currentData = getConfig();
    const updatedData = { ...currentData, ...newData };
    
    // Keep processedMessageIds bounded to last 1000 messages to prevent infinite growth
    if (updatedData.processedMessageIds && updatedData.processedMessageIds.length > 1000) {
      updatedData.processedMessageIds = updatedData.processedMessageIds.slice(-1000);
    }

    // Keep audit logs bounded
    if (updatedData.auditLogs && updatedData.auditLogs.length > 500) {
      updatedData.auditLogs = updatedData.auditLogs.slice(-500);
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2));
  } catch (error) {
    console.error('Error writing WhatsApp config:', error);
  }
};

module.exports = {
  getConfig,
  saveConfig
};
