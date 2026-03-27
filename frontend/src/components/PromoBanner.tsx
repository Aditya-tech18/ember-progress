import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const PromoBanner = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate("/subscription")}
      className="cursor-pointer bg-gradient-to-r from-background via-[#E50914]/10 to-background border-b border-[#E50914]/30 py-2 px-4 hover:from-[#E50914]/5 hover:via-[#E50914]/15 hover:to-[#E50914]/5 transition-all"
    >
      <div className="max-w-6xl mx-auto">
        <img
          src="https://customer-assets.emergentagent.com/job_db-integration-16/artifacts/z8gv3lgu_Screenshot%202026-03-27%20at%202.23.20%E2%80%AFPM.png"
          alt="Back to School Sale - ₹29/month for first 1000 students"
          className="w-full h-auto max-h-32 object-contain mx-auto rounded-lg"
        />
      </div>
    </motion.div>
  );
};
