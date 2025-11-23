import { Card } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/api/analytics.api";

interface MarketDemandChartProps {
  productId?: string;
}

export const MarketDemandChart = ({ productId }: MarketDemandChartProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['marketForecasts', productId],
    queryFn: () => analyticsApi.getMarketForecasts(productId),
    enabled: true,
  });

  const forecasts = data?.data.forecasts || [];

  // Transform data for chart
  const demandData = forecasts.map((forecast) => ({
    market: forecast.country.substring(0, 10), // Shorten for display
    fullMarket: `${forecast.city || ''}, ${forecast.country}`.trim(),
    demand: forecast.demand,
    competition: forecast.competition,
    price: forecast.price,
    growth: forecast.growth,
  }));

  if (isLoading) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Global Market Analysis</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Loading market forecasts...
          </p>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Card>
    );
  }

  if (demandData.length === 0) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Global Market Analysis</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No market forecasts available. Upload a product to generate forecasts.
          </p>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </Card>
    );
  }
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
            tickFormatter={(value, index) => demandData[index]?.fullMarket || value}
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
