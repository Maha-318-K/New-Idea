const { loadData, saveData } = require('../utils/dataUtils');

let users = loadData('users.json', [
  { id: 1, name: 'Admin', empId: 'EMP0001', designation: 'System Administrator', role: 'Super Admin', status: 'Active', password: 'admin', avatar: 'https://i.pravatar.cc/150?u=admin' }
]);

let actionLogs = loadData('actionLogs.json', []);

const logAction = (whoName, what, why) => {
  actionLogs.unshift({
    id: Date.now(),
    who: whoName || 'System',
    what: what,
    why: why,
    timestamp: new Date().toISOString()
  });
  saveData('actionLogs.json', actionLogs);
};

const saveUsers = () => {
  saveData('users.json', users);
};

module.exports = {
  getAllUsers: () => {
    return users;
  },
  createUser: (userData) => {
    const newUser = {
      id: Date.now(),
      name: userData.name || 'New User',
      empId: userData.empId || 'EMP0000',
      designation: userData.designation !== undefined ? userData.designation : 'Employee',
      role: userData.role || 'User',
      status: userData.status || 'Active',
      password: userData.password || 'password123',
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'New User')}&background=random`
    };
    users.unshift(newUser);
    saveUsers();
    logAction(userData.requestedBy || 'System', 'Created User', `Created new user ${newUser.name} (${newUser.empId})`);
    return newUser;
  },
  getUserById: (id) => {
    return users.find(u => u.id === parseInt(id));
  },
  updateUser: (id, updateData) => {
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index !== -1) {
      const oldData = users[index];
      // Merge existing with updates
      users[index] = { ...users[index], ...updateData, id: parseInt(id) };
      
      // Determine what changed
      const changedFields = [];
      Object.keys(updateData).forEach(key => {
        if (key !== 'id' && key !== 'requestedBy' && key !== 'requesterRole' && oldData[key] !== updateData[key]) {
          changedFields.push(key);
        }
      });
      const changeStr = changedFields.length > 0 ? `Changed ${changedFields.join(', ')}` : 'Updated details';

      saveUsers();
      logAction(updateData.requestedBy || 'Unknown', 'Updated User', `${changeStr} for ${users[index].name}`);
      return users[index];
    }
    return null;
  },
  updateUserStatus: (id, status, requesterName) => {
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index !== -1) {
      users[index].status = status;
      saveUsers();
      logAction(requesterName || 'Unknown', 'Updated Status', `Marked ${users[index].name} as ${status}`);
      return users[index];
    }
    return null;
  },
  deleteUser: (id, requesterRole, requesterName) => {
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) return { success: false, error: 'User not found' };

    const targetUser = users[userIndex];

    // RBAC Rules
    if (requesterRole === 'User' || requesterRole === 'Employee') {
      return { success: false, error: 'Users cannot delete other users.' };
    }
    if (requesterRole === 'Admin' && (targetUser.role === 'Admin' || targetUser.role === 'Super Admin')) {
      return { success: false, error: 'Admins cannot delete other Admins or Super Admins.' };
    }
    if (requesterRole === 'Super Admin' && targetUser.name === requesterName) {
      return { success: false, error: 'Cannot delete yourself.' };
    }

    // Perform deletion
    users.splice(userIndex, 1);
    saveUsers();
    logAction(requesterName, 'Deleted User', `Deleted user ${targetUser.name} (${targetUser.role})`);
    return { success: true };
  },
  getActionLogs: () => {
    return actionLogs;
  }
};
