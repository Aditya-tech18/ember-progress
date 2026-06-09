import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap, Star, MapPin, Award, BookOpen,
  MessageCircle, Calendar, ArrowLeft, Sparkles, IndianRupee
} from "lucide-react";
import { MentorProfile, MentorService } from "@/types/mentorship";

export default function MentorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [services, setServices] = useState<MentorService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentorData();
  }, [id]);

  const fetchMentorData = async () => {
    try {
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentor_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (mentorError) throw mentorError;

      const { data: servicesData, error: servicesError } = await supabase
        .from("mentor_services")
        .select("*")
        .eq("mentor_id", id)
        .eq("is_active", true)
        .order("price");

      if (servicesError) throw servicesError;

      setMentor(mentorData);
      setServices(servicesData || []);
    } catch (err) {
      console.error("Error fetching mentor:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (service: MentorService) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // Open Razorpay payment
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: service.price * 100,
      currency: "INR",
      name: "Prepixo",
      description: `${service.title} with ${mentor?.full_name}`,
      handler: async (response: any) => {
        const { data, error } = await supabase
          .from("mentor_sessions")
          .insert({
            student_id: user.id,
            mentor_id: id,
            service_id: service.id,
            payment_amount: service.price,
            payment_id: response.razorpay_payment_id,
            payment_status: "completed",
            session_status: "pending"
          })
          .select()
          .single();

        if (!error && data) {
          await supabase.from("mentor_chats").insert({
            session_id: data.id,
            sender_id: user.id,
            message_text: "Payment successful! Your mentorship session has been booked.",
          });

          navigate(`/mentor-chat/${data.id}`);
        }
      },
      prefill: { email: user.email },
      theme: { color: "#DC2626" },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Mentor Not Found</h2>
          <Button onClick={() => navigate("/mentors")} className="bg-gradient-to-r from-red-600 to-red-700">
            Back to Mentors
          </Button>
        </div>
      </div>
    );
  }

  const achievements = mentor.achievements.split('\n').filter(a => a.trim());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <Button variant="ghost" onClick={() => navigate("/mentors")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-8 bg-gradient-to-br from-red-900/20 to-red-900/20 border-red-500/30">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-600 to-red-600 flex items-center justify-center text-white text-4xl font-bold">
                    {mentor.full_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{mentor.full_name}</h1>
                    <p className="text-lg text-muted-foreground italic mb-3">"{mentor.tagline}"</p>
                    
                    {mentor.display_college && mentor.college_name && (
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="font-semibold">{mentor.college_name}</span>
                        {mentor.course && <span className="text-muted-foreground">• {mentor.course}</span>}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {mentor.exam_expertise.map((exam, idx) => (
                        <Badge key={idx} variant="outline">{exam}</Badge>
                      ))}
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600">
                    <Star className="w-4 h-4 mr-1 fill-white" />
                    {mentor.rating.toFixed(1)}
                  </Badge>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">About Me</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mb-6">
                  {mentor.about_me}
                </p>

                <h4 className="font-bold mb-3">Achievements</h4>
                <div className="space-y-2">
                  {achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-600/10">
                      <Award className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <span>{achievement}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6 bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30 sticky top-24">
                <h3 className="text-xl font-bold mb-4">Services</h3>
                {services.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No services</p>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="p-4 rounded-xl bg-card border-2 border-border">
                        <div className="flex justify-between mb-2">
                          <h4 className="font-bold">{service.title}</h4>
                          <div className="flex items-center text-lg font-bold text-green-400">
                            <IndianRupee className="w-4 h-4" />
                            {service.price}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                        <Button
                          onClick={() => handleBookSession(service)}
                          className="w-full bg-gradient-to-r from-red-600 to-orange-600"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Book Now
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
