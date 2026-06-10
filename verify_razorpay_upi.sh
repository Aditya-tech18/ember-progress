#!/bin/bash

echo "🔍 Razorpay Configuration Verification"
echo "======================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "✅ Checking Razorpay Configuration..."
echo ""

# Check if method.upi is enabled
if grep -q "upi: true" /app/frontend/src/pages/Subscription.tsx; then
    echo -e "${GREEN}✅ UPI enabled${NC} (PhonePe will appear in UPI section)"
else
    echo -e "${RED}❌ UPI not enabled${NC}"
fi

# Check if method.wallet is enabled
if grep -q "wallet: true" /app/frontend/src/pages/Subscription.tsx; then
    echo -e "${GREEN}✅ Wallet enabled${NC} (Other wallets like Paytm will appear)"
else
    echo -e "${RED}❌ Wallet not enabled${NC}"
fi

# Check webview_intent
if grep -q "webview_intent: true" /app/frontend/src/pages/Subscription.tsx; then
    echo -e "${GREEN}✅ webview_intent enabled${NC} (App navigation will work)"
else
    echo -e "${RED}❌ webview_intent not enabled${NC}"
fi

# Check if custom config blocks removed
if grep -q "config:" /app/frontend/src/pages/Subscription.tsx; then
    if grep -q "display:" /app/frontend/src/pages/Subscription.tsx; then
        echo -e "${YELLOW}⚠️  WARNING: Custom config blocks still present${NC}"
        echo -e "   This might override default methods"
    fi
else
    echo -e "${GREEN}✅ No custom blocks${NC} (Using Razorpay defaults)"
fi

echo ""
echo "======================================"
echo "📋 Configuration Summary:"
echo ""
echo "  method: {"
echo "    netbanking: true,"
echo "    card: true,"
echo "    upi: true,        ← PhonePe appears here"
echo "    wallet: true      ← Other wallets appear here"
echo "  },"
echo "  webview_intent: true  ← Enables app navigation"
echo ""
echo -e "${YELLOW}🎯 IMPORTANT:${NC}"
echo "  • PhonePe is in UPI section (NOT Wallets)"
echo "  • You must have UPI enabled in Razorpay Dashboard"
echo "  • Test on real Android device (not emulator)"
echo ""
echo "======================================"
echo ""
echo "📱 Testing Checklist:"
echo ""
echo "  □ Login to Razorpay Dashboard"
echo "  □ Go to Settings → Payment Methods"
echo "  □ Verify UPI is ENABLED"
echo "  □ Build app: yarn build && npx cap sync android"
echo "  □ Install on Android device"
echo "  □ Open Subscription page"
echo "  □ Click 'Pay with UPI'"
echo "  □ Verify UPI section appears"
echo "  □ Verify PhonePe is listed in UPI"
echo "  □ Tap PhonePe → Should open PhonePe app"
echo ""
echo "✅ Configuration check complete!"
echo ""
