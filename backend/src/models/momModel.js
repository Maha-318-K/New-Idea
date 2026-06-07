const { loadData, saveData } = require('../utils/dataUtils');

let meetings = loadData('mom.json', [
  {
    id: 1,
    date: '30 May 2025',
    time: '10:30 AM',
    agendaTitle: 'Payment Gateway',
    agendaSubtitle: 'Discussion',
    pointsCount: 8,
    preparedBy: { name: 'Mohan', empId: 'EMP1005', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    attendees: 5,
    attendeesList: ['Kiran', 'Ravi Kumar', 'Ashwin', 'Lokesh', 'Mohan'],
    notes: 'Discussed stripe integration.'
  },
  {
    id: 2,
    date: '29 May 2025',
    time: '03:00 PM',
    agendaTitle: 'POS Print Issue',
    agendaSubtitle: 'Discussion',
    pointsCount: 6,
    preparedBy: { name: 'Kiran', empId: 'EMP1008', avatar: 'https://i.pravatar.cc/150?img=11' },
    attendees: 4,
    attendeesList: ['Mahanandia', 'Harsh', 'Kiran', 'Lokesh'],
    notes: 'POS printers not aligning.'
  }
]);

const saveMeetings = () => {
  saveData('mom.json', meetings);
};

module.exports = {
  getAllMeetings: () => {
    return meetings;
  },
  createMeeting: (data) => {
    const newMeeting = {
      id: Date.now(),
      date: data.date,
      time: data.time,
      agendaTitle: data.agendaTitle,
      agendaSubtitle: data.agendaSubtitle || 'Meeting',
      pointsCount: data.pointsCount || 0,
      preparedBy: {
        name: data.preparedBy,
        empId: 'EMP' + Math.floor(1000 + Math.random() * 9000), // Mock random EMP ID
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
      },
      attendees: data.attendeesCount || 0,
      attendeesList: data.attendeesList || [],
      notes: data.notes
    };
    meetings.unshift(newMeeting);
    saveMeetings();
    return newMeeting;
  },
  deleteMeeting: (id) => {
    const initialLength = meetings.length;
    meetings = meetings.filter(m => m.id !== parseInt(id));
    if (meetings.length < initialLength) {
      saveMeetings();
      return true;
    }
    return false;
  }
};
