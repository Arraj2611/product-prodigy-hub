import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceTrendChart } from "@/components/charts/PriceTrendChart";
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  Package,
  DollarSign,
  Star,
  ArrowRight,
  Globe,
  LineChart
} from "lucide-react";

export default function Sourcing() {
  const suppliers = [
    {
      material: "14oz Selvedge Denim",
      suppliers: [
        {
          name: "Kaihara Mills",
          location: "Hiroshima, Japan",
          rating: 4.9,
          price: "$8.50/meter",
          moq: "500 meters",
          leadTime: "45 days",
          trend: "stable",
          certifications: ["GOTS", "OEKO-TEX"],
          reliability: 98
        },
        {
          name: "Kurabo Industries",
          location: "Okayama, Japan",
          rating: 4.8,
          price: "$8.20/meter",
          moq: "1000 meters",
          leadTime: "60 days",
          trend: "down",
          certifications: ["ISO 9001"],
          reliability: 96
        },
        {
          name: "Cone Denim",
          location: "North Carolina, USA",
          rating: 4.7,
          price: "$9.00/meter",
          moq: "300 meters",
          leadTime: "30 days",
          trend: "up",
          certifications: ["GOTS", "Fair Trade"],
          reliability: 94
        }
      ]
    },
    {
      material: "Copper Rivets",
      suppliers: [
        {
          name: "Tuscany Hardware Co.",
          location: "Florence, Italy",
          rating: 4.9,
          price: "$0.15/piece",
          moq: "5000 pieces",
          leadTime: "21 days",
          trend: "stable",
          certifications: ["ISO 9001"],
          reliability: 99
        },
        {
          name: "Milano Metallics",
          location: "Milan, Italy",
          rating: 4.7,
          price: "$0.13/piece",
          moq: "10000 pieces",
          leadTime: "35 days",
          trend: "down",
          certifications: ["CE"],
          reliability: 95
        }
      ]
    }
  ];

  const marketData = {
    globalMarkets: [
      {
        country: "United States",
        city: "New York",
        demand: "High",
        avgPrice: "$185",
        growth: "+12%",
        trend: "up",
        marketSize: "$2.4B"
      },
      {
        country: "United Kingdom",
        city: "London",
        demand: "Very High",
        avgPrice: "$165",
        growth: "+18%",
        trend: "up",
        marketSize: "$890M"
      },
      {
        country: "Japan",
        city: "Tokyo",
        demand: "High",
        avgPrice: "$220",
        growth: "+8%",
        trend: "stable",
        marketSize: "$1.2B"
      },
      {
        country: "Germany",
        city: "Berlin",
        demand: "Medium",
        avgPrice: "$155",
        growth: "+5%",
        trend: "stable",
        marketSize: "$650M"
      },
      {
        country: "Australia",
        city: "Sydney",
        demand: "High",
        avgPrice: "$175",
        growth: "+15%",
        trend: "up",
        marketSize: "$450M"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            Global Sourcing & Market Intelligence
          </h1>
          <p className="text-muted-foreground">
            AI-powered supplier recommendations and demand forecasting across 23 countries
          </p>
        </div>

        <Tabs defaultValue="suppliers" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="suppliers">Supplier Network</TabsTrigger>
            <TabsTrigger value="markets">Market Analysis</TabsTrigger>
          </TabsList>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            {suppliers.map((category, catIndex) => (
              <Card key={catIndex} className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
                <div className="p-6 bg-muted/30 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{category.material}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.suppliers.length} verified suppliers found
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Compare All
                    </Button>
                  </div>
                </div>
                
                <div className="divide-y divide-border/50">
                  {category.suppliers.map((supplier, supIndex) => (
                    <div key={supIndex} className="p-6 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{supplier.name}</h3>
                            <div className="flex items-center gap-1 text-warning">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">{supplier.rating}</span>
                            </div>
                            {supplier.trend === "up" && (
                              <Badge variant="outline" className="gap-1 text-destructive border-destructive/30">
                                <TrendingUp className="w-3 h-3" />
                                Price Rising
                              </Badge>
                            )}
                            {supplier.trend === "down" && (
                              <Badge variant="outline" className="gap-1 text-success border-success/30">
                                <TrendingDown className="w-3 h-3" />
                                Price Falling
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{supplier.location}</span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Price</p>
                              <p className="font-semibold text-primary">{supplier.price}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">MOQ</p>
                              <p className="font-semibold">{supplier.moq}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Lead Time</p>
                              <p className="font-semibold">{supplier.leadTime}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Reliability</p>
                              <p className="font-semibold text-success">{supplier.reliability}%</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {supplier.certifications.map((cert, certIndex) => (
                              <Badge key={certIndex} variant="secondary" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button className="gap-2">
                          Contact Supplier
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {/* Price Trends Chart */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <LineChart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Market Intelligence</h2>
                  <p className="text-sm text-muted-foreground">
                    Live commodity pricing and trend analysis
                  </p>
                </div>
              </div>
              <PriceTrendChart />
            </div>

            {/* Market Insights */}
            <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur">
              <h3 className="text-lg font-semibold mb-4">Supply Chain Insights</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cotton Prices</span>
                    <Badge variant="outline" className="gap-1 text-destructive border-destructive/30">
                      <TrendingUp className="w-3 h-3" />
                      +3.2%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rising due to seasonal demand in Asian markets
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hardware Costs</span>
                    <Badge variant="outline" className="gap-1 text-success border-success/30">
                      <TrendingDown className="w-3 h-3" />
                      -1.8%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Decreased production costs in European suppliers
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Labor Rates</span>
                    <Badge variant="outline" className="gap-1 text-warning border-warning/30">
                      <TrendingUp className="w-3 h-3" />
                      +2.1%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gradual increase in manufacturing wages globally
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Shipping Costs</span>
                    <Badge variant="outline" className="gap-1 text-success border-success/30">
                      <TrendingDown className="w-3 h-3" />
                      -5.4%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Improved logistics efficiency and fuel savings
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets" className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
              <div className="p-6 bg-muted/30 border-b border-border/50">
                <h2 className="text-xl font-bold">Optimal Selling Markets</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-predicted demand and pricing for Premium Denim Jacket
                </p>
              </div>
              
              <div className="divide-y divide-border/50">
                {marketData.globalMarkets.map((market, index) => (
                  <div key={index} className="p-6 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{market.city}, {market.country}</h3>
                            <p className="text-sm text-muted-foreground">Market Size: {market.marketSize}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Demand Level</p>
                            <Badge 
                              variant={market.demand === "Very High" ? "default" : market.demand === "High" ? "secondary" : "outline"}
                              className="font-semibold"
                            >
                              {market.demand}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Avg. Selling Price</p>
                            <p className="font-semibold text-lg text-success">{market.avgPrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Market Growth</p>
                            <div className="flex items-center gap-1">
                              {market.trend === "up" ? (
                                <TrendingUp className="w-4 h-4 text-success" />
                              ) : (
                                <Package className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="font-semibold">{market.growth}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Profit Margin</p>
                            <p className="font-semibold text-primary">
                              ${(parseFloat(market.avgPrice.replace('$', '')) - 42.5).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" className="gap-2">
                        <DollarSign className="w-4 h-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Ready to build your brand?</h3>
                  <p className="text-sm text-muted-foreground">
                    Create automated marketing campaigns across all platforms
                  </p>
                </div>
                <Button className="gap-2 shadow-lg">
                  Launch Marketing
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
