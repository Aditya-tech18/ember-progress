import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentMentorDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentSessions();
  }, []);

  const fetchStudentSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get all sessions where student has paid
      const { data: sessionsData, error } = await supabase
        .from('mentor_sessions')
        .select(`
          *,
          mentor_profiles!inner (
            id,
            user_id,
            full_name,
            profile_photo_url,
            tagline,
            rating
          )
        `)
        .eq('student_id', user.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSessions(sessionsData || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getMentorInitial = (mentorName: string) => {
    return mentorName?.charAt(0).toUpperCase() || 'M';
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
        <h1 className="text-2xl font-bold">My Mentors</h1>
        <p className="text-white/80 mt-1">
          Chat with your mentors
        </p>
      </div>

      {/* Mentors List */}
      <div className="p-4">
        {sessions.length === 0 ? (
          <Card className="bg-[#111111] border-white/10 p-8 text-center">
            <p className="text-gray-400">No mentors yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Book a session to connect with mentors
            </p>
            <Button 
              className="mt-4 bg-[#E50914] hover:bg-[#b20710]"
              onClick={() => navigate('/mentors')}
            >
              Browse Mentors
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const mentor = session.mentor_profiles;
              return (
                <Card 
                  key={session.id}
                  className="bg-[#111111] border-white/10 p-4 hover:border-[#E50914] transition-colors cursor-pointer"
                  onClick={() => navigate(`/mentor-chat/${session.id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {mentor?.profile_photo_url ? (
                      <img 
                        src={mentor.profile_photo_url}
                        alt={mentor.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#E50914]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#E50914] flex items-center justify-center text-2xl font-bold border-2 border-[#E50914]">
                        {getMentorInitial(mentor?.full_name)}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {mentor?.full_name || 'Mentor'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {mentor?.tagline || 'Expert Mentor'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {mentor?.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm">{mentor.rating}</span>
                          </div>
                        )}
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Active Session
                        </Badge>
                      </div>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}