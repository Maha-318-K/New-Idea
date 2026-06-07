const Tracker = require('../models/trackerModel');
const appSettingsModel = require('../models/appSettingsModel');
const requirementsModel = require('../models/requirementsModel');

const getTracker = (req, res) => {
  try {
    const points = Tracker.getTrackerByMeetingId(req.params.meetingId);
    res.status(200).json({ success: true, data: points });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const saveTracker = (req, res) => {
  try {
    const settings = appSettingsModel.getSettings();
    const triggerStatuses = settings.requirementTriggerStatuses || [];

    const points = req.body.points.map(point => {
      if (triggerStatuses.includes(point.col3) && !point.movedToRequirement) {
        requirementsModel.createRequirement({
          title: point.col2 || 'Untitled Point',
          module: point.col1 || 'General',
          description: `Imported from MoM Tracker: ${point.col2}`,
          requestedBy: point.col4 || 'System',
          priority: 'Medium',
          status: 'Under Review'
        });
        return { ...point, movedToRequirement: true };
      }
      return point;
    });

    const savedPoints = Tracker.saveTrackerPoints(req.params.meetingId, points);
    res.status(200).json({ success: true, data: savedPoints });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getSettings = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        columns: Tracker.getCustomColumns(),
        statuses: Tracker.getCustomStatuses()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const updateColumns = (req, res) => {
  try {
    const columns = Tracker.updateCustomColumns(req.body.columns);
    res.status(200).json({ success: true, data: columns });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const addStatus = (req, res) => {
  try {
    const statuses = Tracker.addCustomStatus(req.body.status);
    res.status(201).json({ success: true, data: statuses });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getTracker,
  saveTracker,
  getSettings,
  updateColumns,
  addStatus
};
