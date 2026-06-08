const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  empId: { type: String, required: true, unique: true },
  designation: { type: String, default: 'Employee' },
  role: { type: String, default: 'User' },
  status: { type: String, default: 'Active' },
  password: { type: String, required: true },
  avatar: { type: String }
}, { timestamps: true });

// Pre-save hook to generate avatar if not provided
userSchema.pre('save', function (next) {
  if (!this.avatar && this.name) {
    this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
  }
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
