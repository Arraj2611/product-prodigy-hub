import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const priceData = [
  { week: "W1", cotton: 8.2, denim: 8.5, hardware: 0.15, labor: 12.5 },
  { week: "W2", cotton: 8.3, denim: 8.6, hardware: 0.15, labor: 12.5 },
  { week: "W3", cotton: 8.1, denim: 8.4, hardware: 0.16, labor: 12.8 },
  { week: "W4", cotton: 8.4, denim: 8.7, hardware: 0.16, labor: 13.0 },
  { week: "W5", cotton: 8.5, denim: 8.8, hardware: 0.15, labor: 13.2 },
  { week: "W6", cotton: 8.3, denim: 8.5, hardware: 0.15, labor: 13.0 },
  { week: "W7", cotton: 8.2, denim: 8.4, hardware: 0.14, labor: 12.8 },
  { week: "W8", cotton: 8.4, denim: 8.6, hardware: 0.15, labor: 13.1 },
];

export const PriceTrendChart = () => {
  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Material Price Trends</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time commodity pricing over the last 8 weeks
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={priceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="week" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            formatter={(value: number) => `$${value.toFixed(2)}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="denim" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            name="Denim ($/m)"
          />
          <Line 
            type="monotone" 
            dataKey="cotton" 
            stroke="hsl(var(--success))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--success))', r: 4 }}
            name="Cotton ($/m)"
          />
          <Line 
            type="monotone" 
            dataKey="labor" 
            stroke="hsl(var(--warning))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--warning))', r: 4 }}
            name="Labor ($/hr)"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
