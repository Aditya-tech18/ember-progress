import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2, MessageCircle, Calendar, Mail, User } from "lucide-react";
import { motion } from "framer-motion";

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpecialMentor, setIsSpecialMentor] = useState(false);

  useEffect(() => {
    fetchMyStudents();
  }, []);

  const fetchMyStudents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch students from backend
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/mentor/my-students?mentor_email=${user.email}`);
      const result = await response.json();

      if (result.success) {
        setStudents(result.students || []);
        setIsSpecialMentor(result.is_special_mentor || false);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <Navbar />

      {/* Header */}
      <section style={headerStyle}>
        <div style={containerStyle}>
          <h1 style={titleStyle}>My Students</h1>
          <p style={subtitleStyle}>
            Students who have purchased 1:1 sessions with you
          </p>
        </div>
      </section>

      {/* Students List */}
      <section style={sectionStyle}>
        <div style={containerStyle}>
          {loading ? (
            <div style={loadingStyle}>
              <Loader2 className="animate-spin" size={32} color="#e50914" />
              <p style={{ color: "#999", marginTop: "16px" }}>Loading your students...</p>
            </div>
          ) : students.length === 0 ? (
            <div style={emptyStyle}>
              <User size={48} color="#555" />
              <h3 style={{ color: "#fff", marginTop: "16px", marginBottom: "8px" }}>No Students Yet</h3>
              <p style={{ color: "#999" }}>
                No students have purchased sessions with you yet.
              </p>
            </div>
          ) : (
            <div style={gridStyle}>
              {students.map((student, index) => (
                <motion.div
                  key={student.student_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <StudentCard 
                    student={student} 
                    onClick={() => navigate(`/mentor-chat/${student.student_id}`)} 
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function StudentCard({ student, onClick }: any) {
  const [hovered, setHovered] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyle,
        borderColor: hovered ? "#e50914" : "#2a2a2a",
        background: hovered ? "#1c1c1c" : "#181818",
      }}
    >
      {/* Student Avatar */}
      <div style={avatarStyle}>
        <User size={32} color="#e50914" />
      </div>

      {/* Student Info */}
      <div style={infoStyle}>
        <h3 style={nameStyle}>{student.student_name}</h3>
        
        <div style={emailRowStyle}>
          <Mail size={14} color="#666" />
          <span style={{ fontSize: "13px", color: "#999" }}>
            {student.student_email}
          </span>
        </div>

        {/* Purchase Info */}
        <div style={detailsStyle}>
          <div style={detailRowStyle}>
            <Calendar size={14} color="#666" />
            <span style={{ fontSize: "12px", color: "#999" }}>
              Purchased: {formatDate(student.purchased_at)}
            </span>
          </div>
          
          {student.is_active && (
            <div style={detailRowStyle}>
              <Calendar size={14} color="#4CAF50" />
              <span style={{ fontSize: "12px", color: "#4CAF50" }}>
                Valid until: {formatDate(student.expires_at)}
              </span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div style={statusBadgeStyle}>
          <span style={{
            fontSize: "11px",
            fontWeight: 700,
            color: student.is_active ? "#4CAF50" : "#999",
          }}>
            {student.is_active ? "✓ ACTIVE SESSION" : "SESSION EXPIRED"}
          </span>
        </div>

        {/* Chat Button */}
        <button style={chatBtnStyle}>
          <MessageCircle size={16} />
          <span>Open Chat</span>
        </button>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0a0a0a",
  color: "#fff",
  fontFamily: "'Inter', sans-serif",
};

const headerStyle: React.CSSProperties = {
  paddingTop: "100px",
  paddingBottom: "40px",
  background: "linear-gradient(180deg, #1a0000 0%, #0a0a0a 100%)",
  borderBottom: "1px solid #2a0a0a",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 20px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "clamp(28px, 5vw, 42px)",
  fontWeight: 700,
  marginBottom: "12px",
  color: "#fff",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#999",
  maxWidth: "600px",
};

const sectionStyle: React.CSSProperties = {
  padding: "40px 20px 100px",
};

const loadingStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "400px",
};

const emptyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "400px",
  textAlign: "center",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "20px",
};

const cardStyle: React.CSSProperties = {
  background: "#181818",
  border: "2px solid #2a2a2a",
  borderRadius: "16px",
  padding: "20px",
  cursor: "pointer",
  transition: "all 0.3s ease",
};

const avatarStyle: React.CSSProperties = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  background: "rgba(229,9,20,0.1)",
  border: "2px solid #e50914",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
};

const infoStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const nameStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#fff",
  margin: 0,
};

const emailRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginBottom: "8px",
};

const detailsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "12px 0",
  borderTop: "1px solid #2a2a2a",
  borderBottom: "1px solid #2a2a2a",
  marginTop: "8px",
};

const detailRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const statusBadgeStyle: React.CSSProperties = {
  padding: "8px 0",
  marginTop: "4px",
};

const chatBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  background: "#e50914",
  color: "#fff",
  border: "none",
  padding: "10px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  marginTop: "12px",
  transition: "background 0.2s",
};

export { MentorDashboard };
