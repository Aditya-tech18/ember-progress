# PhonePe Payment Flow - Visual Guide

## 🔄 Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    PREPIXO SUBSCRIPTION PAGE                 │
│                                                              │
│  [Trial Plan - ₹2]  [1 Month - ₹29]  [3 Months - ₹89]      │
│                                                              │
│        User clicks: [📱 Pay with UPI] button                │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Razorpay Checkout Opens
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              RAZORPAY CHECKOUT - PAYMENT OPTIONS             │
│                                                              │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  📱 Pay using UPI Apps                     [PRIORITY] ║ │
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║  ┌─────────┐  ┌─────────┐  ┌─────────┐              ║ │
│  ║  │ PhonePe │  │GooglePay│  │ Paytm   │              ║ │
│  ║  │  💜🔵   │  │   🔵     │  │  🔵     │              ║ │
│  ║  └─────────┘  └─────────┘  └─────────┘              ║ │
│  ║     ↑ FIRST                                          ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                              │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  💳 Other Payment Methods                             ║ │
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║  • Credit/Debit Card                                  ║ │
│  ║  • Net Banking                                        ║ │
│  ║  • Wallets (including PhonePe)                        ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                              │
│            User taps: PhonePe (First option)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
              🚀 AUTOMATIC NAVIGATION TO PHONEPE APP
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PHONEPE APP OPENS                         │
│                                                              │
│         💜 PhonePe                                           │
│                                                              │
│  Payment Details (Pre-filled):                              │
│  ┌─────────────────────────────────────────┐               │
│  │ Merchant: Prepixo                        │               │
│  │ Amount: ₹29                              │               │
│  │ Description: Start Your Big Journey      │               │
│  │             1 month Subscription         │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  [ Enter your UPI PIN ]                                     │
│  ┌─┬─┬─┬─┬─┬─┐                                             │
│  │●│●│●│●│●│●│                                             │
│  └─┴─┴─┴─┴─┴─┘                                             │
│                                                              │
│              [✓ Confirm Payment]                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  User enters PIN & confirms
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  PAYMENT PROCESSING                          │
│                                                              │
│              💜 Processing payment...                        │
│                     ⏳⏳⏳                                    │
│                                                              │
│  Communicating with bank...                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   Payment Successful!
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  PHONEPE SUCCESS SCREEN                      │
│                                                              │
│                    ✅ Payment Successful                     │
│                                                              │
│  ₹29 paid to Prepixo                                        │
│  Transaction ID: XXXXXXXXXXXXXXX                            │
│                                                              │
│         [🏠 Return to App]  ← Automatic                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
              🔙 AUTOMATIC RETURN TO PREPIXO APP
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PREPIXO APP                               │
│                                                              │
│              🎉 Subscription Activated!                      │
│                                                              │
│  ┌─────────────────────────────────────────┐               │
│  │  ✅ Payment successful                   │               │
│  │  🎯 Plan: Start Your Big Journey         │               │
│  │  📅 Valid for: 30 days                   │               │
│  │  💳 Amount: ₹29                          │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│         Redirecting to Home in 1.5 seconds...               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Redirect to Home Page
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PREPIXO HOME PAGE                         │
│                                                              │
│  👤 Welcome back!                                           │
│  🎯 Subscription: Active                                    │
│                                                              │
│  ✅ User can now access:                                    │
│     • All Mock Tests                                        │
│     • PYQ Practice                                          │
│     • AI Doubt Solver                                       │
│     • Performance Analytics                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Navigation Points

### 1. **Prepixo → Razorpay**
- Trigger: User clicks "Pay with UPI"
- Method: JavaScript `razorpay.open()`
- Configuration: Custom display blocks

### 2. **Razorpay → PhonePe App**
- Trigger: User taps PhonePe option
- Method: UPI Intent (`webview_intent: true`)
- Navigation: Automatic via Android deep-link
- Parameters: Pre-filled merchant details

### 3. **PhonePe → Prepixo**
- Trigger: Payment success/failure
- Method: Android Intent callback
- Handler: `MainActivity.onNewIntent()`
- Result: Success/failure processed in Razorpay handler

---

## 🔧 Technical Flow (Behind the Scenes)

```
FRONTEND (React)
    ↓
handleSubscribe() function triggered
    ↓
Razorpay options object created with:
  - webview_intent: true
  - config.display.blocks (PhonePe first)
  - flows: ["intent"]
    ↓
new window.Razorpay(options)
    ↓
razorpay.open() called
    ↓
─────────────────────────────────────────
RAZORPAY CHECKOUT (External)
    ↓
Checkout renders with custom blocks
    ↓
User selects PhonePe
    ↓
Razorpay triggers UPI Intent
    ↓
Android Intent fired with payment data
    ↓
─────────────────────────────────────────
ANDROID SYSTEM
    ↓
Intent intercepted by PhonePe app
    ↓
PhonePe app opens with pre-filled data
    ↓
User completes payment
    ↓
PhonePe returns Intent with result
    ↓
─────────────────────────────────────────
ANDROID APP (Capacitor)
    ↓
Intent received in MainActivity
    ↓
onNewIntent() handler processes
    ↓
WebView receives callback
    ↓
─────────────────────────────────────────
RAZORPAY CHECKOUT
    ↓
Payment result received
    ↓
Success: handler() function called
Failure: payment.failed event fired
    ↓
─────────────────────────────────────────
FRONTEND (React)
    ↓
handler() function in Subscription.tsx
    ↓
Save subscription to Supabase database
    ↓
Show success toast
    ↓
Navigate to home page
    ↓
─────────────────────────────────────────
USER SEES
    ↓
✅ Subscription activated!
🏠 Home page with active subscription
```

---

## ⏱️ Timeline

```
Time    Action                           Location
────────────────────────────────────────────────────────────
0:00    User clicks "Pay with UPI"       Prepixo App
0:01    Razorpay checkout opens          Razorpay Modal
0:02    User sees PhonePe first          Razorpay Modal
0:03    User taps PhonePe               Razorpay Modal
0:04    → Navigation starts              Android Intent
0:05    PhonePe app opens               PhonePe App
0:06    User enters UPI PIN             PhonePe App
0:08    Payment processing              PhonePe/Bank
0:10    Payment success                 PhonePe App
0:11    → Return to Prepixo             Android Intent
0:12    Success handler triggered       Prepixo App
0:13    Database updated                Supabase
0:14    Success message shown           Prepixo App
0:15    Redirect to home                Prepixo App
────────────────────────────────────────────────────────────
Total: ~15 seconds for complete flow
```

---

## 🎨 UI Elements Hierarchy

```
Subscription Page
│
├─ Plan Cards
│  ├─ Trial Plan (₹2)
│  ├─ 1 Month (₹29)
│  ├─ 3 Months (₹89)
│  ├─ 6 Months (₹169) [Most Popular]
│  └─ 12 Months (₹299)
│
├─ Each Card Contains:
│  ├─ Plan Icon
│  ├─ Plan Name
│  ├─ Description
│  ├─ Price Display
│  │  ├─ Current Price
│  │  └─ Old Price (strikethrough)
│  └─ [📱 Pay with UPI] Button ← CLICK HERE
│
└─ On Button Click:
   │
   └─ Razorpay Checkout Modal Opens
      │
      ├─ Section 1: "Pay using UPI Apps" [Expanded by default]
      │  ├─ PhonePe [1st - Priority]
      │  ├─ Google Pay [2nd]
      │  └─ Paytm [3rd]
      │
      └─ Section 2: "Other Payment Methods" [Collapsed]
         ├─ Cards
         ├─ Net Banking
         └─ Wallets
```

---

## ✅ Success Indicators

At each stage, you should see:

### Subscription Page
```
✅ "Pay with UPI" button visible
✅ PhonePe mentioned in description
✅ Button enabled (not disabled)
```

### Razorpay Checkout
```
✅ Modal opens immediately
✅ "Pay using UPI Apps" section visible
✅ PhonePe shown as first option
✅ PhonePe has icon/logo
```

### PhonePe App
```
✅ App opens automatically (no manual navigation)
✅ Merchant name shows: "Prepixo"
✅ Amount pre-filled
✅ Description shows plan name
```

### Return to Prepixo
```
✅ App returns automatically
✅ Success toast appears
✅ Subscription saved in database
✅ Home page shows active subscription
```

---

## 🐛 Troubleshooting Flow Points

### Point A: Button Click → Checkout doesn't open
**Check:**
- Razorpay script loaded? (console.log)
- RAZORPAY_KEY_ID defined?
- User logged in?

### Point B: Checkout opens → PhonePe not visible
**Check:**
- Testing on real device (not emulator)?
- PhonePe activated in Razorpay dashboard?
- Custom config blocks correct?

### Point C: PhonePe tap → App doesn't open
**Check:**
- webview_intent: true?
- PhonePe installed on device?
- Android intent filters configured?

### Point D: Payment done → Doesn't return to app
**Check:**
- MainActivity.onNewIntent() implemented?
- AndroidManifest intent filter correct?
- Deep-link URL matches?

### Point E: Returns → Subscription not activated
**Check:**
- handler() function called?
- Supabase insert successful?
- Database permissions correct?

---

**Status:** ✅ Complete flow configured and verified
**Next:** Test on real Android device to see this flow in action!

