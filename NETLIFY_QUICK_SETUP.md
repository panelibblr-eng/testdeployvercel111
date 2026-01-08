# Netlify Quick Setup Checklist

## ✅ Step-by-Step Setup

### 1. Environment Variables (CRITICAL)

Go to **Netlify Dashboard → Your Site → Site settings → Environment variables** and add:

```
NODE_ENV = production
MONGODB_URI = mongodb+srv://lasyajeewnani_db_user:Anusha2019@cluster0.khlw1xv.mongodb.net/?appName=Cluster0
JWT_SECRET = [generate a random string - see below]
CORS_ORIGIN = https://your-site-name.netlify.app
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ IMPORTANT**: After adding/changing environment variables, you MUST **redeploy** your site!

### 2. MongoDB Atlas Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **Network Access** (left sidebar)
3. Click **Add IP Address**
4. Select **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Click **Confirm**

### 3. Deploy to Netlify

**Option A: Via Git (Recommended)**
1. Push your code to GitHub/GitLab/Bitbucket
2. In Netlify: **Add new site → Import from Git**
3. Select your repository
4. Set **Base directory**: `website` (if your repo root is not the website folder)
5. Set **Publish directory**: `.` (or leave empty)
6. Click **Deploy**

**Option B: Via Netlify CLI**
```bash
cd website
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### 4. Verify Deployment

1. Visit your site: `https://your-site.netlify.app`
2. Test API: `https://your-site.netlify.app/api/health`
3. Test Admin: `https://your-site.netlify.app/admin.html`

## 🔧 Troubleshooting

### Admin Panel Not Working?

1. **Check Environment Variables**
   - Netlify Dashboard → Site settings → Environment variables
   - Verify all 4 variables are set
   - **Redeploy** after adding/changing variables

2. **Check Function Logs**
   - Netlify Dashboard → Functions tab
   - Click on `server` function
   - Look for errors (especially MongoDB connection errors)

3. **Check Browser Console**
   - Open admin panel
   - Press F12 → Console tab
   - Look for API errors

4. **Verify MongoDB Connection**
   - Check `MONGODB_URI` is correct
   - Verify password (no spaces unless URL-encoded)
   - Check MongoDB Atlas Network Access is set to `0.0.0.0/0`

### Database Connection Failed?

**Error**: `querySrv EREFUSED` or `authentication failed`

**Fix**:
1. Verify MongoDB URI format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/
   ```
2. Check password encoding (special characters need URL encoding)
3. Verify Network Access in MongoDB Atlas allows `0.0.0.0/0`
4. **Redeploy** after fixing environment variables

### Functions Not Deploying?

1. Check `netlify/functions/server.js` exists
2. Verify `netlify.toml` is in the root directory
3. Check build logs for errors
4. Ensure `serverless-http` is in `package.json` dependencies

## 📝 Common Issues

| Issue | Solution |
|-------|----------|
| Admin panel shows login but won't authenticate | Check environment variables, redeploy |
| API returns 404 | Check `netlify.toml` redirect rules |
| Database connection timeout | Verify MongoDB Atlas Network Access |
| Functions not found | Ensure `netlify/functions/server.js` exists |
| CORS errors | Check `CORS_ORIGIN` environment variable |

## 🚀 After Deployment

1. Test admin login
2. Add a test product
3. Verify products display on homepage
4. Test appointment booking
5. Check analytics

## 📞 Still Having Issues?

1. Check Netlify Function logs (most important!)
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Ensure MongoDB Atlas Network Access is configured
5. Try redeploying after making changes

---

**Remember**: Environment variable changes require a **redeploy** to take effect!
