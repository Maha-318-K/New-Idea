const { loadData, saveData } = require('../utils/dataUtils');
const DOCS_FILE = 'documents.json';

const getAllDocuments = () => {
  return loadData(DOCS_FILE);
};

const getDocumentById = (id) => {
  const docs = loadData(DOCS_FILE);
  return docs.find(d => d.id === id);
};

const createDocument = (data) => {
  const docs = loadData(DOCS_FILE);
  const baseId = 1000;
  const maxExisting = docs.reduce((max, d) => {
    const num = parseInt(d.documentId.replace('DOC-', ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, baseId);
  
  const newId = `DOC-${String(maxExisting + 1).padStart(4, '0')}`;
  
  const newDoc = {
    id: Date.now().toString(),
    documentId: newId,
    documentName: data.documentName || 'Untitled Document',
    documentType: data.documentType || 'Custom Report',
    createdBy: data.createdBy || 'System',
    createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    generatedDate: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: 'Generated',
    filters: data.filters || {},
    history: [{ action: 'Document Created', by: data.createdBy || 'System', date: new Date().toISOString() }]
  };

  docs.unshift(newDoc);
  saveData(DOCS_FILE, docs);
  return newDoc;
};

const updateDocument = (id, data) => {
  const docs = loadData(DOCS_FILE);
  const index = docs.findIndex(d => d.id === id);
  if (index === -1) return null;

  const existing = docs[index];
  const historyEntry = data.historyEntry;
  docs[index] = {
    ...existing,
    ...data,
    id: existing.id,
    history: historyEntry ? [...(existing.history || []), historyEntry] : existing.history || []
  };
  delete docs[index].historyEntry;
  saveData(DOCS_FILE, docs);
  return docs[index];
};

const deleteDocument = (id) => {
  const docs = loadData(DOCS_FILE);
  const index = docs.findIndex(d => d.id === id);
  if (index === -1) return false;

  docs.splice(index, 1);
  saveData(DOCS_FILE, docs);
  return true;
};

// Seed
const docs = loadData(DOCS_FILE);
if (docs.length === 0) {
  saveData(DOCS_FILE, [
    { id: '1', documentId: 'DOC-1001', documentName: 'May Executive Summary', documentType: 'Monthly Report', createdBy: 'Mohananda', createdDate: '01 Jun 2025', generatedDate: '01 Jun 2025 10:00 AM', status: 'Generated', filters: {} }
  ]);
}

module.exports = { getAllDocuments, getDocumentById, createDocument, deleteDocument, updateDocument };
