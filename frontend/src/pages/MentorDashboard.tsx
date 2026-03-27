import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MessageCircle, User, ChevronRight, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface StudentSession {
  id: string;
  student_name: string;
  student_email: string;
  created_at: string;
  session_status: string;
  payment_amount: number;
}

export const MentorDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetchSessions();
  }, []);

  const checkAuthAndFetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please login to view your dashboard");
      navigate("/auth");
      return;
    }

    setUserId(user.id);
    await fetchSessions(user.id);
  };

  const fetchSessions = async (userId: string) => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_APP_BACKEND_URL || 'https://db-integration-16.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/sessions/mentor/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load your students");
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (sessionId: string, studentName: string) => {
    navigate(`/mentor-chat/${sessionId}`, { state: { studentName } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
      </div>
    );
  }

  const totalEarnings = sessions.reduce((sum, s) => sum + (s.payment_amount / 100), 0);

  return (
    <div className="min-h-screen bg-[#000000]">
      <Navbar />
      
      <div className="pt-20 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
              Mentor Dashboard
            </h1>
            <p className="text-gray-400">
              Students who have booked sessions with you
            </p>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#E50914]/20 to-[#E50914]/10 rounded-2xl p-6 border border-[#E50914]/30 mb-8"
          >
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Students</p>
                <p className="text-3xl font-black text-white">{sessions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#E50914]" />
                  <p className="text-3xl font-black text-white">₹{totalEarnings}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#111111] rounded-2xl p-8 text-center border border-white/10"
            >
              <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No Students Yet
              </h3>
              <p className="text-gray-400">
                Students will appear here once they book sessions with you
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleChatClick(session.id, session.student_name)}
                  className="bg-[#111111] rounded-2xl p-6 border border-white/10 hover:border-[#E50914]/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E50914] to-red-600 flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-[#E50914] transition-colors">
                          {session.student_name}
                        </h3>
                        <p className="text-sm text-gray-400">{session.student_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                            Paid ₹{session.payment_amount / 100}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-[#E50914]" />
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#E50914] transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default MentorDashboard;
