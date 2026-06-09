import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

declare global {
  interface Window {
    Capacitor?: any;
  }
}

/**
 * Custom hook to handle Android hardware back button behavior
 * - If history exists: Navigate to previous screen
 * - If on home screen: Exit app
 */
export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if running in Capacitor (mobile app)
    const isCapacitor = window.Capacitor !== undefined;
    
    if (!isCapacitor) {
      return; // Skip if not in Capacitor environment
    }

    const handleBackButton = async () => {
      const homeRoutes = ['/', '/home', '/dashboard', '/jee-main'];
      const currentPath = location.pathname;

      // Check if we're on a home/root screen
      if (homeRoutes.includes(currentPath)) {
        // Try to import App plugin dynamically
        try {
          const { App } = await import('@capacitor/app');
          App.exitApp();
        } catch (err) {
          console.log('Capacitor App plugin not available');
        }
      } else {
        // Navigate back in history
        navigate(-1);
      }
    };

    // Register back button listener for Capacitor
    let backButtonListener: any;
    
    const setupListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backButtonListener = await App.addListener('backButton', handleBackButton);
      } catch (err) {
        console.log('Could not set up back button listener:', err);
      }
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [navigate, location]);
};

export default useAndroidBackButton;
