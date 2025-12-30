const mongoose = require('mongoose');

const websiteSettingSchema = new mongoose.Schema({
  setting_key: { type: String, required: true, unique: true },
  setting_value: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WebsiteSetting', websiteSettingSchema);

