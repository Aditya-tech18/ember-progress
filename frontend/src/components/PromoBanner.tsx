import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const PromoBanner = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={() => navigate("/subscription")}
      className="cursor-pointer bg-[#000000] border-b border-[#E50914]/20 hover:border-[#E50914]/40 transition-all overflow-hidden"
    >
      <div className="w-full">
        <img
          src="https://customer-assets.emergentagent.com/job_db-integration-16/artifacts/wde77n3n_Screenshot%202026-03-27%20at%203.36.15%E2%80%AFPM.png"
          alt="Back to School Sale - ₹29/month for first 1000 students - PYQBook Exclusive Offer"
          className="w-full h-auto object-cover"
          style={{ maxHeight: '200px', objectFit: 'cover' }}
        />
      </div>
    </motion.div>
  );
};
