import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook to handle Android back button navigation
 * Prevents app from closing and navigates to previous page instead
 */
export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only handle on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (!isMobile) return;

    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      
      // If we're on the home page, allow default behavior (exit app)
      if (location.pathname === '/') {
        // Let the app close naturally
        return;
      }

      // Otherwise, navigate back
      navigate(-1);
    };

    // Add listener for popstate (back button)
    window.addEventListener('popstate', handleBackButton);

    // Push state to enable back button handling
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [navigate, location]);
};

export default useAndroidBackButton;
