import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Search, Loader2, GraduationCap, BookOpen, ChevronRight, Users } from "lucide-react";

const DEFAULT_IMAGE =
  "https://pgvymttdvdlkcroqxsgn.supabase.co/storage/v1/object/public/mentor-profile-images/1065a106-cd9f-4cbd-88ae-1ac641624176/profile-1774589376150.jpeg";

const EXAM_CATEGORIES = ["All", "JEE", "NEET", "CUET", "NDA", "Boards"];

export default function MentorDiscovery() {
  const navigate = useNavigate();

  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMentors();
  }, [selectedExam]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("mentor_applications")
        .select("*")
        .eq("status", "approved");

      if (selectedExam !== "All") {
        query = query.contains("exam_expertise", [selectedExam]);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      
      // Process mentor data to add profile photo URLs
      const mentorsWithPhotos = await Promise.all((data || []).map(async (mentor) => {
        let photoUrl = null;
        
        // Try to fetch profile photo from storage
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
          console.error(`Error fetching photo for ${mentor.full_name}:`, err);
        }
        
        return {
          ...mentor,
          profile_photo_url: photoUrl,
          display_college: mentor.display_college_publicly !== false
        };
      }));
      
      setMentors(mentorsWithPhotos);
    } catch (error) {
      console.error("Error fetching mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter((mentor) => {
    const name = mentor.full_name?.toLowerCase() || "";
    const tagline = mentor.tagline?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();
    return name.includes(q) || tagline.includes(q);
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#141414",
        color: "#fff",
        fontFamily: "'Bebas Neue', 'Georgia', serif",
      }}
    >
      <Navbar />

      {/* HERO HEADER */}
      <section
        style={{
          paddingTop: "80px",
          paddingBottom: "32px",
          paddingLeft: "16px",
          paddingRight: "16px",
          background: "linear-gradient(180deg, #1a0000 0%, #141414 100%)",
          borderBottom: "1px solid #2a0a0a",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          {/* Label */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(229,9,20,0.15)",
              border: "1px solid rgba(229,9,20,0.4)",
              borderRadius: "20px",
              padding: "4px 14px",
              marginBottom: "16px",
            }}
          >
            <Users size={13} color="#e50914" />
            <span
              style={{
                fontSize: "11px",
                color: "#e50914",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "'Helvetica Neue', sans-serif",
                fontWeight: 600,
              }}
            >
              Verified Mentors
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 8vw, 52px)",
              fontWeight: 400,
              letterSpacing: "3px",
              textTransform: "uppercase",
              margin: "0 0 8px 0",
              lineHeight: 1,
              color: "#fff",
            }}
          >
            Connect With
            <span style={{ color: "#e50914" }}> Seniors</span>
          </h1>

          <p
            style={{
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: "14px",
              color: "#999",
              marginBottom: "24px",
              fontWeight: 400,
              letterSpacing: "0.3px",
            }}
          >
            Get guidance from toppers who cracked the exam you're preparing for
          </p>

          {/* SEARCH */}
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              color="#666"
              style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
            />
            <Input
              placeholder="Search by name or tagline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: "40px",
                height: "48px",
                background: "#1f1f1f",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "#fff",
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: "14px",
                outline: "none",
              }}
              className="focus:border-red-600 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* CATEGORY PILLS */}
      <div
        style={{
          padding: "20px 16px 0",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        {EXAM_CATEGORIES.map((exam) => {
          const active = selectedExam === exam;
          return (
            <button
              key={exam}
              onClick={() => setSelectedExam(exam)}
              style={{
                whiteSpace: "nowrap",
                padding: "8px 20px",
                borderRadius: "24px",
                border: active ? "1.5px solid #e50914" : "1.5px solid #333",
                background: active ? "#e50914" : "transparent",
                color: active ? "#fff" : "#aaa",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "'Helvetica Neue', sans-serif",
                letterSpacing: "0.5px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {exam}
            </button>
          );
        })}
      </div>

      {/* COUNT */}
      {!loading && (
        <p
          style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: "12px",
            color: "#555",
            textAlign: "center",
            marginTop: "16px",
            letterSpacing: "0.5px",
          }}
        >
          {filteredMentors.length} mentor{filteredMentors.length !== 1 ? "s" : ""} available
        </p>
      )}

      {/* LIST */}
      <section style={{ padding: "16px 16px 80px", maxWidth: "700px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "60px" }}>
            <Loader2 className="animate-spin" size={28} color="#e50914" />
          </div>
        ) : filteredMentors.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <p style={{ color: "#555", fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px" }}>
              No mentors found
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
              {filteredMentors.map((mentor, index) => (
                <motion.div
                  key={mentor.user_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <MentorCard mentor={mentor} onClick={() => navigate(`/mentor/${mentor.user_id}`)} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </section>

      <Footer />
    </div>
  );
}

function MentorCard({ mentor, onClick }: { mentor: any; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  // Show max 3 services/expertise tags, rest as "+N more"
  const tags: string[] = mentor.exam_expertise || [];
  const visibleTags = tags.slice(0, 3);
  const extraCount = tags.length - 3;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1c1c1c" : "#181818",
        border: hovered ? "1px solid #e50914" : "1px solid #2a2a2a",
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Red left accent on hover */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: hovered ? "#e50914" : "transparent",
          transition: "background 0.2s ease",
          borderRadius: "12px 0 0 12px",
        }}
      />

      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        {/* PHOTO */}
        <img
          src={mentor.profile_photo_url || DEFAULT_IMAGE}
          alt={mentor.full_name}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #2a2a2a",
            flexShrink: 0,
          }}
        />

        {/* INFO */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + Arrow */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h3
              style={{
                fontSize: "17px",
                fontWeight: 400,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "#fff",
                margin: 0,
                fontFamily: "'Bebas Neue', serif",
              }}
            >
              {mentor.full_name}
            </h3>
            <ChevronRight
              size={16}
              color={hovered ? "#e50914" : "#444"}
              style={{ transition: "color 0.2s ease", flexShrink: 0, marginTop: "2px" }}
            />
          </div>

          {/* Tagline */}
          {mentor.tagline && (
            <p
              style={{
                fontSize: "12px",
                color: "#888",
                margin: "4px 0 10px",
                fontFamily: "'Helvetica Neue', sans-serif",
                lineHeight: "1.4",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {mentor.tagline}
            </p>
          )}

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {visibleTags.map((tag, i) => (
              <span
                key={i}
                style={{
                  background: "#242424",
                  border: "1px solid #333",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  color: "#bbb",
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontWeight: 500,
                  letterSpacing: "0.3px",
                }}
              >
                {tag}
              </span>
            ))}
            {extraCount > 0 && (
              <span
                style={{
                  background: "transparent",
                  border: "1px solid #333",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  color: "#e50914",
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontWeight: 600,
                }}
              >
                +{extraCount} more
              </span>
            )}
          </div>

          {/* College + Course */}
          {mentor.display_college && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {mentor.college_name && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <GraduationCap size={12} color="#666" />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#777",
                      fontFamily: "'Helvetica Neue', sans-serif",
                    }}
                  >
                    {mentor.college_name}
                  </span>
                </div>
              )}
              {mentor.course && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <BookOpen size={12} color="#666" />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#777",
                      fontFamily: "'Helvetica Neue', sans-serif",
                    }}
                  >
                    {mentor.course}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
