# UPI Intent Integration - Complete Implementation Guide

## ✅ Implementation According to Razorpay Documentation

Your app is a **Hybrid Mobile App (WebView)** using Capacitor. According to Razorpay docs, here's the exact implementation:

---

## 📱 For Android (Already Implemented ✅)

### 1. MainActivity.java Configuration

**Status:** ✅ Already correctly implemented

```java
@Override
protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    // Handles UPI Intent callbacks
}

@Override
protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    // Handles deep-link returns from UPI apps
}
```

### 2. AndroidManifest.xml Configuration

**Status:** ✅ Already correctly implemented

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    
    <!-- Production URL -->
    <data android:scheme="https" android:host="ember-progress.vercel.app" />
    
    <!-- App scheme -->
    <data android:scheme="com.prepixo.aimup" />
    
    <!-- UPI schemes -->
    <data android:scheme="upi" />
    <data android:scheme="io.rzp" />
</intent-filter>
```

### 3. Supported UPI Apps (Android)

According to Razorpay documentation, these UPI apps are supported:

1. **Google Pay** ✅
2. **PhonePe** ✅
3. **CRED** ✅
4. **PayTM** ✅
5. **BHIM** ✅
6. **AmazonPay** ✅
7. **iMobile by ICICI** ✅
8. **PayZapp** ✅
9. **Mobikwik** ✅
10. **Navi** ✅

---

## 📱 For iOS (Needs Configuration)

### iOS Info.plist Configuration

According to Razorpay documentation, you need to add UPI app schemes to your iOS app's Info.plist:

**Location:** `/app/frontend/ios/App/App/Info.plist`

**Add this configuration:**

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>tez</string>           <!-- Google Pay -->
    <string>phonepe</string>        <!-- PhonePe -->
    <string>paytmmp</string>        <!-- Paytm -->
    <string>credpay</string>        <!-- CRED -->
    <string>mobikwik</string>       <!-- MobiKwik -->
    <string>in.fampay.app</string>  <!-- FamPay -->
    <string>bhim</string>           <!-- BHIM -->
    <string>amazonpay</string>      <!-- Amazon Pay -->
    <string>navi</string>           <!-- Navi -->
    <string>kiwi</string>           <!-- Kiwi -->
    <string>payzapp</string>        <!-- PayZapp -->
    <string>jupiter</string>        <!-- Jupiter -->
    <string>omnicard</string>       <!-- Omnicard -->
    <string>icici</string>          <!-- ICICI -->
    <string>popclubapp</string>     <!-- PopClub -->
    <string>sbiyono</string>        <!-- SBI YONO -->
    <string>myjio</string>          <!-- MyJio -->
    <string>slice-upi</string>      <!-- Slice -->
    <string>bobupi</string>         <!-- Bank of Baroda -->
    <string>shriramone</string>     <!-- Shriram One -->
    <string>indusmobile</string>    <!-- IndusInd -->
    <string>whatsapp</string>       <!-- WhatsApp Pay -->
    <string>kotakbank</string>      <!-- Kotak -->
</array>
```

### Supported UPI Apps (iOS)

According to Razorpay documentation, these UPI apps are supported on iOS:

1. **Google Pay** ✅
2. **PhonePe** ✅
3. **CRED** ✅
4. **PayTM** ✅
5. **BHIM** ✅

---

## 💻 Web Integration (React/Razorpay Standard Checkout)

### Current Implementation Status

**File:** `/app/frontend/src/pages/Subscription.tsx`

**Status:** ✅ Correctly using Razorpay Standard Checkout

According to Razorpay documentation:
> "UPI Intent for mobile websites works automatically if the intent flow is enabled on your account."

Your current implementation is correct:

```javascript
const options = {
  key: RAZORPAY_KEY_ID,
  amount: plan.amount,
  currency: "INR",
  name: "Prepixo",
  description: `${plan.name} - ${plan.duration} Subscription`,
  image: "https://i.imgur.com/3g7nmJC.png",
  config: {
    display: {
      blocks: {
        banks: {
          name: "All Payment Methods",
          instruments: [
            { method: "upi", flows: ["intent", "collect", "qr"] },
            { method: "wallet", wallets: ["paytm", "mobikwik", "olamoney", "freecharge", "phonepe"] },
            { method: "card" },
            { method: "netbanking" }
          ]
        }
      },
      sequence: ["block.banks"],
      preferences: { show_default_blocks: true }
    }
  },
  prefill: { email: user.email || "" },
  handler: async function (response) {
    // Payment success handler
  }
};

const razorpay = new window.Razorpay(options);
razorpay.open();
```

---

## 🔄 Complete UPI Intent Payment Flow

### According to Razorpay Documentation:

**Step 1:** Customer selects UPI as payment method
- Razorpay displays list of UPI apps

**Step 2:** Customer taps their preferred app (e.g., PhonePe)
- **On Android:** PhonePe app opens via Intent
- **On iOS:** PhonePe app opens via URL scheme

**Step 3:** UPI app opens with pre-populated details
- Merchant: Prepixo
- Amount: ₹29 (or selected plan)
- No need to enter VPA

**Step 4:** Customer enters UPI PIN
- Completes 2-factor authentication

**Step 5:** Payment successful
- **Android:** Returns via deep-link to MainActivity.onNewIntent()
- **iOS:** Returns via URL scheme
- **WebView:** Razorpay handler() function is called

**Step 6:** Subscription activated
- Success toast appears
- Database updated with expiry date
- Redirected to home page

---

## ✅ What's Already Working

### Android ✅
- MainActivity configured for UPI callbacks
- AndroidManifest configured for deep links
- UPI schemes registered
- Razorpay checkout configured

### Web (React) ✅
- Razorpay Standard Checkout integrated
- UPI Intent flows configured
- Payment handler implemented
- Subscription logic complete

### Dashboard ✅
- UPI: ACTIVATED
- UPI Autopay: ACTIVATED
- Wallets: PhonePe, Amazon Pay, Airtel Money ACTIVATED

---

## ⚠️ What Needs to Be Done

### iOS Configuration (Required for iOS App)

**Action:** Add UPI app schemes to iOS Info.plist

**Steps:**
1. Open: `/app/frontend/ios/App/App/Info.plist` in Xcode or text editor
2. Add the `LSApplicationQueriesSchemes` array (shown above)
3. Save the file
4. Rebuild iOS app

**Why:** According to Razorpay docs:
> "Your iOS app must seek permission from the device to open the UPI PSP app that the customer selects on Checkout."

---

## 🎯 Best Practices (As Per Razorpay)

### UPI Apps Display Order

According to Razorpay documentation:
> "You must show the list of UPI apps in 2 sections:
> - Top performing apps (GPAY > PhonePe > Paytm > BHIM)
> - Other apps"

**Razorpay automatically handles this in Standard Checkout** ✅

**Note from Razorpay:**
> "By default, the top PSP (Payment Service Provider) apps appear on the customer's mobile irrespective of the installation status of the UPI apps."

---

## 📊 Platform Support Summary

| Platform | UPI Intent Support | Implementation Status |
|----------|-------------------|----------------------|
| **Android App** | ✅ Fully Supported | ✅ Complete |
| **iOS App** | ✅ Fully Supported | ⚠️ Needs Info.plist update |
| **Mobile Web** | ✅ Chrome Android Only | ✅ Auto-works |
| **Desktop Web** | ❌ QR Code shown instead | ✅ Auto-handled |

---

## 🚀 Final Build Instructions

### For Android:
```bash
cd frontend
yarn build
npx cap sync android
cd android
./gradlew bundleRelease
```

### For iOS:
```bash
cd frontend
yarn build
npx cap sync ios
# Then open Xcode and build
```

---

## ✅ Verification Checklist

**Before Testing:**
- [x] Razorpay Dashboard: UPI ACTIVATED
- [x] Android: MainActivity configured
- [x] Android: AndroidManifest configured
- [x] React: Razorpay Standard Checkout integrated
- [ ] iOS: Info.plist updated with UPI schemes

**After Building:**
- [ ] Install on Android device with UPI apps
- [ ] Test PhonePe payment
- [ ] Test Google Pay payment
- [ ] Verify app returns after payment
- [ ] Verify subscription activates

---

## 📚 Razorpay Documentation References

- [UPI Intent Overview](https://razorpay.com/docs/payments/payment-methods/upi/upi-intent/)
- [UPI Intent for Android WebView](https://razorpay.com/docs/payments/payment-gateway/web-integration/custom/features/webview/upi-intent-android/)
- [UPI Intent for iOS](https://razorpay.com/docs/payments/payment-gateway/ios-integration/standard/payment-methods/upi-intent/)
- [UPI Supported Apps](https://razorpay.com/docs/payments/payment-methods/upi/supported-apps/)

---

**Implementation Status:** 
- ✅ Android: Complete
- ⚠️ iOS: Needs Info.plist update
- ✅ Web: Complete
- ✅ Dashboard: Configured

**Next Step:** Add UPI app schemes to iOS Info.plist and rebuild both apps for testing.
