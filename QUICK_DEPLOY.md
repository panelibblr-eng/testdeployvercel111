# Quick Deploy Guide

Get your site deployed in 5 minutes!

## Prerequisites Checklist

- [ ] GitHub/GitLab/Bitbucket account
- [ ] Code pushed to a Git repository
- [ ] MongoDB Atlas account (free tier works)

## 5-Minute Deployment

### 1. Set Up MongoDB (2 minutes)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free)
3. Create a free cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)
6. Click "Database Access" → "Add New Database User"
   - Username: `monica-opto-admin`
   - Password: Generate secure password (save it!)
7. Click "Network Access" → "Add IP Address" → "Allow Access from Anywhere" (for testing)

### 2. Deploy to Vercel (3 minutes)

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your Git repository
4. **Configure:**
   - Root Directory: `website` (if your code is in a subdirectory)
   - Framework: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add these 4 variables:

   ```
   NODE_ENV = production
   MONGODB_URI = mongodb+srv://lasyajeewnani_db_user:YOUR_PASSWORD@cluster0.khlw1xv.mongodb.net/monica-opto-hub?appName=Cluster0
   JWT_SECRET = [Generate: openssl rand -base64 32]
   CORS_ORIGIN = https://your-project-name.vercel.app
   ```

   **Replace:**
   - `YOUR_PASSWORD` with your MongoDB database user password (for `lasyajeewnani_db_user`)
     - Get it from MongoDB Atlas → Database Access → Edit user
     - **Important:** If your password has special characters or spaces, you must URL-encode them:
       - Space ` ` → `%20`
       - `@` → `%40`, `#` → `%23`, `%` → `%25`, `&` → `%26`, `/` → `%2F`, `?` → `%3F`
   - Generate JWT_SECRET: Use [this tool](https://randomkeygen.com/) or run `openssl rand -base64 32`
   - `your-project-name` will be shown after first deploy
   
   **Note:** See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed MongoDB connection string help.

6. Click "Deploy"
7. Wait 2-3 minutes for deployment

### 3. Post-Deploy (30 seconds)

1. After deployment, copy your Vercel URL (e.g., `https://monica-opto-hub.vercel.app`)
2. Go to Vercel Dashboard → Settings → Environment Variables
3. Update `CORS_ORIGIN` to your actual URL: `https://monica-opto-hub.vercel.app`
4. Go to Deployments → Click "..." → "Redeploy"

### 4. First Login

1. Visit: `https://your-project.vercel.app/admin.html`
2. Login:
   - Username: `admin`
   - Password: `admin123`
3. **IMPORTANT:** Change password immediately in Settings!

## Verify It Works

✅ Visit: `https://your-project.vercel.app/api/health` → Should show `{"status":"OK"}`

✅ Visit: `https://your-project.vercel.app/` → Homepage loads

✅ Visit: `https://your-project.vercel.app/admin.html` → Admin panel works

## Common Issues

**"Database connection failed"**
→ Check MongoDB URI is correct, IP whitelist includes all IPs

**"CORS error"**
→ Update CORS_ORIGIN environment variable and redeploy

**"Function timeout"**
→ Check Vercel logs for errors, verify MongoDB connection

## Need Help?

See the full [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Next Steps

- [ ] Change default admin password
- [ ] Add your first product via admin panel
- [ ] Configure custom domain (optional)
- [ ] Set up file uploads with cloud storage (see full guide)

---

**That's it! Your site is live! 🎉**

