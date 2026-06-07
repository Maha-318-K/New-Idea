const User = require('../models/userModel');

// POST /api/v1/auth/login
const login = (req, res) => {
  try {
    const { empId, password } = req.body;

    if (!empId || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide Employee ID and Password'
      });
    }

    const users = User.getAllUsers();
    const user = users.find(u => u.empId === empId && u.password === password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Employee ID or Password'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: 'Your account is inactive. Please contact your administrator.'
      });
    }

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      token: 'simulated_jwt_token_' + user.id, // simulated token
      data: userWithoutPassword
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  login
};
