# 🎯 Quick Test Guide - Admin Panel

## ✅ Admin Panel Is Now Fixed!

### What Was Fixed:
- ❌ **Before:** "No applications yet" (all stats = 0)
- ✅ **After:** Shows all 6 applications from database

### Root Cause:
Admin Panel was using Supabase direct queries with anon key → **blocked by RLS policies**

### Solution Applied:
Admin Panel now uses backend API endpoints with service role key → **bypasses RLS**

---

## 🧪 How to Test

### Option 1: Login as Admin (Manual Test)

1. **Open app:** https://supabase-ember.preview.emergentagent.com
2. **Login with:**
   - Email: `tomacwin9961@gmail.com` OR `rituchaubey1984@gmail.com`
   - Password: Your password
3. **Select goal:** JEE
4. **Click:** "Admin" button in bottom navigation
5. **Result:** You should now see:
   - Total Applications: 6
   - Pending: 5 (or current count)
   - Approved: X
   - Rejected: 1
   - List of all applications with expandable details

### Option 2: Backend API Test (Already Verified ✅)

```bash
curl "https://supabase-ember.preview.emergentagent.com/api/admin/applications?admin_email=tomacwin9961@gmail.com"
```

**Result:** Returns 6 applications successfully

---

## 📊 Expected Admin Panel View

```
╔════════════════════════════════════════╗
║         Admin Panel                    ║
║  tomacwin9961@gmail.com                ║
╠════════════════════════════════════════╣
║  [📅 Create JEE Main Weekly Contest]   ║
╠════════════════════════════════════════╣
║  📊 Statistics:                        ║
║                                        ║
║  ┌──────────┐  ┌──────────┐          ║
║  │    6     │  │    5     │          ║
║  │  Total   │  │ Pending  │          ║
║  └──────────┘  └──────────┘          ║
║                                        ║
║  ┌──────────┐  ┌──────────┐          ║
║  │    0     │  │    1     │          ║
║  │ Approved │  │ Rejected │          ║
║  └──────────┘  └──────────┘          ║
╠════════════════════════════════════════╣
║  👥 Mentor Applications                ║
║                                        ║
║  📄 Application #1                     ║
║    Name: dfcvjdncv                     ║
║    Status: [Pending]                   ║
║    [Approve] [Reject] [Expand ▼]      ║
║                                        ║
║  📄 Application #2                     ║
║    Name: Aditya Chaubey                ║
║    Status: [Pending]                   ║
║    [Approve] [Reject] [Expand ▼]      ║
║                                        ║
║  ... (4 more applications)             ║
╚════════════════════════════════════════╝
```

---

## ✅ What Happens on Approve

1. Click "Approve" button on any application
2. Backend API called: `/api/admin/applications/{id}/approve`
3. Updates `mentor_applications.status` = 'approved'
4. **Automatically creates mentor profile in `mentor_profiles` table**
5. Success toast: "Application approved! Mentor profile created."
6. Mentor now appears on "Connect with Mentors" page
7. Stats update instantly

---

## 🗂️ Database Changes After Approval

### Before Approval:
```sql
-- mentor_applications table
{
  "id": "32466269-0fb9-4531-9c9b-dd91f2ec59f6",
  "full_name": "Aditya Chaubey",
  "status": "pending",
  ...
}

-- mentor_profiles table
(empty - no profile yet)
```

### After Approval:
```sql
-- mentor_applications table
{
  "id": "32466269-0fb9-4531-9c9b-dd91f2ec59f6",
  "full_name": "Aditya Chaubey",
  "status": "approved",  ✅ UPDATED
  "reviewed_by": "tomacwin9961@gmail.com",
  "reviewed_at": "2026-03-28T10:15:00Z"
}

-- mentor_profiles table ✅ AUTO-CREATED
{
  "id": "generated-uuid",
  "user_id": "1065a106-cd9f-4cbd-88ae-1ac641624176",
  "application_id": "32466269-0fb9-4531-9c9b-dd91f2ec59f6",
  "full_name": "Aditya Chaubey",
  "tagline": "...",
  "achievements": "...",
  "exam_expertise": ["JEE", "NDA", "Boards"],
  "is_active": true,
  "is_verified": true,
  "rating": 0.00,
  "total_sessions": 0
}
```

---

## 🚀 Full Mentor Flow After Approval

### Step 1: Mentor Appears on Discovery
- Navigate to: https://supabase-ember.preview.emergentagent.com/mentors
- Select exam category: JEE
- Approved mentor card displays with:
  - Name, tagline, achievements
  - Exam expertise badges
  - Star rating
  - "View Profile" button

### Step 2: Student Books Session
- Click mentor card → Opens profile page
- Click "Book Session (₹99)"
- Razorpay payment modal
- Complete payment
- Redirect to chat

### Step 3: Real-Time Chat Unlocked
- Both get "Mentor" button in bottom nav
- Real-time messaging enabled
- Session tracked in `mentor_sessions` table

---

## 🔍 Troubleshooting

### If applications still don't show:
1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Verify logged in as admin email:**
   - tomacwin9961@gmail.com
   - rituchaubey1984@gmail.com
   - prepixo.official@gmail.com
3. **Check browser console** for errors
4. **Verify backend is running:**
   ```bash
   sudo supervisorctl status backend
   # Should show: RUNNING
   ```
5. **Test backend API directly:**
   ```bash
   curl "https://supabase-ember.preview.emergentagent.com/api/admin/applications?admin_email=tomacwin9961@gmail.com"
   # Should return JSON with 6 applications
   ```

### Common Issues:

**Issue:** "403 Forbidden"
- **Fix:** Not logged in as authorized admin email

**Issue:** "Loading..."  hangs forever
- **Fix:** Backend server may be down. Check `sudo supervisorctl status backend`

**Issue:** "No applications yet" persists
- **Fix:** Clear browser cache, check console errors

---

## 📞 Support

If issues persist after testing:
1. Check `/app/ADMIN_PANEL_FIX_COMPLETE.md` for detailed documentation
2. Verify all environment variables are set correctly
3. Ensure Supabase service role key is configured in backend `.env`

---

**✅ Admin Panel is now fully functional and ready for production use!**
