# Netlify Deployment Guide

This guide will help you deploy the Monica Opto Hub website to Netlify with full backend functionality.

## Prerequisites

1. A Netlify account (free tier works)
2. MongoDB Atlas account with database connection string
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

1. Make sure all files are committed to your Git repository
2. The `netlify.toml` file should be in the `website` directory (root of your deployment)

## Step 2: Set Up Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site (or create a new site)
3. Go to **Site settings** → **Environment variables**
4. Add the following environment variables:

### Required Environment Variables

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://lasyajeewnani_db_user:YOUR_PASSWORD@cluster0.khlw1xv.mongodb.net/?appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=https://your-site-name.netlify.app
```

### Important Notes:

- **MONGODB_URI**: Replace `YOUR_PASSWORD` with your actual MongoDB password. If your password contains special characters, URL-encode them:
  - Space: `%20`
  - `@`: `%40`
  - `#`: `%23`
  - `%`: `%25`
  - etc.

  Example: If your password is `Anusha 2019`, use `Anusha%202019`

- **JWT_SECRET**: Generate a strong random string. You can use:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- **CORS_ORIGIN**: Replace with your actual Netlify site URL (e.g., `https://monica-opto-hub.netlify.app`)

## Step 3: Configure MongoDB Atlas Network Access

1. Go to MongoDB Atlas dashboard
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Select **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Click **Confirm**

**Note**: This allows connections from any IP address, which is necessary for Netlify Functions (they use dynamic IPs).

## Step 4: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard

1. Go to [Netlify](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect your Git repository
4. Configure build settings:
   - **Base directory**: `website` (if your Netlify site root is the `website` folder)
   - **Build command**: Leave empty or use `npm install` (if needed)
   - **Publish directory**: `.` (current directory)
5. Click **Deploy site**

### Option B: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Navigate to your website directory:
   ```bash
   cd website
   ```

3. Login to Netlify:
   ```bash
   netlify login
   ```

4. Initialize and deploy:
   ```bash
   netlify init
   netlify deploy --prod
   ```

## Step 5: Verify Deployment

1. After deployment, visit your Netlify site URL
2. Check the admin panel: `https://your-site.netlify.app/admin.html`
3. Test API endpoints: `https://your-site.netlify.app/api/health`

## Troubleshooting

### Admin Panel Not Opening

**Issue**: Admin panel shows login screen but doesn't authenticate.

**Solutions**:
1. Check browser console for errors (F12 → Console)
2. Verify environment variables are set correctly in Netlify
3. Check Netlify Function logs:
   - Go to **Functions** tab in Netlify dashboard
   - Click on a function to see logs
4. Verify MongoDB connection:
   - Check `MONGODB_URI` is correct
   - Verify Network Access in MongoDB Atlas
   - Check function logs for connection errors

### Database Connection Issues

**Issue**: `querySrv EREFUSED` or `authentication failed`

**Solutions**:
1. **Verify MongoDB URI**:
   - Check password is correct
   - Ensure special characters are URL-encoded
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/`

2. **Check Network Access**:
   - MongoDB Atlas → Network Access
   - Ensure `0.0.0.0/0` is allowed

3. **Verify Environment Variables**:
   - Netlify Dashboard → Site settings → Environment variables
   - Ensure `MONGODB_URI` is set correctly
   - **Important**: After changing environment variables, you need to **redeploy** the site

4. **Check Function Logs**:
   - Netlify Dashboard → Functions → View logs
   - Look for MongoDB connection errors

### API Endpoints Not Working

**Issue**: API calls return 404 or 500 errors

**Solutions**:
1. Check `netlify.toml` redirect rules are correct
2. Verify function is deployed:
   - Netlify Dashboard → Functions
   - Should see `server` function listed
3. Check function logs for errors
4. Verify CORS settings in environment variables

### Functions Not Deploying

**Issue**: Functions directory not found or functions not working

**Solutions**:
1. Ensure `netlify/functions/server.js` exists
2. Check `netlify.toml` has correct function directory:
   ```toml
   [functions]
     directory = "netlify/functions"
   ```
3. Verify `serverless-http` is in `package.json` dependencies
4. Check build logs for errors

## File Structure

Your deployment should have this structure:

```
website/
├── netlify.toml          # Netlify configuration
├── netlify/
│   └── functions/
│       └── server.js     # Netlify function handler
├── package.json          # Dependencies
├── routes/              # API routes
├── database/            # Database models and init
├── js/                  # Frontend JavaScript
├── css/                 # Stylesheets
├── index.html           # Main page
├── admin.html           # Admin panel
└── ... (other files)
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `JWT_SECRET` | Secret for JWT tokens | `your-secret-key` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://your-site.netlify.app` |

## Important Notes

1. **After changing environment variables**, you must **redeploy** your site for changes to take effect
2. **MongoDB password encoding**: Special characters in passwords must be URL-encoded
3. **Function timeout**: Netlify Functions have a 10-second timeout on free tier, 26 seconds on paid
4. **Cold starts**: First request after inactivity may be slow (function cold start)

## Support

If you encounter issues:
1. Check Netlify Function logs in the dashboard
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB Atlas Network Access is configured

## Next Steps

After successful deployment:
1. Test all admin panel features
2. Verify product display works
3. Test appointment booking
4. Check analytics tracking
5. Set up custom domain (optional)
