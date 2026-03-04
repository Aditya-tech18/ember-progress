import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, FileText, Target, Calendar, Video, Cloud } from "lucide-react";
import { useState } from "react";
import { PostCloudModal } from "./social/PostCloudModal";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FileText, label: "PYQs", path: "/pyq" },
  { icon: Cloud, label: "Posts", path: "/posts" },
  { icon: Video, label: "Focus", path: "/focus-room" },
  { icon: Calendar, label: "Planner", path: "/planner" },
];

export const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPostCloud, setShowPostCloud] = useState(false);

  // Hide on mock test pages
  const hiddenPaths = ["/mock-test/", "/contest/", "/team-battle/"];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

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
