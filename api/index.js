const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Import routes
const productRoutes = require('../routes/products');
const adminRoutes = require('../routes/admin');
const appointmentRoutes = require('../routes/appointments');
const analyticsRoutes = require('../routes/analytics');

// Import database
const { initDatabase } = require('../database/init');

const app = express();
const PORT = process.env.PORT || 3001;

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

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : ['https://monica-opto-hub.vercel.app'])
    : ['http://localhost:3001', 'http://localhost:3000'],
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

// Static file serving
app.use(express.static(path.join(__dirname, '..'), {
  maxAge: '1d',
  etag: false
}));

// Initialize database
initDatabase().then(() => {
  console.log('✅ Database initialized successfully');
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
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
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

app.get('/all-products.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'all-products.html'));
});

app.get('/brand.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'brand.html'));
});

app.get('/appointment-form.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'appointment-form.html'));
});

app.get('/men.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'men.html'));
});

app.get('/women.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'women.html'));
});

app.get('/sunglasses.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'sunglasses.html'));
});

app.get('/optical-frames.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'optical-frames.html'));
});

app.get('/contact-lenses.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'contact-lenses.html'));
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
  res.status(404).json({ error: 'Not Found' });
});

// Export for Vercel
module.exports = app;
