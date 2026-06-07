 const Mom = require('../models/momModel');
const Tracker = require('../models/trackerModel');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const getMeetings = (req, res) => {
  try {
    const meetings = Mom.getAllMeetings();
    const enrichedMeetings = meetings.map(m => {
      const points = Tracker.getTrackerByMeetingId(m.id);
      const openCount = points.filter(p => p.status === 'Open').length;
      const inProgressCount = points.filter(p => p.status === 'In Progress').length;
      const completedCount = points.filter(p => p.status === 'Completed').length;
      return { ...m, openCount, inProgressCount, completedCount };
    });
    res.status(200).json({ success: true, data: enrichedMeetings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const createMeeting = (req, res) => {
  try {
    // In a real app we validate req.body here too
    const newMeeting = Mom.createMeeting(req.body);
    res.status(201).json({ success: true, data: newMeeting });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const deleteMeeting = (req, res) => {
  try {
    const success = Mom.deleteMeeting(req.params.id);
    if (success) {
      res.status(200).json({ success: true, message: 'Meeting deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Meeting not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    let extractedText = '';
    const fileBuffer = req.file.buffer;
    const mimetype = req.file.mimetype;
    const originalname = req.file.originalname;

    if (mimetype === 'application/pdf') {
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimetype === 'application/msword' ||
      originalname.endsWith('.doc') || originalname.endsWith('.docx')
    ) {
      const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = docxData.value;
    } else if (mimetype === 'text/plain') {
      extractedText = fileBuffer.toString('utf-8');
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type' });
    }

    // Return plain text so the textarea on the frontend displays it correctly
    res.status(200).json({ success: true, data: extractedText.trim() });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: 'Error processing document' });
  }
};

module.exports = {
  getMeetings,
  createMeeting,
  deleteMeeting,
  uploadDocument
};
