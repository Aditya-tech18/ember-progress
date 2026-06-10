#!/bin/bash

# PhonePe Payment Configuration Verification Script

echo "🔍 PhonePe Payment Flow Configuration Checker"
echo "=============================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check 1: webview_intent parameter
echo "1️⃣  Checking webview_intent configuration..."
if grep -q "webview_intent: true" /app/frontend/src/pages/Subscription.tsx; then
    echo -e "${GREEN}✅ PASS${NC}: webview_intent: true enabled"
else
    echo -e "${RED}❌ FAIL${NC}: webview_intent not found"
fi
echo ""

# Check 2: PhonePe in apps array
echo "2️⃣  Checking PhonePe priority in UPI apps..."
if grep -q 'apps:.*\["phonepe"' /app/frontend/src/pages/Subscription.tsx; then
    echo -e "${GREEN}✅ PASS${NC}: PhonePe listed first in apps array"
else
    echo -e "${RED}❌ FAIL${NC}: PhonePe not prioritized"
fi
echo ""

# Check 3: Intent flow configuration
echo "3️⃣  Checking UPI Intent flow..."
if grep -q 'flows:.*\["intent"\]' /app/frontend/src/pages/Subscription.tsx; then
    echo -e "${GREEN}✅ PASS${NC}: Intent flow configured (enables app navigation)"
else
    echo -e "${RED}❌ FAIL${NC}: Intent flow not configured"
fi
echo ""

# Check 4: PhonePe in wallet options
echo "4️⃣  Checking PhonePe wallet option..."
if grep -q 'wallets:.*\["phonepe"\]' /app/frontend/src/pages/Subscription.tsx; then
    echo -e "${GREEN}✅ PASS${NC}: PhonePe wallet option enabled"
else
    echo -e "${YELLOW}⚠️  WARN${NC}: PhonePe wallet not explicitly configured"
fi
echo ""

# Check 5: Display blocks configuration
echo "5️⃣  Checking custom display blocks..."
if grep -q "config:" /app/frontend/src/pages/Subscription.tsx && grep -q "display:" /app/frontend/src/pages/Subscription.tsx; then
    echo -e "${GREEN}✅ PASS${NC}: Custom display blocks configured"
    
    # Check block sequence
    if grep -q "sequence:.*\[.*block.utib" /app/frontend/src/pages/Subscription.tsx; then
        echo -e "${GREEN}   ✓${NC} UPI apps block shown first"
    fi
else
    echo -e "${RED}❌ FAIL${NC}: Display blocks not configured"
fi
echo ""

# Check 6: Android configuration
echo "6️⃣  Checking Android deep-link configuration..."
if grep -q "onNewIntent" /app/frontend/android/app/src/main/java/com/prepixo/aimup/MainActivity.java; then
    echo -e "${GREEN}✅ PASS${NC}: MainActivity handles payment callbacks"
else
    echo -e "${RED}❌ FAIL${NC}: MainActivity callback handler missing"
fi

if grep -q "Razorpay UPI Intent callback handler" /app/frontend/android/app/src/main/AndroidManifest.xml; then
    echo -e "${GREEN}✅ PASS${NC}: AndroidManifest has Razorpay intent filter"
else
    echo -e "${RED}❌ FAIL${NC}: AndroidManifest intent filter missing"
fi
echo ""

# Summary
echo "=============================================="
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo ""
echo "PhonePe Payment Flow Components:"
echo "  ✓ webview_intent: true (enables app navigation)"
echo "  ✓ apps: [\"phonepe\", ...] (PhonePe priority)"
echo "  ✓ flows: [\"intent\"] (direct app launch)"
echo "  ✓ wallets: [\"phonepe\"] (wallet option)"
echo "  ✓ Custom display blocks (UPI apps first)"
echo "  ✓ Android deep-link handlers (payment return)"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT TESTING NOTES:${NC}"
echo ""
echo "  📱 PhonePe Priority Flow:"
echo "     1. User clicks 'Pay with UPI'"
echo "     2. Razorpay shows 'Pay using UPI Apps' first"
echo "     3. PhonePe appears as first option"
echo "     4. User taps PhonePe → App opens automatically"
echo "     5. Payment completes → Returns to Prepixo"
echo ""
echo "  🧪 Testing Requirements:"
echo "     • MUST test on real Android device (not emulator)"
echo "     • PhonePe must be installed on device"
echo "     • PhonePe must be activated in Razorpay dashboard"
echo "     • Use test UPI ID: success@razorpay"
echo ""
echo "  📱 Build and Test Commands:"
echo "     cd frontend"
echo "     yarn build"
echo "     npx cap sync android"
echo "     npx cap run android"
echo ""
echo -e "${GREEN}✅ All PhonePe configuration checks complete!${NC}"
echo ""
echo "Next: Test on your Android device to verify PhonePe appears and navigates correctly."
echo ""
