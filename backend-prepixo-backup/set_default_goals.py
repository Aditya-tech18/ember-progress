import httpx
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']

headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

print("🎯 Setting default goal 'JEE' for existing users...")
print(f"📍 URL: {SUPABASE_URL}")
print("-" * 60)

with httpx.Client(timeout=30) as client:
    # Get all users without a goal
    try:
        response = client.get(
            f'{SUPABASE_URL}/rest/v1/users?select=id,email,goal&limit=1000',
            headers=headers
        )
        
        if response.status_code == 200:
            users = response.json()
            users_without_goal = [u for u in users if not u.get('goal')]
            
            print(f"✅ Found {len(users)} total users")
            print(f"⏳ {len(users_without_goal)} users need default goal")
            
            if len(users_without_goal) > 0:
                # Update all users without goal to JEE
                for user in users_without_goal[:10]:  # Show first 10
                    print(f"  - Setting goal for user: {user.get('email', user['id'])}")
                
                # Bulk update using SQL function would be better, but we'll do direct update
                update_response = client.patch(
                    f'{SUPABASE_URL}/rest/v1/users?goal=is.null',
                    headers=headers,
                    json={
                        'goal': 'JEE',
                        'goal_selected_at': '2024-01-01T00:00:00Z'
                    }
                )
                
                if update_response.status_code in [200, 204]:
                    print(f"\n✅ Successfully set {len(users_without_goal)} users to JEE goal!")
                else:
                    print(f"\n⚠️  Update response: {update_response.status_code}")
                    print(f"Response: {update_response.text}")
            else:
                print("✅ All users already have goals set!")
        else:
            print(f"⚠️  Could not fetch users: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error: {str(e)}")

print("\n✅ Done!")
print("\nSQL Alternative (run in Supabase SQL Editor):")
print("=" * 60)
print("""
UPDATE users 
SET goal = 'JEE', 
    goal_selected_at = NOW() 
WHERE goal IS NULL;
""")
print("=" * 60)

