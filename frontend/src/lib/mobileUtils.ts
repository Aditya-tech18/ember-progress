/**
 * Mobile Optimization Utilities
 * Ensures all screens fit perfectly on mobile devices
 */

// Mobile breakpoints
export const BREAKPOINTS = {
  xs: '320px',   // Small phones
  sm: '375px',   // iPhone SE, iPhone 12/13 mini
  md: '414px',   // iPhone 12/13 Pro Max
  lg: '768px',   // Tablets
  xl: '1024px',  // Desktop
};

// Safe area insets for notched devices
export const SAFE_AREAS = {
  top: 'env(safe-area-inset-top, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
};

// Minimum touch target size (Apple & Google guidelines)
export const TOUCH_TARGET = {
  minWidth: '44px',
  minHeight: '44px',
};

// Common mobile styles
export const mobileStyles = {
  // Prevent text from being too small
  minFontSize: {
    fontSize: 'max(16px, 1rem)', // Prevents zoom on iOS
  },
  
  // Prevent horizontal scroll
  noScrollX: {
    overflowX: 'hidden',
    maxWidth: '100vw',
  },
  
  // Full viewport height accounting for mobile browser chrome
  fullHeight: {
    minHeight: '100vh',
    minHeight: '100dvh', // Dynamic viewport height
  },
  
  // Safe area padding for notched devices
  safeAreaPadding: {
    paddingTop: SAFE_AREAS.top,
    paddingBottom: SAFE_AREAS.bottom,
    paddingLeft: SAFE_AREAS.left,
    paddingRight: SAFE_AREAS.right,
  },
  
  // Touch-friendly button
  touchButton: {
    minWidth: TOUCH_TARGET.minWidth,
    minHeight: TOUCH_TARGET.minHeight,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  
  // Prevent zoom on input focus (iOS)
  noZoomInput: {
    fontSize: '16px', // iOS won't zoom if font-size >= 16px
  },
  
  // Mobile container with proper padding
  mobileContainer: {
    width: '100%',
    maxWidth: '100vw',
    paddingLeft: 'max(16px, env(safe-area-inset-left))',
    paddingRight: 'max(16px, env(safe-area-inset-right))',
  },
};

// Helper function to check if device is mobile
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

// Helper to prevent scroll when modal is open
export const preventScroll = (prevent: boolean) => {
  if (typeof document === 'undefined') return;
  
  if (prevent) {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  } else {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
};

// Get viewport dimensions
export const getViewport = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    // Dynamic viewport (excludes browser chrome)
    dynamicHeight: window.visualViewport?.height || window.innerHeight,
  };
};
