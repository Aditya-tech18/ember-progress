import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import badgeRecruit from "@/assets/badge-recruit.png";
import badgeCadet from "@/assets/badge-cadet.png";
import badgeSergeant from "@/assets/badge-sergeant.png";
import badgeCommander from "@/assets/badge-commander.png";

interface SubjectCount {
  solved: number;
  total: number;
}

interface Stats {
  combatName: string;
  rank: number;
  totalUsers: number;
  physics: SubjectCount;
  chemistry: SubjectCount;
  mathematics: SubjectCount;
  totalSolved: number;
  totalQuestions: number;
  submissionsByDate: Map<string, number>;
}

const BADGES = [
  { min: 0, name: "Recruit", img: badgeRecruit, color: "text-amber-500" },
  { min: 50, name: "Cadet", img: badgeCadet, color: "text-cyan-400" },
  { min: 200, name: "Sergeant", img: badgeSergeant, color: "text-yellow-400" },
  { min: 500, name: "Commander", img: badgeCommander, color: "text-purple-400" },
];

const getBadge = (solved: number) => {
  let current = BADGES[0];
  for (const b of BADGES) if (solved >= b.min) current = b;
  return current;
};

// 3-color circular progress (Physics=cyan, Chemistry=orange, Mathematics=green)
const TripleArc = ({
  phys,
  chem,
  math,
  totalSolved,
  totalQuestions,
}: {
  phys: SubjectCount;
  chem: SubjectCount;
  math: SubjectCount;
  totalSolved: number;
  totalQuestions: number;
}) => {
  const size = 220;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  // Each subject gets 1/3 of the circle; fill arc proportional to solved/total
  const segLen = circ / 3;
  const gap = 6;

  const seg = (s: SubjectCount) => {
    const pct = s.total > 0 ? Math.min(s.solved / s.total, 1) : 0;
    return Math.max(0, segLen - gap) * pct;
  };

  const segments = [
    { color: "hsl(189 94% 55%)", filled: seg(phys), offset: 0, total: segLen, label: "Phy" },
    { color: "hsl(28 95% 60%)", filled: seg(chem), offset: segLen, total: segLen, label: "Chem" },
    { color: "hsl(142 70% 50%)", filled: seg(math), offset: segLen * 2, total: segLen, label: "Math" },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background full track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted) / 0.3)"
          strokeWidth={stroke}
        />
        {/* Per-segment dim track */}
        {segments.map((s, i) => (
          <circle
            key={`bg-${i}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeOpacity={0.15}
            strokeWidth={stroke}
            strokeDasharray={`${Math.max(0, s.total - gap)} ${circ}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="round"
          />
        ))}
        {/* Filled progress per subject */}
        {segments.map((s, i) => (
          <circle
            key={`fg-${i}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${s.filled} ${circ}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${s.color})`,
              transition: "stroke-dasharray 0.8s ease",
            }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-foreground">{totalSolved}</span>
          <span className="text-base text-muted-foreground">/{totalQuestions}</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-emerald-400 text-sm">✓</span>
          <span className="text-sm text-muted-foreground">Solved</span>
        </div>
      </div>
    </div>
  );
};

// 365-day GitHub-style heatmap
const SubmissionsHeatmap = ({ submissionsByDate }: { submissionsByDate: Map<string, number> }) => {
  const { weeks, monthLabels, totalSubs, activeDays, maxStreak } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Start 364 days back, align to Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    const dow = start.getDay();
    start.setDate(start.getDate() - dow);

    const weeksArr: { date: Date; count: number; inRange: boolean }[][] = [];
    let totalSubs = 0;
    let activeDays = 0;
    let curStreak = 0;
    let maxStreak = 0;

    let cursor = new Date(start);
    while (cursor <= today || weeksArr.length === 0 || (weeksArr[weeksArr.length - 1]?.length ?? 0) < 7) {
      const week: { date: Date; count: number; inRange: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split("T")[0];
        const inRange = cursor >= new Date(today.getFullYear(), today.getMonth(), today.getDate() - 364) && cursor <= today;
        const count = inRange ? submissionsByDate.get(dateStr) ?? 0 : 0;
        if (inRange) {
          totalSubs += count;
          if (count > 0) {
            activeDays++;
            curStreak++;
            if (curStreak > maxStreak) maxStreak = curStreak;
          } else {
            curStreak = 0;
          }
        }
        week.push({ date: new Date(cursor), count, inRange });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeksArr.push(week);
      if (cursor > today && weeksArr.length >= 53) break;
    }

    // Month labels positioned at week index where the 1st of the month falls
    const monthLabels: { idx: number; label: string }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let lastMonth = -1;
    weeksArr.forEach((w, i) => {
      const firstInRange = w.find((d) => d.inRange);
      if (firstInRange && firstInRange.date.getMonth() !== lastMonth) {
        monthLabels.push({ idx: i, label: monthNames[firstInRange.date.getMonth()] });
        lastMonth = firstInRange.date.getMonth();
      }
    });

    return { weeks: weeksArr, monthLabels, totalSubs, activeDays, maxStreak };
  }, [submissionsByDate]);

  const cell = 11;
  const gap = 3;

  const colorFor = (count: number, inRange: boolean) => {
    if (!inRange) return "hsl(var(--muted) / 0.05)";
    if (count === 0) return "hsl(var(--muted) / 0.25)";
    if (count < 3) return "hsl(142 70% 30%)";
    if (count < 6) return "hsl(142 70% 45%)";
    if (count < 10) return "hsl(142 70% 55%)";
    return "hsl(142 80% 65%)";
  };

  return (
    <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-bold">
          <span className="text-foreground">{totalSubs}</span>{" "}
          <span className="text-muted-foreground font-normal">submissions in the past one year</span>
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Active days: <span className="text-foreground font-semibold">{activeDays}</span>
          </span>
          <span>
            Max streak: <span className="text-foreground font-semibold">{maxStreak}</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div
            className="relative h-4 mb-1"
            style={{ width: weeks.length * (cell + gap) }}
          >
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute text-[10px] text-muted-foreground"
                style={{ left: m.idx * (cell + gap) }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <svg
            width={weeks.length * (cell + gap)}
            height={7 * (cell + gap)}
          >
            {weeks.map((w, x) =>
              w.map((d, y) => (
                <rect
                  key={`${x}-${y}`}
                  x={x * (cell + gap)}
                  y={y * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx={2}
                  fill={colorFor(d.count, d.inRange)}
                >
                  {d.inRange && (
                    <title>
                      {d.date.toDateString()}: {d.count} submission{d.count !== 1 ? "s" : ""}
                    </title>
                  )}
                </rect>
              ))
            )}
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0.25, 0.4, 0.55, 0.7, 0.85].map((a) => (
          <span
            key={a}
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: `hsl(142 70% 45% / ${a})` }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

export const HomeStatsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Total questions per subject
      const { data: questions } = await supabase.from("questions").select("id, subject");
      const totals = { Physics: 0, Chemistry: 0, Mathematics: 0 };
      questions?.forEach((q) => {
        if (q.subject && totals.hasOwnProperty(q.subject)) {
          totals[q.subject as keyof typeof totals]++;
        }
      });
      const totalQuestions = totals.Physics + totals.Chemistry + totals.Mathematics;

      if (!user) {
        setStats({
          combatName: "Guest",
          rank: 0,
          totalUsers: 0,
          physics: { solved: 0, total: totals.Physics },
          chemistry: { solved: 0, total: totals.Chemistry },
          mathematics: { solved: 0, total: totals.Mathematics },
          totalSolved: 0,
          totalQuestions,
          submissionsByDate: new Map(),
        });
        setLoading(false);
        return;
      }

      // User profile
      const { data: profile } = await supabase
        .from("users")
        .select("combat_name, full_name")
        .eq("id", user.id)
        .maybeSingle();

      // User submissions (last 365 days)
      const yearAgo = new Date();
      yearAgo.setDate(yearAgo.getDate() - 365);

      const { data: subs } = await supabase
        .from("submissions")
        .select("question_id, submitted_at")
        .eq("user_id", user.id);

      const uniqueQids = [...new Set(subs?.map((s) => s.question_id).filter(Boolean) ?? [])] as number[];

      const subjectSolved = { Physics: 0, Chemistry: 0, Mathematics: 0 };
      if (uniqueQids.length > 0) {
        const { data: solvedQs } = await supabase
          .from("questions")
          .select("id, subject")
          .in("id", uniqueQids);
        solvedQs?.forEach((q) => {
          if (q.subject && subjectSolved.hasOwnProperty(q.subject)) {
            subjectSolved[q.subject as keyof typeof subjectSolved]++;
          }
        });
      }
      const totalSolved =
        subjectSolved.Physics + subjectSolved.Chemistry + subjectSolved.Mathematics;

      // Submissions by date map
      const subsByDate = new Map<string, number>();
      subs?.forEach((s) => {
        if (!s.submitted_at) return;
        const d = new Date(s.submitted_at).toISOString().split("T")[0];
        subsByDate.set(d, (subsByDate.get(d) ?? 0) + 1);
      });

      // Rank: count distinct users with more unique solved submissions than this user.
      // Simple approximation: rank = (users with submissions > totalSolved) + 1.
      // Total users from `users` table.
      const { count: totalUsers } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });

      // Compute rank by querying counts per user, then filtering client-side.
      // (Limited to 1000 rows by default — acceptable for an approximate global rank.)
      const { data: allSubs } = await supabase
        .from("submissions")
        .select("user_id, question_id");

      const perUser = new Map<string, Set<number>>();
      allSubs?.forEach((s) => {
        if (!s.user_id || !s.question_id) return;
        if (!perUser.has(s.user_id)) perUser.set(s.user_id, new Set());
        perUser.get(s.user_id)!.add(s.question_id);
      });
      let higher = 0;
      perUser.forEach((set, uid) => {
        if (uid !== user.id && set.size > totalSolved) higher++;
      });
      const rank = higher + 1;

      setStats({
        combatName: profile?.combat_name || profile?.full_name || user.email?.split("@")[0] || "User",
        rank,
        totalUsers: totalUsers ?? 0,
        physics: { solved: subjectSolved.Physics, total: totals.Physics },
        chemistry: { solved: subjectSolved.Chemistry, total: totals.Chemistry },
        mathematics: { solved: subjectSolved.Mathematics, total: totals.Mathematics },
        totalSolved,
        totalQuestions,
        submissionsByDate: subsByDate,
      });
    } catch (e) {
      console.error("Dashboard stats error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <section className="px-3 sm:px-4 py-6">
        <div className="container mx-auto">
          <div className="rounded-2xl bg-card/60 border border-border/50 h-64 animate-pulse" />
        </div>
      </section>
    );
  }

  const badge = getBadge(stats.totalSolved);
  const nextBadge = BADGES.find((b) => b.min > stats.totalSolved);
  const toNext = nextBadge ? nextBadge.min - stats.totalSolved : 0;

  return (
    <section className="px-3 sm:px-4 py-6 sm:py-8">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Combined: Badge (25%) + Solved circle & subject stats (75%) */}
          <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-black via-[#0a0000] to-black shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.5)]">
            {/* Netflix-style red accent glow */}
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-crimson/20 blur-3xl pointer-events-none" />

            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-0">
              {/* Badge — 25% (1/4) */}
              <div className="md:col-span-1 p-5 sm:p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-primary/15 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest text-primary/80 font-bold">Badges</p>
                    <p className="text-2xl font-extrabold text-foreground leading-none">
                      {BADGES.filter((b) => stats.totalSolved >= b.min).length}
                    </p>
                  </div>
                  <div className={`text-[10px] uppercase tracking-wider font-bold ${badge.color}`}>
                    {badge.name}
                  </div>
                </div>
                <div className="relative my-1">
                  <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
                  <img
                    src={badge.img}
                    alt={`${badge.name} badge`}
                    width={110}
                    height={110}
                    loading="lazy"
                    className="relative drop-shadow-[0_0_22px_hsl(var(--primary)/0.55)]"
                  />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">Most Recent</p>
                <p className="text-sm font-bold text-foreground">{badge.name}</p>
                {nextBadge ? (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {toNext} more to <span className={`font-semibold ${nextBadge.color}`}>{nextBadge.name}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-400 mt-1">Max badge unlocked!</p>
                )}
              </div>

              {/* Solved circle + subject stats — 75% (3/4) */}
              <div className="md:col-span-3 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm uppercase tracking-widest font-bold text-primary">
                    Your Progress
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Rank #{stats.rank.toLocaleString()}
                    {stats.totalUsers > 0 && ` / ${stats.totalUsers.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <TripleArc
                    phys={stats.physics}
                    chem={stats.chemistry}
                    math={stats.mathematics}
                    totalSolved={stats.totalSolved}
                    totalQuestions={stats.totalQuestions}
                  />
                  <div className="flex-1 w-full grid grid-cols-1 gap-2.5">
                    {[
                      { label: "Phy", color: "hsl(189 94% 55%)", s: stats.physics },
                      { label: "Chem", color: "hsl(28 95% 60%)", s: stats.chemistry },
                      { label: "Math", color: "hsl(142 70% 50%)", s: stats.mathematics },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="rounded-lg bg-background/60 border border-border/50 px-4 py-2.5 flex items-center justify-between hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: row.color, boxShadow: `0 0 8px ${row.color}` }}
                          />
                          <span className="text-sm font-bold" style={{ color: row.color }}>
                            {row.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {row.s.solved}
                          <span className="text-muted-foreground font-normal">/{row.s.total}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap full width */}
          <div>
            <SubmissionsHeatmap submissionsByDate={stats.submissionsByDate} />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HomeStatsDashboard;
