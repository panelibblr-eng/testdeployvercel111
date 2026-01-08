#!/usr/bin/env node

/**
 * Test MongoDB connection
 * Run: node test-mongodb-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

console.log('🔍 Testing MongoDB connection...');
console.log('📝 Connection string:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
console.log('');

// Test connection with longer timeout
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅ MongoDB connection successful!');
  console.log('✅ Database:', mongoose.connection.db.databaseName);
  console.log('✅ Ready state:', mongoose.connection.readyState);
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB connection failed!');
  console.error('');
  console.error('Error details:');
  console.error('  Code:', error.code);
  console.error('  Message:', error.message);
  console.error('');
  
  if (error.code === 'EREFUSED' || error.message.includes('querySrv')) {
    console.error('🔴 DNS Resolution Error');
    console.error('');
    console.error('Possible causes:');
    console.error('  1. Network Access in MongoDB Atlas not configured');
    console.error('  2. Network Access changes not yet propagated (wait 2-5 minutes)');
    console.error('  3. Firewall/antivirus blocking DNS queries');
    console.error('  4. Internet connection issue');
    console.error('');
    console.error('Solutions:');
    console.error('  ✓ Check MongoDB Atlas → Network Access → Ensure 0.0.0.0/0 is Active');
    console.error('  ✓ Wait 2-5 minutes after adding Network Access');
    console.error('  ✓ Flush DNS: ipconfig /flushdns');
    console.error('  ✓ Check firewall/antivirus settings');
    console.error('  ✓ Test connection with MongoDB Compass');
  } else if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
    console.error('🔴 Authentication Error');
    console.error('');
    console.error('Possible causes:');
    console.error('  1. Wrong username or password');
    console.error('  2. Password not URL-encoded (if it has special characters)');
    console.error('  3. User doesn\'t exist or has wrong permissions');
    console.error('');
    console.error('Solutions:');
    console.error('  ✓ Verify username: lasyajeewnani_db_user');
    console.error('  ✓ Verify password in MongoDB Atlas → Database Access');
    console.error('  ✓ Update .env file with correct password');
  } else {
    console.error('  Check the error message above for details');
  }
  
  process.exit(1);
});

// Close connection after test
setTimeout(() => {
  mongoose.connection.close();
}, 5000);

