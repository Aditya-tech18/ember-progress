import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Enhanced Android back button handler with "Press again to exit" feature
 */
export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (!isMobile) return;

    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      
      const isHomePage = location.pathname === '/' || location.pathname === '/index';
      
      if (isHomePage) {
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
        // Not on home - navigate back
        navigate(-1);
      }
    };

    window.addEventListener('popstate', handleBackButton);
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [navigate, location]);
};

export default useAndroidBackButton;