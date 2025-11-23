import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { marketingApi } from "@/services/api/marketing.api";
import { productApi } from "@/services/api/product.api";
import { Loader2 } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(217 91% 70%)",
  "hsl(var(--accent-foreground))"
];

export const CampaignROIChart = () => {
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

  // Transform campaign data for chart
  const roiData = campaigns.map(campaign => {
    // Parse ROI percentage (e.g., "320%" -> 320)
    const roi = parseFloat(campaign.roi.replace('%', '')) || 0;
    // Parse budget (e.g., "$5,000" -> 5000)
    const spent = parseFloat(campaign.budget.replace(/[$,]/g, '')) || 0;
    // Parse reach (e.g., "50K" -> 50000)
    const reachStr = campaign.reach.replace(/[Kk]/g, '000').replace(/[Mm]/g, '000000');
    const reach = parseFloat(reachStr.replace(/[^0-9.]/g, '')) || 0;
    // Estimate conversions from engagement rate
    const engagementRate = parseFloat(campaign.engagement.replace('%', '')) || 0;
    const conversions = Math.round(reach * (engagementRate / 100) * 0.1); // 10% of engaged users convert
    
    return {
      platform: campaign.platform,
      roi,
      spent,
      conversions,
    };
  });

  if (isLoading) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Campaign ROI Analysis</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Loading ROI data...
          </p>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (roiData.length === 0) {
    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
        <div className="mb-6">
          <h3 className="text-xl font-bold">Campaign ROI Analysis</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No campaign data available. Generate campaigns to see ROI analysis.
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
