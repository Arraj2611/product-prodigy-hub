import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { ProductPerformanceChart } from "@/components/charts/ProductPerformanceChart";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  BarChart3,
  Sparkles,
  Upload,
  Loader2,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi } from "@/services/api/product.api";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getProducts(),
    refetchInterval: (query) => {
      // Poll every 5 seconds if there are processing products
      const products = query.state.data?.data?.products || [];
      const hasProcessing = products.some((p: any) => p.status === 'PROCESSING');
      return hasProcessing ? 5000 : false;
    },
  });

  const products = productsData?.data?.products || [];
  
  // Refetch when processing products complete (check notifications)
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      // Invalidate all product-related queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-boms'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      
      // Also refetch immediately
      refetch();
    };
    window.addEventListener('notification:received', handleNotification as EventListener);
    return () => window.removeEventListener('notification:received', handleNotification as EventListener);
  }, [refetch, queryClient]);

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => productApi.deleteProduct(productId),
    onSuccess: (_, productId) => {
      // Remove the deleted product from cache immediately
      queryClient.setQueryData(['products'], (oldData: any) => {
        if (!oldData?.data?.products) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            products: oldData.data.products.filter((p: any) => p.id !== productId),
          },
        };
      });
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-boms'] });
      queryClient.removeQueries({ queryKey: ['product', productId] }); // Remove individual product query
      
      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete product');
    },
  });

  // Fetch BOM data for products to show cost estimates
  const { data: productsWithBoms } = useQuery({
    queryKey: ['products-with-boms', products.map(p => p.id).join(',')],
    queryFn: async () => {
      const productsWithBomData = await Promise.all(
        products.map(async (product) => {
          try {
            const productData = await productApi.getProduct(product.id);
            // Check if product still exists (might have been deleted)
            if (productData?.data?.product) {
              return { ...product, bom: productData.data.product.boms?.[0] };
            }
          } catch (error: any) {
            // If product not found (404), it was likely deleted - skip it
            if (error?.response?.status === 404) {
              return null; // Mark as null to filter out later
            }
            // For other errors, return the product without BOM data
          }
          return product;
        })
      );
      // Filter out null values (deleted products)
      return productsWithBomData.filter((p) => p !== null);
    },
    enabled: products.length > 0,
  });

  // Calculate stats from real data (after fetching BOM data)
  const activeProjects = products.filter(p => p.status !== 'ARCHIVED' && p.status !== 'DRAFT').length;
  const productsSourced = products.filter(p => p.status === 'SOURCING' || p.status === 'READY').length;
  const processingProducts = products.filter(p => p.status === 'PROCESSING').length;
  
  // Count actual BOMs from products with BOMs
  const totalBOMs = (productsWithBoms || products).reduce((count, product) => {
    const bom = (product as any).bom;
    return count + (bom ? 1 : 0);
  }, 0);
  
  // Check if any products are processing BOM generation
  const isBOMGenerating = processingProducts > 0;
  
  const stats = [
    {
      title: "Active Projects",
      value: activeProjects.toString(),
      change: `${activeProjects} active`,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
      isLoading: false
    },
    {
      title: "Products Sourced",
      value: isBOMGenerating ? "..." : productsSourced.toString(),
      change: isBOMGenerating ? "Generating..." : "In sourcing pipeline",
      icon: ShoppingCart,
      color: "text-success",
      bg: "bg-success/10",
      isLoading: isBOMGenerating
    },
    {
      title: "BOMs Generated",
      value: isBOMGenerating ? "..." : totalBOMs.toString(),
      change: isBOMGenerating ? "In process..." : "AI-generated BOMs",
      icon: DollarSign,
      color: "text-warning",
      bg: "bg-warning/10",
      isLoading: isBOMGenerating
    },
    {
      title: "Total Products",
      value: products.length.toString(),
      change: "All time",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      isLoading: false
    }
  ];

  const recentProjects = (productsWithBoms || products)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map(product => {
      const bom = (product as any).bom;
      let materials = 0;
      let estimated = "$0";
      
      if (bom) {
        // Get materials count from BOM items
        if (bom.items && Array.isArray(bom.items)) {
          materials = bom.items.length;
        }
        
        // Calculate estimated cost - prefer bom.totalCost, then calculate from items
        let totalCost = 0;
        if (bom.totalCost) {
          totalCost = Number(bom.totalCost);
        } else if (bom.items && Array.isArray(bom.items)) {
          // Calculate from items - prefer item.totalCost, otherwise calculate
          totalCost = bom.items.reduce((sum: number, item: any) => {
            const itemTotalCost = Number(item.totalCost) || 0;
            if (itemTotalCost > 0) {
              return sum + itemTotalCost;
            }
            // Fallback: calculate from quantity * unitCost
            const quantity = Number(item.quantity) || 0;
            const unitCost = Number(item.unitCost) || 0;
            return sum + (quantity * unitCost);
          }, 0);
        }
        
        estimated = totalCost > 0 ? `$${totalCost.toFixed(2)}` : "$0";
      }
      
      const isProcessing = product.status === 'PROCESSING';
      
      return {
        id: product.id,
        name: product.name,
        status: product.status,
        progress: getProgressForStatus(product.status),
        date: formatDate(product.createdAt),
        materials,
        estimated,
        isProcessing,
        hasBOM: !!bom
      };
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show welcome state if no products
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center border-border/50 bg-card/50 backdrop-blur space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Welcome to SourceFlow</h1>
            <p className="text-muted-foreground text-lg">
              Your AI-powered platform for product creation and global commerce
            </p>
          </div>
          <div className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Start by uploading a product to see the full experience
            </p>
            <Button 
              onClick={() => navigate("/upload")}
              size="lg"
              className="gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Your First Product
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, Creator 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your product pipeline today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-border/50 bg-card/50 backdrop-blur"
            >
              <div className="relative">
                {/* Icon in top right */}
                <div className={`absolute top-0 right-0 p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                
                {/* Content - centered */}
                <div className="text-center space-y-2 pt-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold flex items-center justify-center gap-2">
                    {stat.isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    {stat.isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3 text-success" />
                    )}
                    {stat.change}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-2xl font-bold">Recent Projects</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Track your active product development pipeline
              </p>
            </div>
            <div className="divide-y divide-border/50">
              {recentProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="p-6 hover:bg-muted/30 transition-colors group relative"
                >
                  <div 
                    className={`cursor-pointer ${project.isProcessing ? 'opacity-75' : ''}`}
                    onClick={() => {
                      if (project.isProcessing || !project.hasBOM) {
                        // Don't navigate if still processing or no BOM yet
                        return;
                      }
                      navigate(`/bom?productId=${project.id}`);
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {project.name}
                          </h3>
                          <Badge variant="secondary" className="gap-1">
                            {project.isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
                            {!project.isProcessing && project.status === "BOM_GENERATED" && <Clock className="w-3 h-3" />}
                            {!project.isProcessing && project.status === "SOURCING" && <CheckCircle2 className="w-3 h-3 text-success" />}
                            {!project.isProcessing && project.status === "READY" && <TrendingUp className="w-3 h-3 text-primary" />}
                            {project.isProcessing ? "BOM Generation in Process" : formatStatus(project.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {project.date}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToDelete(project.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">Materials</span>
                          <p className="font-semibold flex items-center gap-2">
                            {project.isProcessing ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-muted-foreground">Processing...</span>
                              </>
                            ) : (
                              project.materials
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Cost</span>
                          <p className="font-semibold text-primary flex items-center gap-2">
                            {project.isProcessing ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-muted-foreground">Calculating...</span>
                              </>
                            ) : (
                              project.estimated
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progress</span>
                          <p className="font-semibold">{project.progress}%</p>
                        </div>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the product and all associated data including:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>Product assets (images/videos)</li>
                      <li>BOM and all BOM items</li>
                      <li>Market forecasts</li>
                      <li>Price forecasts</li>
                      <li>All related supplier data</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (productToDelete) {
                        deleteProductMutation.mutate(productToDelete);
                      }
                    }}
                    disabled={deleteProductMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteProductMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card 
            className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate("/upload")}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Upload New Product</h3>
              <p className="text-sm text-muted-foreground">
                Start your product journey with AI-powered analysis
              </p>
            </div>
          </Card>
          
          <Card 
            className="p-6 border-border/50 bg-gradient-to-br from-success/5 to-success/10 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate("/sourcing")}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold text-lg">Explore Sourcing</h3>
              <p className="text-sm text-muted-foreground">
                Find optimal suppliers across the globe
              </p>
            </div>
          </Card>
          
          <Card 
            className="p-6 border-border/50 bg-gradient-to-br from-warning/5 to-warning/10 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate("/marketing")}
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <h3 className="font-semibold text-lg">Launch Campaign</h3>
              <p className="text-sm text-muted-foreground">
                Automate your marketing across all channels
              </p>
            </div>
          </Card>
        </div>

        {/* Analytics Section */}
        {products.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Business Analytics</h2>
                <p className="text-sm text-muted-foreground">
                  Real-time insights and performance metrics
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <RevenueChart />
              <ProductPerformanceChart />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getProgressForStatus(status: string): number {
  const statusMap: Record<string, number> = {
    'DRAFT': 10,
    'PROCESSING': 30,
    'BOM_GENERATED': 60,
    'SOURCING': 80,
    'READY': 100,
    'ARCHIVED': 0,
  };
  return statusMap[status] || 0;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}
