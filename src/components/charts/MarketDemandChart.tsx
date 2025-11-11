import { Card } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts";

const demandData = [
  { market: "USA", demand: 92, competition: 78, price: 85, growth: 88 },
  { market: "UK", demand: 88, competition: 72, price: 80, growth: 92 },
  { market: "Japan", demand: 85, competition: 85, price: 95, growth: 75 },
  { market: "Germany", demand: 78, competition: 68, price: 72, growth: 70 },
  { market: "Australia", demand: 82, competition: 65, price: 78, growth: 85 },
  { market: "Canada", demand: 75, competition: 70, price: 76, growth: 72 },
];

export const MarketDemandChart = () => {
  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Global Market Analysis</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Multi-factor market scoring across key regions
        </p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={demandData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="market" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '11px' }}
          />
          <Radar 
            name="Demand Score" 
            dataKey="demand" 
            stroke="hsl(var(--primary))" 
            fill="hsl(var(--primary))" 
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar 
            name="Growth Potential" 
            dataKey="growth" 
            stroke="hsl(var(--success))" 
            fill="hsl(var(--success))" 
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
};
