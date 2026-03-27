import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, FileText, Target, Calendar, Video, Cloud, Shield, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { PostCloudModal } from "./social/PostCloudModal";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/utils/adminUtils";

export const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPostCloud, setShowPostCloud] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showMentorButton, setShowMentorButton] = useState(false);
  const [mentorPath, setMentorPath] = useState("/student-mentors");

  useEffect(() => {
    checkUserAndMentorStatus();
  }, []);

  const checkUserAndMentorStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserEmail(user.email || null);
    setUserId(user.id);
    
    // Check if user is a mentor OR has paid sessions
    await checkMentorStatus(user.id);
  };

  const checkMentorStatus = async (userId: string) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://db-integration-16.preview.emergentagent.com';
      
      // Check if user has mentor profile
      const mentorCheck = await fetch(`${backendUrl}/api/sessions/mentor/${userId}`);
      const mentorData = await mentorCheck.json();
      
      // Check if user has paid sessions as student
      const studentCheck = await fetch(`${backendUrl}/api/sessions/student/${userId}`);
      const studentData = await studentCheck.json();
      
      if (mentorData.success && mentorData.sessions?.length > 0) {
        setShowMentorButton(true);
        setMentorPath("/mentor-dashboard");
      } else if (studentData.success && studentData.sessions?.length > 0) {
        setShowMentorButton(true);
        setMentorPath("/student-mentors");
      }
    } catch (error) {
      console.error("Error checking mentor status:", error);
    }
  };

  // Hide on mock test and question pages
  const hiddenPaths = ["/mock-test/", "/contest/", "/team-battle/", "/question/"];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  const baseNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: FileText, label: "PYQs", path: "/pyq" },
    { icon: Cloud, label: "Posts", path: "/posts" },
    { icon: Video, label: "Focus", path: "/focus-room" },
    { icon: Calendar, label: "Planner", path: "/planner" },
  ];

  // Build nav items with conditional buttons
  let navItems = [...baseNavItems];
  
  // Add Admin button for admin users
  if (isAdmin(userEmail || undefined)) {
    navItems.push({ icon: Shield, label: "Admin", path: "/admin" });
  }
  
  // Add Mentor button if user is mentor or has paid sessions
  if (showMentorButton) {
    navItems.push({ 
      icon: MessageCircle, 
      label: "Mentor", 
      path: mentorPath
    });
  }

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.path === "/posts") {
      setShowPostCloud(true);
    } else {
      navigate(item.path);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-bottom">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = item.path === "/posts" 
              ? false 
              : location.pathname === item.path;
            
            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.85 }}
                onClick={() => handleNavClick(item)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 w-6 h-0.5 bg-primary rounded-full"
                  />
                )}
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <PostCloudModal
        isOpen={showPostCloud}
        onClose={() => setShowPostCloud(false)}
      />
    </>
  );
};
