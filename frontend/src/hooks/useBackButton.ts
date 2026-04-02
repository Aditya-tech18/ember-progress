import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook to handle back button behavior (especially for Android)
 * Prevents app from closing and navigates to previous page instead
 */
export const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Detect if running as a PWA or mobile app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Only handle on mobile or PWA
    if (!isMobile && !isStandalone) return;

    const handlePopState = (e: PopStateEvent) => {
      // If we're on the home page, allow default behavior
      if (location.pathname === '/') {
        return;
      }

      // Prevent default and navigate back
      e.preventDefault();
      navigate(-1);
    };

    // Listen for back button
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate, location.pathname]);
};

export default useBackButton;
