import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Mail,
  Phone,
  GraduationCap,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2
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
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
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
  const [creatingContest, setCreatingContest] = useState(false);

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
    fetchApplications(userEmail);
  };

  const fetchApplications = async (adminEmail: string) => {
    try {
      setLoading(true);
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/admin/applications?admin_email=${encodeURIComponent(adminEmail)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error(error.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    if (!user?.email) return;

    try {
      setProcessingId(applicationId);
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/admin/applications/${applicationId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            admin_email: user.email,
            admin_notes: 'Approved by admin'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve application');
      }

      toast.success("Application approved! Mentor profile created.");
      fetchApplications(user.email);
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast.error(error.message || "Failed to approve application");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!user?.email) return;

    const reason = prompt("Enter rejection reason (optional):");
    
    try {
      setProcessingId(applicationId);
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/admin/applications/${applicationId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            admin_email: user.email,
            admin_notes: reason || 'Rejected by admin'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject application');
      }

      toast.success("Application rejected.");
      fetchApplications(user.email);
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast.error(error.message || "Failed to reject application");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateWeeklyContest = async () => {
    if (!user?.email) return;

    try {
      setCreatingContest(true);
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/admin/contests/create-weekly?admin_email=${encodeURIComponent(user.email)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create weekly contest');
      }

      const data = await response.json();
      toast.success(data.message || "Weekly contest created for upcoming Sunday!");
    } catch (error: any) {
      console.error('Error creating contest:', error);
      toast.error(error.message || "Failed to create weekly contest");
    } finally {
      setCreatingContest(false);
    }
  };


  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      under_review: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      approved: "bg-green-500/20 text-green-300 border-green-500/30",
      rejected: "bg-red-500/20 text-red-300 border-red-500/30"
    };

    const icons = {
      pending: Clock,
      under_review: FileText,
      approved: CheckCircle,
      rejected: XCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <Badge className={`${styles[status as keyof typeof styles]} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0B0B0B]/95 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            <Button onClick={() => navigate("/")} variant="ghost" size="sm">
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6">
        {/* Admin Actions */}
        <div className="mb-6">
          <Button
            onClick={handleCreateWeeklyContest}
            disabled={creatingContest}
            className="bg-gradient-to-r from-[#E50914] to-red-600 hover:from-[#E50914]/90 hover:to-red-600/90 text-white font-bold"
          >
            {creatingContest ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Contest...
              </>
            ) : (
              "📅 Create JEE Main Weekly Contest (Sunday)"
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#151515] border-white/10 p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Applications</div>
          </Card>
          <Card className="bg-[#151515] border-yellow-500/20 p-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </Card>
          <Card className="bg-[#151515] border-green-500/20 p-4">
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
            <div className="text-sm text-gray-400">Approved</div>
          </Card>
          <Card className="bg-[#151515] border-red-500/20 p-4">
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <div className="text-sm text-gray-400">Rejected</div>
          </Card>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-400" />
            Mentor Applications
          </h2>

          {applications.length === 0 ? (
            <Card className="bg-[#151515] border-white/10 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No applications yet</p>
            </Card>
          ) : (
            applications.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#151515] border border-white/10 rounded-lg overflow-hidden"
              >
                {/* Application Header */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">{app.full_name}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{app.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{app.mobile_number}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">{app.college_name} - {app.course}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {app.exam_expertise.map((exam, idx) => (
                        <Badge key={idx} variant="outline" className="border-purple-500/30 text-purple-300">
                          {exam}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  >
                    {expandedId === app.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </Button>
                </div>

                {/* Expanded Details */}
                {expandedId === app.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-purple-400 mb-2">Tagline</h4>
                        <p className="text-gray-300">{app.tagline}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Achievements
                        </h4>
                        <p className="text-gray-300 whitespace-pre-line">{app.achievements}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-purple-400 mb-2">About</h4>
                        <p className="text-gray-300">{app.about_me}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-purple-400 mb-2">Verification Documents</h4>
                        <div className="flex gap-4">
                          <a 
                            href={app.college_id_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            View College ID
                          </a>
                          <a 
                            href={app.exam_result_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            View Exam Result
                          </a>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Applied: {new Date(app.created_at).toLocaleDateString()}
                      </div>

                      {/* Action Buttons */}
                      {app.status === 'pending' && (
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => handleApprove(app.id)}
                            disabled={processingId === app.id}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                          >
                            {processingId === app.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <UserCheck className="w-4 h-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(app.id)}
                            disabled={processingId === app.id}
                            variant="destructive"
                            className="flex-1"
                          >
                            {processingId === app.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <UserX className="w-4 h-4 mr-2" />
                            )}
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
