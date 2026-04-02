# 🚀 PREPIXO DEPLOYMENT GUIDE - NETLIFY

## ⚠️ IMPORTANT: This is a React + Vite App, NOT Ember.js

Your app uses:
- **Frontend:** React + Vite + TypeScript
- **Backend:** FastAPI (Python) - needs separate deployment
- **Database:** Supabase (cloud-hosted)
- **Payments:** Razorpay

---

## 📋 DEPLOYMENT ARCHITECTURE

```
Emergent (Development)
   ↓
GitHub (ember-progress repo)
   ↓
Netlify (Auto-deploy on commit)
   ↓
prepixo.info (Your domain)
```

---

## 🔧 STEP-BY-STEP FIX

### ✅ Step 1: Files Already Created

I've created:
- `/app/netlify.toml` - Netlify configuration
- `/app/.nvmrc` - Node version specification (v18)

These files configure Netlify to:
- Build from `frontend/` directory
- Use Node 18
- Publish `frontend/dist/` folder
- Handle SPA routing
- Set security headers

---

### ✅ Step 2: Push to GitHub

**Option A: Manual (if you have Git access)**

```bash
cd /app
git add netlify.toml .nvmrc
git commit -m "Add Netlify deployment configuration"
git push origin main
```

**Option B: Use Emergent's GitHub Push Feature**

Click "Save to GitHub" button in Emergent → ember-progress repo

---

### ✅ Step 3: Configure Netlify Build Settings

Go to: https://app.netlify.com → Your Site → Site Settings → Build & Deploy

**Build settings:**
- **Base directory:** Leave empty (or set to `/`)
- **Build command:** `cd frontend && npm install && npm run build`
- **Publish directory:** `frontend/dist`
- **Node version:** 18

---

### ✅ Step 4: Set Environment Variables in Netlify

Go to: Site Settings → Environment Variables

Add these variables:

```
VITE_SUPABASE_PROJECT_ID=pgvymttdvdlkcroqxsgn
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndnltdHRkdmRsa2Nyb3F4c2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTEwMzMsImV4cCI6MjA3NDk2NzAzM30.lAaQEs2Mk6BGjIcP8zLkqkFxUDIKyDIT-9kTK5kPnq8
VITE_SUPABASE_URL=https://pgvymttdvdlkcroqxsgn.supabase.co
VITE_RAZORPAY_KEY_ID=rzp_live_SObcQvFXRo6HAa
VITE_RAZORPAY_KEY_SECRET=cwYauUFEKheGa1Kt5HEpAFrA
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

**Important:** 
- `REACT_APP_BACKEND_URL` needs to point to your deployed backend
- All variables must start with `VITE_` or `REACT_APP_` to be accessible in the frontend

---

### ✅ Step 5: Deploy!

**Method 1: Trigger Manual Deploy**

1. Go to: Deploys tab
2. Click: "Trigger deploy"
3. Select: "Clear cache and deploy site"
4. Wait 2-3 minutes

**Method 2: Push to GitHub (Auto-deploy)**

Any push to `main` branch will trigger auto-deployment.

---

## 🔍 TROUBLESHOOTING

### Error: "Script not found 'build'"

**Cause:** Netlify running from wrong directory

**Fix:** 
- Ensure `netlify.toml` has: `command = "cd frontend && npm run build"`
- Or set Base directory to `frontend` in Netlify settings

### Error: "Module not found" or dependency errors

**Cause:** Missing `node_modules`

**Fix:** 
- Clear Netlify cache
- Ensure build command includes `npm install`
- Check Node version is 18+

### Error: Build succeeds but site shows blank page

**Cause:** Environment variables missing or incorrect routing

**Fix:**
- Add all `VITE_` environment variables in Netlify
- Ensure `[[redirects]]` is in `netlify.toml` for SPA routing
- Check browser console for errors

### Error: API calls failing

**Cause:** Backend URL not configured or CORS issues

**Fix:**
- Update `REACT_APP_BACKEND_URL` to your deployed backend
- Ensure backend allows requests from `prepixo.info`
- Check Supabase RLS policies

---

## 🎯 BACKEND DEPLOYMENT (Separate)

**Your backend (FastAPI) needs separate deployment!**

Netlify only hosts the frontend (React). For backend:

**Option 1: Railway**
- Deploy FastAPI app to Railway
- Get deployment URL
- Set as `REACT_APP_BACKEND_URL`

**Option 2: Render**
- Deploy to Render.com
- Free tier available
- Good for FastAPI

**Option 3: DigitalOcean App Platform**
- More powerful
- $5/month

**Steps:**
1. Create account on chosen platform
2. Connect GitHub repo
3. Select `backend/` folder
4. Set Python runtime
5. Install command: `pip install -r requirements.txt`
6. Start command: `uvicorn server:app --host 0.0.0.0 --port 8000`
7. Copy deployment URL
8. Update Netlify env var: `REACT_APP_BACKEND_URL`

---

## ✅ VERIFICATION CHECKLIST

After deployment, test:

- [ ] Site loads at prepixo.info
- [ ] Homepage displays correctly
- [ ] Navigation works (all routes)
- [ ] Supabase connection works (login/signup)
- [ ] Razorpay payment modal opens
- [ ] Mock tests load
- [ ] Solutions display properly
- [ ] Mentorship section visible
- [ ] Mobile responsive
- [ ] No console errors

---

## 📊 CURRENT DEPLOYMENT STATUS

**Frontend (Netlify):**
- ✅ Build script exists (`vite build`)
- ✅ Netlify.toml created
- ✅ Node version specified (.nvmrc)
- ✅ Environment variables documented
- ⏳ Needs: Push to GitHub + Netlify redeploy

**Backend (Not deployed yet):**
- ⏳ FastAPI server in `/app/backend`
- ⏳ Needs: Deployment to Railway/Render
- ⏳ Needs: Update `REACT_APP_BACKEND_URL` in Netlify

**Database (Supabase):**
- ✅ Connection configured
- ⏳ Needs: Run SQL schema for mentorship tables
- ⏳ Needs: Create storage buckets

---

## 🎉 FINAL STEPS

1. **Push files to GitHub** (netlify.toml + .nvmrc)
2. **Configure Netlify** (environment variables)
3. **Trigger deploy** (clear cache)
4. **Deploy backend** (Railway/Render)
5. **Update backend URL** in Netlify env vars
6. **Test prepixo.info**

---

## 📞 SUPPORT

If deployment fails:
1. Check Netlify deploy logs
2. Verify all environment variables
3. Ensure GitHub repo has latest code
4. Check Node version is 18+
5. Clear Netlify cache and retry

**Your app is READY for deployment! Just follow the steps above.** 🚀
