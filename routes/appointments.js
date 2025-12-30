const express = require('express');
const router = express.Router();
const { ensureDatabaseConnection } = require('../database/init');
const Appointment = require('../database/models/Appointment');

// GET /api/appointments - Get all appointments with optional filtering
router.get('/', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const { status, type, search, limit, offset } = req.query;
    
    // Build MongoDB query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build query options
    const options = {
      sort: { created_at: -1 }
    };
    
    if (limit) {
      options.limit = parseInt(limit);
      if (offset) {
        options.skip = parseInt(offset);
      }
    }
    
    const appointments = await Appointment.find(query, null, options);
    
    res.json({ 
      success: true, 
      appointments: appointments.map(a => a.toObject()), 
      count: appointments.length 
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments/:id - Get single appointment
router.get('/:id', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const { id } = req.params;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(appointment.toObject());
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// POST /api/appointments - Create new appointment
router.post('/', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const {
      type,
      name,
      email,
      phone,
      service,
      preferredDate,
      preferredTime,
      message,
      source
    } = req.body;
    
    // Validate required fields
    if (!type || !name || !email || !phone || !service) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const id = 'apt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const appointment = new Appointment({
      _id: id,
      type,
      name,
      email,
      phone,
      service,
      preferred_date: preferredDate ? new Date(preferredDate) : null,
      preferred_time: preferredTime || null,
      message: message || '',
      source: source || 'Website',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    await appointment.save();
    
    res.status(201).json({ success: true, appointment: appointment.toObject() });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ success: false, error: 'Failed to create appointment' });
  }
});

// PUT /api/appointments/:id - Update appointment status
router.put('/:id', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status, updated_at: new Date() },
      { new: true }
    );
    
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    
    res.json({ success: true, appointment: appointment.toObject() });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ success: false, error: 'Failed to update appointment' });
  }
});

// DELETE /api/appointments/:id - Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    const { id } = req.params;
    
    const appointment = await Appointment.findByIdAndDelete(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment deleted successfully', id: id });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// GET /api/appointments/stats/summary - Get appointment statistics
router.get('/stats/summary', async (req, res) => {
  try {
    await ensureDatabaseConnection();
    
    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      byType,
      byStatus
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $project: { type: '$_id', count: 1, _id: 0 } }
      ]),
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ])
    ]);
    
    res.json({
      success: true,
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      byType,
      byStatus
    });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
