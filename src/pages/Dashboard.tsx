import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { ProductPerformanceChart } from "@/components/charts/ProductPerformanceChart";
import { MarketDemandChart } from "@/components/charts/MarketDemandChart";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  BarChart3
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Active Projects",
      value: "12",
      change: "+2 this week",
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      title: "Products Sourced",
      value: "48",
      change: "+12% from last month",
      icon: ShoppingCart,
      color: "text-success",
      bg: "bg-success/10"
    },
    {
      title: "Total Revenue",
      value: "$124.5K",
      change: "+18% growth",
      icon: DollarSign,
      color: "text-warning",
      bg: "bg-warning/10"
    },
    {
      title: "Market Reach",
      value: "23 Countries",
      change: "Across 4 continents",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10"
    }
  ];

  const recentProjects = [
    {
      id: 1,
      name: "Premium Denim Jacket",
      status: "BOM Generated",
      progress: 85,
      date: "2 hours ago",
      materials: 12,
      estimated: "$2,450"
    },
    {
      id: 2,
      name: "Organic Cotton T-Shirt",
      status: "Sourcing Complete",
      progress: 100,
      date: "5 hours ago",
      materials: 6,
      estimated: "$890"
    },
    {
      id: 3,
      name: "Sustainable Sneakers",
      status: "Marketing Active",
      progress: 95,
      date: "1 day ago",
      materials: 18,
      estimated: "$5,200"
    }
  ];

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
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-success" />
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Projects */}
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
                className="p-6 hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <Badge variant="secondary" className="gap-1">
                        {project.status === "BOM Generated" && <Clock className="w-3 h-3" />}
                        {project.status === "Sourcing Complete" && <CheckCircle2 className="w-3 h-3 text-success" />}
                        {project.status === "Marketing Active" && <TrendingUp className="w-3 h-3 text-primary" />}
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {project.materials} materials • Est. {project.estimated}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{project.date}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all cursor-pointer group">
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
          
          <Card className="p-6 border-border/50 bg-gradient-to-br from-success/5 to-success/10 hover:shadow-xl transition-all cursor-pointer group">
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
          
          <Card className="p-6 border-border/50 bg-gradient-to-br from-warning/5 to-warning/10 hover:shadow-xl transition-all cursor-pointer group">
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

          <MarketDemandChart />
        </div>
      </div>
    </div>
  );
}
