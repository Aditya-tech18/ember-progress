import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, UserCheck, UserX, Clock, CheckCircle, XCircle,
  FileText, Mail, Phone, GraduationCap, Award, ChevronDown,
  ChevronUp, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { isAdmin } from "@/utils/adminUtils";

interface MentorApplication {
  id: string;
  user_id: string;
  full_name: string;
  mobile_number: string;
  email: string;
  exam_expertise: string[];
  college_name: string;
  course: string;
  display_college_publicly: boolean;
  tagline: string;
  achievements: string;
  about_me: string;
  college_id_url: string;
  exam_result_url: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export const AdminPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Please login to access admin panel");
      navigate("/auth");
      return;
    }
    const userEmail = session.user.email || "";
    if (!isAdmin(userEmail)) {
      toast.error("Unauthorized access. Admin privileges required.");
      navigate("/");
      return;
    }
    setUser(session.user);
    fetchApplications();
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("mentor_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications((data as unknown as MentorApplication[]) || []);
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (app: MentorApplication) => {
    if (!user) return;
    try {
      setProcessingId(app.id);

      // 1. Update application status to approved
      const { error: updateError } = await supabase
        .from("mentor_applications")
        .update({
          status: "approved",
          admin_notes: "Approved by admin",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", app.id);

      if (updateError) throw updateError;

      // 2. Create mentor profile from application data
      const { error: profileError } = await supabase
        .from("mentor_profiles")
        .insert({
          user_id: app.user_id,
          full_name: app.full_name,
          email: app.email,
          application_id: app.id,
          tagline: app.tagline,
          achievements: app.achievements,
          about_me: app.about_me,
          college_name: app.college_name,
          college: app.college_name,
          course: app.course,
          display_college: app.display_college_publicly ?? true,
          exam_expertise: app.exam_expertise,
          is_active: true,
          is_verified: true,
          rating: 0,
          total_sessions: 0,
          total_reviews: 0,
        });

      if (profileError) throw profileError;

      toast.success("Application approved! Mentor profile created.");
      fetchApplications();
    } catch (error: any) {
      console.error("Error approving:", error);
      toast.error(error.message || "Failed to approve application");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (app: MentorApplication) => {
    if (!user) return;
    const reason = prompt("Enter rejection reason (optional):");
    try {
      setProcessingId(app.id);
      const { error } = await supabase
        .from("mentor_applications")
        .update({
          status: "rejected",
          admin_notes: reason || "Rejected by admin",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", app.id);

      if (error) throw error;
      toast.success("Application rejected.");
      fetchApplications();
    } catch (error: any) {
      console.error("Error rejecting:", error);
      toast.error(error.message || "Failed to reject application");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      approved: "bg-green-500/20 text-green-300 border-green-500/30",
      rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    const icons: Record<string, any> = { pending: Clock, approved: CheckCircle, rejected: XCircle };
    const Icon = icons[status] || Clock;
    return (
      <Badge className={`${styles[status] || styles.pending} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg"><ShieldCheck className="w-6 h-6 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button onClick={() => navigate("/")} variant="ghost" size="sm">Back to Home</Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-muted-foreground">Total</div></Card>
          <Card className="p-4 border-yellow-500/20"><div className="text-2xl font-bold text-yellow-400">{stats.pending}</div><div className="text-sm text-muted-foreground">Pending</div></Card>
          <Card className="p-4 border-green-500/20"><div className="text-2xl font-bold text-green-400">{stats.approved}</div><div className="text-sm text-muted-foreground">Approved</div></Card>
          <Card className="p-4 border-red-500/20"><div className="text-2xl font-bold text-red-400">{stats.rejected}</div><div className="text-sm text-muted-foreground">Rejected</div></Card>
        </div>

        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5 text-primary" /> Mentor Applications
        </h2>

        {applications.length === 0 ? (
          <Card className="p-8 text-center"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No applications yet</p></Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">{app.full_name}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{app.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{app.mobile_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>{app.college_name} - {app.course}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {app.exam_expertise.map((exam, idx) => (
                        <Badge key={idx} variant="outline">{exam}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}>
                    {expandedId === app.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </Button>
                </div>

                {expandedId === app.id && (
                  <div className="border-t border-border p-4 space-y-4">
                    <div><h4 className="text-sm font-semibold text-primary mb-1">Tagline</h4><p>{app.tagline}</p></div>
                    <div><h4 className="text-sm font-semibold text-primary mb-1 flex items-center gap-1"><Award className="w-4 h-4" />Achievements</h4><p className="whitespace-pre-line">{app.achievements}</p></div>
                    <div><h4 className="text-sm font-semibold text-primary mb-1">About</h4><p>{app.about_me}</p></div>
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-1">Documents</h4>
                      <div className="flex gap-4">
                        <a href={app.college_id_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm underline">View College ID</a>
                        <a href={app.exam_result_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm underline">View Exam Result</a>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Applied: {new Date(app.created_at).toLocaleDateString()}</p>

                    {app.status === "pending" && (
                      <div className="flex gap-3 pt-4">
                        <Button onClick={() => handleApprove(app)} disabled={processingId === app.id} className="flex-1 bg-green-600 hover:bg-green-700">
                          {processingId === app.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                          Approve
                        </Button>
                        <Button onClick={() => handleReject(app)} disabled={processingId === app.id} variant="destructive" className="flex-1">
                          {processingId === app.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserX className="w-4 h-4 mr-2" />}
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
