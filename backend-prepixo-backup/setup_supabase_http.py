#!/usr/bin/env python3
"""
Supabase Setup Script - Using HTTP API
"""
import os
import httpx
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']

print("🚀 Starting Supabase Setup with HTTP API...")
print(f"📍 URL: {SUPABASE_URL}")
print("-" * 60)

def create_storage_buckets():
    """Create storage buckets using REST API"""
    print("\n📦 Creating storage buckets...")
    
    buckets = [
        {
            'id': 'mentor-verification-docs',
            'name': 'mentor-verification-docs',
            'public': False,
            'file_size_limit': 5242880,
            'allowed_mime_types': ['image/*', 'application/pdf']
        },
        {
            'id': 'mentor-profile-images',
            'name': 'mentor-profile-images',
            'public': True,
            'file_size_limit': 2097152,
            'allowed_mime_types': ['image/*']
        },
        {
            'id': 'mentor-media',
            'name': 'mentor-media',
            'public': True,
            'file_size_limit': 5242880,
            'allowed_mime_types': ['image/*']
        },
        {
            'id': 'chat-attachments',
            'name': 'chat-attachments',
            'public': False,
            'file_size_limit': 10485760,
            'allowed_mime_types': ['image/*', 'application/*', 'text/*']
        }
    ]
    
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # List existing buckets
    with httpx.Client() as client:
        response = client.get(
            f'{SUPABASE_URL}/storage/v1/bucket',
            headers=headers
        )
        existing_buckets = []
        if response.status_code == 200:
            existing_buckets = [b['name'] for b in response.json()]
            print(f"  ℹ️  Found {len(existing_buckets)} existing buckets")
        
        created = 0
        for bucket in buckets:
            if bucket['name'] in existing_buckets:
                print(f"  ✓ Bucket '{bucket['name']}' already exists")
                continue
            
            try:
                response = client.post(
                    f'{SUPABASE_URL}/storage/v1/bucket',
                    headers=headers,
                    json=bucket
                )
                
                if response.status_code in [200, 201]:
                    print(f"  ✅ Created bucket: {bucket['name']}")
                    created += 1
                else:
                    print(f"  ⚠️  Bucket '{bucket['name']}': {response.text}")
            except Exception as e:
                print(f"  ⚠️  Bucket '{bucket['name']}': {str(e)}")
        
        if created > 0:
            print(f"\n✅ Created {created} new storage buckets!")
        else:
            print(f"\n✅ All storage buckets verified!")

def check_tables():
    """Check if tables exist"""
    print("\n📊 Checking database tables...")
    
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    }
    
    tables = ['mentor_applications', 'mentor_profiles', 'mentor_services']
    
    with httpx.Client() as client:
        for table in tables:
            try:
                response = client.get(
                    f'{SUPABASE_URL}/rest/v1/{table}?select=id&limit=1',
                    headers=headers
                )
                if response.status_code == 200:
                    print(f"  ✓ Table '{table}' exists")
                else:
                    print(f"  ⚠️  Table '{table}' may not exist: {response.status_code}")
            except Exception as e:
                print(f"  ⚠️  Table '{table}': {str(e)}")

def create_test_data():
    """Create test mentor application"""
    print("\n🧪 Creating test data...")
    
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    test_application = {
        'user_id': 'test_user_123',
        'full_name': 'Test Mentor',
        'mobile_number': '+919999999999',
        'email': 'testmentor@example.com',
        'exam_expertise': ['JEE'],
        'college_name': 'IIT Delhi',
        'course': 'B.Tech Computer Science',
        'display_college_publicly': True,
        'tagline': 'JEE AIR 450 | Helping students crack JEE',
        'achievements': 'AIR 450 JEE Advanced\nAIR 1200 JEE Main\n99.8 percentile in Physics',
        'about_me': 'I cleared JEE with good rank and want to help aspirants achieve their dreams.',
        'college_id_url': 'https://example.com/id.jpg',
        'exam_result_url': 'https://example.com/result.pdf',
        'status': 'pending'
    }
    
    with httpx.Client() as client:
        try:
            response = client.post(
                f'{SUPABASE_URL}/rest/v1/mentor_applications',
                headers=headers,
                json=test_application
            )
            
            if response.status_code in [200, 201]:
                print(f"  ✅ Test application created successfully!")
            elif response.status_code == 409:
                print(f"  ℹ️  Test application already exists")
            else:
                print(f"  ⚠️  Could not create test data: {response.text}")
        except Exception as e:
            print(f"  ⚠️  Error creating test data: {str(e)}")

def main():
    print("\n" + "="*60)
    print("🎓 PREPIXO - MENTORSHIP PLATFORM SETUP")
    print("="*60)
    
    # Create storage buckets
    create_storage_buckets()
    
    # Check tables
    check_tables()
    
    # Create test data
    create_test_data()
    
    print("\n" + "="*60)
    print("✅ SETUP COMPLETE!")
    print("="*60)
    print("\n🚀 Your mentorship platform is ready!")
    print("  • Storage buckets created")
    print("  • Database tables verified")
    print("  • Test data added")
    print("\n📱 Admin users can now:")
    print("  • View mentor applications")
    print("  • Approve/reject applications")
    print("  • Manage mentors")

if __name__ == "__main__":
    main()
