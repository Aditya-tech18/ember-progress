import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Menu, X, Home, FileText, Target, User, LogOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfileModal } from "@/components/social/UserProfileModal";
import { LeaderboardModal } from "@/components/LeaderboardModal";

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showGoalMenu, setShowGoalMenu] = useState(false);
  const [userGoal, setUserGoal] = useState<string | null>(null);

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

    // Close goal menu on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (showGoalMenu && !(e.target as Element).closest('.goal-menu-container')) {
        setShowGoalMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGoalMenu]);

  const fetchUserData = async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setUserData(data);
      setUserGoal(data.goal);
    }
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

  const handleLeaderboardClick = () => {
    setShowLeaderboard(true);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-lg shadow-black/10 safe-top"
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-[68px]">
            {/* Logo with Goal Menu + WhatsApp Button */}
            <div className="relative goal-menu-container flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowGoalMenu(!showGoalMenu)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <img 
                  src="/images/prepixo-splash.jpg" 
                  alt="PYQBook" 
                  className="w-9 h-9 rounded-xl shadow-md shadow-primary/20 object-cover"
                />
                <span className="text-lg font-bold text-foreground hidden sm:block tracking-tight">
                  PYQBook
                </span>
              </motion.div>

              {/* WhatsApp Join Community Button */}
              <motion.a
                href="https://chat.whatsapp.com/GIMkVsIvORy49bknPIZeim"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-[#25D366]/20 hover:shadow-[#25D366]/40 transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="hidden sm:inline">Join Community</span>
                <span className="sm:hidden">Community</span>
              </motion.a>

              {/* Goal Change Dropdown */}
              <AnimatePresence>
                {showGoalMenu && user && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 bg-[#111111] border border-white/10 rounded-xl p-2 z-50 min-w-[180px] shadow-xl"
                  >
                    <div className="text-xs text-gray-400 px-3 py-2">Current Goal: {userGoal || 'Not Set'}</div>
                    <button
                      onClick={() => {
                        setShowGoalMenu(false);
                        navigate("/goal-selection");
                      }}
                      className="w-full text-left px-3 py-2 text-white hover:bg-[#E50914]/20 rounded-lg text-sm transition-colors"
                    >
                      🎯 Change Goal
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Center Navigation */}
            <div className="hidden lg:flex items-center gap-1 bg-muted/40 rounded-xl px-1.5 py-1 border border-border/30">
              {navLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all duration-200 font-medium"
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </motion.a>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/subscription")}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-semibold hover:bg-emerald-600/25 hover:border-emerald-500/50 transition-all"
              >
                See Plans
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleLeaderboardClick}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 text-sm font-semibold hover:bg-amber-500/25 hover:border-amber-500/50 transition-all"
              >
                🏆 Leaderboard
              </motion.button>
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

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </>
  );
};
