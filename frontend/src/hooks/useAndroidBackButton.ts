import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Enhanced Android back button handler with "Press again to exit" feature
 * Prevents app from closing immediately and ensures proper navigation
 */
export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPressRef = useRef<number>(0);
  const navigationHistoryRef = useRef<string[]>([]);

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (!isMobile) return;

    // Track navigation history
    navigationHistoryRef.current.push(location.pathname);
    if (navigationHistoryRef.current.length > 10) {
      navigationHistoryRef.current.shift();
    }

    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      
      const isHomePage = location.pathname === '/' || location.pathname === '/index';
      const isGoalSelection = location.pathname === '/goal-selection';
      
      // If on goal selection or home, show exit confirmation
      if (isHomePage || isGoalSelection) {
        const now = Date.now();
        const timeSinceLastPress = now - lastBackPressRef.current;
        
        if (timeSinceLastPress < 2000) {
          // Double press detected - allow app exit
          window.history.back();
          return;
        }
        
        // First press - show toast
        lastBackPressRef.current = now;
        toast.info('Press back again to exit', {
          duration: 2000,
        });
        
        // Push state again to prevent immediate exit
        window.history.pushState(null, '', window.location.href);
      } else {
        // Not on home/goal - navigate back in app
        const historyLength = navigationHistoryRef.current.length;
        if (historyLength > 1) {
          // We have history, go back
          navigate(-1);
        } else {
          // No history, go to home or goal selection
          navigate('/');
        }
      }
    };

    window.addEventListener('popstate', handleBackButton);
    
    // Push initial state to enable back button interception
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [navigate, location]);
};

export default useAndroidBackButton;