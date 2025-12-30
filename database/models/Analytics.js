const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  visitor_id: { type: String, required: true },
  page: { type: String, required: true },
  user_agent: { type: String, default: '' },
  referrer: { type: String, default: '' },
  ip_address: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

// Indexes for better query performance
analyticsSchema.index({ timestamp: -1 });
analyticsSchema.index({ visitor_id: 1 });
analyticsSchema.index({ page: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);

