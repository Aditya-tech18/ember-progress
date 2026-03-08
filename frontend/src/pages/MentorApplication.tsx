import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle } from "lucide-react";

export default function MentorApplication() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    examExpertise: [] as string[],
    collegeName: "",
    course: "",
    displayCollege: true,
    tagline: "",
    achievements: "",
    aboutMe: "",
  });

  const [files, setFiles] = useState({
    collegeId: null as File | null,
    examResult: null as File | null,
  });

  const examOptions = ["JEE", "NEET", "CUET", "NDA", "Boards"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please login first", variant: "destructive" });
        navigate("/auth");
        return;
      }

      // Upload files to Supabase Storage
      let collegeIdUrl = "";
      let examResultUrl = "";

      if (files.collegeId) {
        const { data, error } = await supabase.storage
          .from("mentor-verification-docs")
          .upload(`${user.id}/college-id-${Date.now()}.${files.collegeId.name.split('.').pop()}`, files.collegeId);
        
        if (error) throw error;
        collegeIdUrl = data.path;
      }

      if (files.examResult) {
        const { data, error } = await supabase.storage
          .from("mentor-verification-docs")
          .upload(`${user.id}/exam-result-${Date.now()}.${files.examResult.name.split('.').pop()}`, files.examResult);
        
        if (error) throw error;
        examResultUrl = data.path;
      }

      // Insert application
      const { error: insertError } = await supabase
        .from("mentor_applications")
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          mobile_number: formData.mobile,
          email: formData.email,
          exam_expertise: formData.examExpertise,
          college_name: formData.collegeName,
          course: formData.course,
          display_college_publicly: formData.displayCollege,
          tagline: formData.tagline,
          achievements: formData.achievements,
          about_me: formData.aboutMe,
          college_id_url: collegeIdUrl,
          exam_result_url: examResultUrl,
          status: "pending"
        });

      if (insertError) throw insertError;

      toast({
        title: "Application Submitted!",
        description: "We'll review your application within 48 hours.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExam = (exam: string) => {
    if (formData.examExpertise.includes(exam)) {
      setFormData({
        ...formData,
        examExpertise: formData.examExpertise.filter(e => e !== exam)
      });
    } else {
      setFormData({
        ...formData,
        examExpertise: [...formData.examExpertise, exam]
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Mentor Application</h1>
            <p className="text-muted-foreground">Step {step} of 3</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="p-8 border-red-600/30">
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Personal Information</h2>
                  
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mobile Number *</Label>
                      <Input
                        required
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="+91 9999999999"
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Exam Expertise * (Select all that apply)</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {examOptions.map((exam) => (
                        <div key={exam} className="flex items-center space-x-2">
                          <Checkbox
                            id={exam}
                            checked={formData.examExpertise.includes(exam)}
                            onCheckedChange={() => toggleExam(exam)}
                          />
                          <label htmlFor={exam} className="text-sm cursor-pointer">
                            {exam}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!formData.fullName || !formData.mobile || !formData.email || formData.examExpertise.length === 0}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700"
                  >
                    Next Step
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Academic Details</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>College Name *</Label>
                      <Input
                        required
                        value={formData.collegeName}
                        onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                        placeholder="IIT Delhi"
                      />
                    </div>
                    <div>
                      <Label>Course *</Label>
                      <Input
                        required
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        placeholder="B.Tech CSE"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="displayCollege"
                      checked={formData.displayCollege}
                      onCheckedChange={(checked) => setFormData({ ...formData, displayCollege: checked as boolean })}
                    />
                    <label htmlFor="displayCollege" className="text-sm">
                      Display college publicly on my profile
                    </label>
                  </div>

                  <div>
                    <Label>Tagline *</Label>
                    <Input
                      required
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="Helping students crack JEE smarter"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label>Achievements * (One per line)</Label>
                    <Textarea
                      required
                      value={formData.achievements}
                      onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                      placeholder="AIR 450 - JEE Advanced&#10;99.7 percentile - JEE Main&#10;IIT Bombay Mechanical"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>About Me *</Label>
                    <Textarea
                      required
                      value={formData.aboutMe}
                      onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
                      placeholder="Tell students about your journey, preparation strategies, and how you can help them..."
                      rows={6}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" onClick={() => setStep(1)} variant="outline" className="flex-1">
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!formData.collegeName || !formData.course || !formData.tagline || !formData.achievements || !formData.aboutMe}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700"
                    >
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Verification Documents</h2>
                  
                  <div>
                    <Label>College ID Card * (Image/PDF)</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Input
                        required
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setFiles({ ...files, collegeId: e.target.files?.[0] || null })}
                        className="hidden"
                        id="collegeId"
                      />
                      <label
                        htmlFor="collegeId"
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-card transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Choose File
                      </label>
                      {files.collegeId && (
                        <span className="text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {files.collegeId.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Exam Result Proof * (JEE/NEET scorecard)</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Input
                        required
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setFiles({ ...files, examResult: e.target.files?.[0] || null })}
                        className="hidden"
                        id="examResult"
                      />
                      <label
                        htmlFor="examResult"
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-card transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Choose File
                      </label>
                      {files.examResult && (
                        <span className="text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {files.examResult.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-yellow-600/10 border border-yellow-500/30">
                    <p className="text-sm text-yellow-400">
                      📌 These documents are for verification only and will NOT be displayed publicly.
                      Only admins can view them.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" onClick={() => setStep(2)} variant="outline" className="flex-1">
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !files.collegeId || !files.examResult}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
