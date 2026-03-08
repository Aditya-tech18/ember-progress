# ⚡ QUICK FIX - Netlify Deployment

## 🔴 Your Issue
Netlify says: "Script not found 'build'"

## ✅ The Fix

### 1. Files Created (Already Done ✅)
- `/app/netlify.toml` - Deployment config
- `/app/.nvmrc` - Node version (18)
- `/app/NETLIFY_DEPLOYMENT_GUIDE.md` - Full guide

### 2. Push to GitHub
```bash
# Save these files to your ember-progress repo
git add netlify.toml .nvmrc
git commit -m "Fix Netlify deployment configuration"
git push
```

### 3. Netlify Settings
Go to: https://app.netlify.com → Your Site → Build Settings

**Change to:**
- Build command: `cd frontend && npm install && npm run build`
- Publish directory: `frontend/dist`
- Base directory: (leave empty)

### 4. Environment Variables
Add in Netlify → Site Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://pgvymttdvdlkcroqxsgn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndnltdHRkdmRsa2Nyb3F4c2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTEwMzMsImV4cCI6MjA3NDk2NzAzM30.lAaQEs2Mk6BGjIcP8zLkqkFxUDIKyDIT-9kTK5kPnq8
VITE_RAZORPAY_KEY_ID=rzp_live_SObcQvFXRo6HAa
```

### 5. Deploy!
Netlify → Deploys → "Trigger deploy" → "Clear cache and deploy site"

---

## 🎯 Why It Was Failing

**Wrong:** `bun run build` (no build script found)
**Right:** `cd frontend && npm run build` (builds Vite app)

Your app is **React + Vite**, not Ember!

---

## 📋 After Deployment

Test: https://prepixo.info
- Homepage loads ✅
- Navigation works ✅
- Login/Signup works ✅
- Mentorship section shows ✅

---

**Need help?** See `/app/NETLIFY_DEPLOYMENT_GUIDE.md` for full instructions!
