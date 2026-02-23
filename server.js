const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Import routes
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointments');
const analyticsRoutes = require('./routes/analytics');

// Import database
const { initDatabase } = require('./database/init');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;
// Detect environment
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// Security middleware
// Security middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
    }
  } : false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - enabled for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Stricter limit in production
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration - environment-aware
let allowedOrigins;
if (isProduction) {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin) {
    console.warn('⚠️  WARNING: CORS_ORIGIN not set in production!');
    console.warn('   Set CORS_ORIGIN environment variable to your production domain');
    console.warn('   Example: CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com');
    // Allow all origins as fallback (not ideal, but better than blocking)
    allowedOrigins = ['*'];
  } else {
    // Parse multiple origins if comma-separated
    allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
  }
} else {
  allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3002', 'http://127.0.0.1:3002', 'file://'];
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);

// Add missing routes for compatibility
app.use('/api/settings', adminRoutes); // Settings routes are in admin.js

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve static files from the main website directory
app.use(express.static(path.join(__dirname), {
  // Don't serve index.html for all routes - let specific routes handle it
  index: false
}));

// Catch-all handler for SPA routing (only for routes that don't match existing files)
app.get('*', (req, res, next) => {
  // If it's an API request, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Check if the requested file exists (for .html, .css, .js, etc.)
  const requestedPath = path.join(__dirname, req.path);
  
  // If it's a request for a file with extension, check if it exists
  if (req.path.includes('.')) {
    if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
      return res.sendFile(requestedPath);
    }
    // File doesn't exist, return 404
    return res.status(404).send('File not found');
  }
  
  // For routes without file extensions (SPA routes), serve index.html
  // But first check if index.html exists
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  res.status(404).send('Page not found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid JSON in request body',
      message: 'Please check your request format'
    });
  }
  
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({ 
      success: false,
      error: 'Database constraint violation',
      message: 'The data violates database constraints'
    });
  }
  
  if (err.code === 'ENOENT') {
    return res.status(404).json({ 
      success: false,
      error: 'File not found',
      message: 'The requested resource was not found'
    });
  }
  
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Validate environment variables before starting
function validateEnvironment() {
  const warnings = [];
  const errors = [];
  
  if (isProduction) {
    // Critical checks for production
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production');
    }
    
    if (!process.env.CORS_ORIGIN) {
      warnings.push('CORS_ORIGIN not set - CORS will allow all origins (not recommended)');
    }
    
    if (!process.env.MONGODB_URI && !process.env.MONGODB_CONNECTION_STRING) {
      warnings.push('MONGODB_URI not set - database features will be limited (using localStorage)');
    }
  }
  
  // Development warnings
  if (!isProduction) {
    if (!process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET not set - using insecure development secret');
    }
  }
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
    console.warn('');
  }
  
  // Throw on errors
  if (errors.length > 0) {
    console.error('\n❌ Environment Variable Errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('');
    throw new Error('Environment validation failed. Fix the errors above before starting.');
  }
  
  return { warnings, errors };
}

// Initialize database and start server
async function startServer() {
  try {
    // Validate environment first
    validateEnvironment();
    
    // Initialize database (in-memory for Vercel, file-based for local)
    // This will not throw an error if MongoDB is unavailable
    await initDatabase();
    
    // Start server regardless of database connection status
    app.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Admin panel: http://localhost:${PORT}/admin.html`);
        console.log(`🏠 Main website: http://localhost:${PORT}/`);
        console.log(`💡 Note: If database is not connected, frontend will use localStorage`);
      } else {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`✅ Environment: Production`);
        if (process.env.CORS_ORIGIN) {
          console.log(`✅ CORS configured for: ${process.env.CORS_ORIGIN}`);
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // Still try to start server for static file serving
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (limited mode)`);
      console.log(`⚠️  Database unavailable - some features may not work`);
    });
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
