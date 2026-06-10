# 🚨 CRITICAL: How to Enable UPI in Razorpay Dashboard

## THE PROBLEM

You're only seeing **Cards** and **Netbanking** in the payment options.
**UPI is NOT showing** because it's likely **DISABLED** in your Razorpay dashboard.

**This is NOT a code issue. This is a dashboard settings issue.**

---

## ✅ SOLUTION: Enable UPI in Dashboard

### Step-by-Step Guide with Details

#### **Step 1: Open Razorpay Dashboard**

1. Go to: **https://dashboard.razorpay.com**
2. Login with your credentials
3. You'll see the dashboard home page

#### **Step 2: Navigate to Payment Methods Settings**

**Option A: Via Settings**
1. Click on **"Settings"** (gear icon) in the left sidebar
2. Click on **"Payment Methods"** or **"Configuration"**

**Option B: Via Account Menu**
1. Click your profile/account name (top right)
2. Look for **"Payment Methods"** or **"Account Settings"**
3. Navigate to payment configuration section

#### **Step 3: Check Payment Methods Status**

You should see a list like this:

```
Payment Methods
───────────────────────────────────────
✅ Cards                    [Toggle: ON]
❌ UPI                      [Toggle: OFF] ← THIS IS THE PROBLEM!
✅ Net Banking              [Toggle: ON]
❌ Wallets                  [Toggle: OFF] ← Also needs to be ON
❓ EMI                      [Toggle: OFF]
```

#### **Step 4: Enable UPI**

1. Find **"UPI"** in the payment methods list
2. Click the **toggle switch** to turn it **ON**
3. You might see additional options:
   - **UPI Intent** - Enable this (for PhonePe, GPay app opening)
   - **UPI Collect** - Enable this (for manual UPI ID entry)
   - **UPI QR** - Optional

**Enable ALL UPI options**

#### **Step 5: Enable Wallets (Optional but Recommended)**

1. Find **"Wallets"** in the payment methods list
2. Click the **toggle switch** to turn it **ON**
3. You might see wallet options:
   - PhonePe Wallet
   - Paytm Wallet
   - MobiKwik
   - Ola Money
   - FreeCharge
   
**Enable the wallets you want to support**

#### **Step 6: Save Changes**

1. Look for a **"Save"** or **"Update"** button
2. Click it to save your changes
3. You might see a confirmation message: "Payment methods updated successfully"

#### **Step 7: Verify Changes**

After saving, verify the status:

```
Payment Methods
───────────────────────────────────────
✅ Cards                    [Toggle: ON]  ✓ Working
✅ UPI                      [Toggle: ON]  ✓ NOW ENABLED!
✅ Net Banking              [Toggle: ON]  ✓ Working
✅ Wallets                  [Toggle: ON]  ✓ NOW ENABLED!
```

---

## ⚠️ Important Notes

### Account Activation Required

Some Razorpay accounts need to be **fully activated** before certain payment methods become available:

**Requirements for UPI:**
- ✅ KYC verification complete
- ✅ Business details submitted
- ✅ Bank account linked
- ✅ Account status: "Activated" (not "Pending" or "Restricted")

**Check Your Account Status:**
1. Go to Razorpay Dashboard home
2. Look at the top banner or sidebar
3. Status should be: **"Activated" ✅**
4. If it says **"Pending Verification" ⏳** or **"Action Required" ⚠️**, complete those steps first

### Test Mode vs Live Mode

Your key: `rzp_live_SObcQvFXRo6HAa` (This is a **LIVE** key)

**Make sure:**
- Dashboard is in **LIVE MODE** (check top-right corner toggle)
- Payment methods are enabled for **LIVE MODE** (not just Test Mode)

**How to Check:**
1. Look at top-right corner of dashboard
2. You'll see: **"Test Mode"** or **"Live Mode"** toggle
3. Switch to **"Live Mode"**
4. Enable UPI in Live Mode settings

---

## 🔄 After Enabling UPI

### Wait for Changes to Sync

**Important:** After enabling UPI in dashboard:
1. **Wait 5-10 minutes** for changes to propagate
2. Razorpay needs time to sync your settings

### Rebuild Your App

```bash
cd frontend
yarn build
npx cap sync android
npx cap run android
```

### Test Again

1. Open app on Android device
2. Go to Subscription page
3. Click "Pay with UPI"
4. **Now you should see:**
   - 📱 UPI section with PhonePe, GPay, Paytm
   - 💰 Wallets section (if enabled)
   - 💳 Cards section
   - 🏦 Net Banking section

---

## 🆘 Still Not Working?

### Scenario 1: UPI is Enabled but Still Not Showing

**Possible Reasons:**

1. **Account Not Fully Activated**
   - Check if KYC is complete
   - Verify business details are submitted
   - Check for pending verifications

2. **Regional Restrictions**
   - Some payment methods are region-specific
   - UPI is primarily for India
   - Check if your account is set up for Indian market

3. **Integration Issue**
   - Contact Razorpay support
   - They might need to enable UPI backend for your account

### Scenario 2: "UPI Not Available" Message

If you see "UPI Not Available" in dashboard:

1. Complete KYC verification
2. Submit business registration documents
3. Link bank account
4. Wait for Razorpay approval (1-2 business days)

### Scenario 3: Toggle is Grayed Out

If the UPI toggle is grayed out (can't be clicked):

1. Your account might not be eligible yet
2. Contact Razorpay support: support@razorpay.com
3. Ask them to enable UPI for your account

---

## 📧 Contact Razorpay Support

If none of the above works, contact Razorpay:

**Email:** support@razorpay.com

**Subject:** Request to Enable UPI Payment Method

**Email Template:**

```
Dear Razorpay Support Team,

I am unable to enable UPI payment method in my Razorpay account.

Account Details:
- Account ID: [Your Account ID from dashboard]
- Registered Website: ember-progress.vercel.app
- API Key: rzp_live_SObcQvFXRo6HAa
- Business Name: [Your Business Name]

Issue:
When I go to Settings → Payment Methods, the UPI option is either:
[ ] Grayed out / Cannot be toggled ON
[ ] Shows "Not Available"
[ ] Shows "Activation Required"
[ ] Other: [Describe what you see]

I have completed:
[✓] KYC verification
[✓] Business details submission
[✓] Bank account linking
[✓] Website registration

Please enable UPI payment method for my account so that customers can pay using PhonePe, Google Pay, and other UPI apps.

Screenshots:
[Attach screenshot of your Payment Methods page]
[Attach screenshot of Account Status]

Thank you,
[Your Name]
```

**Attach Screenshots:**
1. Screenshot of Payment Methods page showing UPI status
2. Screenshot of Account home page showing account status

---

## 📸 What to Screenshot

### Screenshot 1: Payment Methods Page

Go to Settings → Payment Methods
Capture the entire page showing:
- UPI toggle and its status
- Wallets toggle and its status
- Cards toggle
- Net Banking toggle

### Screenshot 2: Account Status

Go to Dashboard Home
Capture the top section showing:
- Account activation status
- Any pending actions
- Verification status

### Screenshot 3: Account Details

Go to Settings → Account Details
Capture:
- Account ID
- Registered website
- Business details

---

## ✅ Expected Result After Enabling UPI

Once UPI is properly enabled in your Razorpay dashboard:

```
Payment Options in Your App:
┌─────────────────────────────┐
│ 📱 UPI                      │ ← WILL APPEAR
│   • PhonePe                 │
│   • Google Pay              │
│   • Paytm                   │
│   • Enter UPI ID            │
│                             │
│ 💰 Wallets (if enabled)     │
│   • Paytm Wallet            │
│   • MobiKwik                │
│                             │
│ 💳 Cards                    │ ← Already showing
│                             │
│ 🏦 Net Banking              │ ← Already showing
└─────────────────────────────┘
```

---

## 🎯 Summary

**The code is correct. The problem is in your Razorpay dashboard settings.**

**Action Required:**
1. ✅ Login to Razorpay Dashboard
2. ✅ Go to Settings → Payment Methods
3. ✅ Enable UPI toggle
4. ✅ Enable Wallets toggle (optional)
5. ✅ Save changes
6. ✅ Wait 5-10 minutes
7. ✅ Rebuild app: `yarn build && npx cap sync android`
8. ✅ Test again

**If still not working:**
- Contact Razorpay support with screenshots
- Your account might need activation for UPI
- They can enable it backend

---

**Remember:** No amount of code changes will make UPI appear if it's disabled in your Razorpay dashboard. This must be fixed from the dashboard first.

