import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface ConsistencyHeatmapProps {
  tasks: any[];
  startDate?: Date;
}

const getISTDate = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (5.5 * 60 * 60 * 1000));
};

export const ConsistencyHeatmap = ({ tasks, startDate }: ConsistencyHeatmapProps) => {
  const today = getISTDate();
  
  // Generate last 12 months of data
  const heatmapData = useMemo(() => {
    const months: any[] = [];
    const currentDate = startDate || new Date(today.getFullYear(), today.getMonth() - 11, 1);
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentDate);
      monthDate.setMonth(currentDate.getMonth() + i);
      
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const weeks: any[][] = [];
      let currentWeek: any[] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Calculate completion percentage for this day
        const dayTasks = tasks.filter(t => t.due_date === dateStr);
        const completedTasks = dayTasks.filter(t => t.status === 'completed');
        const percentage = dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0;
        
        currentWeek.push({
          date: dateStr,
          day,
          percentage,
          count: dayTasks.length,
          completed: completedTasks.length
        });
        
        if (date.getDay() === 6 || day === daysInMonth) {
          weeks.push([...currentWeek]);
          currentWeek = [];
        }
      }
      
      months.push({
        name: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        year: monthDate.getFullYear(),
        weeks
      });
    }
    
    return months;
  }, [tasks, today]);

  const getColor = (percentage: number) => {
    if (percentage === 0) return 'bg-[#1a1a1a]';
    if (percentage < 25) return 'bg-[#E50914]/20';
    if (percentage < 50) return 'bg-[#E50914]/40';
    if (percentage < 75) return 'bg-[#E50914]/60';
    if (percentage < 100) return 'bg-[#E50914]/80';
    return 'bg-[#E50914]';
  };

  // Calculate current streak
  const streak = useMemo(() => {
    let count = 0;
    const sortedDates = [...new Set(tasks.map(t => t.due_date))].sort().reverse();
    
    for (const date of sortedDates) {
      const dayTasks = tasks.filter(t => t.due_date === date);
      const completed = dayTasks.filter(t => t.status === 'completed');
      
      if (dayTasks.length > 0 && completed.length === dayTasks.length) {
        count++;
      } else {
        break;
      }
    }
    
    return count;
  }, [tasks]);

  return (
    <div className="bg-[#111111] rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#E50914]" />
            Consistency Heatmap
          </h3>
          <p className="text-sm text-gray-400 mt-1">Your daily completion journey</p>
        </div>
        <div className="bg-[#E50914]/10 border border-[#E50914]/30 rounded-xl px-4 py-2">
          <div className="text-2xl font-black text-[#E50914]">{streak}d</div>
          <div className="text-xs text-gray-400">Current Streak</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-6">
          {heatmapData.map((month, monthIdx) => (
            <motion.div
              key={monthIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: monthIdx * 0.05 }}
              className="flex flex-col gap-2"
            >
              <div className="text-sm font-semibold text-gray-400 mb-1">
                {month.name}
              </div>
              <div className="grid gap-1">
                {month.weeks.map((week: any[], weekIdx: number) => (
                  <div key={weekIdx} className="flex gap-1">
                    {week.map((day: any) => (
                      <div
                        key={day.date}
                        className={`w-3 h-3 rounded-sm ${getColor(day.percentage)} transition-colors cursor-pointer hover:ring-2 hover:ring-[#E50914]`}
                        title={`${day.date}: ${day.completed}/${day.count} tasks (${Math.round(day.percentage)}%)`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#1a1a1a]"></div>
          <div className="w-3 h-3 rounded-sm bg-[#E50914]/20"></div>
          <div className="w-3 h-3 rounded-sm bg-[#E50914]/40"></div>
          <div className="w-3 h-3 rounded-sm bg-[#E50914]/60"></div>
          <div className="w-3 h-3 rounded-sm bg-[#E50914]/80"></div>
          <div className="w-3 h-3 rounded-sm bg-[#E50914]"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};