const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date }
});

module.exports = mongoose.model('AdminUser', adminUserSchema);

