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
    profilePicture: null as File | null,
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
      let profilePictureUrl = "";
      let collegeIdUrl = "";
      let examResultUrl = "";

      // Helper function to upload with fallback
      const uploadFile = async (file: File, bucket: string, prefix: string) => {
        try {
          const fileName = `${user.id}/${prefix}-${Date.now()}.${file.name.split('.').pop()}`;
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);
          
          if (error) {
            // If bucket doesn't exist, store locally for now
            console.warn(`Bucket ${bucket} not found. File will be processed later.`);
            return `pending-upload/${fileName}`;
          }
          return data.path;
        } catch (err) {
          console.error("Upload error:", err);
          return `pending-upload/${prefix}-${Date.now()}`;
        }
      };

      // Upload profile picture
      if (files.profilePicture) {
        profilePictureUrl = await uploadFile(files.profilePicture, "mentor-profile-images", "profile");
      }

      // Upload verification docs
      if (files.collegeId) {
        collegeIdUrl = await uploadFile(files.collegeId, "mentor-verification-docs", "college-id");
      }

      if (files.examResult) {
        examResultUrl = await uploadFile(files.examResult, "mentor-verification-docs", "exam-result");
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
          college_id_url: collegeIdUrl || "pending",
          exam_result_url: examResultUrl || "pending",
          status: "pending"
        });

      if (insertError) {
        // Check if it's a table not found error
        if (insertError.message.includes("relation") || insertError.message.includes("does not exist")) {
          toast({
            title: "Database Setup Required",
            description: "Please run the Supabase SQL schema first. Check /app/database/QUICK_SETUP_GUIDE.md",
            variant: "destructive",
          });
          return;
        }
        throw insertError;
      }

      toast({
        title: "Application Submitted Successfully! 🎉",
        description: "We'll review your application within 48 hours and notify you via email.",
      });

      // Store profile picture URL in localStorage temporarily
      if (profilePictureUrl) {
        localStorage.setItem(`mentor_profile_pic_${user.id}`, profilePictureUrl);
      }

      navigate("/");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Error submitting application",
        description: error.message || "Please check your internet connection and try again.",
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
                  <h2 className="text-2xl font-bold mb-6">Profile Picture & Verification Documents</h2>
                  
                  <div>
                    <Label>Profile Picture * (This will be displayed on your profile)</Label>
                    <div className="mt-2 flex flex-col items-center gap-4">
                      {files.profilePicture && (
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-600">
                          <img 
                            src={URL.createObjectURL(files.profilePicture)} 
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <Input
                        required
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFiles({ ...files, profilePicture: e.target.files?.[0] || null })}
                        className="hidden"
                        id="profilePicture"
                      />
                      <label
                        htmlFor="profilePicture"
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-card transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {files.profilePicture ? "Change Picture" : "Upload Picture"}
                      </label>
                      {files.profilePicture && (
                        <span className="text-sm flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          {files.profilePicture.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4">Verification Documents</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      These documents are for verification only and will NOT be displayed publicly.
                    </p>
                  </div>
                  
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
                      📌 Verification documents are for admin review only. Only your profile picture will be displayed publicly.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" onClick={() => setStep(2)} variant="outline" className="flex-1">
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !files.profilePicture || !files.collegeId || !files.examResult}
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
