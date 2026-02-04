import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MonthlyAreaChartProps {
  dailyStats: { date: string; completed: number; total: number }[];
  selectedMonth: Date;
}

export const MonthlyAreaChart = ({ dailyStats, selectedMonth }: MonthlyAreaChartProps) => {
  const chartData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const data: { day: number; percentage: number; completed: number; total: number }[] = [];
    
    for (let i = 1; i <= numDays; i++) {
      const date = new Date(year, month, i).toISOString().split("T")[0];
      const stat = dailyStats.find((s) => s.date === date);
      
      const completed = stat?.completed || 0;
      const total = stat?.total || 1;
      const percentage = total > 0 ? (completed / total) * 100 : 0;
      
      data.push({
        day: i,
        percentage,
        completed,
        total,
      });
    }
    
    return data;
  }, [dailyStats, selectedMonth]);

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-semibold mb-4">Daily Task Completion Trend</h3>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="day"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number, name: string) => {
                if (name === "percentage") return [`${Math.round(value)}%`, "Completion"];
                return [value, name];
              }}
              labelFormatter={(day) => `Day ${day}`}
            />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#monthlyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
