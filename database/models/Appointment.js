const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  preferred_date: { type: Date },
  preferred_time: { type: String },
  message: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'completed', 'cancelled'] },
  source: { type: String, default: 'Website' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { _id: true });

// Indexes
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ type: 1 });
appointmentSchema.index({ created_at: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

