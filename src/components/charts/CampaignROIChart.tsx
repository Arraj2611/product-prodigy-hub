import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

const roiData = [
  { platform: "Instagram", roi: 185, spent: 1840, conversions: 234 },
  { platform: "Facebook", roi: 142, spent: 1120, conversions: 156 },
  { platform: "Twitter", roi: 98, spent: 450, conversions: 89 },
  { platform: "TikTok", roi: 220, spent: 2100, conversions: 312 },
  { platform: "YouTube", roi: 165, spent: 1650, conversions: 198 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(217 91% 70%)",
  "hsl(var(--accent-foreground))"
];

export const CampaignROIChart = () => {
  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Campaign ROI Analysis</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Return on investment by marketing platform
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={roiData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="platform" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            formatter={(value: number, name: string) => {
              if (name === "ROI") return [`${value}%`, name];
              if (name === "Spent") return [`$${value}`, name];
              return [value, name];
            }}
          />
          <Legend />
          <Bar 
            dataKey="roi" 
            radius={[8, 8, 0, 0]}
            name="ROI %"
          >
            {roiData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
