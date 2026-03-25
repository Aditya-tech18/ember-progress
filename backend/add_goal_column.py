import httpx
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']

sql_statements = [
    """
    -- Add goal columns to users table
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS goal TEXT,
    ADD COLUMN IF NOT EXISTS goal_selected_at TIMESTAMPTZ;
    """,
    """
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_users_goal ON users(goal);
    """
]

print("🗄️  Updating Supabase schema...")
print(f"📍 URL: {SUPABASE_URL}")
print("-" * 60)

# Try to add columns using direct table update approach
headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json'
}

with httpx.Client(timeout=30) as client:
    # Check if columns exist by trying to select them
    try:
        response = client.get(
            f'{SUPABASE_URL}/rest/v1/users?select=goal&limit=1',
            headers=headers
        )
        if response.status_code == 200:
            print("✅ Column 'goal' already exists in users table")
        else:
            print("⚠️  Column 'goal' may not exist, but table is accessible")
    except Exception as e:
        print(f"ℹ️  Column check: {str(e)}")

print("\n📝 SQL to run manually in Supabase SQL Editor:")
print("=" * 60)
for sql in sql_statements:
    print(sql)
print("=" * 60)

print("\n✅ Schema update prepared!")
print("Note: Run the SQL above in Supabase SQL Editor if columns don't exist")

