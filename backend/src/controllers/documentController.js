const documentModel = require('../models/documentModel');
const requirementsModel = require('../models/requirementsModel');
const momModel = require('../models/momModel');
const qaIssuesModel = require('../models/qaIssuesModel');
const issuesModel = require('../models/issuesModel'); // Production issues

const getDocuments = (req, res) => {
  try {
    const data = documentModel.getAllDocuments();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const generateDocument = (req, res) => {
  try {
    const { documentName, documentType, createdBy, filters } = req.body;
    
    // Create DB entry
    const docRecord = documentModel.createDocument({ documentName, documentType, createdBy, filters });
    
    // Aggregation logic based on filters
    const reportData = {
      metadata: docRecord,
      requirements: [],
      mom: [],
      qaIssues: [],
      prodIssues: []
    };

    // Helper to parse DD MMM YYYY or YYYY-MM-DD to Date
    const parseDate = (dStr) => {
      if (!dStr || dStr === '-') return new Date(0);
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return new Date(0);
      return d;
    };

    const isWithinRange = (dateStr, from, to) => {
      const d = parseDate(dateStr);
      const f = from ? new Date(from) : new Date(0);
      const t = to ? new Date(to) : new Date(8640000000000000); // Max date
      
      // Reset time to start/end of day for accurate inclusive comparison
      f.setHours(0,0,0,0);
      t.setHours(23,59,59,999);
      
      return d >= f && d <= t;
    };

    if (filters.requirements && filters.requirements.selected) {
      const allReqs = requirementsModel.getAllRequirements();
      reportData.requirements = allReqs.filter(r => isWithinRange(r.requestedDate, filters.requirements.from, filters.requirements.to));
    }

    if (filters.mom && filters.mom.selected) {
      const allMoms = momModel.getAllMeetings();
      reportData.mom = allMoms.filter(m => isWithinRange(m.date, filters.mom.from, filters.mom.to));
    }

    if (filters.qaIssues && filters.qaIssues.selected) {
      const allQA = qaIssuesModel.getAllQAIssues();
      reportData.qaIssues = allQA.filter(q => isWithinRange(q.raisedDate, filters.qaIssues.from, filters.qaIssues.to));
    }

    if (filters.prodIssues && filters.prodIssues.selected) {
      const allProd = issuesModel.getAllIssues();
      reportData.prodIssues = allProd.filter(p => isWithinRange(p.raisedDate, filters.prodIssues.from, filters.prodIssues.to));
    }

    res.status(201).json({ success: true, data: reportData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteDocument = (req, res) => {
  try {
    const deleted = documentModel.deleteDocument(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDocument = (req, res) => {
  try {
    const updated = documentModel.updateDocument(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDocuments, generateDocument, deleteDocument, updateDocument };
