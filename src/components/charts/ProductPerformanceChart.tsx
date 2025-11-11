import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const productData = [
  { product: "Denim Jacket", sales: 234, revenue: 43290, margin: 65 },
  { product: "Cotton T-Shirt", sales: 456, revenue: 18240, margin: 58 },
  { product: "Sneakers", sales: 189, revenue: 28350, margin: 72 },
  { product: "Hoodie", sales: 312, revenue: 24960, margin: 61 },
  { product: "Chino Pants", sales: 278, revenue: 22240, margin: 54 },
];

export const ProductPerformanceChart = () => {
  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Product Performance</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Sales and revenue by product category
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={productData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="product" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '11px' }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
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
          <Bar 
            dataKey="sales" 
            fill="hsl(var(--primary))" 
            radius={[8, 8, 0, 0]}
            name="Units Sold"
          />
          <Bar 
            dataKey="margin" 
            fill="hsl(var(--success))" 
            radius={[8, 8, 0, 0]}
            name="Margin %"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
