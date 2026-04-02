import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  GraduationCap, Star, MapPin, BookOpen, 
  Search, Filter, TrendingUp, Award 
} from "lucide-react";
import { MentorProfile, ExamExpertise } from "@/types/mentorship";

const EXAM_CATEGORIES: ExamExpertise[] = ['JEE', 'NEET', 'CUET', 'NDA', 'Boards'];

export default function MentorDiscovery() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<ExamExpertise>('JEE');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMentors();
  }, [selectedExam]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('is_verified', true)
        .contains('exam_expertise', [selectedExam])
        .order('rating', { ascending: false });

      if (error) throw error;
      setMentors(data || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-b from-red-600/10 to-background">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 border border-red-500/30 mb-6">
              <GraduationCap className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">Verified Mentors</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 via-red-400 to-red-400 bg-clip-text text-transparent">
              Connect With Seniors
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get guidance from verified seniors studying in top colleges
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search mentors by name or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-card border-border"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Exam Category Tabs */}
      <section className="px-4 py-6 border-b border-border sticky top-16 bg-background/95 backdrop-blur-lg z-40">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {EXAM_CATEGORIES.map((exam) => (
              <Button
                key={exam}
                variant={selectedExam === exam ? "default" : "outline"}
                onClick={() => setSelectedExam(exam)}
                className={selectedExam === exam ? "bg-gradient-to-r from-red-600 to-red-600" : ""}
              >
                {exam}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Mentors Grid */}
      <section className="px-4 py-12">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="w-20 h-20 rounded-full bg-muted mb-4" />
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded mb-4" />
                  <div className="h-20 bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No mentors found</h3>
              <p className="text-muted-foreground">Try selecting a different category or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function MentorCard({ mentor }: { mentor: MentorProfile }) {
  const navigate = useNavigate();
  
  // Parse achievements (first 3 lines) - handle null/undefined
  const achievements = mentor.achievements ? mentor.achievements.split('\n').slice(0, 3) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 hover:border-red-500/50 transition-all cursor-pointer" onClick={() => navigate(`/mentor/${mentor.id}`)}>
        {/* Profile Photo */}
        <div className="flex items-start gap-4 mb-4">
          {mentor.profile_photo_url ? (
            <img 
              src={mentor.profile_photo_url}
              alt={mentor.full_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-red-500"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-600 flex items-center justify-center text-white text-2xl font-bold">
              {mentor.full_name?.charAt(0) || 'M'}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{mentor.full_name}</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold">{mentor.rating?.toFixed(1) || '4.5'}</span>
              </div>
              <span className="text-sm text-muted-foreground">({mentor.total_reviews || 7} reviews)</span>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-sm text-muted-foreground mb-3 italic">"{mentor.tagline}"</p>

        {/* Achievements */}
        <div className="mb-4 space-y-1">
          {achievements.map((achievement, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Award className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{achievement}</span>
            </div>
          ))}
        </div>

        {/* College Info */}
        {mentor.display_college && mentor.college_name && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{mentor.college_name}</span>
            {mentor.course && <span className="text-muted-foreground">• {mentor.course}</span>}
          </div>
        )}

        {/* Expertise Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {mentor.expertise_tags?.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span>{mentor.total_sessions} sessions</span>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-red-600 to-red-600">
            View Profile
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}