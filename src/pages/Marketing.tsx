import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Target,
  Upload,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/services/api/product.api";
import { toast } from "sonner";

export default function Marketing() {
  const navigate = useNavigate();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getProducts(),
  });

  const products = productsData?.data?.products || [];
  const hasProducts = products.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Marketing Command Center
          </h1>
          <p className="text-muted-foreground">
            Launch and manage your marketing campaigns across all platforms
          </p>
        </div>

        {/* Begin Campaign Section */}
        <Card className="p-8 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Ready to Launch?</h2>
              <p className="text-muted-foreground">
                {hasProducts 
                  ? "Add a product to start your marketing campaign and integrate with sales funnel"
                  : "Upload a product first, then add it here to begin marketing"}
              </p>
            </div>
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => {
                if (hasProducts) {
                  // Show implementation in progress message
                  toast.info("Implementation in progress", {
                    description: "Marketing campaign feature is currently under development. Coming soon!",
                  });
                } else {
                  navigate("/upload");
                }
              }}
            >
              <Plus className="w-5 h-5" />
              Begin Campaign
            </Button>
          </div>
        </Card>


        {/* Empty State if no products */}
        {!hasProducts && (
          <Card className="p-12 text-center border-border/50 bg-card/50 backdrop-blur">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Products Available</h3>
            <p className="text-muted-foreground mb-6">
              Upload a product first, then come back here to start your marketing campaign.
            </p>
            <Button onClick={() => navigate("/upload")} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Product
            </Button>
          </Card>
        )}

        {/* Info Card */}
        <Card className="p-6 border-border/50 bg-muted/30 backdrop-blur">
          <div className="space-y-2">
            <h3 className="font-semibold">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              Social media integration and sales funnel automation will be available soon. 
              This is your command center where you'll manage all marketing activities.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
