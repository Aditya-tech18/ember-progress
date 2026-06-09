import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getCachedGoal } from "@/utils/examConfig";
import badgeRecruit from "@/assets/badge-recruit.png";
import badgeCadet from "@/assets/badge-cadet.png";
import badgeSergeant from "@/assets/badge-sergeant.png";
import badgeCommander from "@/assets/badge-commander.png";
import disciplineBanner from "@/assets/discipline-banner.png";
import { Atom, FlaskConical, Sigma, Leaf, Bug, Target, TrendingUp, Flame, Trophy, Share2, Lock } from "lucide-react";

interface SubjectCount {
  solved: number;
  total: number;
}
interface SubjectDef {
  key: string;
  label: string;
  short: string;
  color: string;
  Icon: any;
}
interface Stats {
  combatName: string;
  rank: number;
  totalUsers: number;
  subjects: { def: SubjectDef; s: SubjectCount }[];
  totalSolved: number;
  totalQuestions: number;
  thisWeek: number;
  streak: number;
  submissionsByDate: Map<string, number>;
}

const BADGES = [
  { min: 0, name: "Recruit", img: badgeRecruit, color: "text-amber-500" },
  { min: 50, name: "Cadet", img: badgeCadet, color: "text-violet-400" },
  { min: 200, name: "Sergeant", img: badgeSergeant, color: "text-yellow-400" },
  { min: 500, name: "Commander", img: badgeCommander, color: "text-purple-400" },
];

const getBadge = (solved: number) => {
  let current = BADGES[0];
  for (const b of BADGES) if (solved >= b.min) current = b;
  return current;
};

const JEE_SUBJECTS: SubjectDef[] = [
  { key: "Physics", label: "Physics", short: "PHY", color: "hsl(199 95% 60%)", Icon: Atom },
  { key: "Chemistry", label: "Chemistry", short: "CHEM", color: "hsl(28 95% 60%)", Icon: FlaskConical },
  { key: "Mathematics", label: "Mathematics", short: "MATH", color: "hsl(142 70% 50%)", Icon: Sigma },
];
const NEET_SUBJECTS: SubjectDef[] = [
  { key: "Physics", label: "Physics", short: "PHY", color: "hsl(199 95% 60%)", Icon: Atom },
  { key: "Chemistry", label: "Chemistry", short: "CHEM", color: "hsl(28 95% 60%)", Icon: FlaskConical },
  { key: "Botany", label: "Botany", short: "BOT", color: "hsl(142 70% 50%)", Icon: Leaf },
  { key: "Zoology", label: "Zoology", short: "ZOO", color: "hsl(330 80% 60%)", Icon: Bug },
];

// Multi-segment circular progress ring (3 or 4 subjects)
const MultiArc = ({
  subjects,
  totalSolved,
  totalQuestions,
  badgeImg,
  badgeName,
  size = 260,
  showLabels = true,
}: {
  subjects: { def: SubjectDef; s: SubjectCount }[];
  totalSolved: number;
  totalQuestions: number;
  badgeImg: string;
  badgeName: string;
  size?: number;
  showLabels?: boolean;
}) => {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const n = subjects.length;
  const segLen = circ / n;
  const gap = 8;

  const seg = (s: SubjectCount) => {
    const pct = s.total > 0 ? Math.min(s.solved / s.total, 1) : 0;
    return Math.max(0, segLen - gap) * pct;
  };

  return (
    <div className="relative mx-auto" style={{ width: "100%", maxWidth: size, aspectRatio: "1 / 1" }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" className="-rotate-90 overflow-visible">
        {subjects.map((row, i) => {
          const offset = i * segLen;
          return (
            <g key={i}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={row.def.color}
                strokeOpacity={0.18}
                strokeWidth={stroke}
                strokeDasharray={`${Math.max(0, segLen - gap)} ${circ}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={row.def.color}
                strokeWidth={stroke}
                strokeDasharray={`${seg(row.s)} ${circ}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 6px ${row.def.color})`,
                  transition: "stroke-dasharray 0.8s ease",
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Subject labels around the ring */}
      {showLabels && (
        <>
          {subjects.map((row, i) => {
            // Angles around the circle at the middle of each segment (starting from top, going clockwise)
            const angle = (i / n) * 360 + 360 / n / 2 - 90;
            const rad = (angle * Math.PI) / 180;
            const r = (size / 2) - 4;
            const x = size / 2 + r * Math.cos(rad);
            const y = size / 2 + r * Math.sin(rad);
            const xPct = (x / size) * 100;
            const yPct = (y / size) * 100;
            const { Icon } = row.def;
            return (
              <div
                key={row.def.key}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center pointer-events-none"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
              >
                <Icon className="w-5 h-5 mb-0.5" style={{ color: row.def.color }} />
                <span className="text-[13px] font-bold tracking-wide" style={{ color: row.def.color }}>
                  {row.def.short}
                </span>
                <span className="text-[12px] text-white/90 font-semibold leading-none">
                  {row.s.solved}<span className="text-white/50">/{row.s.total}</span>
                </span>
              </div>
            );
          })}
        </>
      )}

      {/* Center badge + total */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative mb-1">
          <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full" />
          <img
            src={badgeImg}
            alt={badgeName}
            className="relative w-12 h-12 sm:w-14 sm:h-14 drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
          />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">★ Current Rank ★</p>
        <p className="text-lg sm:text-xl font-extrabold text-white leading-none mb-1">{badgeName}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-extrabold text-white">{totalSolved}</span>
          <span className="text-sm text-white/70 font-semibold">/{totalQuestions}</span>
        </div>
        <p className="text-[12px] text-white/75 font-semibold mt-0.5">Questions Solved</p>
      </div>
    </div>
  );
};

// Month-grouped heatmap (kept exactly as-is per user request)
const SubmissionsHeatmap = ({ submissionsByDate }: { submissionsByDate: Map<string, number> }) => {
  const { months, totalSubs, activeDays, maxStreak } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(oneYearAgo.getDate() - 364);

    const curY = today.getFullYear();
    const curM = today.getMonth();
    const ordered: { year: number; month: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(curY, curM - i, 1);
      ordered.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let totalSubs = 0;
    let activeDays = 0;
    const dateCounts: { date: Date; count: number }[] = [];
    for (let i = 0; i < 365; i++) {
      const d = new Date(oneYearAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const c = submissionsByDate.get(key) ?? 0;
      dateCounts.push({ date: d, count: c });
      if (c > 0) { totalSubs += c; activeDays++; }
    }
    let maxStreak = 0;
    let cur = 0;
    dateCounts.forEach((d) => {
      if (d.count > 0) { cur++; if (cur > maxStreak) maxStreak = cur; } else cur = 0;
    });

    const months = ordered.map(({ year, month }) => {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDow = firstDay.getDay();
      const cells: { date: Date | null; count: number; inRange: boolean; future: boolean }[] = [];
      for (let i = 0; i < startDow; i++) cells.push({ date: null, count: 0, inRange: false, future: false });
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const inRange = date >= oneYearAgo && date <= today;
        const future = date > today;
        const key = date.toISOString().split("T")[0];
        const count = inRange ? submissionsByDate.get(key) ?? 0 : 0;
        cells.push({ date, count, inRange, future });
      }
      const weeks: typeof cells[] = [];
      for (let i = 0; i < cells.length; i += 7) {
        const w = cells.slice(i, i + 7);
        while (w.length < 7) w.push({ date: null, count: 0, inRange: false, future: false });
        weeks.push(w);
      }
      return { label: `${monthNames[month]} ${String(year).slice(2)}`, weeks, isCurrent: year === curY && month === curM };
    });

    return { months, totalSubs, activeDays, maxStreak };
  }, [submissionsByDate]);

  const cell = 12;
  const gap = 3;
  const colorFor = (count: number, inRange: boolean, future: boolean) => {
    if (future) return "hsl(var(--muted) / 0.08)";
    if (!inRange) return "hsl(var(--muted) / 0.12)";
    if (count === 0) return "hsl(var(--muted) / 0.28)";
    if (count < 3) return "hsl(142 70% 32%)";
    if (count < 6) return "hsl(142 72% 45%)";
    if (count < 10) return "hsl(142 75% 55%)";
    return "hsl(142 82% 65%)";
  };

  return (
    <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <h3 className="text-base sm:text-lg font-bold">
          <span className="text-foreground">{totalSubs}</span>{" "}
          <span className="text-muted-foreground font-normal">submissions in the past year</span>
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Active: <span className="text-foreground font-semibold">{activeDays}</span></span>
          <span>Max streak: <span className="text-emerald-400 font-semibold">{maxStreak}🔥</span></span>
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex items-end gap-5">
          {months.map((m, mi) => {
            const widthPx = m.weeks.length * (cell + gap);
            return (
              <div key={mi} className="flex flex-col items-center">
                <svg width={widthPx} height={7 * (cell + gap)} className="block">
                  {m.weeks.map((w, x) =>
                    w.map((d, y) => (
                      <rect
                        key={`${x}-${y}`}
                        x={x * (cell + gap)}
                        y={y * (cell + gap)}
                        width={cell}
                        height={cell}
                        rx={2.5}
                        fill={colorFor(d.count, d.inRange, d.future)}
                      >
                        {d.date && d.inRange && (
                          <title>{d.date.toDateString()}: {d.count} submission{d.count !== 1 ? "s" : ""}</title>
                        )}
                      </rect>
                    ))
                  )}
                </svg>
                <span className={`mt-2 text-[10px] tracking-wide ${m.isCurrent ? "text-primary font-bold uppercase" : "text-muted-foreground font-medium"}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0.25, 0.4, 0.55, 0.7, 0.85].map((a) => (
          <span key={a} className="w-2.5 h-2.5 rounded-sm" style={{ background: `hsl(142 70% 45% / ${a})` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

const RANKS = ["Recruit", "Cadet", "Sergeant", "Commander"];
const RANK_IMGS: Record<string, string> = {
  Recruit: badgeRecruit,
  Cadet: badgeCadet,
  Sergeant: badgeSergeant,
  Commander: badgeCommander,
};

export const HomeStatsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const goal = getCachedGoal();
  const isNEET = goal === "NEET";
  const SUBJECT_DEFS = isNEET ? NEET_SUBJECTS : JEE_SUBJECTS;

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const qTable = (isNEET ? "neet_questions" : "questions") as "neet_questions" | "questions";
      const { data: { user } } = await supabase.auth.getUser();

      const { data: questions } = await supabase.from(qTable).select("id, subject");
      const totals: Record<string, number> = {};
      SUBJECT_DEFS.forEach((d) => (totals[d.key] = 0));
      questions?.forEach((q: any) => {
        if (q.subject && totals.hasOwnProperty(q.subject)) totals[q.subject]++;
      });
      const totalQuestions = Object.values(totals).reduce((a, b) => a + b, 0);

      const baseSubjects = SUBJECT_DEFS.map((def) => ({ def, s: { solved: 0, total: totals[def.key] } }));

      if (!user) {
        setStats({
          combatName: "Guest", rank: 0, totalUsers: 0,
          subjects: baseSubjects, totalSolved: 0, totalQuestions,
          thisWeek: 0, streak: 0, submissionsByDate: new Map(),
        });
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users").select("combat_name, full_name").eq("id", user.id).maybeSingle();

      const { data: subs } = await supabase
        .from("submissions").select("question_id, submitted_at").eq("user_id", user.id);

      const uniqueQids = [...new Set(subs?.map((s) => s.question_id).filter(Boolean) ?? [])] as number[];
      const subjectSolved: Record<string, number> = {};
      SUBJECT_DEFS.forEach((d) => (subjectSolved[d.key] = 0));
      if (uniqueQids.length > 0) {
        const { data: solvedQs } = await supabase.from(qTable).select("id, subject").in("id", uniqueQids);
        solvedQs?.forEach((q: any) => {
          if (q.subject && subjectSolved.hasOwnProperty(q.subject)) subjectSolved[q.subject]++;
        });
      }
      const totalSolved = Object.values(subjectSolved).reduce((a, b) => a + b, 0);

      const subsByDate = new Map<string, number>();
      subs?.forEach((s) => {
        if (!s.submitted_at) return;
        const d = new Date(s.submitted_at).toISOString().split("T")[0];
        subsByDate.set(d, (subsByDate.get(d) ?? 0) + 1);
      });

      // This week (last 7 days)
      let thisWeek = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        thisWeek += subsByDate.get(d.toISOString().split("T")[0]) ?? 0;
      }
      // Streak (consecutive days back from today with submissions)
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if ((subsByDate.get(d.toISOString().split("T")[0]) ?? 0) > 0) streak++;
        else if (i > 0) break;
      }

      // Rank (approximate)
      const { count: totalUsers } = await supabase
        .from("users").select("id", { count: "exact", head: true });
      const { data: allSubs } = await supabase.from("submissions").select("user_id, question_id");
      const perUser = new Map<string, Set<number>>();
      allSubs?.forEach((s) => {
        if (!s.user_id || !s.question_id) return;
        if (!perUser.has(s.user_id)) perUser.set(s.user_id, new Set());
        perUser.get(s.user_id)!.add(s.question_id);
      });
      let higher = 0;
      perUser.forEach((set, uid) => { if (uid !== user.id && set.size > totalSolved) higher++; });
      const rank = higher + 1;

      const merged = SUBJECT_DEFS.map((def) => ({
        def, s: { solved: subjectSolved[def.key], total: totals[def.key] },
      }));

      setStats({
        combatName: profile?.combat_name || profile?.full_name || user.email?.split("@")[0] || "User",
        rank, totalUsers: totalUsers ?? 0,
        subjects: merged, totalSolved, totalQuestions,
        thisWeek, streak, submissionsByDate: subsByDate,
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
          <div className="rounded-2xl bg-card/60 border border-border/50 h-72 animate-pulse" />
        </div>
      </section>
    );
  }

  const badge = getBadge(stats.totalSolved);
  const nextBadge = BADGES.find((b) => b.min > stats.totalSolved);
  const toNext = nextBadge ? nextBadge.min - stats.totalSolved : 0;
  const nextProgress = nextBadge
    ? Math.max(0, Math.min(100, ((stats.totalSolved - badge.min) / (nextBadge.min - badge.min)) * 100))
    : 100;
  const percentile = stats.totalUsers > 0
    ? Math.max(1, Math.round((stats.rank / stats.totalUsers) * 100))
    : null;
  const badgesUnlocked = BADGES.filter((b) => stats.totalSolved >= b.min).length;

  return (
    <section className="px-3 sm:px-4 py-6 sm:py-8">
      <div className="container mx-auto space-y-4">

        {/* ===================== HERO CARD ===================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-black via-[#0a0000] to-black shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.5)] p-4 sm:p-5"
        >
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-crimson/20 blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-12 gap-3 items-center">
            {/* Left column: tagline + next badge */}
            <div className="col-span-12 md:col-span-3 order-2 md:order-1 space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-white/80 font-semibold">Keep Going, Champion! 💪</p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  Your Journey<br /><span className="text-primary">Matters.</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-white/60 mt-1 leading-snug">
                  Consistency today,<br />Success tomorrow.
                </p>
              </div>

              {nextBadge && (
                <div className="rounded-xl border border-primary/30 bg-black/40 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-primary font-bold">Next Badge</p>
                      <p className="text-sm sm:text-base font-extrabold text-white leading-tight">{nextBadge.name}</p>
                    </div>
                    <img src={nextBadge.img} alt={nextBadge.name} className="w-9 h-9 opacity-90 drop-shadow-[0_0_10px_hsl(var(--primary)/0.4)]" />
                  </div>
                  <p className="text-[10px] text-white/60 mt-1.5 mb-2">{toNext} more questions to unlock</p>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      style={{ width: `${nextProgress}%` }} />
                  </div>
                  <p className="text-right text-[10px] text-white/60 mt-1">{Math.round(nextProgress)}%</p>
                </div>
              )}
            </div>

            {/* Center: big multi-arc ring */}
            <div className="col-span-12 md:col-span-6 order-1 md:order-2 flex justify-center">
              <MultiArc
                subjects={stats.subjects}
                totalSolved={stats.totalSolved}
                totalQuestions={stats.totalQuestions}
                badgeImg={badge.img}
                badgeName={badge.name}
                size={280}
              />
            </div>

            {/* Right column: rank only */}
            <div className="col-span-12 md:col-span-3 order-3 space-y-2">
              <div className="rounded-xl border border-primary/30 bg-black/40 p-3">
                <p className="text-[9px] uppercase tracking-widest text-primary font-bold">Rank</p>
                <p className="text-2xl font-extrabold text-white leading-none">#{stats.rank}</p>
                {percentile !== null && (
                  <>
                    <p className="text-[10px] uppercase tracking-wider text-white/60 mt-1.5">Percentile</p>
                    <p className="text-base font-bold text-violet-400">TOP {percentile}%</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===================== SUBJECT PROGRESS + SHARE ===================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Subject progress */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm uppercase tracking-widest font-bold text-white">Subject Progress</h3>
            </div>
            <div className={`grid gap-2.5 ${isNEET ? "grid-cols-2" : "grid-cols-3"}`}>
              {stats.subjects.map((row) => {
                const pct = row.s.total > 0 ? (row.s.solved / row.s.total) * 100 : 0;
                const { Icon } = row.def;
                return (
                  <div key={row.def.key} className="rounded-xl bg-black/40 border border-border/60 p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5" style={{ color: row.def.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: row.def.color }}>
                        {row.def.short}
                      </span>
                    </div>
                    <p className="text-base font-extrabold text-white">
                      {row.s.solved}<span className="text-white/40 text-xs font-normal">/{row.s.total}</span>
                    </p>
                    <div className="h-1 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: row.def.color }} />
                    </div>
                    <p className="text-[10px] mt-1 font-semibold" style={{ color: row.def.color }}>
                      {pct.toFixed(pct < 10 && pct > 0 ? 2 : 0)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discipline banner card */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 flex flex-col">
            <div className="relative rounded-xl overflow-hidden border border-primary/30 mb-3 flex-1">
              <img
                src={disciplineBanner}
                alt="Discipline today, Domination tomorrow — Prepixo"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => { /* intentional no-op */ }}
              className="relative w-full rounded-xl bg-gradient-to-r from-primary via-orange-500 to-amber-400 text-white font-extrabold py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-primary/40 active:scale-95 transition-transform overflow-hidden ring-1 ring-white/20"
            >
              <span className="absolute inset-0 bg-primary/30 blur-xl -z-10 animate-pulse" />
              <Share2 className="w-4 h-4 relative" />
              <span className="relative text-sm sm:text-base">Take screenshot and share with your friends</span>
            </button>
          </div>
        </div>

        {/* Heatmap (kept as-is) */}
        <div>
          <SubmissionsHeatmap submissionsByDate={stats.submissionsByDate} />
        </div>
      </div>
    </section>
  );
};

const StatRow = ({ Icon, label, value, color }: { Icon: any; label: string; value: any; color: string }) => (
  <div className="rounded-xl border border-border/60 bg-black/40 px-3 py-2 flex items-center gap-2.5">
    <Icon className={`w-4 h-4 ${color}`} />
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-white/60 leading-none">{label}</p>
      <p className={`text-sm font-extrabold ${color} leading-tight mt-0.5`}>{value}</p>
    </div>
  </div>
);

export default HomeStatsDashboard;
