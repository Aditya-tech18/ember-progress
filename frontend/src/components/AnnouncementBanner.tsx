import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, DollarSign, Users } from "lucide-react";

const BANNERS = [
  {
    id: 1,
    title: "Solve 1500+ Questions",
    subtitle: "Get FULL Money Refunded!",
    description: "Achieve a 1500+ question streak and get your Prepixo subscription fee fully refunded.",
    gradient: "linear-gradient(135deg, #e50914 0%, #8b0000 100%)",
    icon: <Check size={32} />,
    highlight: "FULL Money Refunded",
    highlightColor: "#ffd700"
  },
  {
    id: 2,
    title: "₹29/month",
    subtitle: "Exclusive Offer",
    description: "For the First 1000 Students Only. Get all premium features at just ₹29/month.",
    gradient: "linear-gradient(135deg, #1a0000 0%, #e50914 50%, #000000 100%)",
    icon: <DollarSign size={32} />,
    highlight: "₹29",
    highlightColor: "#ffd700"
  },
  {
    id: 3,
    title: "Become a Campus Ambassador",
    subtitle: "Work & Earn with Prepixo",
    description: "Add 20+ students to the Prepixo WhatsApp community and get a chance to work with our team.",
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a4d1a 50%, #0a0a0a 100%)",
    icon: <Users size={32} />,
    highlight: "Campus Ambassador",
    highlightColor: "#4ade80"
  }
];

export default function AnnouncementBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-slide every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }

    if (touchStart - touchEnd < -50) {
      // Swipe right
      setCurrentIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentBanner = BANNERS[currentIndex];

  return (
    <div style={containerStyle}>
      {/* Banner Container */}
      <div
        style={{
          ...bannerStyle,
          background: currentBanner.gradient,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Icon */}
        <div style={iconWrapStyle}>
          {currentBanner.icon}
        </div>

        {/* Content */}
        <div style={contentStyle}>
          <h2 style={titleStyle}>
            {currentBanner.title.includes(currentBanner.highlight) ? (
              <>
                {currentBanner.title.split(currentBanner.highlight)[0]}
                <span style={{ color: currentBanner.highlightColor, fontWeight: 900 }}>
                  {currentBanner.highlight}
                </span>
                {currentBanner.title.split(currentBanner.highlight)[1]}
              </>
            ) : (
              currentBanner.title
            )}
          </h2>
          
          <p style={subtitleStyle}>{currentBanner.subtitle}</p>
          <p style={descriptionStyle}>{currentBanner.description}</p>
        </div>

        {/* Glow Effect */}
        <div style={glowStyle} />
      </div>

      {/* Dot Indicators */}
      <div style={dotsContainerStyle}>
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              ...dotStyle,
              backgroundColor: currentIndex === index ? "#e50914" : "#444",
              width: currentIndex === index ? "24px" : "8px",
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  width: "100%",
  padding: "0 16px",
  marginTop: "0", // No margin needed, spacer handles it
  marginBottom: "12px", // Tight spacing to next section
  maxWidth: "100%",
};

const bannerStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "160px",
  borderRadius: "16px",
  padding: "20px",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(229, 9, 20, 0.3), 0 2px 8px rgba(0, 0, 0, 0.5)",
  transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)", // Smoother transition
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  touchAction: "pan-y",
};

const iconWrapStyle: React.CSSProperties = {
  position: "absolute",
  top: "16px",
  right: "16px",
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  border: "2px solid rgba(255, 255, 255, 0.2)",
};

const contentStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
};

const titleStyle: React.CSSProperties = {
  fontSize: "clamp(20px, 5vw, 28px)",
  fontWeight: 800,
  color: "#fff",
  margin: "0 0 8px 0",
  lineHeight: 1.2,
  textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "rgba(255, 255, 255, 0.9)",
  margin: "0 0 8px 0",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const descriptionStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(255, 255, 255, 0.8)",
  lineHeight: 1.6,
  maxWidth: "90%",
  margin: 0,
};

const glowStyle: React.CSSProperties = {
  position: "absolute",
  top: "-50%",
  right: "-20%",
  width: "200px",
  height: "200px",
  background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
  borderRadius: "50%",
  pointerEvents: "none",
};

const dotsContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "8px",
  marginTop: "12px",
};

const dotStyle: React.CSSProperties = {
  height: "8px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  transition: "all 0.3s ease",
  padding: 0,
};
