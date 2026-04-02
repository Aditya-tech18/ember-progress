import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, DollarSign, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentorSessions();
  }, []);

  const fetchMentorSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get mentor profile
      const { data: profile } = await supabase
        .from('mentor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error('Mentor profile not found');
        navigate('/');
        return;
      }

      // Get all sessions for this mentor
      const { data: sessionsData } = await supabase
        .from('mentor_sessions')
        .select('*')
        .eq('mentor_id', profile.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      setSessions(sessionsData || []);
      
      // Calculate total earnings
      const total = sessionsData?.reduce((sum, s) => sum + s.payment_amount, 0) || 0;
      setTotalEarnings(total);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getStudentInitial = (session: any) => {
    return 'S';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-20">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E50914] to-red-700 p-6 mt-16">
        <h1 className="text-2xl font-bold mb-4">Mentor Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-gray-300">Total Earnings</p>
                <p className="text-2xl font-bold">₹{totalEarnings}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-300">Students</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Students List */}
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Your Students</h2>
        
        {sessions.length === 0 ? (
          <Card className="bg-[#111111] border-white/10 p-8 text-center">
            <p className="text-gray-400">No students yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Students who book sessions will appear here
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card 
                key={session.id}
                className="bg-[#111111] border-white/10 p-4 hover:border-[#E50914] transition-colors cursor-pointer"
                onClick={() => navigate(`/mentor-chat/${session.id}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-[#E50914] flex items-center justify-center text-2xl font-bold">
                    {getStudentInitial(session)}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      Student #{session.student_id.slice(0, 8)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Paid ₹{session.payment_amount}
                      </Badge>
                      <Badge variant="outline" className="border-white/20">
                        {session.session_status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Button 
                    className="bg-[#E50914] hover:bg-[#b20710]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/mentor-chat/${session.id}`);
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}