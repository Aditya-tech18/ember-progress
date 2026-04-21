import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, ArrowLeft, GraduationCap, BookOpen,
  Share2, Star, Award, ChevronDown, ChevronUp,
  Mail, ShieldCheck, AlertCircle, Zap,
  MessageCircle, Clock, Users, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Global Type for Razorpay ────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: any;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_BASE = "https://pgvymttdvdlkcroqxsgn.supabase.co/storage/v1/object/public/mentor-profile-images";
const ADITYA_IMAGE = "https://pgvymttdvdlkcroqxsgn.supabase.co/storage/v1/object/public/mentor-profile-images/1065a106-cd9f-4cbd-88ae-1ac641624176/profile-1774589376150.jpeg";
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SObcQvFXRo6HAa";

interface MentorProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  mobile_number: string | null;
  exam_expertise: string[] | null;
  college_name: string | null;
  course: string | null;
  display_college_publicly: boolean;
  tagline: string | null;
  achievements: string | null;
  about_me: string | null;
  profile_photo_url: string | null;
  status: string;
}

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const MentorProfilePage = () => {
  const { user_id, id } = useParams();
  const targetId = user_id || id;
  const navigate = useNavigate();
  const location = useLocation();

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(ADITYA_IMAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [achExpanded, setAchExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // ── Load Razorpay Script ────────────────────────────────────────────────
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast.error("Failed to load payment system");
    document.body.appendChild(script);
    return () => { try { document.body.removeChild(script); } catch (e) {} };
  }, []);

  useEffect(() => {
    if (targetId) { fetchMentor(); } else { setLoading(false); setError(true); }
  }, [targetId]);

  const fetchMentor = async () => {
    try {
      setLoading(true); 
      setError(false);
      const { data, error: fetchError } = await supabase
        .from("mentor_applications")
        .select("*")
        .eq("user_id", targetId)
        .eq("status", "approved")
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!data) { setMentor(null); setError(true); return; }
      setMentor(data as MentorProfile);
      
      // Hardcoded image for Aditya Chaubey ONLY
      if (data.full_name?.toLowerCase().includes("aditya chaubey")) {
        setPhotoUrl("https://pgvymttdvdlkcroqxsgn.supabase.co/storage/v1/object/public/mentor-profile-images/1065a106-cd9f-4cbd-88ae-1ac641624176/profile-1774589376150.jpeg");
      } else {
        // Fetch profile photo from storage for all other mentors
        try {
          const { data: files } = await supabase.storage
            .from("mentor-profile-images")
            .list(data.user_id, { 
              limit: 1, 
              sortBy: { column: "created_at", order: "desc" } 
            });
          
          if (files && files.length > 0) {
            setPhotoUrl(`${STORAGE_BASE}/${data.user_id}/${files[0].name}`);
          } else {
            // Fallback to default image
            setPhotoUrl(ADITYA_IMAGE);
          }
        } catch (err) {
          console.error("Error fetching profile photo:", err);
          setPhotoUrl(ADITYA_IMAGE);
        }
      }
    } catch (err) { 
      console.error("Fetch error:", err); 
      setError(true); 
    }
    finally { setLoading(false); }
  };

  // ── Handle Payment Logic ────────────────────────────────────────────────
  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to book a session");
        navigate("/auth", { state: { returnTo: location.pathname } });
        setIsProcessing(false);
        return;
      }
      if (!razorpayLoaded || !window.Razorpay) {
        toast.error("Payment system loading. Please wait...");
        setTimeout(() => setIsProcessing(false), 2000);
        return;
      }
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: 9900,
        currency: "INR",
        name: "PYQBook Mentorship",
        description: `1:1 Session with ${mentor?.full_name}`,
        image: "https://i.imgur.com/3g7nmJC.png",
        handler: async function (response: any) {
          try {
            // Create session purchase record
            const purchaseResponse = await fetch(`${import.meta.env.REACT_APP_BACKEND_URL || ''}/api/session/create-purchase`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                student_id: user.id,
                student_email: user.email,
                mentor_user_id: mentor?.user_id,
                mentor_email: mentor?.email,
                amount_paid: 99,
                payment_id: response.razorpay_payment_id
              })
            });
            
            if (!purchaseResponse.ok) throw new Error("Failed to create purchase record");
            
            toast.success("🎉 Mentorship session booked!");
            navigate(`/mentor-chat/${mentor?.user_id}`);
          } catch (error: any) {
            console.error("Activation error:", error);
            toast.error("Payment successful but activation failed. Contact support.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: { email: user.email || "" },
        theme: { color: "#e50914" },
        modal: { ondismiss: () => setIsProcessing(false) }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error("Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={loadingWrapStyle}>
        <div style={loaderRingStyle} />
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          style={{ color: "#666", fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase", marginTop: "20px" }}
        >
          Loading Profile
        </motion.div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────
  if (error || !mentor) {
    return (
      <div style={errorWrapStyle}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: "center" }}>
          <div style={errorIconWrapStyle}><AlertCircle size={32} color="#e50914" /></div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>Profile Unavailable</h2>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "28px", lineHeight: 1.6 }}>
            This mentor may not be approved yet<br />or the link is incorrect.
          </p>
          <button onClick={() => navigate(-1)} style={errorBtnStyle}>← Go Back</button>
        </motion.div>
      </div>
    );
  }

  const aboutShort = (mentor.about_me?.length || 0) > 160;
  const achShort = (mentor.achievements?.length || 0) > 120;

  return (
    <div style={pageStyle}>

      {/* ── Cinematic Hero Glow ───────────────────────────────────────── */}
      <div style={heroGlowStyle} />

      {/* ── Sticky Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={stickyHeaderStyle}
      >
        <button onClick={() => navigate(-1)} style={backBtnStyle}>
          <ArrowLeft size={18} />
          <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.5px" }}>Senior Detail</span>
        </button>
        <button
          style={shareIconBtnStyle}
          onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
        >
          <Share2 size={16} color="#aaa" />
        </button>
      </motion.div>

      <div style={contentWrapStyle}>

        {/* ── Hero Profile Card ────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} style={heroCardStyle}>
          {/* Avatar with glow ring */}
          <div style={avatarWrapStyle}>
            <div style={avatarGlowRingStyle} />
            <img
              src={photoUrl}
              alt={mentor.full_name}
              style={{ ...avatarImgStyle, opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s" }}
              onLoad={() => setImgLoaded(true)}
            />
            <div style={verifiedBadgeStyle}>
              <ShieldCheck size={10} color="#fff" strokeWidth={2.5} />
            </div>
          </div>

          {/* Name & Meta */}
          <div style={{ flex: 1 }}>
            <div style={verifiedLabelStyle}>✦ VERIFIED SENIOR</div>
            <h1 style={nameStyle}>{mentor.full_name}</h1>
            <p style={taglineStyle}>{mentor.tagline || "Expert Mentor"}</p>
            <div style={starsRowStyle}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={13} fill="#e50914" color="#e50914" />
              ))}
              <span style={{ color: "#666", fontSize: "12px", marginLeft: "6px" }}>5.0</span>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Strip ─────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} style={statsStripStyle}>
          <StatPill icon={<Clock size={13} />} value="24h" label="Response" />
          <div style={statDividerStyle} />
          <StatPill icon={<Users size={13} />} value="50+" label="Students" />
          <div style={statDividerStyle} />
          <StatPill icon={<TrendingUp size={13} />} value="4.9★" label="Rating" />
          <div style={statDividerStyle} />
          <StatPill icon={<MessageCircle size={13} />} value="Live" label="Chat" />
        </motion.div>

        {/* ── Info Grid ───────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} style={infoGridStyle}>
          {mentor.display_college_publicly && mentor.college_name && (
            <InfoCard icon={<GraduationCap size={16} />} label="College" value={mentor.college_name} />
          )}
          {mentor.course && (
            <InfoCard icon={<BookOpen size={16} />} label="Course" value={mentor.course} />
          )}
        </motion.div>

        {/* ── Expertise Tags ───────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} style={sectionStyle}>
          <SectionLabel text="Expertise" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
            {(mentor.exam_expertise || []).map((tag) => (
              <motion.span
                key={tag}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(229,9,20,0.2)" }}
                style={expertiseTagStyle}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* ── About Me ─────────────────────────────────────────────────── */}
        {mentor.about_me && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} style={sectionStyle}>
            <SectionLabel text="About Me" />
            <AnimatePresence initial={false}>
              <motion.p
                key={aboutExpanded ? "full" : "short"}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={bodyTextStyle}
              >
                {aboutShort && !aboutExpanded
                  ? `${mentor.about_me.substring(0, 160)}…`
                  : mentor.about_me}
              </motion.p>
            </AnimatePresence>
            {aboutShort && (
              <button onClick={() => setAboutExpanded(!aboutExpanded)} style={expandBtnStyle}>
                {aboutExpanded ? <>Show Less <ChevronUp size={14} /></> : <>Read Full Bio <ChevronDown size={14} /></>}
              </button>
            )}
          </motion.div>
        )}

        {/* ── Achievements ─────────────────────────────────────────────── */}
        {mentor.achievements && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5} style={sectionStyle}>
            <SectionLabel text="Achievements" />
            <div style={achievementCardStyle}>
              <div style={achIconRowStyle}>
                <Award size={18} color="#e50914" />
                <span style={{ color: "#e50914", fontSize: "11px", fontWeight: 800, letterSpacing: "1px" }}>HIGHLIGHTS</span>
              </div>
              <AnimatePresence initial={false}>
                <motion.p
                  key={achExpanded ? "full" : "short"}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ ...bodyTextStyle, margin: "10px 0 0" }}
                >
                  {achShort && !achExpanded
                    ? `${mentor.achievements.substring(0, 120)}…`
                    : mentor.achievements}
                </motion.p>
              </AnimatePresence>
              {achShort && (
                <button onClick={() => setAchExpanded(!achExpanded)} style={expandBtnStyle}>
                  {achExpanded ? <>View Less <ChevronUp size={14} /></> : <>View All <ChevronDown size={14} /></>}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Verified Contact ─────────────────────────────────────────── */}
        {mentor.email && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6} style={contactCardStyle}>
            <div style={contactHeaderStyle}>
              <ShieldCheck size={15} color="#e50914" />
              <span style={{ color: "#e50914", fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px" }}>VERIFIED CONTACT</span>
            </div>
            <ContactRow icon={<Mail size={14} color="#e50914" />} value={mentor.email} />
          </motion.div>
        )}

        {/* ── Trust Strip ─────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7} style={trustStripStyle}>
          {["🔒 Secure Payment", "✅ Instant Access", "💬 Direct Chat"].map(t => (
            <span key={t} style={trustItemStyle}>{t}</span>
          ))}
        </motion.div>

        {/* spacer for fixed CTA */}
        <div style={{ height: "100px" }} />
      </div>

      {/* ── Fixed Book CTA ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={ctaWrapStyle}
      >
        <button onClick={handlePayment} disabled={isProcessing} style={ctaBtnStyle}>
          {isProcessing ? (
            <Loader2 className="animate-spin" size={22} color="#fff" />
          ) : (
            <>
              <div>
                <div style={ctaSubtitleStyle}>1:1 MENTORSHIP SESSION</div>
                <div style={ctaPriceStyle}>
                  Book @ ₹99
                  <span style={ctaStrikeStyle}>₹999</span>
                  <span style={ctaSavingsStyle}>90% OFF</span>
                </div>
              </div>
              <div style={ctaIconWrapStyle}>
                <Zap size={20} fill="#fff" color="#fff" />
              </div>
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const SectionLabel = ({ text }: { text: string }) => (
  <div style={sectionLabelStyle}>
    <span style={sectionLabelBarStyle} />
    {text}
  </div>
);

const StatPill = ({ icon, value, label }: { icon: any; value: string; label: string }) => (
  <div style={statPillStyle}>
    <span style={{ color: "#e50914" }}>{icon}</span>
    <span style={statValueStyle}>{value}</span>
    <span style={statLabelStyle}>{label}</span>
  </div>
);

const InfoCard = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <div style={infoCardStyle}>
    <div style={infoCardIconStyle}>{icon}</div>
    <div>
      <div style={infoCardLabelStyle}>{label}</div>
      <div style={infoCardValueStyle}>{value}</div>
    </div>
  </div>
);

const ContactRow = ({ icon, value }: { icon: any; value: string }) => (
  <div style={contactRowStyle}>
    {icon}
    <span style={contactValueStyle}>{value}</span>
  </div>
);

// ─── Styles ────────────────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0a0a0a",
  color: "#fff",
  fontFamily: "'Outfit', 'DM Sans', system-ui, sans-serif",
  position: "relative",
  overflowX: "hidden",
};

const heroGlowStyle: React.CSSProperties = {
  position: "fixed",
  top: "-120px",
  left: "50%",
  transform: "translateX(-50%)",
  width: "600px",
  height: "400px",
  background: "radial-gradient(ellipse at center, rgba(229,9,20,0.12) 0%, transparent 70%)",
  pointerEvents: "none",
  zIndex: 0,
};

const loadingWrapStyle: React.CSSProperties = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  background: "#0a0a0a",
};

const loaderRingStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  border: "3px solid rgba(229,9,20,0.15)",
  borderTopColor: "#e50914",
  animation: "spin 0.8s linear infinite",
};

const errorWrapStyle: React.CSSProperties = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0a0a0a",
  padding: "20px",
};

const errorIconWrapStyle: React.CSSProperties = {
  width: "72px",
  height: "72px",
  background: "rgba(229,9,20,0.1)",
  border: "1px solid rgba(229,9,20,0.2)",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 20px",
};

const errorBtnStyle: React.CSSProperties = {
  background: "#e50914",
  color: "#fff",
  border: "none",
  padding: "12px 28px",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
  letterSpacing: "0.5px",
};

const stickyHeaderStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 100,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 20px",
  background: "rgba(10,10,10,0.92)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const backBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
  padding: "6px 0",
};

const shareIconBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  padding: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};

const contentWrapStyle: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "24px 18px",
  position: "relative",
  zIndex: 1,
};

const heroCardStyle: React.CSSProperties = {
  display: "flex",
  gap: "18px",
  alignItems: "center",
  marginBottom: "24px",
  padding: "22px",
  background: "linear-gradient(135deg, rgba(229,9,20,0.06) 0%, rgba(255,255,255,0.02) 100%)",
  border: "1px solid rgba(229,9,20,0.15)",
  borderRadius: "20px",
  position: "relative",
  overflow: "hidden",
};

const avatarWrapStyle: React.CSSProperties = {
  position: "relative",
  flexShrink: 0,
};

const avatarGlowRingStyle: React.CSSProperties = {
  position: "absolute",
  inset: "-3px",
  borderRadius: "50%",
  background: "conic-gradient(from 0deg, #e50914, #ff4d4d, #e50914, transparent, #e50914)",
  animation: "spin 4s linear infinite",
  zIndex: 0,
};

const avatarImgStyle: React.CSSProperties = {
  width: "90px",
  height: "90px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "3px solid #0a0a0a",
  position: "relative",
  zIndex: 1,
};

const verifiedBadgeStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 2,
  right: 2,
  background: "#e50914",
  borderRadius: "50%",
  width: "22px",
  height: "22px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid #0a0a0a",
  zIndex: 2,
};

const verifiedLabelStyle: React.CSSProperties = {
  fontSize: "9px",
  color: "#e50914",
  fontWeight: 800,
  letterSpacing: "2px",
  marginBottom: "6px",
};

const nameStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 900,
  margin: "0 0 4px",
  lineHeight: 1.2,
  letterSpacing: "-0.3px",
};

const taglineStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#ff6b6b",
  fontWeight: 700,
  margin: "0 0 10px",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
};

const starsRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
};

const statsStripStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "14px 20px",
  marginBottom: "20px",
};

const statPillStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "3px",
  flex: 1,
};

const statDividerStyle: React.CSSProperties = {
  width: "1px",
  height: "28px",
  background: "rgba(255,255,255,0.08)",
};

const statValueStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 800,
  color: "#fff",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: "9px",
  color: "#555",
  fontWeight: 600,
  letterSpacing: "0.8px",
  textTransform: "uppercase",
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "24px",
};

const infoCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "14px",
  padding: "14px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  transition: "border-color 0.2s",
};

const infoCardIconStyle: React.CSSProperties = {
  color: "#e50914",
  background: "rgba(229,9,20,0.1)",
  padding: "8px",
  borderRadius: "10px",
  display: "flex",
  flexShrink: 0,
};

const infoCardLabelStyle: React.CSSProperties = {
  fontSize: "9px",
  color: "#555",
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase",
  marginBottom: "3px",
};

const infoCardValueStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#eee",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "24px",
};

const sectionLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "11px",
  color: "#888",
  fontWeight: 800,
  letterSpacing: "2px",
  textTransform: "uppercase",
};

const sectionLabelBarStyle: React.CSSProperties = {
  display: "inline-block",
  width: "3px",
  height: "14px",
  background: "#e50914",
  borderRadius: "2px",
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#999",
  lineHeight: 1.75,
  marginTop: "12px",
};

const expandBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#e50914",
  fontWeight: 700,
  fontSize: "12px",
  cursor: "pointer",
  padding: "8px 0 0",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  letterSpacing: "0.3px",
};

const achievementCardStyle: React.CSSProperties = {
  background: "rgba(229,9,20,0.04)",
  border: "1px solid rgba(229,9,20,0.15)",
  borderLeft: "3px solid #e50914",
  borderRadius: "14px",
  padding: "18px",
  marginTop: "12px",
};

const achIconRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const expertiseTagStyle: React.CSSProperties = {
  background: "rgba(229,9,20,0.08)",
  color: "#ff6b6b",
  padding: "7px 14px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: 700,
  border: "1px solid rgba(229,9,20,0.2)",
  cursor: "default",
  letterSpacing: "0.3px",
  transition: "background 0.2s",
};

const contactCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "16px",
};

const contactHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "16px",
};

const contactRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "12px",
};

const contactValueStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#ccc",
  fontWeight: 500,
};

const trustStripStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "16px",
  flexWrap: "wrap",
  padding: "4px 0",
};

const trustItemStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#555",
  fontWeight: 600,
};

const ctaWrapStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "16px",
  left: "50%",
  transform: "translateX(-50%)",
  width: "calc(100% - 32px)",
  maxWidth: "520px",
  zIndex: 1000,
};

const ctaBtnStyle: React.CSSProperties = {
  width: "100%",
  height: "68px",
  background: "linear-gradient(135deg, #e50914 0%, #c8070f 100%)",
  color: "#fff",
  border: "none",
  borderRadius: "16px",
  fontWeight: 800,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 22px",
  cursor: "pointer",
  boxShadow: "0 8px 32px rgba(229,9,20,0.45), 0 2px 8px rgba(0,0,0,0.5)",
  transition: "transform 0.15s, box-shadow 0.15s",
};

const ctaSubtitleStyle: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 800,
  letterSpacing: "2px",
  opacity: 0.75,
  marginBottom: "3px",
};

const ctaPriceStyle: React.CSSProperties = {
  fontSize: "19px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  gap: "8px",
  letterSpacing: "-0.3px",
};

const ctaStrikeStyle: React.CSSProperties = {
  fontSize: "12px",
  textDecoration: "line-through",
  opacity: 0.45,
  fontWeight: 500,
};

const ctaSavingsStyle: React.CSSProperties = {
  fontSize: "10px",
  background: "rgba(255,255,255,0.2)",
  padding: "2px 7px",
  borderRadius: "6px",
  fontWeight: 800,
  letterSpacing: "0.5px",
};

const ctaIconWrapStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  borderRadius: "10px",
  padding: "10px",
  display: "flex",
  alignItems: "center",
};

export default MentorProfilePage;
