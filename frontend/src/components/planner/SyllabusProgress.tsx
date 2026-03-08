import { useMemo } from "react";
import { motion } from "framer-motion";
import { SyllabusMastery } from "@/hooks/usePlanner";

interface SyllabusProgressProps {
  syllabusMastery: SyllabusMastery[];
}

const subjects = [
  { name: "Physics", color: "from-blue-500 to-blue-600", bg: "bg-blue-500", total: 30 },
  { name: "Chemistry", color: "from-green-500 to-green-600", bg: "bg-green-500", total: 30 },
  { name: "Mathematics", color: "from-red-500 to-red-600", bg: "bg-red-500", total: 35 },
];

export const SyllabusProgress = ({ syllabusMastery }: SyllabusProgressProps) => {
  const progressData = useMemo(() => {
    return subjects.map((subject) => {
      const subjectMastery = syllabusMastery.filter((s) => s.subject === subject.name);
      const masteredCount = subjectMastery.filter((s) => s.mastery_status === "mastered").length;
      const strongCount = subjectMastery.filter((s) => s.mastery_status === "strong").length;
      const progress = ((masteredCount + strongCount * 0.5) / subject.total) * 100;

      return {
        ...subject,
        mastered: masteredCount,
        strong: strongCount,
        progress: Math.min(progress, 100),
      };
    });
  }, [syllabusMastery]);

  const RadialProgress = ({ subject }: { subject: typeof progressData[0] }) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (subject.progress / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted/30"
            />
            <motion.circle
              cx="56"
              cy="56"
              r="45"
              stroke={`url(#${subject.name}Gradient)`}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id={`${subject.name}Gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className={subject.name === "Physics" ? "text-blue-400" : subject.name === "Chemistry" ? "text-green-400" : "text-red-400"} stopColor="currentColor" />
                <stop offset="100%" className={subject.name === "Physics" ? "text-blue-600" : subject.name === "Chemistry" ? "text-green-600" : "text-red-600"} stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{Math.round(subject.progress)}%</span>
          </div>
        </div>
        <div className="mt-2 text-center">
          <p className="font-semibold">{subject.name}</p>
          <p className="text-xs text-muted-foreground">
            {subject.mastered}/{subject.total} Mastered
          </p>
        </div>
      </div>
    );
  };

  // Calculate subject balance
  const totalMastered = progressData.reduce((acc, s) => acc + s.mastered, 0);
  const subjectBalance = progressData.map((s) => ({
    name: s.name,
    percentage: totalMastered > 0 ? (s.mastered / totalMastered) * 100 : 33.33,
  }));

  const isImbalanced = subjectBalance.some((s) => s.percentage > 60 || s.percentage < 15);

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-semibold mb-6">Syllabus Mastery</h3>

      {/* Radial Progress Bars */}
      <div className="flex justify-around mb-6">
        {progressData.map((subject) => (
          <RadialProgress key={subject.name} subject={subject} />
        ))}
      </div>

      {/* Subject Balance Warning */}
      {isImbalanced && (
        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30 flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-yellow-400">Subject Imbalance Detected</p>
            <p className="text-xs text-muted-foreground">
              Focus more on weaker subjects for balanced preparation.
            </p>
          </div>
        </div>
      )}

      {/* Balance Pie Visualization */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-sm text-muted-foreground mb-2">Study Time Distribution</p>
        <div className="flex h-3 rounded-full overflow-hidden">
          {subjectBalance.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ width: 0 }}
              animate={{ width: `${s.percentage}%` }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`${
                s.name === "Physics"
                  ? "bg-blue-500"
                  : s.name === "Chemistry"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {subjectBalance.map((s) => (
            <span key={s.name}>
              {s.name}: {Math.round(s.percentage)}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
