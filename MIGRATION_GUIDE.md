# SQLite to MongoDB Migration Guide

This guide will help you migrate your existing SQLite data to MongoDB.

## Prerequisites

1. **SQLite database file exists**: Make sure your SQLite database is at `./database/database.sqlite`
2. **MongoDB connection**: Set up your MongoDB connection string in `.env` file
3. **Dependencies installed**: Run `npm install` to install required packages (including `sqlite3` for migration)

## Step-by-Step Migration

### 1. Install Dependencies

First, make sure all dependencies are installed, including `sqlite3` which is needed for the migration:

```bash
npm install
```

### 2. Configure MongoDB Connection

Make sure your `.env` file has the MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/monica-opto-hub
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/monica-opto-hub
```

### 3. Backup Your SQLite Database (Recommended)

Before migration, create a backup of your SQLite database:

```bash
# On Windows
copy database\database.sqlite database\database.sqlite.backup

# On Linux/Mac
cp database/database.sqlite database/database.sqlite.backup
```

### 4. Run the Migration Script

Execute the migration script:

```bash
npm run migrate-sqlite
```

Or directly:

```bash
node scripts/migrate-sqlite-to-mongodb.js
```

### 5. Verify Migration

The script will output a summary showing:
- Number of records migrated for each table
- Any errors encountered
- Total records migrated

Example output:
```
📋 MIGRATION SUMMARY
============================================================

📦 Products:        150/150 migrated, 0 errors
📅 Appointments:   45/45 migrated, 0 errors
👤 Admin Users:     1/1 migrated, 0 errors
⚙️  Settings:        12/12 migrated, 0 errors
📊 Analytics:       1250/1250 migrated, 0 errors

✅ Total Records Migrated: 1458
============================================================
```

## What Gets Migrated?

The migration script migrates the following data:

1. **Products** (`products` table)
   - All product information
   - Product images are embedded in the product document
   - Images from `product_images` table are merged into the `images` array

2. **Appointments** (`appointments` table)
   - All appointment records with status, dates, and customer information

3. **Admin Users** (`admin_users` table)
   - Admin user accounts with hashed passwords
   - Existing users are skipped if they already exist in MongoDB

4. **Website Settings** (`website_settings` table)
   - All website configuration settings

5. **Analytics** (`analytics` table)
   - Visitor tracking data
   - Migrated in batches for better performance

## Data Transformation

The migration script automatically handles:

- **Data Type Conversion**: SQLite types are converted to MongoDB-compatible types
- **Date Conversion**: SQLite date strings are converted to JavaScript Date objects
- **Boolean Conversion**: SQLite integers (0/1) are converted to MongoDB booleans
- **Embedded Documents**: Product images are embedded in product documents
- **ID Preservation**: Original IDs are preserved using MongoDB's `_id` field

## Troubleshooting

### Error: SQLite database not found

**Solution**: Make sure the SQLite database file exists at `./database/database.sqlite`

### Error: MongoDB connection failed

**Solution**: 
- Check your `MONGODB_URI` in `.env` file
- Verify MongoDB is running (if using local MongoDB)
- Check network connectivity (if using MongoDB Atlas)
- Verify credentials are correct

### Error: Duplicate key errors

**Solution**: The script uses `upsert` operations, so existing records will be updated. If you see duplicate key errors, it might be due to:
- Running the migration multiple times (this is safe, records will be updated)
- Manual data conflicts

### Partial Migration

If the migration fails partway through:
1. Check the error messages in the console
2. Fix any issues (database connection, permissions, etc.)
3. Run the migration again - it's safe to run multiple times (uses upsert)

## After Migration

1. **Test your application**: Start your server and verify all data is accessible
   ```bash
   npm run dev
   ```

2. **Verify data in MongoDB**: You can use MongoDB Compass or mongo shell to verify:
   ```bash
   # Using mongo shell
   mongo mongodb://localhost:27017/monica-opto-hub
   > use monica-opto-hub
   > db.products.count()
   > db.appointments.count()
   ```

3. **Keep SQLite backup**: Don't delete the SQLite database immediately - keep it as a backup for a few days

4. **Update documentation**: Update any documentation that references SQLite

## Migration Script Options

The migration script:
- ✅ Preserves all original IDs
- ✅ Handles missing/null values gracefully
- ✅ Migrates in batches for large datasets
- ✅ Provides detailed progress and error reporting
- ✅ Can be run multiple times safely (idempotent)

## Need Help?

If you encounter issues:
1. Check the error messages in the console
2. Verify your database connections
3. Ensure all dependencies are installed
4. Check file permissions for the SQLite database

## Cleanup (Optional)

After successful migration and verification, you can:

1. **Remove sqlite3 dependency** (optional, if you don't need it anymore):
   ```bash
   npm uninstall sqlite3
   ```

2. **Archive SQLite database** (keep as backup):
   ```bash
   # Move to backup location
   mv database/database.sqlite backups/database.sqlite.backup
   ```

---

**Note**: The migration script is designed to be safe and idempotent. You can run it multiple times without duplicating data (it uses upsert operations).

