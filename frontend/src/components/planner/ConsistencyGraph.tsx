import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { DailyAggregate } from "@/hooks/usePlanner";

interface ConsistencyGraphProps {
  dailyAggregates: DailyAggregate[];
}

export const ConsistencyGraph = ({ dailyAggregates }: ConsistencyGraphProps) => {
  const chartData = useMemo(() => {
    const today = new Date();
    const data: { date: string; label: string; completion: number; focus: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const aggregate = dailyAggregates.find((a) => a.date === dateStr);

      data.push({
        date: dateStr,
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        completion: aggregate?.completion_score || 0,
        focus: aggregate?.focus_minutes || 0,
      });
    }

    return data;
  }, [dailyAggregates]);

  const avgCompletion = useMemo(() => {
    const scores = chartData.filter((d) => d.completion > 0);
    return scores.length > 0 ? Math.round(scores.reduce((acc, d) => acc + d.completion, 0) / scores.length) : 0;
  }, [chartData]);

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">30-Day Consistency</h3>
          <p className="text-sm text-muted-foreground">Task Completion Trend</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">{avgCompletion}%</p>
          <p className="text-xs text-muted-foreground">Avg Completion</p>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
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
              formatter={(value: number) => [`${Math.round(value)}%`, "Completion"]}
            />
            <Area
              type="monotone"
              dataKey="completion"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#completionGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Success Correlation Indicator */}
      {avgCompletion >= 70 && (
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30 flex items-center gap-2">
          <span className="text-2xl">📈</span>
          <div>
            <p className="font-semibold text-primary">Success Correlation Detected!</p>
            <p className="text-xs text-muted-foreground">
              Your consistency is above 70%. Keep it up for best results!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
