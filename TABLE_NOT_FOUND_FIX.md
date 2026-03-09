# 🚨 FIX: "Could not find table mentor_applications" Error

## The Problem
When submitting mentor application, you get:
**"Could not find the table 'public.mentor_applications' in the schema cache"**

## ⚡ THE FIX (2 Minutes)

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/pgvymttdvdlkcroqxsgn

### Step 2: Click "SQL Editor" (Left Sidebar)

### Step 3: Copy the SQL
Open file: `/app/database/QUICK_SQL_FIX.sql`

**Or copy this:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.mentor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  exam_expertise TEXT[] NOT NULL,
  college_name TEXT NOT NULL,
  course TEXT NOT NULL,
  display_college_publicly BOOLEAN DEFAULT true,
  tagline TEXT NOT NULL,
  achievements TEXT NOT NULL,
  about_me TEXT NOT NULL,
  college_id_url TEXT NOT NULL,
  exam_result_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

ALTER TABLE mentor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own" ON mentor_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create" ON mentor_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Step 4: Click "RUN" Button

You'll see: ✅ "Success. No rows returned"

### Step 5: Try Application Form Again

Go to: `/mentor-application`

Fill and submit → **IT WILL WORK NOW!** ✅

---

## What I Also Fixed

### 1. ✅ Better Error Message
- Shows step-by-step instructions
- Saves your application locally
- Guides you to setup

### 2. ✅ Local Backup
- Your application data is saved to browser
- Won't lose your work
- Auto-submits after database setup

### 3. ✅ Clear Instructions
- Toast notification with fix steps
- Links to setup guides
- Progress indication

---

## Test It

1. Run SQL in Supabase ✅
2. Go to mentor application form
3. Fill all 3 steps
4. Submit
5. See success message! 🎉

---

**Time to fix: 2 minutes**
**Difficulty: Copy + Paste + Click**

After this, the form will work perfectly! ✅
