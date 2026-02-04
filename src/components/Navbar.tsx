import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Menu, X, Home, FileText, Target, User, LogOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfileModal } from "@/components/social/UserProfileModal";

// Feature definitions for search
const searchableFeatures = [
  { name: "Home", href: "/", keywords: ["home", "dashboard", "main", "start"] },
  { name: "PYQs", href: "/pyq", keywords: ["pyq", "previous", "year", "questions", "practice", "jee", "papers"] },
  { name: "Mock Tests", href: "/mock-tests", keywords: ["mock", "test", "exam", "practice", "full", "paper", "jee"] },
  { name: "Study Planner", href: "/planner", keywords: ["planner", "habit", "tracker", "study", "schedule", "goals", "focus", "pomodoro"] },
  { name: "Weekly Contest", href: "/weekly-contest", keywords: ["weekly", "contest", "competition", "leaderboard", "sunday"] },
  { name: "AI Chat", href: "/ai-chat", keywords: ["ai", "chat", "doubt", "help", "assistant", "ask"] },
  { name: "Subscription", href: "/subscription", keywords: ["subscription", "premium", "plan", "pricing", "buy", "payment"] },
  { name: "About Us", href: "/about", keywords: ["about", "team", "company", "info"] },
  { name: "Contact", href: "/contact", keywords: ["contact", "support", "help", "feedback", "reach"] },
  { name: "Physics", href: "/pyq?subject=physics", keywords: ["physics", "mechanics", "electro", "optics", "waves"] },
  { name: "Chemistry", href: "/pyq?subject=chemistry", keywords: ["chemistry", "organic", "inorganic", "physical"] },
  { name: "Mathematics", href: "/pyq?subject=mathematics", keywords: ["mathematics", "maths", "calculus", "algebra", "geometry"] },
];

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "PYQs", href: "/pyq", icon: FileText },
  { name: "Mock Tests", href: "/mock-tests", icon: Target },
  { name: "Planner", href: "/planner", icon: Calendar },
];

export const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setUserData(data);
  };

  // Filter features based on search query
  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return searchableFeatures.filter(feature => 
      feature.name.toLowerCase().includes(query) ||
      feature.keywords.some(keyword => keyword.includes(query))
    ).slice(0, 6);
  }, [searchQuery]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleSearchSelect = (href: string) => {
    navigate(href);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const handleProfileClick = () => {
    if (user && userData) {
      setShowProfileModal(true);
    } else {
      navigate("/auth");
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5"
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">P</span>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:block">
                Prepixo
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  whileHover={{ scale: 1.05 }}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
                >
                  {link.name}
                </motion.a>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Search with Live Filtering */}
              <div className="relative">
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="relative"
                    >
                      <input
                        type="text"
                        placeholder="Search features..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                      
                      {/* Search Results Dropdown */}
                      {filteredFeatures.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50"
                        >
                          {filteredFeatures.map((feature, index) => (
                            <button
                              key={feature.href}
                              onClick={() => handleSearchSelect(feature.href)}
                              className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 border-b border-border last:border-0"
                            >
                              <Search className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{feature.name}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchOpen(!searchOpen);
                    setSearchQuery("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </Button>
              </div>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </Button>

              {/* Profile Avatar / Login */}
              {user ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    onClick={handleProfileClick}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary cursor-pointer flex items-center justify-center"
                  >
                    <User className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-primary to-orange text-primary-foreground font-medium"
                >
                  Login
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden overflow-hidden"
              >
                <div className="py-4 space-y-2">
                  {navLinks.map((link, index) => (
                    <motion.a
                      key={link.name}
                      href={link.href}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <link.icon className="w-5 h-5" />
                      {link.name}
                    </motion.a>
                  ))}
                  
                  {/* Profile option in mobile menu */}
                  {user && (
                    <motion.button
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: navLinks.length * 0.1 }}
                      onClick={handleProfileClick}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full text-left"
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Profile Modal */}
      {userData && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={user?.id || ""}
        />
      )}
    </>
  );
};
