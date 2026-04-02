import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft, Share2, GraduationCap, BookOpen, IndianRupee,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface MentorData {
  id: string;
  user_id: string | null;
  full_name: string | null;
  profile_photo_url: string | null;
  tagline: string | null;
  achievements: string | null;
  about_me: string | null;
  college_name: string | null;
  college: string | null;
  course: string | null;
  display_college: boolean | null;
  exam_expertise: string[] | null;
  expertise_tags: string[] | null;
  media_urls: string[] | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  total_sessions: number | null;
  rating: number | null;
  total_reviews: number | null;
}

interface MentorServiceData {
  id: string;
  mentor_id: string | null;
  service_title: string | null;
  description: string | null;
  price: number | null;
}

const SESSION_PRICE = 99;

export default function MentorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState<MentorData | null>(null);
  const [services, setServices] = useState<MentorServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  useEffect(() => {
    fetchMentorData();
  }, [id]);

  const fetchMentorData = async () => {
    try {
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentor_profiles")
        .select("*")
        .eq("id", id!)
        .single();

      if (mentorError) throw mentorError;

      const { data: servicesData } = await supabase
        .from("mentor_services")
        .select("*")
        .eq("mentor_id", id!);

      setMentor(mentorData);
      setServices(servicesData || []);
    } catch (err) {
      console.error("Error fetching mentor:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${mentor?.full_name} - Prepixo Mentor`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const handleBookSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to book a session");
      navigate("/auth");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SObcQvFXRo6HAa",
      amount: SESSION_PRICE * 100,
      currency: "INR",
      name: "Prepixo",
      description: `1:1 Mentorship with ${mentor?.full_name}`,
      handler: async (response: any) => {
        try {
          const { data, error } = await supabase
            .from("mentor_sessions")
            .insert({
              student_id: user.id,
              mentor_id: id,
              payment_id: response.razorpay_payment_id,
              status: "scheduled",
            })
            .select()
            .single();

          if (error) throw error;

          if (data) {
            await supabase.from("mentor_chats").insert({
              session_id: data.id,
              sender_id: user.id,
              message: "Hi! I just booked a session. Looking forward to learning from you!",
            });
            toast.success("Session booked successfully!");
            navigate(`/mentor-chat/${data.id}`);
          }
        } catch (err) {
          console.error("Error creating session:", err);
          toast.error("Failed to create session. Please contact support.");
        }
      },
      prefill: { email: user.email },
      theme: { color: "#E50914" },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Mentor Not Found</h2>
          <Button onClick={() => navigate("/mentors")} variant="destructive">Back to Mentors</Button>
        </div>
      </div>
    );
  }

  const aboutText = mentor.about_me || "";
  const showReadMore = aboutText.length > 200;
  const displayAbout = aboutExpanded ? aboutText : aboutText.slice(0, 200);
  const collegeName = mentor.college_name || mentor.college || "";
  const allTags = [
    ...(services.map(s => s.service_title).filter(Boolean) as string[]),
    ...(mentor.expertise_tags || []),
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <div className="pt-20 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/mentors")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Senior Detail</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-6">
          {mentor.profile_photo_url ? (
            <img
              src={mentor.profile_photo_url}
              alt={mentor.full_name || "Mentor"}
              className="w-20 h-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-3xl font-bold">
              {mentor.full_name?.charAt(0) || "M"}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold">{mentor.full_name}</h2>
            <p className="text-sm text-muted-foreground">{mentor.tagline}</p>
          </div>
        </div>

        {/* College & Course */}
        {mentor.display_college && collegeName && (
          <div className="mb-6 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span>🎓</span>
              <span className="font-medium">{collegeName}</span>
            </div>
            {mentor.course && (
              <div className="flex items-center gap-2 text-sm">
                <span>📄</span>
                <span>{mentor.course}</span>
              </div>
            )}
          </div>
        )}

        {/* About Me */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-2">About me</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {displayAbout}
            {showReadMore && !aboutExpanded && "..."}
          </p>
          {showReadMore && (
            <button
              onClick={() => setAboutExpanded(!aboutExpanded)}
              className="text-sm font-bold mt-1 text-foreground"
            >
              {aboutExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Media - show first media image if available */}
        {mentor.media_urls && mentor.media_urls.length > 0 && (
          <div className="mb-6">
            <img
              src={mentor.media_urls[0]}
              alt="Mentor media"
              className="w-full rounded-xl object-cover max-h-72"
            />
          </div>
        )}

        {/* Achievements */}
        {mentor.achievements && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2">Achievements</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{mentor.achievements}</p>
          </div>
        )}

        {/* Services / Tags */}
        {allTags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Services</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="rounded-full px-4 py-1.5 text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <hr className="border-border my-6" />

        {/* 1:1 Mentorship CTA */}
        <Card className="p-5 border-border">
          <h3 className="text-lg font-bold mb-2">1:1 Mentorship</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect directly with a verified senior for genuine 1:1 mentorship. Get specific, high-level strategies needed to crack your exam and secure admission.
          </p>
          <Button
            onClick={handleBookSession}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-base h-12"
          >
            <IndianRupee className="w-4 h-4 mr-1" />
            Book Session @ ₹{SESSION_PRICE}
          </Button>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
