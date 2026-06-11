package com.prepixo.aimup;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable JavaScript and DOM storage for Razorpay
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings webSettings = webView.getSettings();
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setAllowFileAccess(true);
            webSettings.setAllowContentAccess(true);
            
            // Enable hardware acceleration for better performance
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        }
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        
        // Handle deep links from UPI apps (PhonePe, GPay, Paytm) and wallets
        if (intent != null && intent.getData() != null) {
            String url = intent.getData().toString();
            // The WebView will automatically handle Razorpay's return URLs
            // This enables payment completion callbacks
        }
    }
    
    @Override
    public void onResume() {
        super.onResume();
        // Ensure intent is processed when app comes to foreground
        if (getIntent() != null && getIntent().getData() != null) {
            onNewIntent(getIntent());
        }
    }
}
