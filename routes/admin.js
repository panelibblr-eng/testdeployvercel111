const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ensureDatabaseConnection } = require('../database/init');
const AdminUser = require('../database/models/AdminUser');
const WebsiteSetting = require('../database/models/WebsiteSetting');
const Product = require('../database/models/Product');
const Appointment = require('../database/models/Appointment');
const Analytics = require('../database/models/Analytics');

// JWT Secret - MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

if (!JWT_SECRET) {
  if (isProduction) {
    console.error('❌ CRITICAL: JWT_SECRET environment variable is not set!');
    console.error('   Set JWT_SECRET in your environment variables before deploying.');
    console.error('   Generate with: openssl rand -base64 32');
    throw new Error('JWT_SECRET is required in production');
  } else {
    // Development fallback with warning
    console.warn('⚠️  WARNING: JWT_SECRET not set, using insecure development secret');
    console.warn('   Set JWT_SECRET in .env file for development');
  }
}

// Fallback for development only (never used in production)
const DEFAULT_JWT_SECRET = 'dev-secret-key-change-in-production-INSECURE';
const finalJwtSecret = JWT_SECRET || (isProduction ? null : DEFAULT_JWT_SECRET);

if (!finalJwtSecret) {
  throw new Error('JWT_SECRET is required');
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, finalJwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Enhanced error handling middleware
const handleAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// POST /api/admin/login - Admin login
router.post('/login', handleAsync(async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    await ensureDatabaseConnection();
    
    const user = await AdminUser.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    user.last_login = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        username: user.username,
        type: 'admin'
      },
      finalJwtSecret,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Login error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message || 'Login failed',
      timestamp: new Date().toISOString()
    });
  }
}));

// POST /api/admin/logout - Admin logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // You could implement token blacklisting here if needed
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/admin/profile - Get admin profile
router.get('/profile', authenticateToken, handleAsync(async (req, res) => {
  await ensureDatabaseConnection();
  
  const user = await AdminUser.findById(req.user.id).select('username created_at last_login');
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ 
    success: true, 
    user: {
      id: user._id.toString(),
      username: user.username,
      created_at: user.created_at,
      last_login: user.last_login
    }
  });
}));

// PUT /api/admin/profile - Update admin profile
router.put('/profile', authenticateToken, handleAsync(async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  await ensureDatabaseConnection();
  
  // Get current user data
  const user = await AdminUser.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Verify current password if changing password
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password required to change password' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password and update
    user.password_hash = await bcrypt.hash(newPassword, 10);
  }
  
  // Update username if provided
  if (username) {
    // Check if username already exists (excluding current user)
    const existingUser = await AdminUser.findOne({ username, _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    user.username = username;
  }
  
  await user.save();
  
  res.json({ success: true, message: 'Profile updated successfully' });
}));

// GET /api/admin/dashboard - Get dashboard data
router.get('/dashboard', authenticateToken, handleAsync(async (req, res) => {
  await ensureDatabaseConnection();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [
    totalProducts,
    featuredProducts,
    totalAppointments,
    pendingAppointments,
    totalVisitors,
    todayVisitors
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ featured: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'pending' }),
    Analytics.distinct('visitor_id').then(ids => ids.length),
    Analytics.distinct('visitor_id', { timestamp: { $gte: today } }).then(ids => ids.length)
  ]);
  
  res.json({ 
    success: true,
    totalProducts,
    featuredProducts,
    totalAppointments,
    pendingAppointments,
    totalVisitors,
    todayVisitors
  });
}));

// GET /api/admin/settings - Get website settings
router.get('/settings', authenticateToken, handleAsync(async (req, res) => {
  try {
    await ensureDatabaseConnection();
  } catch (dbError) {
    // Database not available - return empty settings so frontend can use localStorage
    console.log('⚠️ Database not available for settings, returning empty object');
    return res.json({ 
      success: true, 
      settings: {},
      message: 'Database not available. Frontend will use localStorage.' 
    });
  }
  
  try {
    const settingsDocs = await WebsiteSetting.find({});
    
    const settings = {};
    settingsDocs.forEach(doc => {
      settings[doc.setting_key] = doc.setting_value;
    });
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return empty settings instead of error
    res.json({ 
      success: true, 
      settings: {},
      message: 'Error loading settings. Using defaults.' 
    });
  }
}));

// PUT /api/admin/settings - Update website settings
router.put('/settings', authenticateToken, handleAsync(async (req, res) => {
  const settings = req.body;
  await ensureDatabaseConnection();
  
  try {
    for (const [key, value] of Object.entries(settings)) {
      await WebsiteSetting.findOneAndUpdate(
        { setting_key: key },
        { 
          setting_key: key,
          setting_value: value,
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );
    }
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
}));

// GET /api/admin/content - Get content management data
router.get('/content', authenticateToken, handleAsync(async (req, res) => {
  await ensureDatabaseConnection();
  
  // Get all content-related settings
  const contentKeys = [
    'hero_eyebrow', 'hero_title', 'hero_description',
    'whatsapp_number', 'instagram_handle', 'facebook_page',
    'site_title', 'site_description', 'contact_phone', 'contact_email'
  ];
  
  const settingsDocs = await WebsiteSetting.find({ setting_key: { $in: contentKeys } });
  
  const content = {};
  settingsDocs.forEach(doc => {
    content[doc.setting_key] = doc.setting_value;
  });
  
  // Get brands
  const brands = await Product.distinct('brand', { brand: { $ne: null } }).sort();
  
  res.json({ 
    success: true, 
    content,
    brands 
  });
}));

// PUT /api/admin/content - Update content management data
router.put('/content', authenticateToken, handleAsync(async (req, res) => {
  const { content, brands } = req.body;
  await ensureDatabaseConnection();
  
  try {
    // Update content settings
    if (content) {
      for (const [key, value] of Object.entries(content)) {
        await WebsiteSetting.findOneAndUpdate(
          { setting_key: key },
          { 
            setting_key: key,
            setting_value: value,
            updated_at: new Date()
          },
          { upsert: true, new: true }
        );
      }
    }
    
    // Note: Brands are typically managed through products, not stored separately
    // This endpoint is here for future expansion
    
    res.json({ success: true, message: 'Content updated successfully' });
  } catch (err) {
    console.error('Error updating content:', err);
    res.status(500).json({ error: 'Failed to update content', details: err.message });
  }
}));

// GET /api/admin/analytics - Get analytics data
router.get('/analytics', authenticateToken, handleAsync(async (req, res) => {
  await ensureDatabaseConnection();
  const { period = '30' } = req.query;
  
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));
  
  // Get visitor stats
  const analyticsData = await Analytics.find({ timestamp: { $gte: daysAgo } });
  
  const uniqueVisitorIds = [...new Set(analyticsData.map(a => a.visitor_id.toString()))];
  
  const visitorStats = {
    totalVisitors: uniqueVisitorIds.length,
    totalPageViews: analyticsData.length,
    uniqueVisitors: uniqueVisitorIds.length
  };
  
  // Get page analytics
  const pageAnalytics = await Analytics.aggregate([
    { $match: { timestamp: { $gte: daysAgo } } },
    {
      $group: {
        _id: '$page',
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$visitor_id' }
      }
    },
    {
      $project: {
        page: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
        _id: 0
      }
    },
    { $sort: { views: -1 } }
  ]);
  
  res.json({ 
    success: true, 
    period,
    visitorStats,
    pageAnalytics 
  });
}));

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Admin route error:', error);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
