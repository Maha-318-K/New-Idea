const User = require('../models/userModel');

// GET /api/v1/users
const getUsers = (req, res) => {
  try {
    const users = User.getAllUsers();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// POST /api/v1/users
const createUser = (req, res) => {
  try {
    const userData = req.body;
    
    // Basic validation
    if (!userData.name || !userData.empId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name and employee ID'
      });
    }

    const newUser = User.createUser(userData);

    res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// GET /api/v1/users/:id
const getUserById = (req, res) => {
  try {
    const user = User.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// PUT /api/v1/users/:id
const updateUser = (req, res) => {
  try {
    const updatedUser = User.updateUser(req.params.id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// PUT /api/v1/users/:id/status
const updateUserStatus = (req, res) => {
  try {
    const { status, requesterName } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    const updatedUser = User.updateUserStatus(req.params.id, status, requesterName);
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// DELETE /api/v1/users/:id
const deleteUser = (req, res) => {
  try {
    const { requesterRole, requesterName } = req.body; // In a real app, this comes from a JWT token
    const result = User.deleteUser(req.params.id, requesterRole, requesterName);
    
    if (!result.success) {
      // 403 Forbidden for RBAC failures, 404 for not found
      const status = result.error === 'User not found' ? 404 : 403;
      return res.status(status).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// GET /api/v1/users/logs/action-history
const getActionLogs = (req, res) => {
  try {
    const logs = User.getActionLogs();
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  getActionLogs
};
