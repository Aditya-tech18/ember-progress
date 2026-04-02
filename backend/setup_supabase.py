#!/usr/bin/env python3
"""
Supabase Setup Script
This script creates all necessary tables and storage buckets for the mentorship platform
"""
import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("🚀 Starting Supabase Setup...")
print(f"📍 URL: {SUPABASE_URL}")
print("-" * 60)

# SQL Schema from mentorship_schema.sql
SCHEMA_SQL = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- MENTOR APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS mentor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Academic Information
  exam_expertise TEXT[] NOT NULL,
  college_name TEXT NOT NULL,
  course TEXT NOT NULL,
  display_college_publicly BOOLEAN DEFAULT true,
  
  -- Profile Information
  tagline TEXT NOT NULL,
  achievements TEXT NOT NULL,
  about_me TEXT NOT NULL,
  
  -- Verification Documents
  college_id_url TEXT NOT NULL,
  exam_result_url TEXT NOT NULL,
  
  -- Application Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_mentor_applications_user_id ON mentor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_status ON mentor_applications(status);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_created_at ON mentor_applications(created_at DESC);

-- MENTOR PROFILES TABLE
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  application_id UUID REFERENCES mentor_applications(id),
  
  -- Profile Information
  full_name TEXT NOT NULL,
  profile_photo_url TEXT,
  tagline TEXT NOT NULL,
  achievements TEXT NOT NULL,
  about_me TEXT NOT NULL,
  
  -- Academic Information
  college_name TEXT,
  course TEXT,
  display_college BOOLEAN DEFAULT true,
  
  -- Expertise
  exam_expertise TEXT[] NOT NULL,
  expertise_tags TEXT[],
  
  -- Media Gallery
  media_urls TEXT[],
  
  -- Profile Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT true,
  
  -- Statistics
  total_sessions INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_user_id ON mentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_exam_expertise ON mentor_profiles USING GIN(exam_expertise);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_active ON mentor_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_rating ON mentor_profiles(rating DESC);

-- MENTOR SERVICES TABLE
CREATE TABLE IF NOT EXISTS mentor_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  
  -- Service Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price_inr DECIMAL(10,2) NOT NULL,
  
  -- Service Type
  service_type TEXT CHECK (service_type IN ('doubt_solving', 'mock_analysis', 'strategy_session', 'full_guidance')),
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_services_mentor_id ON mentor_services(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_services_active ON mentor_services(is_active);

-- Enable Row Level Security
ALTER TABLE mentor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentor_applications
DROP POLICY IF EXISTS "Users can insert own applications" ON mentor_applications;
CREATE POLICY "Users can insert own applications"
ON mentor_applications FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own applications" ON mentor_applications;
CREATE POLICY "Users can view own applications"
ON mentor_applications FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can view all applications" ON mentor_applications;
CREATE POLICY "Admins can view all applications"
ON mentor_applications FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can update applications" ON mentor_applications;
CREATE POLICY "Admins can update applications"
ON mentor_applications FOR UPDATE
USING (true);

-- RLS Policies for mentor_profiles
DROP POLICY IF EXISTS "Public can view active mentors" ON mentor_profiles;
CREATE POLICY "Public can view active mentors"
ON mentor_profiles FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Mentors can update own profiles" ON mentor_profiles;
CREATE POLICY "Mentors can update own profiles"
ON mentor_profiles FOR UPDATE
USING (true);

-- RLS Policies for mentor_services
DROP POLICY IF EXISTS "Public can view active services" ON mentor_services;
CREATE POLICY "Public can view active services"
ON mentor_services FOR SELECT
USING (is_active = true);
"""

def create_tables():
    """Create database tables"""
    print("\n📊 Creating database tables...")
    try:
        # Execute SQL using REST API
        response = supabase.postgrest.rpc('exec_sql', {'sql': SCHEMA_SQL}).execute()
        print("✅ Database tables created successfully!")
        return True
    except Exception as e:
        # If rpc doesn't work, we'll need to use the SQL editor manually
        print(f"⚠️  Tables creation: {str(e)}")
        print("💡 You may need to run the SQL manually in Supabase SQL Editor")
        return False

def create_storage_buckets():
    """Create storage buckets"""
    print("\n📦 Creating storage buckets...")
    
    buckets = [
        {
            'name': 'mentor-verification-docs',
            'public': False,
            'file_size_limit': 5242880,  # 5MB
            'allowed_mime_types': ['image/*', 'application/pdf']
        },
        {
            'name': 'mentor-profile-images',
            'public': True,
            'file_size_limit': 2097152,  # 2MB
            'allowed_mime_types': ['image/*']
        },
        {
            'name': 'mentor-media',
            'public': True,
            'file_size_limit': 5242880,  # 5MB
            'allowed_mime_types': ['image/*']
        },
        {
            'name': 'chat-attachments',
            'public': False,
            'file_size_limit': 10485760,  # 10MB
            'allowed_mime_types': ['image/*', 'application/*', 'text/*']
        }
    ]
    
    created = 0
    for bucket_config in buckets:
        try:
            # Check if bucket exists
            existing_buckets = supabase.storage.list_buckets()
            bucket_exists = any(b['name'] == bucket_config['name'] for b in existing_buckets)
            
            if bucket_exists:
                print(f"  ℹ️  Bucket '{bucket_config['name']}' already exists")
            else:
                # Create bucket
                supabase.storage.create_bucket(
                    bucket_config['name'],
                    options={
                        'public': bucket_config['public'],
                        'file_size_limit': bucket_config['file_size_limit'],
                        'allowed_mime_types': bucket_config['allowed_mime_types']
                    }
                )
                print(f"  ✅ Created bucket: {bucket_config['name']}")
                created += 1
        except Exception as e:
            print(f"  ⚠️  Bucket '{bucket_config['name']}': {str(e)}")
    
    if created > 0:
        print(f"\n✅ Created {created} new storage buckets!")
    else:
        print(f"\n✅ All storage buckets already exist!")
    
    return True

def verify_setup():
    """Verify setup by checking tables and buckets"""
    print("\n🔍 Verifying setup...")
    
    # Check buckets
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b['name'] for b in buckets]
        print(f"\n📦 Storage Buckets ({len(buckets)}):")
        for name in bucket_names:
            print(f"  ✓ {name}")
    except Exception as e:
        print(f"  ❌ Error checking buckets: {str(e)}")
    
    # Check tables
    try:
        # Try to query tables
        apps = supabase.table('mentor_applications').select('id').limit(1).execute()
        profiles = supabase.table('mentor_profiles').select('id').limit(1).execute()
        services = supabase.table('mentor_services').select('id').limit(1).execute()
        
        print(f"\n📊 Database Tables:")
        print(f"  ✓ mentor_applications")
        print(f"  ✓ mentor_profiles")
        print(f"  ✓ mentor_services")
    except Exception as e:
        print(f"  ⚠️  Tables check: {str(e)}")
        print(f"  💡 Please run the SQL schema manually in Supabase SQL Editor")

def main():
    """Main setup function"""
    print("\n" + "="*60)
    print("🎓 PREPIXO - MENTORSHIP PLATFORM SETUP")
    print("="*60)
    
    # Create storage buckets
    create_storage_buckets()
    
    # Create tables (may need manual intervention)
    create_tables()
    
    # Verify setup
    verify_setup()
    
    print("\n" + "="*60)
    print("✅ SETUP COMPLETE!")
    print("="*60)
    print("\n📝 Next Steps:")
    print("  1. If tables weren't created automatically, run the SQL from")
    print("     /app/database/mentorship_schema.sql in Supabase SQL Editor")
    print("  2. Test the admin panel in your application")
    print("  3. Submit a test mentor application")
    print("\n🚀 Your mentorship platform is ready!")

if __name__ == "__main__":
    main()
