import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, TrendingDown, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/api/analytics.api";

interface MarketForecastsListProps {
  productId: string;
}

export function MarketForecastsList({ productId }: MarketForecastsListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['marketForecasts', productId],
    queryFn: () => analyticsApi.getMarketForecasts(productId),
  });

  const forecasts = data?.data.forecasts || [];

  if (isLoading) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <p className="text-muted-foreground">Loading market forecasts...</p>
      </Card>
    );
  }

  if (forecasts.length === 0) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur text-center">
        <div className="space-y-2">
          <p className="text-muted-foreground">
            No market forecasts available yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Market analysis will identify the best regions to sell your product based on demand, competition, and pricing opportunities.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Optimal Selling Markets</h2>
        <p className="text-sm text-muted-foreground">
          {forecasts.length} {forecasts.length === 1 ? 'market' : 'markets'}
        </p>
        <div className="h-px bg-border/50 mt-2"></div>
      </div>

      <div className="space-y-4">
        {forecasts.map((market) => (
          <Card key={market.id} className="p-6 border-border/50 bg-muted/20 backdrop-blur hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-6">
              {/* Left side - Market details */}
              <div className="flex-1 space-y-3">
                {/* Row 1: Market name and location */}
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <h3 className="font-bold text-lg leading-tight text-foreground">
                    {market.city ? `${market.city}, ` : ''}{market.country}
                  </h3>
                </div>
                
                {/* Row 2: Market details */}
                {market.marketSize && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Market Size: {market.marketSize}
                  </p>
                )}
                
                {/* Row 3: Metrics */}
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge
                      variant={market.demand >= 85 ? "default" : market.demand >= 70 ? "secondary" : "outline"}
                      className="font-semibold"
                    >
                      {market.demand >= 85 ? "Very High" : market.demand >= 70 ? "High" : market.demand >= 50 ? "Medium" : "Low"} Demand
                    </Badge>
                  </div>
                  
                  {market.avgPrice && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Avg Price: <span className="font-semibold text-success">{market.avgPrice}</span></span>
                    </div>
                  )}
                  
                  {market.growthPercent && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {market.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-success" />
                      ) : market.trend === "down" ? (
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      ) : (
                        <Package className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span>Growth: <span className="font-semibold">{market.growthPercent}</span></span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right side - Growth Score */}
              <div className="flex flex-col items-end justify-start flex-shrink-0">
                <p className="text-2xl font-bold text-primary">
                  {market.growth.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Growth Score</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

