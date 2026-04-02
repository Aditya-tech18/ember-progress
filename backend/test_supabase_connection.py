#!/usr/bin/env python3
"""Test script to verify Supabase connection"""
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def test_supabase_connection():
    """Test Supabase connection and list tables"""
    try:
        # Get credentials
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        
        print("🔧 Testing Supabase Connection")
        print(f"URL: {supabase_url}")
        print(f"Service Key: {supabase_key[:20]}...")
        
        # Create client
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created successfully")
        
        # Test a simple query to check if we can access tables
        try:
            # Try to query mentor_applications table
            response = supabase.table('mentor_applications').select('*').limit(1).execute()
            print(f"✅ Successfully queried mentor_applications table")
            print(f"   Found {len(response.data)} records (showing max 1)")
        except Exception as e:
            print(f"⚠️  Could not query mentor_applications: {str(e)}")
            
        # Try to query mentor_profiles table
        try:
            response = supabase.table('mentor_profiles').select('*').limit(1).execute()
            print(f"✅ Successfully queried mentor_profiles table")
            print(f"   Found {len(response.data)} records (showing max 1)")
        except Exception as e:
            print(f"⚠️  Could not query mentor_profiles: {str(e)}")
            
        print("\n✅ Supabase connection test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_supabase_connection()
    exit(0 if success else 1)
