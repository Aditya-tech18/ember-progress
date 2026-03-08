import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const mockTestPaths = ["/mock-test/", "/contest/", "/team-battle/"];
      const isInMockTest = mockTestPaths.some(p => location.pathname.startsWith(p)) && 
        !location.pathname.includes("/instructions/") && 
        !location.pathname.includes("/result/");

      if (isInMockTest) {
        e.preventDefault();
        const confirmed = window.confirm("Are you sure you want to exit? Your progress may be lost.");
        if (!confirmed) {
          // Push current state back
          window.history.pushState(null, "", location.pathname);
        }
      }
    };

    // Push initial state so we can catch back button
    window.history.pushState(null, "", location.pathname);
    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [location.pathname, navigate]);
};
