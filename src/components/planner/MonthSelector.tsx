import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = [2024, 2025, 2026, 2027];

export const MonthSelector = ({ selectedMonth, onMonthChange }: MonthSelectorProps) => {
  const currentMonth = selectedMonth.getMonth();
  const currentYear = selectedMonth.getFullYear();

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

  const handleMonthSelect = (month: string) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(MONTHS.indexOf(month));
    onMonthChange(newDate);
  };

  const handleYearSelect = (year: string) => {
    const newDate = new Date(selectedMonth);
    newDate.setFullYear(parseInt(year));
    onMonthChange(newDate);
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">HABIT TRACKER</h2>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">YEAR</div>
            <Select value={currentYear.toString()} onValueChange={handleYearSelect}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-xs text-muted-foreground ml-2">MONTH</div>
            <Select value={MONTHS[currentMonth]} onValueChange={handleMonthSelect}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Current month display */}
      <div className="mt-2 text-center">
        <span className="text-sm text-muted-foreground">
          - {MONTHS[currentMonth].toUpperCase()} {currentYear} -
        </span>
      </div>
    </div>
  );
};
