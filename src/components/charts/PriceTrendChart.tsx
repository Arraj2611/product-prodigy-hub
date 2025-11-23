import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/api/analytics.api";
import { useMemo } from "react";

interface PriceTrendChartProps {
  productId?: string;
}

export const PriceTrendChart = ({ productId }: PriceTrendChartProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['priceForecasts', productId],
    queryFn: () => analyticsApi.getPriceForecasts(productId),
    enabled: true,
  });

  const forecasts = data?.data.forecasts || {};

  // Transform data for chart - group by week
  const priceData = useMemo(() => {
    const materials = Object.keys(forecasts);
    if (materials.length === 0) return [];

    // Get all weeks from all materials
    const allWeeks = materials.flatMap(m => forecasts[m].map(f => f.week));
    if (allWeeks.length === 0) return [];

    // Get max weeks
    const maxWeeks = Math.max(...allWeeks);

    // Build data array
    const result: Array<Record<string, any>> = [];
    for (let week = 1; week <= maxWeeks; week++) {
      const weekData: Record<string, any> = { week: `W${week}` };
      materials.forEach(material => {
        const forecast = forecasts[material].find(f => f.week === week);
        if (forecast) {
          // Use short material name as key (first word, lowercase)
          const shortName = material.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '');
          weekData[shortName] = Number(forecast.price);
        }
      });
      result.push(weekData);
    }
    return result;
  }, [forecasts]);

  // Get material names for legend
  const materialNames = Object.keys(forecasts);
  const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  if (isLoading) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Material Price Trends</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Loading price forecasts...
          </p>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Card>
    );
  }

  if (priceData.length === 0) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Material Price Trends</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No price forecasts available. Upload a product to generate forecasts.
          </p>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </Card>
    );
  }
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
          {materialNames.slice(0, 4).map((material, index) => {
            const shortName = material.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '');
            const color = colors[index % colors.length];
            const firstForecast = forecasts[material]?.[0];
            return (
              <Line
                key={material}
                type="monotone"
                dataKey={shortName}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                name={`${material}${firstForecast ? ' ($/unit)' : ''}`}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
