const { loadData, saveData } = require('../utils/dataUtils');

let trackerState = loadData('tracker.json', {
  trackerData: {}, // meetingId -> [points]
  customColumns: {
    col1: 'Page Name',
    col2: 'Issue / Point',
    col3: 'Status',
    col4: 'Assignee',
    col5: 'Staging Deployment',
    col6: 'Production Deployment'
  },
  customStatuses: [
    { name: 'Completed', color: '#22c55e' },
    { name: 'In Progress', color: '#3b82f6' },
    { name: 'Pending', color: '#eab308' },
    { name: 'Open', color: '#f8ab37' }
  ]
});

const saveTrackerState = () => {
  saveData('tracker.json', trackerState);
};

module.exports = {
  getTrackerByMeetingId: (meetingId) => {
    return trackerState.trackerData[meetingId] || [];
  },
  saveTrackerPoints: (meetingId, points) => {
    trackerState.trackerData[meetingId] = points;
    saveTrackerState();
    return trackerState.trackerData[meetingId];
  },
  getCustomColumns: () => {
    return trackerState.customColumns;
  },
  updateCustomColumns: (columns) => {
    trackerState.customColumns = { ...trackerState.customColumns, ...columns };
    saveTrackerState();
    return trackerState.customColumns;
  },
  getCustomStatuses: () => {
    return trackerState.customStatuses;
  },
  addCustomStatus: (statusObj) => {
    const exists = trackerState.customStatuses.find(s => s.name.toLowerCase() === statusObj.name.toLowerCase());
    if (!exists) {
      trackerState.customStatuses.push(statusObj);
      saveTrackerState();
    }
    return trackerState.customStatuses;
  }
};
