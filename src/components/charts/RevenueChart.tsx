import { Card } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/api/analytics.api";
import { productApi } from "@/services/api/product.api";
import { Loader2 } from "lucide-react";

export const RevenueChart = () => {
  // Get first product for revenue projection
  // const { data: productsData } = useQuery({
  //   queryKey: ['products'],
  //   queryFn: () => productApi.getProducts(),
  // });

  // const firstProduct = productsData?.data?.products?.[0];

  // API CALL FROZEN - Commented out temporarily
  // const { data: revenueData, isLoading } = useQuery({
  //   queryKey: ['revenue-projection', firstProduct?.id],
  //   queryFn: () => analyticsApi.getRevenueProjection(firstProduct!.id),
  //   enabled: !!firstProduct?.id,
  // });

  // const chartData = revenueData?.data?.projections?.map(p => ({
  //   month: p.month.substring(0, 3), // Short month name
  //   revenue: p.revenue,
  //   cost: p.cost,
  //   profit: p.profit,
  // })) || [];
  
  const isLoading = false;
  const chartData: any[] = [];

  // Chart will be populated after marketing campaigns are launched
  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Revenue Overview</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Revenue data will appear here after launching marketing campaigns
        </p>
      </div>
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Chart will be available after marketing campaigns are active</p>
      </div>
    </Card>
  );
};
