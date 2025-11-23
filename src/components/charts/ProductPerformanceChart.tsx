import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/api/analytics.api";
import { Loader2 } from "lucide-react";

export const ProductPerformanceChart = () => {
  // API CALL FROZEN - Commented out temporarily
  // const { data, isLoading } = useQuery({
  //   queryKey: ['product-performance'],
  //   queryFn: () => analyticsApi.getProductPerformance(),
  // });

  // const productData = data?.data?.performance?.map(p => ({
  //   product: p.product.length > 15 ? p.product.substring(0, 15) + '...' : p.product,
  //   sales: p.sales,
  //   revenue: p.revenue,
  //   margin: p.margin,
  // })) || [];
  
  const isLoading = false;
  const productData: any[] = [];

  // Chart will be populated after marketing campaigns are launched
  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Product Performance</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Performance metrics will appear here after launching marketing campaigns
        </p>
      </div>
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Chart will be available after marketing campaigns are active</p>
      </div>
    </Card>
  );
};
