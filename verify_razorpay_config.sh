#!/bin/bash

# Razorpay UPI Configuration Verification Script
# This script checks if all required configurations are in place

echo "🔍 Razorpay UPI Intent Configuration Checker"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: webview_intent in Subscription.tsx
echo "1️⃣  Checking Subscription.tsx for webview_intent..."
if grep -q "webview_intent: true" /app/frontend/src/pages/Subscription.tsx; then
    echo -e "${GREEN}✅ PASS${NC}: webview_intent: true found in Subscription.tsx"
else
    echo -e "${RED}❌ FAIL${NC}: webview_intent: true NOT found in Subscription.tsx"
fi
echo ""

# Check 2: MainActivity.java has onNewIntent
echo "2️⃣  Checking MainActivity.java for onNewIntent handler..."
if grep -q "onNewIntent" /app/frontend/android/app/src/main/java/com/prepixo/aimup/MainActivity.java; then
    echo -e "${GREEN}✅ PASS${NC}: onNewIntent method found in MainActivity.java"
else
    echo -e "${RED}❌ FAIL${NC}: onNewIntent method NOT found in MainActivity.java"
fi
echo ""

# Check 3: AndroidManifest.xml has Razorpay intent filter
echo "3️⃣  Checking AndroidManifest.xml for Razorpay intent filter..."
if grep -q "Razorpay UPI Intent callback handler" /app/frontend/android/app/src/main/AndroidManifest.xml; then
    echo -e "${GREEN}✅ PASS${NC}: Razorpay intent filter found in AndroidManifest.xml"
else
    echo -e "${RED}❌ FAIL${NC}: Razorpay intent filter NOT found in AndroidManifest.xml"
fi
echo ""

# Check 4: Razorpay key configured
echo "4️⃣  Checking Razorpay key configuration..."
if grep -q "RAZORPAY_KEY_ID" /app/frontend/src/pages/Subscription.tsx; then
    echo -e "${GREEN}✅ PASS${NC}: Razorpay key import found"
    
    # Check if using environment variable
    if grep -q "import.meta.env.VITE_RAZORPAY_KEY_ID" /app/frontend/src/pages/Subscription.tsx; then
        echo -e "${GREEN}   ✓${NC} Using environment variable (recommended)"
    else
        echo -e "${YELLOW}   ⚠${NC}  Using hardcoded key (ensure it's test key for testing)"
    fi
else
    echo -e "${RED}❌ FAIL${NC}: Razorpay key configuration not found"
fi
echo ""

# Check 5: Capacitor configuration
echo "5️⃣  Checking Capacitor configuration..."
if [ -f "/app/frontend/capacitor.config.ts" ]; then
    echo -e "${GREEN}✅ PASS${NC}: capacitor.config.ts found"
    APP_ID=$(grep -oP 'appId:\s*"\K[^"]+' /app/frontend/capacitor.config.ts)
    if [ ! -z "$APP_ID" ]; then
        echo -e "${GREEN}   ✓${NC} App ID: $APP_ID"
    fi
else
    echo -e "${RED}❌ FAIL${NC}: capacitor.config.ts NOT found"
fi
echo ""

# Summary
echo "=============================================="
echo "📋 Configuration Summary:"
echo ""
echo "Required for UPI Intent to work:"
echo "  ✓ webview_intent: true in Razorpay options"
echo "  ✓ onNewIntent() in MainActivity.java"
echo "  ✓ Intent filter in AndroidManifest.xml"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "  • UPI Intent only works on REAL Android devices"
echo "  • Android emulator has LIMITED UPI testing capability"
echo "  • Install PhonePe/GPay/Paytm on test device"
echo "  • Use 'success@razorpay' as test UPI ID"
echo ""
echo "📱 To test on Android device:"
echo "  1. Connect Android phone via USB (USB Debugging enabled)"
echo "  2. cd frontend && yarn build && npx cap sync android"
echo "  3. npx cap run android"
echo "  4. Go to Subscription page in app"
echo "  5. Click 'Pay with UPI'"
echo "  6. UPI apps should appear!"
echo ""
echo "✅ All checks complete!"
echo ""
