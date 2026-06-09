import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2, MessageCircle, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";

const DEFAULT_IMAGE =
  "https://pgvymttdvdlkcroqxsgn.supabase.co/storage/v1/object/public/mentor-profile-images/1065a106-cd9f-4cbd-88ae-1ac641624176/profile-1774589376150.jpeg";

export default function StudentSessions() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessType, setAccessType] = useState<'free' | 'paid' | 'none'>('none');

  useEffect(() => {
    fetchMyMentors();
  }, []);

  const fetchMyMentors = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check access via backend API
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/student/my-mentors?student_email=${user.email}`);
      const result = await response.json();

      if (result.success) {
        setAccessType(result.access_type);
        
        // Fetch profile photos for each mentor
        const mentorsWithPhotos = await Promise.all((result.mentors || []).map(async (mentor: any) => {
          let photoUrl = DEFAULT_IMAGE;
          
          try {
            const { data: files } = await supabase.storage
              .from("mentor-profile-images")
              .list(mentor.user_id, { 
                limit: 1, 
                sortBy: { column: "created_at", order: "desc" } 
              });
            
            if (files && files.length > 0) {
              photoUrl = `https://pgvymttdvdlkcroqxsgn.supabase.co/storage/v1/object/public/mentor-profile-images/${mentor.user_id}/${files[0].name}`;
            }
          } catch (err) {
            console.error(`Error fetching photo for mentor:`, err);
          }
          
          return {
            ...mentor,
            profile_photo_url: photoUrl
          };
        }));
        
        setMentors(mentorsWithPhotos);
      }
    } catch (error) {
      console.error("Error fetching mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div style={pageStyle}>
      <Navbar />

      {/* Header */}
      <section style={headerStyle}>
        <div style={containerStyle}>
          <h1 style={titleStyle}>
            {accessType === 'free' ? 'All Available Mentors' : 'My Mentors'}
          </h1>
          <p style={subtitleStyle}>
            {accessType === 'free' 
              ? 'You have free access to all mentors on the platform'
              : 'Mentors you can chat with for the next month'}
          </p>
        </div>
      </section>

      {/* Mentors List */}
      <section style={sectionStyle}>
        <div style={containerStyle}>
          {loading ? (
            <div style={loadingStyle}>
              <Loader2 className="animate-spin" size={32} color="#e50914" />
              <p style={{ color: "#999", marginTop: "16px" }}>Loading your mentors...</p>
            </div>
          ) : mentors.length === 0 ? (
            <div style={emptyStyle}>
              <MessageCircle size={48} color="#555" />
              <h3 style={{ color: "#fff", marginTop: "16px", marginBottom: "8px" }}>No Mentors Yet</h3>
              <p style={{ color: "#999", marginBottom: "24px" }}>
                You haven't purchased any mentor sessions yet.
              </p>
              <button
                onClick={() => navigate('/mentors')}
                style={browseBtnStyle}
              >
                Browse Mentors
              </button>
            </div>
          ) : (
            <div style={gridStyle}>
              {mentors.map((mentor, index) => (
                <motion.div
                  key={mentor.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MentorSessionCard 
                    mentor={mentor} 
                    accessType={accessType}
                    onClick={() => navigate(`/mentor-chat/${mentor.user_id}`)} 
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

function MentorSessionCard({ mentor, accessType, onClick }: any) {
  const [hovered, setHovered] = useState(false);

  const photoUrl = mentor.profile_photo_url || DEFAULT_IMAGE;

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
      {/* Profile Image */}
      <div style={imageWrapStyle}>
        <img src={photoUrl} alt={mentor.full_name} style={imageStyle} />
      </div>

      {/* Mentor Info */}
      <div style={infoStyle}>
        <h3 style={nameStyle}>{mentor.full_name}</h3>
        <p style={taglineTextStyle}>{mentor.tagline || "Expert Mentor"}</p>

        {/* Expertise Tags */}
        <div style={tagsStyle}>
          {(mentor.exam_expertise || []).slice(0, 2).map((tag: string) => (
            <span key={tag} style={tagStyle}>
              {tag}
            </span>
          ))}
        </div>

        {/* Access Info */}
        {accessType === 'free' ? (
          <div style={accessBadgeStyle}>
            <span style={{ color: "#4CAF50", fontSize: "12px", fontWeight: 700 }}>
              ✓ FREE ACCESS
            </span>
          </div>
        ) : (
          <div style={dateInfoStyle}>
            <Calendar size={14} color="#666" />
            <span style={{ fontSize: "12px", color: "#999" }}>
              Access until {new Date(mentor.expires_at || Date.now()).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Chat Button */}
        <button style={chatBtnStyle}>
          <MessageCircle size={16} />
          <span>Start Chat</span>
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

const browseBtnStyle: React.CSSProperties = {
  background: "#e50914",
  color: "#fff",
  border: "none",
  padding: "12px 32px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "transform 0.2s",
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

const imageWrapStyle: React.CSSProperties = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  border: "3px solid #e50914",
  padding: "3px",
  marginBottom: "16px",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  objectFit: "cover",
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

const taglineTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#999",
  marginBottom: "8px",
};

const tagsStyle: React.CSSProperties = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
  marginBottom: "12px",
};

const tagStyle: React.CSSProperties = {
  background: "#2a2a2a",
  color: "#ccc",
  fontSize: "11px",
  padding: "4px 10px",
  borderRadius: "12px",
  border: "1px solid #444",
};

const accessBadgeStyle: React.CSSProperties = {
  padding: "8px 0",
  borderTop: "1px solid #2a2a2a",
  marginTop: "8px",
};

const dateInfoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 0",
  borderTop: "1px solid #2a2a2a",
  marginTop: "8px",
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

export { StudentSessions };
