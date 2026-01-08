import { motion } from "framer-motion";
import { Crown, Shield, Star, Award, Medal, Zap, Rocket, Target, Flame, Gem, Swords, Trophy } from "lucide-react";

const ranks = [
  { name: "Recruit", range: "0-49", icon: Shield, description: "Begin your journey", current: false },
  { name: "Private", range: "50-99", icon: Star, description: "Building foundation", current: false },
  { name: "Corporal", range: "100-199", icon: Award, description: "Gaining momentum", current: false },
  { name: "Sergeant", range: "200-349", icon: Medal, description: "Consistent performer", current: false },
  { name: "Lieutenant", range: "350-499", icon: Zap, description: "Rising star", current: false },
  { name: "Captain", range: "500-699", icon: Rocket, description: "Skilled warrior", current: false },
  { name: "Major", range: "700-999", icon: Target, description: "Expert level", current: true },
  { name: "Colonel", range: "1000-1499", icon: Flame, description: "Battle-hardened", current: false },
  { name: "Brigadier", range: "1500-1999", icon: Gem, description: "Elite force", current: false },
  { name: "General", range: "2000-2999", icon: Swords, description: "Master tactician", current: false },
  { name: "Field Marshal", range: "3000-4999", icon: Trophy, description: "Legendary", current: false },
  { name: "Supreme Marshal", range: "5000+", icon: Crown, description: "Ultimate champion", current: false },
];

export const RankSection = () => {
  const currentRankIndex = ranks.findIndex(r => r.current);

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Your Rank Journey
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Rise through the ranks by solving questions and mastering subjects
          </p>
        </motion.div>

        {/* Rank Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {ranks.map((rank, index) => {
            const Icon = rank.icon;
            const isPast = index < currentRankIndex;
            const isCurrent = rank.current;
            const isFuture = index > currentRankIndex;

            return (
              <motion.div
                key={rank.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`relative group cursor-pointer`}
              >
                <div
                  className={`glass-card rounded-2xl p-4 text-center transition-all duration-300 h-full
                    ${isCurrent ? "ring-2 ring-primary animate-glow-pulse" : ""}
                    ${isPast ? "opacity-60" : ""}
                    ${isFuture ? "opacity-40" : ""}
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 transition-colors
                      ${isCurrent ? "bg-gradient-to-br from-primary to-orange" : "bg-muted"}
                      ${isPast ? "bg-accent/30" : ""}
                    `}
                  >
                    <Icon
                      className={`w-6 h-6 ${isCurrent ? "text-primary-foreground" : isPast ? "text-accent" : "text-muted-foreground"}`}
                    />
                  </div>

                  {/* Name */}
                  <h4 className={`font-bold text-sm mb-1 ${isCurrent ? "text-primary" : "text-foreground"}`}>
                    {rank.name}
                  </h4>

                  {/* Range */}
                  <div className="text-xs text-muted-foreground mb-2">
                    {rank.range} Qs
                  </div>

                  {/* Current Badge */}
                  {isCurrent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                    >
                      YOU
                    </motion.div>
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover rounded-lg text-xs text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    {rank.description}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 glass-card rounded-full">
            <Rocket className="w-5 h-5 text-primary" />
            <span className="text-muted-foreground">
              You're <span className="text-foreground font-semibold">25 questions</span> away from becoming a <span className="text-primary font-bold">Colonel</span>!
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
