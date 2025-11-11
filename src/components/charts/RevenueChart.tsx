import { Card } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const revenueData = [
  { month: "Jan", revenue: 45000, cost: 28000, profit: 17000 },
  { month: "Feb", revenue: 52000, cost: 31000, profit: 21000 },
  { month: "Mar", revenue: 48000, cost: 29000, profit: 19000 },
  { month: "Apr", revenue: 61000, cost: 35000, profit: 26000 },
  { month: "May", revenue: 72000, cost: 41000, profit: 31000 },
  { month: "Jun", revenue: 85000, cost: 46000, profit: 39000 },
  { month: "Jul", revenue: 95000, cost: 52000, profit: 43000 },
  { month: "Aug", revenue: 108000, cost: 58000, profit: 50000 },
];

export const RevenueChart = () => {
  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Revenue Overview</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Monthly revenue, cost, and profit trends
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={revenueData}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="hsl(var(--primary))" 
            fill="url(#colorRevenue)"
            strokeWidth={2}
            name="Revenue"
          />
          <Area 
            type="monotone" 
            dataKey="profit" 
            stroke="hsl(var(--success))" 
            fill="url(#colorProfit)"
            strokeWidth={2}
            name="Profit"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};
