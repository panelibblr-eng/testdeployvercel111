const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection string - use environment variable or default
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/monica-opto-hub';
console.log(MONGODB_URI);
// Global connection state
let isConnected = false;
let isInitialized = false;


// Connect to MongoDB
async function connectDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('✅ Database already connected');
    return mongoose.connection;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for Network Access propagation
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Connection timeout
      retryWrites: true,
      w: 'majority'
    });
    
    isConnected = true;
    console.log('✅ MongoDB connection established');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    isConnected = false;
    throw error;
  }
}

// Get database connection (for compatibility with existing code)
function getDatabase() {
  if (!isConnected) {
    throw new Error('Database not connected. Call initDatabase() first.');
  }
  return mongoose.connection;
}

// Initialize database and create default data
async function initDatabase() {
  if (isInitialized && isConnected) {
    console.log('Database already initialized');
    return;
  }

  try {
    // Connect to database
    const connection = await connectDatabase();
    
    // If connection failed, allow server to start anyway
    if (!connection) {
      console.log('⚠️  Database not available. Server will start in limited mode.');
      console.log('💡 Frontend will use localStorage for data storage.');
      isInitialized = true; // Mark as initialized to prevent retry loops
      return;
    }
    
    // Import models
    const AdminUser = require('./models/AdminUser');
    const WebsiteSetting = require('./models/WebsiteSetting');
    
    // Check if admin user exists
    const adminExists = await AdminUser.findOne({ username: 'admin' });
    
    if (!adminExists) {
      // Create default admin user
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await AdminUser.create({
        username: 'admin',
        password_hash: hashedPassword
      });
      console.log('✅ Default admin user created (username: admin, password: admin123)');
      console.warn('⚠️  SECURITY WARNING: Default password is insecure!');
      console.warn('   IMMEDIATELY change the admin password after first login');
      console.warn('   Go to Admin Panel → Settings → Admin Settings');
      
      // Also warn in production
      if (process.env.NODE_ENV === 'production') {
        console.error('🔴 CRITICAL: Default admin password detected in production!');
        console.error('   Change password immediately to prevent security breach!');
      }
    }
    
    // Insert default website settings
    const defaultSettings = [
      { setting_key: 'site_title', setting_value: 'MONICA OPTO HUB' },
      { setting_key: 'site_description', setting_value: 'Premium eyewear boutique offering luxury sunglasses, optical frames, and contact lenses.' },
      { setting_key: 'contact_phone', setting_value: '+91-7000532010' },
      { setting_key: 'contact_email', setting_value: 'info@example.com' },
      { setting_key: 'hero_eyebrow', setting_value: 'Now Trending' },
      { setting_key: 'hero_title', setting_value: 'Ray-Ban Meta Glasses' },
      { setting_key: 'hero_description', setting_value: 'Immersive, iconic, and innovative. Book your pair today.' },
      { setting_key: 'announcement_text', setting_value: 'Our prices are being updated to reflect GST changes. Chat with us for revised prices.' },
      { setting_key: 'announcement_visible', setting_value: 'true' },
      { setting_key: 'whatsapp_number', setting_value: '917000532010' },
      { setting_key: 'instagram_handle', setting_value: '' },
      { setting_key: 'facebook_page', setting_value: '' }
    ];
    
    for (const setting of defaultSettings) {
      await WebsiteSetting.findOneAndUpdate(
        { setting_key: setting.setting_key },
        { $set: setting },
        { upsert: true, new: true }
      );
    }
    
    console.log('✅ Default website settings inserted');
    console.log('✅ Database initialization completed');
    
    isInitialized = true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('⚠️  Server will continue without database. Frontend will use localStorage.');
    // Don't throw error - allow server to start
    isInitialized = true;
  }
}

// Ensure database connection is ready
async function ensureDatabaseConnection() {
  if (!isConnected) {
    const connection = await connectDatabase();
    if (!connection) {
      throw new Error('Database not available. Please ensure MongoDB is running or set MONGODB_URI in .env');
    }
  }
  return mongoose.connection;
}

// Close database connection (useful for testing or graceful shutdown)
async function closeDatabase() {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    isInitialized = false;
    console.log('Database connection closed');
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  ensureDatabaseConnection,
  connectDatabase,
  closeDatabase
};
