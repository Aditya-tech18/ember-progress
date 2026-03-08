import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const MonthSelector = ({ selectedMonth, onMonthChange }: MonthSelectorProps) => {
  const currentMonth = selectedMonth.getMonth();
  const currentYear = selectedMonth.getFullYear();
  const today = new Date();
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const handlePrevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(monthIndex);
    onMonthChange(newDate);
  };

  const handleGoToToday = () => {
    onMonthChange(new Date());
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm rounded-2xl p-5 border border-border shadow-lg"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Title with Icon */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Habit Tracker</h2>
            <p className="text-xs text-muted-foreground">Track your daily progress</p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-10 w-10 rounded-xl hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Month/Year Display */}
          <motion.div 
            key={`${currentMonth}-${currentYear}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-6 py-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl border border-primary/20 min-w-[180px] text-center"
          >
            <p className="text-lg font-bold text-foreground">{MONTHS[currentMonth]}</p>
            <p className="text-xs text-muted-foreground">{currentYear}</p>
          </motion.div>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-10 w-10 rounded-xl hover:bg-muted/80 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Go to Today Button */}
          {!isCurrentMonth && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToToday}
                className="gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
              >
                <Sparkles className="h-4 w-4" />
                Today
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Month Navigation - Pill Buttons */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {SHORT_MONTHS.map((month, index) => {
          const isSelected = index === currentMonth;
          const isToday = index === today.getMonth() && currentYear === today.getFullYear();
          
          return (
            <motion.button
              key={month}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMonthClick(index)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : isToday
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {month}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
