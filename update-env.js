#!/usr/bin/env node

/**
 * Update .env file with correct MongoDB password
 * Run: node update-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('   Run: node setup-env.js');
  process.exit(1);
}

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Update MONGODB_URI with correct password
// Replace any existing MONGODB_URI line with the correct one
const newMongoUri = 'MONGODB_URI=mongodb+srv://lasyajeewnani_db_user:Anusha2019@cluster0.khlw1xv.mongodb.net/monica-opto-hub?appName=Cluster0';

// Check if MONGODB_URI exists in file
if (envContent.includes('MONGODB_URI=')) {
  // Replace the entire MONGODB_URI line (handles multi-line values)
  envContent = envContent.replace(/MONGODB_URI=.*/g, newMongoUri);
  console.log('✅ Updated MONGODB_URI in .env file');
} else {
  // Add MONGODB_URI if it doesn't exist
  envContent += '\n' + newMongoUri + '\n';
  console.log('✅ Added MONGODB_URI to .env file');
}

// Write updated content back
try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('');
  console.log('📝 Updated connection string:');
  console.log('   Username: lasyajeewnani_db_user');
  console.log('   Password: Anusha2019');
  console.log('   Database: monica-opto-hub');
  console.log('');
  console.log('🚀 Now restart your server: npm start');
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  process.exit(1);
}

