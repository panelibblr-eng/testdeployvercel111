// Netlify Function Handler for Express App
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const productRoutes = require('../../routes/products');
const adminRoutes = require('../../routes/admin');
const appointmentRoutes = require('../../routes/appointments');
const analyticsRoutes = require('../../routes/analytics');

// Import database
const { initDatabase } = require('../../database/init');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS configuration - allow Netlify domain
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, allow Netlify domains and custom domains
    if (process.env.NODE_ENV === 'production') {
      // Netlify provides URL and DEPLOY_PRIME_URL automatically
      const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
      const customOrigin = process.env.CORS_ORIGIN;
      
      // Check if origin matches site URL or custom origin
      if (customOrigin) {
        const allowedOrigins = customOrigin.split(',').map(url => url.trim());
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }
      
      // Allow Netlify subdomains
      if (origin.includes('.netlify.app') || origin.includes('.netlify.com')) {
        return callback(null, true);
      }
      
      // Allow same origin as site URL
      if (siteUrl && origin.startsWith(siteUrl)) {
        return callback(null, true);
      }
      
      // For now, allow all (can be restricted later for security)
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database (non-blocking)
let dbInitialized = false;
initDatabase().then(() => {
  console.log('✅ Database initialized successfully');
  dbInitialized = true;
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
  // Don't block the server, but log the error
});

// API routes
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbInitialized ? 'connected' : 'initializing'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Export as Netlify function handler
exports.handler = serverless(app);
