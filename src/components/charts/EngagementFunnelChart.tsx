import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Users, MousePointerClick, ShoppingCart, DollarSign } from "lucide-react";

const funnelData = [
  {
    stage: "Impressions",
    value: 310000,
    percentage: 100,
    icon: Users,
    color: "bg-primary/20 text-primary"
  },
  {
    stage: "Clicks",
    value: 24800,
    percentage: 8.0,
    icon: MousePointerClick,
    color: "bg-primary/30 text-primary"
  },
  {
    stage: "Engagement",
    value: 16740,
    percentage: 5.4,
    icon: TrendingDown,
    color: "bg-primary/40 text-primary"
  },
  {
    stage: "Add to Cart",
    value: 3410,
    percentage: 1.1,
    icon: ShoppingCart,
    color: "bg-primary/60 text-primary"
  },
  {
    stage: "Conversions",
    value: 479,
    percentage: 0.15,
    icon: DollarSign,
    color: "bg-primary text-primary-foreground"
  }
];

export const EngagementFunnelChart = () => {
  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Marketing Funnel</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customer journey from impression to conversion
        </p>
      </div>
      <div className="space-y-4">
        {funnelData.map((stage, index) => (
          <div key={index} className="relative">
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-10 h-10 rounded-lg ${stage.color} flex items-center justify-center flex-shrink-0`}>
                <stage.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stage.value.toLocaleString()}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {stage.percentage}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full h-8 bg-muted rounded-lg overflow-hidden">
                  <div 
                    className={`h-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${stage.percentage * 10}%` }}
                  />
                </div>
              </div>
            </div>
            {index < funnelData.length - 1 && (
              <div className="ml-5 h-4 w-0.5 bg-border" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall Conversion Rate</span>
          <span className="font-bold text-lg text-primary">0.15%</span>
        </div>
      </div>
    </Card>
  );
};
