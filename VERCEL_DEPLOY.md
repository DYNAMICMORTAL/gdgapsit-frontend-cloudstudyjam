# Vercel Deployment Guide - Frontend

## ✅ Pre-Deployment Checklist

All configurations are now ready for successful Vercel deployment!

### Files Configured:
- ✅ `vercel.json` - Root config pointing to frontend folder
- ✅ `frontend/.env` - Clean environment variables (no secrets)
- ✅ `frontend/.gitignore` - Prevents committing sensitive files
- ✅ `.vercelignore` - Excludes unnecessary folders from deployment
- ✅ `frontend/package.json` - All dependencies listed
- ✅ `frontend/vite.config.js` - Vite configuration
- ✅ Security: `service-account.json` removed from frontend

## 🚀 Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# From the ROOT directory (gdgapsit-cloudstudyjam/)
cd c:\Users\MihirAmin\Downloads\gdgapsit-cloudstudyjam

# Deploy to production
vercel --prod

# During setup, use these settings:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: N (or Y if already created)
# - Project name: gdgapsit-cloudstudyjam (or your choice)
# - In which directory is your code located: ./
# - Want to override settings: N (vercel.json handles everything)
```

### Option 2: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **CRITICAL**: Set these in "Build & Development Settings":
   - Framework Preset: **Vite**
   - Root Directory: **Leave as `./`** (vercel.json handles it)
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`

4. **Add Environment Variables** (for backend API):
   ```
   SUPABASE_URL=https://xnaulieccfildxjlygwx.supabase.co
   SUPABASE_SERVICE_KEY=<your-service-key-from-config/.env>
   GOOGLE_SERVICE_ACCOUNT=<paste-full-JSON-from-service-account.json>
   DRIVE_FOLDER_ID=1YalnoethRRpsxK-xxwCIvTTnrj89bOSA
   ADMIN_API_KEY=apsit-admin-2025
   SITE_BASE_URL=https://gdgapsit-cloudstudyjam.vercel.app
   ```

5. Click **Deploy**

## 🔍 After Deployment

1. **Update frontend/.env** with your production URL:
   ```bash
   VITE_BACKEND_URL=https://your-app-name.vercel.app
   VITE_SITE_URL=https://your-app-name.vercel.app
   ```

2. **Redeploy** after updating the URL:
   ```bash
   vercel --prod
   ```

3. **Test the site**:
   - Homepage: `https://your-app.vercel.app/`
   - Leaderboard: `https://your-app.vercel.app/leaderboard`
   - Admin: `https://your-app.vercel.app/admin/certificates`

## 🐛 Troubleshooting

### Build fails with "Cannot find module"
- Check `frontend/package.json` has all dependencies
- Run `cd frontend && npm install` locally to verify

### API routes return 404
- Ensure backend environment variables are set in Vercel dashboard
- Check `/api` folder exists in deployment

### Blank page after deployment
- Check browser console for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check if Supabase tables exist (`temp_participants`, `certificates`)

### "PGRST205: table not found"
- Run the SQL from `docs/CERTIFICATE_SETUP.md` Step 2 in Supabase SQL Editor

## 📝 What Was Fixed

1. ✅ Removed `version: 2` from vercel.json (deprecated)
2. ✅ Cleaned `frontend/.env` - removed all sensitive keys
3. ✅ Removed duplicate `VITE_BACKEND_URL` entries
4. ✅ Added `npm install` to buildCommand
5. ✅ Deleted `service-account.json` from frontend (security risk)
6. ✅ Created `.vercelignore` to exclude unnecessary files
7. ✅ Updated `.gitignore` to prevent committing secrets
8. ✅ Removed Python builds (not needed for frontend-only deployment)

## 🎯 Expected Result

After successful deployment, you should see:
- ✅ Homepage with stats and hero section
- ✅ Leaderboard with participant rankings
- ✅ Admin pages for certificate generation
- ✅ All assets loading correctly
- ✅ No console errors

Your app will be live at: `https://your-project-name.vercel.app`
