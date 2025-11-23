import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Users, MousePointerClick, ShoppingCart, DollarSign, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { marketingApi } from "@/services/api/marketing.api";
import { productApi } from "@/services/api/product.api";

export const EngagementFunnelChart = () => {
  // Get first product for campaigns
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getProducts(),
  });

  const firstProduct = productsData?.data?.products?.[0];

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['marketing-campaigns', firstProduct?.id],
    queryFn: () => marketingApi.getCampaigns(firstProduct!.id),
    enabled: !!firstProduct?.id,
  });

  const campaigns = campaignsData?.data?.campaigns || [];

  // Calculate funnel metrics from campaigns
  const calculateFunnelData = () => {
    if (campaigns.length === 0) return [];

    // Aggregate all campaigns
    let totalReach = 0;
    let totalClicks = 0;
    let totalEngagement = 0;
    let totalAddToCart = 0;
    let totalConversions = 0;

    campaigns.forEach(campaign => {
      // Parse reach (e.g., "50K" -> 50000)
      const reachStr = campaign.reach.replace(/[Kk]/g, '000').replace(/[Mm]/g, '000000');
      const reach = parseFloat(reachStr.replace(/[^0-9.]/g, '')) || 0;
      totalReach += reach;

      // Estimate clicks (typically 2-5% CTR)
      const clicks = Math.round(reach * 0.03); // 3% CTR
      totalClicks += clicks;

      // Parse engagement rate
      const engagementRate = parseFloat(campaign.engagement.replace('%', '')) || 0;
      const engagement = Math.round(reach * (engagementRate / 100));
      totalEngagement += engagement;

      // Estimate add to cart (typically 20% of engaged users)
      const addToCart = Math.round(engagement * 0.2);
      totalAddToCart += addToCart;

      // Estimate conversions (typically 10% of add to cart)
      const conversions = Math.round(addToCart * 0.1);
      totalConversions += conversions;
    });

    if (totalReach === 0) return [];

    return [
      {
        stage: "Impressions",
        value: totalReach,
        percentage: 100,
        icon: Users,
        color: "bg-primary/20 text-primary"
      },
      {
        stage: "Clicks",
        value: totalClicks,
        percentage: (totalClicks / totalReach) * 100,
        icon: MousePointerClick,
        color: "bg-primary/30 text-primary"
      },
      {
        stage: "Engagement",
        value: totalEngagement,
        percentage: (totalEngagement / totalReach) * 100,
        icon: TrendingDown,
        color: "bg-primary/40 text-primary"
      },
      {
        stage: "Add to Cart",
        value: totalAddToCart,
        percentage: (totalAddToCart / totalReach) * 100,
        icon: ShoppingCart,
        color: "bg-primary/60 text-primary"
      },
      {
        stage: "Conversions",
        value: totalConversions,
        percentage: (totalConversions / totalReach) * 100,
        icon: DollarSign,
        color: "bg-primary text-primary-foreground"
      }
    ];
  };

  const funnelData = calculateFunnelData();
  const conversionRate = funnelData.length > 0 
    ? ((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(2)
    : "0.00";

  if (isLoading) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Marketing Funnel</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Loading funnel data...
          </p>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (funnelData.length === 0) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Marketing Funnel</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No campaign data available. Generate campaigns to see funnel metrics.
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
          <span className="font-bold text-lg text-primary">{conversionRate}%</span>
        </div>
      </div>
    </Card>
  );
};
