package com.prepixo.aimup;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable hardware acceleration for better WebView performance
        // This is important for Razorpay checkout rendering
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        
        // Handle deep links from UPI apps (PhonePe, GPay, Paytm)
        // This allows the app to receive callbacks after payment
        if (intent != null && intent.getData() != null) {
            String url = intent.getData().toString();
            // The WebView will automatically handle Razorpay's return URLs
            // when webview_intent: true is set in checkout options
        }
    }
}
