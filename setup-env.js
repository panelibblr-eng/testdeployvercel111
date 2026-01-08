#!/usr/bin/env node

/**
 * Setup script to create .env file with MongoDB connection string
 * Run: node setup-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   If you want to recreate it, delete it first and run this script again.');
  process.exit(0);
}

// MongoDB connection string
// Password: Anusha2019 (no space, no URL encoding needed)
const envContent = `# Monica Opto Hub - Environment Variables

# Node Environment
NODE_ENV=development

# Server Port
PORT=3001

# Database Configuration
# MongoDB Connection String
# Password: Anusha2019
MONGODB_URI=mongodb+srv://lasyajeewnani_db_user:Anusha2019@cluster0.khlw1xv.mongodb.net/monica-opto-hub?appName=Cluster0

# JWT Secret (Generate a secure random string)
# For development, using a simple secret. Change in production!
JWT_SECRET=dev-secret-key-change-in-production-INSECURE

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:3000,http://127.0.0.1:3001,http://127.0.0.1:3000

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# API Configuration
API_URL=http://localhost:3001

# Analytics
ANALYTICS_ENABLED=true
`;

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ .env file created successfully!');
  console.log('');
  console.log('📝 Created with MongoDB connection string:');
  console.log('   Username: lasyajeewnani_db_user');
  console.log('   Password: Anusha2019');
  console.log('   Database: monica-opto-hub');
  console.log('');
  console.log('⚠️  IMPORTANT: Make sure MongoDB Atlas Network Access allows your IP!');
  console.log('   1. Go to MongoDB Atlas → Network Access');
  console.log('   2. Click "Add IP Address"');
  console.log('   3. Select "Allow Access from Anywhere" (0.0.0.0/0)');
  console.log('   4. Click "Confirm"');
  console.log('');
  console.log('🚀 Now restart your server: npm start');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

