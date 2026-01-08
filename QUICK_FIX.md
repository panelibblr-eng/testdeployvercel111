# Quick Fix for MongoDB Connection

## Issue: `querySrv EREFUSED` Error

This is a **Network Access** problem in MongoDB Atlas.

## Fix in 3 Steps:

### 1. Stop the server (if running)
Press `Ctrl+C` in the terminal

### 2. Fix MongoDB Atlas Network Access ⚠️ MOST IMPORTANT!

1. Go to: https://cloud.mongodb.com
2. Click **"Network Access"** (left menu)
3. Click **"Add IP Address"**
4. Click **"Allow Access from Anywhere"**
5. Click **"Confirm"**
6. Wait 1-2 minutes

### 3. Check/Update .env File

Make sure you have a `.env` file in the `website` folder with:

```env
MONGODB_URI=mongodb+srv://lasyajeewnani_db_user:Anusha2019@cluster0.khlw1xv.mongodb.net/monica-opto-hub?appName=Cluster0
```

**If the password is different** (check MongoDB Atlas → Database Access), update it in the `.env` file.

### 4. Restart Server

```bash
npm start
```

You should see: `✅ MongoDB connection established`

---

## If Port 3001 is Already in Use

Run this to kill the process:
```powershell
netstat -ano | findstr :3001
# Note the PID (last number)
taskkill /PID <PID> /F
```

Or use the fix script:
```powershell
.\fix-connection.ps1
```

