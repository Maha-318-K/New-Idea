const { loadData, saveData } = require('../utils/dataUtils');
const AUTOMATION_FILE = 'automation.json';

const getAllAutomation = () => {
  return loadData(AUTOMATION_FILE);
};

const getAutomationById = (id) => {
  const records = loadData(AUTOMATION_FILE);
  return records.find(r => r.id === id);
};

const createAutomation = (data) => {
  const records = loadData(AUTOMATION_FILE);
  
  const total = parseInt(data.totalTestCases) || 0;
  const automated = parseInt(data.automatedCases) || 0;
  
  let status = 'Not Started';
  if (total > 0 && automated === total) {
    status = 'Completed';
  } else if (automated > 0) {
    status = 'In Progress';
  }

  const newRecord = {
    id: Date.now().toString(),
    project: data.project || '',
    module: data.module || '',
    pageName: data.pageName || '',
    totalTestCases: total,
    automatedCases: automated,
    status: status,
    lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  };

  records.unshift(newRecord);
  saveData(AUTOMATION_FILE, records);
  return newRecord;
};

const updateAutomation = (id, updates) => {
  const records = loadData(AUTOMATION_FILE);
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return null;

  const currentRecord = records[index];
  const updatedRecord = { ...currentRecord, ...updates, lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) };

  const total = parseInt(updatedRecord.totalTestCases) || 0;
  const automated = parseInt(updatedRecord.automatedCases) || 0;
  
  let status = 'Not Started';
  if (total > 0 && automated === total) {
    status = 'Completed';
  } else if (automated > 0) {
    status = 'In Progress';
  }
  
  updatedRecord.status = status;
  records[index] = updatedRecord;
  saveData(AUTOMATION_FILE, records);
  return records[index];
};

const deleteAutomation = (id) => {
  const records = loadData(AUTOMATION_FILE);
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return false;

  records.splice(index, 1);
  saveData(AUTOMATION_FILE, records);
  return true;
};

// Seed initial data if empty
const records = loadData(AUTOMATION_FILE);
if (records.length === 0) {
  const seed = [
    { id: '1', project: 'Evergreen Farms', module: 'POS', pageName: 'Checkout', totalTestCases: 45, automatedCases: 40, status: 'In Progress', lastUpdated: '30 May 2025' },
    { id: '2', project: 'Evergreen Farms', module: 'Payment', pageName: 'Card Details', totalTestCases: 25, automatedCases: 25, status: 'Completed', lastUpdated: '29 May 2025' },
    { id: '3', project: 'Evergreen Farms', module: 'Dashboard', pageName: 'Home', totalTestCases: 60, automatedCases: 15, status: 'In Progress', lastUpdated: '28 May 2025' },
    { id: '4', project: 'Evergreen Farms', module: 'Profile', pageName: 'Edit Profile', totalTestCases: 30, automatedCases: 0, status: 'Not Started', lastUpdated: '27 May 2025' }
  ];
  saveData(AUTOMATION_FILE, seed);
}

module.exports = { getAllAutomation, getAutomationById, createAutomation, updateAutomation, deleteAutomation };
