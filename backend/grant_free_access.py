import httpx
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']

headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

email = "practice9961@gmail.com"

print(f"🎁 Granting free lifetime access to {email}...")
print("-" * 60)

with httpx.Client(timeout=30) as client:
    # Get user by email
    response = client.get(
        f'{SUPABASE_URL}/rest/v1/users?select=id,email&email=eq.{email}',
        headers=headers
    )
    
    if response.status_code == 200:
        users = response.json()
        if users:
            user_id = users[0]['id']
            print(f"✅ Found user: {email}")
            print(f"   User ID: {user_id}")
            
            # Grant lifetime subscription
            subscription_data = {
                'user_id': user_id,
                'email': email,
                'plan_name': 'BuildLife Lifetime - Free Access',
                'paid_on': datetime.now().isoformat(),
                'valid_until': datetime(2099, 12, 31).isoformat(),
                'payment_id': 'free_access_granted'
            }
            
            # Upsert subscription
            sub_response = client.post(
                f'{SUPABASE_URL}/rest/v1/subscriptions',
                headers=headers,
                json=subscription_data
            )
            
            if sub_response.status_code in [200, 201]:
                print(f"✅ Lifetime subscription granted!")
                print(f"   Valid until: 2099-12-31")
            else:
                # Try update if exists
                update_response = client.patch(
                    f'{SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.{user_id}',
                    headers=headers,
                    json=subscription_data
                )
                if update_response.status_code in [200, 204]:
                    print(f"✅ Subscription updated to lifetime!")
                else:
                    print(f"⚠️  Response: {sub_response.text}")
        else:
            print(f"❌ User not found with email: {email}")
            print("   User needs to signup first")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

print("\n✅ Done!")

