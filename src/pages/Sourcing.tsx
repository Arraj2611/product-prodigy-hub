import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PriceTrendChart } from "@/components/charts/PriceTrendChart";
import { MarketDemandChart } from "@/components/charts/MarketDemandChart";
import { MarketForecastsList } from "@/components/MarketForecastsList";
import { WorldMap } from "@/components/WorldMap";
import { MarketMapWithForecasts } from "@/components/MarketMapWithForecasts";
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  Package,
  DollarSign,
  Star,
  ArrowRight,
  Globe,
  LineChart,
  Upload,
  Loader2
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sourcingApi } from "@/services/api/sourcing.api";
import { productApi } from "@/services/api/product.api";
import { useRef } from "react";

export default function Sourcing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const clickingRef = useRef<Set<string>>(new Set());

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getProducts(),
  });

  const products = productsData?.data?.products || [];
  const hasProducts = products.length > 0;
  const currentProduct = productId ? products.find(p => p.id === productId) : products[0];

  // Fetch sourcing data for the current product
  const { data: sourcingData, isLoading } = useQuery({
    queryKey: ['sourcing', productId || currentProduct?.id],
    queryFn: () => sourcingApi.getSuppliers({ productId: productId || currentProduct?.id }),
    enabled: !!(productId || currentProduct?.id),
  });

  if (!hasProducts || !currentProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center border-border/50 bg-card/50 backdrop-blur space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Globe className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Global Sourcing</h1>
            <p className="text-muted-foreground text-lg">
              {!hasProducts 
                ? "No sourcing data available. Upload a product to discover suppliers."
                : "Please select a product from the dashboard to view sourcing data."}
            </p>
          </div>
          <Button 
            onClick={() => navigate(hasProducts ? "/dashboard" : "/upload")}
            size="lg"
            className="gap-2"
          >
            {hasProducts ? (
              <>
                <Package className="w-5 h-5" />
                Go to Dashboard
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Product
              </>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading sourcing data...</p>
        </div>
      </div>
    );
  }

  const suppliers = sourcingData?.data?.suppliers || [];
  
  // Transform supplier data for map - handle both JSON string and object coordinates
  const supplierLocations = suppliers
    .filter((s: any) => {
      if (!s.coordinates) return false;
      // Handle coordinates as JSON string or object
      try {
        const coords = typeof s.coordinates === 'string' ? JSON.parse(s.coordinates) : s.coordinates;
        return Array.isArray(coords) && coords.length === 2;
      } catch {
        return false;
      }
    })
    .map((s: any) => {
      const coords = typeof s.coordinates === 'string' ? JSON.parse(s.coordinates) : s.coordinates;
      const material = s.materials?.[0];
      return {
        name: s.name,
        coordinates: coords as [number, number],
        city: s.city || '',
        country: s.country || '',
        type: 'supplier' as const,
        details: material?.materialName || '',
        value: material?.unitPrice ? `$${Number(material.unitPrice).toFixed(2)}/${material.unit}` : ''
      };
    });

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
            AI-powered supplier recommendations and demand forecasting
          </p>
        </div>

        <Tabs defaultValue="suppliers" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="suppliers">Supplier Network</TabsTrigger>
            <TabsTrigger value="markets">Market Analysis</TabsTrigger>
          </TabsList>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            {/* Interactive World Map */}
            {supplierLocations.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Global Supplier Network</h2>
                    <p className="text-sm text-muted-foreground">
                      Interactive map of verified suppliers worldwide
                    </p>
                  </div>
                </div>
                <WorldMap locations={supplierLocations} height={450} />
              </div>
            )}

            {suppliers.length > 0 ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
                <div className="p-6 bg-muted/30 border-b border-border/50">
                  <h2 className="text-xl font-bold">Available Suppliers</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {suppliers.length} verified suppliers found
                  </p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {suppliers.map((supplier: any, index: number) => (
                    <AccordionItem key={index} value={`supplier-${index}`} className="border-b border-border/50">
                      <AccordionTrigger className="hover:no-underline px-6 py-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-semibold text-lg text-left">{supplier.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-4 h-4" />
                                <span>{supplier.city}, {supplier.country}</span>
                              </div>
                            </div>
                            {supplier.rating && (
                              <div className="flex items-center gap-1 text-warning">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">{supplier.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="space-y-4">
                          {/* Basic Info */}
                          <div className="grid grid-cols-2 gap-4">
                            {supplier.website && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Website</p>
                                <a 
                                  href={supplier.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  {supplier.website}
                                </a>
                              </div>
                            )}
                            {supplier.contactEmail && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Email</p>
                                <p className="text-sm">{supplier.contactEmail}</p>
                              </div>
                            )}
                            {supplier.reliability && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Reliability</p>
                                <p className="font-semibold text-success">{supplier.reliability}%</p>
                              </div>
                            )}
                            {(supplier as any).address && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Address</p>
                                <p className="text-sm">{(supplier as any).address}</p>
                              </div>
                            )}
                          </div>

                          {/* Materials */}
                          {supplier.materials && supplier.materials.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold mb-2">Materials Offered</p>
                              {supplier.materials.map((material: any, matIndex: number) => (
                                <div key={matIndex} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Material</p>
                                    <p className="font-semibold text-sm">{material.materialName}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Price</p>
                                    <p className="font-semibold text-primary">${material.unitPrice}/{material.unit}</p>
                                  </div>
                                  {material.moq && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">MOQ</p>
                                      <p className="font-semibold text-sm">{material.moq}</p>
                                    </div>
                                  )}
                                  {material.leadTime && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Lead Time</p>
                                      <p className="font-semibold text-sm">{material.leadTime}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Certifications */}
                          {supplier.certifications && supplier.certifications.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2">Certifications</p>
                              <div className="flex flex-wrap gap-2">
                                {supplier.certifications.map((cert: any, certIndex: number) => (
                                  <Badge key={certIndex} variant="outline">
                                    {cert.type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Contact Button */}
                          <div className="pt-2">
                            <Button 
                              className="gap-2 w-full"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                if (supplier.website) {
                                  window.open(supplier.website, '_blank', 'noopener,noreferrer');
                                } else if (supplier.contactEmail) {
                                  const subject = encodeURIComponent(`Inquiry about ${supplier.materials?.[0]?.materialName || 'materials'}`);
                                  const body = encodeURIComponent(`Hello,\n\nI am interested in sourcing ${supplier.materials?.[0]?.materialName || 'materials'} from your company.\n\nCould you please provide more information about:\n- Pricing and MOQ\n- Lead times\n- Certifications\n- Sample availability\n\nThank you!`);
                                  window.location.href = `mailto:${supplier.contactEmail}?subject=${subject}&body=${body}`;
                                }
                              }}
                            >
                              {supplier.website ? (
                                <>
                                  Visit Website
                                  <Globe className="w-4 h-4" />
                                </>
                              ) : (
                                <>
                                  Contact Supplier
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ) : (
              <Card className="p-12 text-center border-border/50 bg-card/50 backdrop-blur">
                <p className="text-muted-foreground">No suppliers found. Generate a BOM first to find suppliers.</p>
              </Card>
            )}

              {/* Price Trends Chart */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <LineChart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Market Intelligence</h2>
                    <p className="text-sm text-muted-foreground">
                      AI-generated material price forecasts
                    </p>
                  </div>
                </div>
                <PriceTrendChart productId={products[0]?.id} />
              </div>
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets" className="space-y-6">
            {/* Market Intelligence Map */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Global Market Opportunities</h2>
                  <p className="text-sm text-muted-foreground">
                    AI-predicted demand hotspots across various countries
                  </p>
                </div>
              </div>
              
              {/* World Map with Market Locations */}
              {currentProduct && (
                <MarketMapWithForecasts productId={currentProduct.id} />
              )}
            </div>

            {/* Market Forecasts List */}
            {currentProduct && (
              <MarketForecastsList productId={currentProduct.id} />
            )}

            {/* Global Market Analysis Chart - At the bottom */}
            {currentProduct && (
              <div className="space-y-4">
                <MarketDemandChart productId={currentProduct.id} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
