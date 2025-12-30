/**
 * SQLite to MongoDB Migration Script
 * 
 * This script migrates all data from SQLite database to MongoDB
 * 
 * Usage:
 *   node scripts/migrate-sqlite-to-mongodb.js
 * 
 * Prerequisites:
 *   1. SQLite database file exists at ./database/database.sqlite
 *   2. MongoDB connection string is set in MONGODB_URI environment variable
 *   3. Both sqlite3 and mongoose packages are installed
 */

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Import MongoDB models
const Product = require('../database/models/Product');
const Appointment = require('../database/models/Appointment');
const AdminUser = require('../database/models/AdminUser');
const WebsiteSetting = require('../database/models/WebsiteSetting');
const Analytics = require('../database/models/Analytics');

// Configuration
const SQLITE_DB_PATH = path.join(__dirname, '../database/database.sqlite');
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/monica-opto-hub';

// Statistics
const stats = {
  products: { total: 0, migrated: 0, errors: 0 },
  productImages: { total: 0, migrated: 0, errors: 0 },
  appointments: { total: 0, migrated: 0, errors: 0 },
  adminUsers: { total: 0, migrated: 0, errors: 0 },
  websiteSettings: { total: 0, migrated: 0, errors: 0 },
  analytics: { total: 0, migrated: 0, errors: 0 }
};

// Helper function to promisify SQLite queries
function sqliteQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function sqliteGet(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Connect to SQLite
function connectSQLite() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(SQLITE_DB_PATH)) {
      reject(new Error(`SQLite database not found at: ${SQLITE_DB_PATH}`));
      return;
    }

    const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Connected to SQLite database');
        resolve(db);
      }
    });
  });
}

// Connect to MongoDB
async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Migrate Products
async function migrateProducts(sqliteDb) {
  console.log('\n📦 Migrating Products...');
  
  try {
    // Get all products
    const products = await sqliteQuery(sqliteDb, 'SELECT * FROM products');
    stats.products.total = products.length;
    
    if (products.length === 0) {
      console.log('   No products to migrate');
      return;
    }

    // Get all product images
    const productImages = await sqliteQuery(sqliteDb, 'SELECT * FROM product_images ORDER BY product_id, image_order');
    stats.productImages.total = productImages.length;
    
    // Group images by product_id
    const imagesByProduct = {};
    productImages.forEach(img => {
      if (!imagesByProduct[img.product_id]) {
        imagesByProduct[img.product_id] = [];
      }
      imagesByProduct[img.product_id].push({
        image_url: img.image_url,
        image_order: img.image_order || 0,
        is_primary: Boolean(img.is_primary),
        created_at: img.created_at ? new Date(img.created_at) : new Date()
      });
    });

    // Migrate each product
    for (const product of products) {
      try {
        const productData = {
          _id: product.id,
          name: product.name,
          brand: product.brand,
          price: Number(product.price),
          category: product.category,
          gender: product.gender,
          model: product.model || '',
          description: product.description || '',
          image_url: product.image_url || '',
          featured: Boolean(product.featured),
          trending: Boolean(product.trending || 0),
          images: imagesByProduct[product.id] || [],
          created_at: product.created_at ? new Date(product.created_at) : new Date(),
          updated_at: product.updated_at ? new Date(product.updated_at) : new Date()
        };

        // If product has image_url but no images array, add it
        if (product.image_url && productData.images.length === 0) {
          productData.images.push({
            image_url: product.image_url,
            image_order: 0,
            is_primary: true,
            created_at: productData.created_at
          });
        }

        await Product.findOneAndUpdate(
          { _id: product.id },
          productData,
          { upsert: true, new: true }
        );

        stats.products.migrated++;
        if (stats.products.migrated % 10 === 0) {
          process.stdout.write(`   Migrated ${stats.products.migrated}/${stats.products.total} products...\r`);
        }
      } catch (error) {
        console.error(`\n   ❌ Error migrating product ${product.id}:`, error.message);
        stats.products.errors++;
      }
    }

    console.log(`\n   ✅ Products: ${stats.products.migrated}/${stats.products.total} migrated, ${stats.products.errors} errors`);
    console.log(`   ✅ Product Images: ${stats.productImages.total} images migrated`);
  } catch (error) {
    console.error('❌ Error migrating products:', error);
    throw error;
  }
}

// Migrate Appointments
async function migrateAppointments(sqliteDb) {
  console.log('\n📅 Migrating Appointments...');
  
  try {
    const appointments = await sqliteQuery(sqliteDb, 'SELECT * FROM appointments');
    stats.appointments.total = appointments.length;
    
    if (appointments.length === 0) {
      console.log('   No appointments to migrate');
      return;
    }

    for (const appointment of appointments) {
      try {
        const appointmentData = {
          _id: appointment.id,
          type: appointment.type,
          name: appointment.name,
          email: appointment.email,
          phone: appointment.phone,
          service: appointment.service,
          preferred_date: appointment.preferred_date ? new Date(appointment.preferred_date) : null,
          preferred_time: appointment.preferred_time || null,
          message: appointment.message || '',
          status: appointment.status || 'pending',
          source: appointment.source || 'Website',
          created_at: appointment.created_at ? new Date(appointment.created_at) : new Date(),
          updated_at: appointment.updated_at ? new Date(appointment.updated_at) : new Date()
        };

        await Appointment.findOneAndUpdate(
          { _id: appointment.id },
          appointmentData,
          { upsert: true, new: true }
        );

        stats.appointments.migrated++;
      } catch (error) {
        console.error(`   ❌ Error migrating appointment ${appointment.id}:`, error.message);
        stats.appointments.errors++;
      }
    }

    console.log(`   ✅ Appointments: ${stats.appointments.migrated}/${stats.appointments.total} migrated, ${stats.appointments.errors} errors`);
  } catch (error) {
    console.error('❌ Error migrating appointments:', error);
    throw error;
  }
}

// Migrate Admin Users
async function migrateAdminUsers(sqliteDb) {
  console.log('\n👤 Migrating Admin Users...');
  
  try {
    const adminUsers = await sqliteQuery(sqliteDb, 'SELECT * FROM admin_users');
    stats.adminUsers.total = adminUsers.length;
    
    if (adminUsers.length === 0) {
      console.log('   No admin users to migrate');
      return;
    }

    for (const user of adminUsers) {
      try {
        // Check if user already exists
        const existingUser = await AdminUser.findOne({ username: user.username });
        
        if (!existingUser) {
          const userData = {
            username: user.username,
            password_hash: user.password_hash,
            created_at: user.created_at ? new Date(user.created_at) : new Date(),
            last_login: user.last_login ? new Date(user.last_login) : null
          };

          await AdminUser.create(userData);
          stats.adminUsers.migrated++;
        } else {
          console.log(`   ⚠️  Admin user "${user.username}" already exists, skipping`);
        }
      } catch (error) {
        console.error(`   ❌ Error migrating admin user ${user.username}:`, error.message);
        stats.adminUsers.errors++;
      }
    }

    console.log(`   ✅ Admin Users: ${stats.adminUsers.migrated}/${stats.adminUsers.total} migrated, ${stats.adminUsers.errors} errors`);
  } catch (error) {
    console.error('❌ Error migrating admin users:', error);
    throw error;
  }
}

// Migrate Website Settings
async function migrateWebsiteSettings(sqliteDb) {
  console.log('\n⚙️  Migrating Website Settings...');
  
  try {
    const settings = await sqliteQuery(sqliteDb, 'SELECT * FROM website_settings');
    stats.websiteSettings.total = settings.length;
    
    if (settings.length === 0) {
      console.log('   No website settings to migrate');
      return;
    }

    for (const setting of settings) {
      try {
        const settingData = {
          setting_key: setting.setting_key,
          setting_value: setting.setting_value || '',
          created_at: setting.created_at ? new Date(setting.created_at) : new Date(),
          updated_at: setting.updated_at ? new Date(setting.updated_at) : new Date()
        };

        await WebsiteSetting.findOneAndUpdate(
          { setting_key: setting.setting_key },
          settingData,
          { upsert: true, new: true }
        );

        stats.websiteSettings.migrated++;
      } catch (error) {
        console.error(`   ❌ Error migrating setting ${setting.setting_key}:`, error.message);
        stats.websiteSettings.errors++;
      }
    }

    console.log(`   ✅ Website Settings: ${stats.websiteSettings.migrated}/${stats.websiteSettings.total} migrated, ${stats.websiteSettings.errors} errors`);
  } catch (error) {
    console.error('❌ Error migrating website settings:', error);
    throw error;
  }
}

// Migrate Analytics
async function migrateAnalytics(sqliteDb) {
  console.log('\n📊 Migrating Analytics...');
  
  try {
    const analytics = await sqliteQuery(sqliteDb, 'SELECT * FROM analytics ORDER BY timestamp');
    stats.analytics.total = analytics.length;
    
    if (analytics.length === 0) {
      console.log('   No analytics to migrate');
      return;
    }

    // Batch insert for better performance
    const batchSize = 100;
    for (let i = 0; i < analytics.length; i += batchSize) {
      const batch = analytics.slice(i, i + batchSize);
      
      try {
        const analyticsDocs = batch.map(analytics => ({
          visitor_id: analytics.visitor_id,
          page: analytics.page,
          user_agent: analytics.user_agent || '',
          referrer: analytics.referrer || '',
          ip_address: analytics.ip_address || '',
          timestamp: analytics.timestamp ? new Date(analytics.timestamp) : new Date()
        }));

        await Analytics.insertMany(analyticsDocs, { ordered: false });
        stats.analytics.migrated += batch.length;
        
        if (stats.analytics.migrated % 500 === 0) {
          process.stdout.write(`   Migrated ${stats.analytics.migrated}/${stats.analytics.total} analytics records...\r`);
        }
      } catch (error) {
        // If batch insert fails, try individual inserts
        for (const analytics of batch) {
          try {
            const analyticsData = {
              visitor_id: analytics.visitor_id,
              page: analytics.page,
              user_agent: analytics.user_agent || '',
              referrer: analytics.referrer || '',
              ip_address: analytics.ip_address || '',
              timestamp: analytics.timestamp ? new Date(analytics.timestamp) : new Date()
            };

            await Analytics.create(analyticsData);
            stats.analytics.migrated++;
          } catch (err) {
            stats.analytics.errors++;
          }
        }
      }
    }

    console.log(`\n   ✅ Analytics: ${stats.analytics.migrated}/${stats.analytics.total} migrated, ${stats.analytics.errors} errors`);
  } catch (error) {
    console.error('❌ Error migrating analytics:', error);
    throw error;
  }
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n📦 Products:        ${stats.products.migrated}/${stats.products.total} migrated, ${stats.products.errors} errors`);
  console.log(`📅 Appointments:    ${stats.appointments.migrated}/${stats.appointments.total} migrated, ${stats.appointments.errors} errors`);
  console.log(`👤 Admin Users:    ${stats.adminUsers.migrated}/${stats.adminUsers.total} migrated, ${stats.adminUsers.errors} errors`);
  console.log(`⚙️  Settings:        ${stats.websiteSettings.migrated}/${stats.websiteSettings.total} migrated, ${stats.websiteSettings.errors} errors`);
  console.log(`📊 Analytics:       ${stats.analytics.migrated}/${stats.analytics.total} migrated, ${stats.analytics.errors} errors`);
  
  const totalMigrated = 
    stats.products.migrated +
    stats.appointments.migrated +
    stats.adminUsers.migrated +
    stats.websiteSettings.migrated +
    stats.analytics.migrated;
  
  const totalErrors = 
    stats.products.errors +
    stats.appointments.errors +
    stats.adminUsers.errors +
    stats.websiteSettings.errors +
    stats.analytics.errors;
  
  console.log(`\n✅ Total Records Migrated: ${totalMigrated}`);
  if (totalErrors > 0) {
    console.log(`⚠️  Total Errors: ${totalErrors}`);
  }
  console.log('='.repeat(60));
}

// Main migration function
async function runMigration() {
  let sqliteDb = null;
  
  try {
    console.log('🚀 Starting SQLite to MongoDB Migration...\n');
    console.log(`SQLite DB: ${SQLITE_DB_PATH}`);
    console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}\n`);

    // Connect to databases
    sqliteDb = await connectSQLite();
    await connectMongoDB();

    // Run migrations
    await migrateProducts(sqliteDb);
    await migrateAppointments(sqliteDb);
    await migrateAdminUsers(sqliteDb);
    await migrateWebsiteSettings(sqliteDb);
    await migrateAnalytics(sqliteDb);

    // Print summary
    printSummary();

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (sqliteDb) {
      sqliteDb.close((err) => {
        if (err) console.error('Error closing SQLite:', err);
        else console.log('\n✅ SQLite connection closed');
      });
    }
    
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  }
}

// Run migration
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };

