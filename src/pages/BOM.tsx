import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  Package, 
  Ruler, 
  DollarSign,
  Download,
  Edit,
  ArrowRight,
  Sparkles,
  Upload,
  Loader2,
  ArrowLeft,
  Globe
} from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bomApi, BOM } from "@/services/api/bom.api";
import { productApi } from "@/services/api/product.api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { sourcingApi } from "@/services/api/sourcing.api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WorldMap } from "@/components/WorldMap";
import { MarketMapWithForecasts } from "@/components/MarketMapWithForecasts";
import { MarketForecastsList } from "@/components/MarketForecastsList";
import { MarketDemandChart } from "@/components/charts/MarketDemandChart";
import { PriceTrendChart } from "@/components/charts/PriceTrendChart";
import { 
  MapPin, 
  Star, 
  LineChart
} from "lucide-react";

export default function BOM() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const bomId = searchParams.get('bomId');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItems, setEditingItems] = useState<any[]>([]);

  // Fetch product with BOMs
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getProduct(productId!),
    enabled: !!productId,
  });

  const product = productData?.data?.product;
  const bomFromProduct = product?.boms?.[0];
  const bomIdFromProduct = bomFromProduct?.id;

  // Fetch BOM by bomId if provided, otherwise use bomId from product
  const { data: bomData, isLoading: isLoadingBOM } = useQuery({
    queryKey: ['bom', bomId || bomIdFromProduct],
    queryFn: () => bomApi.getBOM(bomId || bomIdFromProduct!),
    enabled: !!(bomId || (productData && bomIdFromProduct)),
  });

  // Use fetched BOM data if available, otherwise fallback to product BOM
  const bom = bomData?.data?.bom || bomFromProduct;

  // Fetch sourcing data for the current product - MUST be called before any early returns (Rules of Hooks)
  const { data: sourcingData, isLoading: isLoadingSourcing } = useQuery({
    queryKey: ['sourcing', productId],
    queryFn: () => sourcingApi.getSuppliers({ productId: productId! }),
    enabled: !!productId,
  });

  // Get market locations for map - MUST be called before any early returns (Rules of Hooks)
  const { data: marketForecastsData } = useQuery({
    queryKey: ['marketForecasts', productId],
    queryFn: async () => {
      if (!productId) return { data: { forecasts: [] } };
      const { analyticsApi } = await import('@/services/api/analytics.api');
      return analyticsApi.getMarketForecasts(productId);
    },
    enabled: !!productId,
  });

  // Update BOM mutation - MUST be called before any early returns (Rules of Hooks)
  const updateBomMutation = useMutation({
    mutationFn: (data: { items?: any[]; yieldBuffer?: number; status?: string; bomId: string }) =>
      bomApi.updateBOM(data.bomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', bomId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      setIsEditDialogOpen(false);
      setEditingItems([]);
      toast.success("BOM updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update BOM", { description: error.message });
    },
  });

  // Hooks MUST be called before any early returns (Rules of Hooks)
  const clickingRef = useRef<Set<string>>(new Set());
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);

  if (isLoadingProduct || isLoadingBOM) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading BOM...</p>
      </div>
    );
  }

  if (!product || !bom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center border-border/50 bg-card/50 backdrop-blur space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Bill of Materials</h1>
            <p className="text-muted-foreground text-lg">
              No BOM generated yet. Upload a product to get started.
            </p>
          </div>
          <Button 
            onClick={() => navigate("/upload")}
            size="lg"
            className="gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Product
          </Button>
        </Card>
      </div>
    );
  }

  // Export BOM functionality as PDF
  const handleExportBOM = () => {
    if (!bom || !bom.items || !product) {
      toast.error("No BOM data to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    const margin = 15;
    const lineHeight = 7;

    // Header
    doc.setFontSize(20);
    doc.text('Bill of Materials', margin, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Product: ${product.name}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Generated: ${new Date(bom.createdAt).toLocaleDateString()}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`AI Confidence: ${Math.round((bom.confidence || 0) * 100)}%`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Total Components: ${bom.items.length}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Estimated Cost (Per Unit): ${totalCost}`, margin, yPos);
    yPos += 10;

    // BOM Items by Category
    bomCategories.forEach((category: any) => {
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(category.category, margin, yPos);
      yPos += lineHeight + 2;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Table headers
      const headers = ['Name', 'Type', 'Qty', 'Unit', 'Unit Cost', 'Total'];
      const colWidths = [60, 30, 15, 15, 25, 25];
      let xPos = margin;
      
      doc.setFont(undefined, 'bold');
      headers.forEach((header, idx) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[idx];
      });
      yPos += lineHeight;
      doc.setFont(undefined, 'normal');

      // Draw line under headers
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 2;

      // Table rows
      category.items.forEach((item: any) => {
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }

        xPos = margin;
        const rowData = [
          item.name || '',
          item.type || '',
          String(item.quantity || 0),
          item.unit || '',
          `$${Number(item.unitCost || 0).toFixed(2)}`,
          `$${Number(item.totalCost || (item.quantity * item.unitCost) || 0).toFixed(2)}`
        ];

        rowData.forEach((cell, idx) => {
          doc.text(cell.substring(0, colWidths[idx] / 2), xPos, yPos);
          xPos += colWidths[idx];
        });
        yPos += lineHeight;
      });

      yPos += 5; // Space between categories
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`${product.name.replace(/[^a-z0-9]/gi, '_')}_BOM_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("BOM exported as PDF successfully");
  };

  const suppliers = sourcingData?.data?.suppliers || [];

  // Group suppliers by material (exactly 3 unique suppliers per material)
  const suppliersByMaterial = bom?.items?.reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.name]) {
      acc[item.name] = [];
    }
    // Find suppliers that offer this specific material (exact match preferred, then partial)
    const materialSuppliers = suppliers
      .filter((s: any) => {
        // Check if supplier has this material
        return s.materials?.some((m: any) => {
          const materialName = m.materialName?.toLowerCase() || '';
          const itemName = item.name.toLowerCase();
          // Exact match first, then partial match
          return materialName === itemName || 
                 materialName.includes(itemName) || 
                 itemName.includes(materialName);
        });
      })
      .slice(0, 3); // Max 3 suppliers per material (backend already limits, but ensure here too)
    
    acc[item.name] = materialSuppliers;
    return acc;
  }, {}) || {};

  // Format BOM data for display (only if bom exists)
  const bomCategories = bom?.items?.reduce((acc: any[], item: any) => {
    const category = item.category || 'Other';
    let cat = acc.find(c => c.category === category);
    if (!cat) {
      cat = { category, items: [] };
      acc.push(cat);
    }
    cat.items.push(item);
    return acc;
  }, []) || [];

  const confidence = bom?.confidence ? Math.round(bom.confidence * 100) : 0;
  
  // Calculate total cost from items if not available in bom
  const calculatedTotalCost = bom?.items?.reduce((sum: number, item: any) => {
    const quantity = Number(item.quantity) || 0;
    const unitCost = Number(item.unitCost) || 0;
    const itemTotalCost = Number(item.totalCost) || (quantity * unitCost);
    return sum + itemTotalCost;
  }, 0) || 0;
  
  const totalCost = bom?.totalCost 
    ? `$${Number(bom.totalCost).toFixed(2)}` 
    : calculatedTotalCost > 0 
      ? `$${calculatedTotalCost.toFixed(2)}` 
      : 'N/A';
  
  // Calculate average material cost per unit
  const avgMaterialCost = bom?.items && bom.items.length > 0
    ? bom.items.reduce((sum: number, item: any) => {
        const unitCost = Number(item.unitCost) || 0;
        return sum + unitCost;
      }, 0) / bom.items.length
    : 0;

  // Transform supplier data for map
  const supplierLocations = suppliers
    .filter((s: any) => {
      if (!s.coordinates) return false;
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

  const marketForecasts = marketForecastsData?.data?.forecasts || [];
  
  // Helper function to get coordinates from city and country
  const getMarketCoordinates = (city: string | undefined, country: string): [number, number] | null => {
    const cityCoordinates: Record<string, [number, number]> = {
      'Tokyo': [139.6917, 35.6895], 'New York': [-74.0060, 40.7128], 'London': [-0.1276, 51.5074],
      'Paris': [2.3522, 48.8566], 'Berlin': [13.4050, 52.5200], 'Sydney': [151.2093, -33.8688],
      'Toronto': [-79.3832, 43.6532], 'Los Angeles': [-118.2437, 34.0522], 'Chicago': [-87.6298, 41.8781],
      'San Francisco': [-122.4194, 37.7749], 'Miami': [-80.1918, 25.7617], 'Seattle': [-122.3321, 47.6062],
      'Boston': [-71.0589, 42.3601], 'Vancouver': [-123.1216, 49.2827], 'Montreal': [-73.5673, 45.5017],
      'Amsterdam': [4.9041, 52.3676], 'Madrid': [-3.7038, 40.4168], 'Rome': [12.4964, 41.9028],
      'Milan': [9.1859, 45.4642], 'Barcelona': [2.1734, 41.3851], 'Munich': [11.5820, 48.1351],
      'Frankfurt': [8.6821, 50.1109], 'Zurich': [8.5417, 47.3769], 'Stockholm': [18.0686, 59.3293],
      'Copenhagen': [12.5683, 55.6761], 'Oslo': [10.7522, 59.9139], 'Dublin': [-6.2603, 53.3498],
      'Brussels': [4.3517, 50.8503], 'Vienna': [16.3738, 48.2082], 'Warsaw': [21.0122, 52.2297],
      'Prague': [14.4378, 50.0755], 'Budapest': [19.0402, 47.4979], 'Athens': [23.7275, 37.9838],
      'Lisbon': [-9.1393, 38.7223], 'Dubai': [55.2708, 25.2048], 'Singapore': [103.8198, 1.3521],
      'Hong Kong': [114.1694, 22.3193], 'Shanghai': [121.4737, 31.2304], 'Beijing': [116.4074, 39.9042],
      'Seoul': [126.9780, 37.5665], 'Bangkok': [100.5018, 13.7563], 'Jakarta': [106.8451, -6.2088],
      'Manila': [120.9842, 14.5995], 'Mumbai': [72.8777, 19.0760], 'Delhi': [77.2090, 28.6139],
      'Bangalore': [77.5946, 12.9716], 'Melbourne': [144.9631, -37.8136], 'Auckland': [174.7633, -36.8485],
      'São Paulo': [-46.6333, -23.5505], 'Rio de Janeiro': [-43.1729, -22.9068], 'Buenos Aires': [-58.3816, -34.6037],
      'Mexico City': [-99.1332, 19.4326], 'Cairo': [31.2357, 30.0444], 'Johannesburg': [28.0473, -26.2041],
      'Lagos': [3.3792, 6.5244], 'Nairobi': [36.8219, -1.2921],
    };
    const countryCapitals: Record<string, [number, number]> = {
      'United States': [-95.7129, 37.0902], 'Canada': [-106.3468, 56.1304], 'United Kingdom': [-2.5879, 54.7024],
      'Germany': [10.4515, 51.1657], 'France': [2.2137, 46.2276], 'Italy': [12.5674, 41.8719],
      'Spain': [-3.7492, 40.4637], 'Japan': [138.2529, 36.2048], 'China': [104.1954, 35.8617],
      'India': [78.9629, 20.5937], 'Australia': [133.7751, -25.2744], 'Brazil': [-51.9253, -14.2350],
      'Mexico': [-102.5528, 23.6345], 'South Korea': [127.7669, 35.9078], 'Thailand': [100.9925, 15.8700],
      'Indonesia': [113.9213, -0.7893], 'Philippines': [121.7740, 12.8797], 'Vietnam': [108.2772, 14.0583],
      'Malaysia': [101.9758, 4.2105],
    };
    if (city) {
      const cityKey = city.split(',')[0].trim();
      if (cityCoordinates[cityKey]) return cityCoordinates[cityKey];
    }
    const countryKey = country.split(',')[0].trim();
    if (countryCapitals[countryKey]) return countryCapitals[countryKey];
    return null;
  };

  const marketLocations = marketForecasts
    .map((forecast: any) => {
      const coords = getMarketCoordinates(forecast.city, forecast.country);
      if (!coords) return null;
      return {
        name: forecast.city ? `${forecast.city} Market` : `${forecast.country} Market`,
        coordinates: coords as [number, number],
        city: forecast.city || '',
        country: forecast.country,
        type: 'market' as const,
        details: `Demand: ${forecast.demand >= 85 ? 'Very High' : forecast.demand >= 70 ? 'High' : forecast.demand >= 50 ? 'Medium' : 'Low'}`,
        value: forecast.avgPrice || `Growth: ${forecast.growth?.toFixed(0)}%`,
      };
    })
    .filter((loc: any): loc is NonNullable<typeof loc> => loc !== null);

  // Combine supplier and market locations for the map
  const allMapLocations = [...supplierLocations, ...marketLocations];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header with Back Button */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
              <Badge className="gap-1 bg-success text-success-foreground">
                <CheckCircle2 className="w-3 h-3" />
                BOM Generated
              </Badge>
            </div>
            <p className="text-muted-foreground">
              AI-generated Bill of Materials with sourcing data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setIsEditDialogOpen(true)}
              disabled={bom?.status === 'LOCKED'}
            >
              <Edit className="w-4 h-4" />
              Edit BOM
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportBOM}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="bom" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="bom">BOM</TabsTrigger>
            <TabsTrigger value="sourcing">Sourcing</TabsTrigger>
          </TabsList>

          {/* BOM Tab */}
          <TabsContent value="bom" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
          <Card className="p-6 border-border/50 bg-gradient-to-br from-success/5 to-success/10 backdrop-blur">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">AI Confidence</p>
                <p className="text-3xl font-bold">{confidence}%</p>
              </div>
              <div className="p-3 rounded-xl bg-success/20">
                <Sparkles className="w-6 h-6 text-success" />
              </div>
            </div>
            <Progress value={confidence} className="mt-4 h-2" />
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Components</p>
                <p className="text-3xl font-bold">
                  {bom.items?.length || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Across {bomCategories.length} categories
            </p>
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-to-br from-warning/5 to-warning/10 backdrop-blur">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                <p className="text-3xl font-bold">{totalCost}</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/20">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Per unit manufacturing</p>
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Avg Material Cost</p>
                <p className="text-3xl font-bold">
                  {avgMaterialCost > 0 ? `$${avgMaterialCost.toFixed(2)}` : '$0.00'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Per unit average</p>
          </Card>
        </div>

        {/* BOM Details - Category Cards with Material Sub-Cards */}
        {bomCategories.length > 0 ? (
          <div className="space-y-6">
            {bomCategories.map((category: any, catIndex: number) => (
              <Card key={catIndex} className="p-6 border-border/50 bg-card/50 backdrop-blur">
                {/* Category Header */}
                <div className="space-y-2 mb-6">
                  <h2 className="text-2xl font-bold text-foreground">{category.category}</h2>
                  <p className="text-sm text-muted-foreground">
                    {category.items.length} {category.items.length === 1 ? 'component' : 'components'}
                  </p>
                  <div className="h-px bg-border/50 mt-2"></div>
                </div>
                
                {/* Material Sub-Cards */}
                <div className="space-y-4">
                  {category.items.map((item: any, itemIndex: number) => {
                    // Parse quantity - handle Decimal, number, and string formats
                    let quantity = 0;
                    if (item.quantity != null) {
                      // Handle Prisma Decimal type (has toString method)
                      if (typeof item.quantity === 'object' && item.quantity.toString) {
                        quantity = parseFloat(item.quantity.toString()) || 0;
                      } else if (typeof item.quantity === 'string') {
                        // Extract number from string like "5 pieces" or "5.5"
                        const numMatch = item.quantity.match(/[\d.]+/);
                        quantity = numMatch ? parseFloat(numMatch[0]) : 0;
                      } else if (typeof item.quantity === 'number') {
                        quantity = item.quantity;
                      }
                    }
                    
                    // Parse costs - handle Decimal types from Prisma
                    const unitCost = item.unitCost != null 
                      ? (typeof item.unitCost === 'object' && item.unitCost.toString 
                          ? parseFloat(item.unitCost.toString()) 
                          : Number(item.unitCost))
                      : 0;
                    const itemTotalCost = item.totalCost != null
                      ? (typeof item.totalCost === 'object' && item.totalCost.toString
                          ? parseFloat(item.totalCost.toString())
                          : Number(item.totalCost))
                      : (quantity * unitCost);
                    
                    // Extract specifications - combine all specification fields
                    const specificationsText = item.specifications && typeof item.specifications === 'object'
                      ? Object.entries(item.specifications)
                          .filter(([_, value]) => value && value !== '')
                          .map(([_, value]) => String(value))
                          .join(', ')
                      : item.specifications || '';
                    
                    // Format quantity display - show actual quantity if available
                    const quantityDisplay = quantity > 0 
                      ? `${quantity} ${item.unit || 'pieces'}`
                      : (item.unit ? `0 ${item.unit}` : '0 pieces');
                    
                    return (
                      <Card key={itemIndex} className="p-6 border-border/50 bg-muted/20 backdrop-blur hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-6">
                          {/* Left side - Material details */}
                          <div className="flex-1 space-y-3">
                            {/* Row 1: Name and Type Badge only (no measurements) */}
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-lg leading-tight text-foreground">{item.name}</h3>
                              <Badge variant="outline" className="text-xs font-normal border-border/50 bg-muted/30">{item.type}</Badge>
                            </div>
                            
                            {/* Row 2: Specifications/Measurements */}
                            {specificationsText && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {specificationsText}
                              </p>
                            )}
                            
                            {/* Row 3: Quantity, Unit Price, Source */}
                            <div className="flex items-center gap-6 flex-wrap">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Ruler className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span>{quantityDisplay}</span>
                              </div>
                              
                              {unitCost > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span>${unitCost.toFixed(2)}/{item.unit || 'piece'}</span>
                                </div>
                              )}
                              
                              {item.source && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span>Source: {item.source}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Right side - Total Cost */}
                          <div className="flex flex-col items-end justify-start flex-shrink-0">
                            <p className="text-2xl font-bold text-primary">
                              ${itemTotalCost.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Total cost</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-border/50 bg-card/50 backdrop-blur">
            <p className="text-muted-foreground">No BOM items found.</p>
          </Card>
        )}

          </TabsContent>

          {/* Sourcing Tab */}
          <TabsContent value="sourcing" className="space-y-6">
            {isLoadingSourcing ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Supplier Network Section */}
                <Tabs defaultValue="suppliers" className="space-y-6">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="suppliers">Supplier Network</TabsTrigger>
                    <TabsTrigger value="markets">Market Analysis</TabsTrigger>
                  </TabsList>

                    {/* Suppliers Tab - Where to BUY Materials */}
                    <TabsContent value="suppliers" className="space-y-6">
                      <div className="space-y-2 mb-4">
                        <h2 className="text-2xl font-bold">Material Suppliers</h2>
                        <p className="text-sm text-muted-foreground">
                          Verified suppliers worldwide who can provide the materials needed to manufacture <strong>{product?.name}</strong>
                        </p>
                      </div>
                      
                    {/* Interactive World Map - Material Suppliers */}
                    {supplierLocations.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Globe className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">Global Supplier Network</h2>
                            <p className="text-sm text-muted-foreground">
                              Interactive map showing material suppliers across the world
                            </p>
                          </div>
                        </div>
                        <WorldMap locations={supplierLocations} height={450} />
                      </div>
                    )}

                    {/* Suppliers Grouped by Material - Where to Buy Each Material */}
                    {Object.keys(suppliersByMaterial).length > 0 ? (
                      <div className="space-y-8">
                        {Object.entries(suppliersByMaterial).map(([materialName, materialSuppliers]: [string, any[]]) => {
                          if (materialSuppliers.length === 0) return null;
                          // Find the BOM item to get quantity needed
                          const bomItem = bom?.items?.find((item: any) => item.name === materialName);
                          return (
                            <div key={materialName} className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-2xl font-bold">{materialName}</h2>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {materialSuppliers.length} verified supplier{materialSuppliers.length > 1 ? 's' : ''} found
                                    {bomItem && (
                                      <span className="ml-2">
                                        • Required: {bomItem.quantity} {bomItem.unit}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                {materialSuppliers.length > 3 && (
                                  <Button variant="outline" size="sm">
                                    Compare All
                                  </Button>
                                )}
                              </div>
                              <div className="space-y-4">
                                {materialSuppliers.map((supplier: any, index: number) => {
                                  const supplierKey = `${materialName}-${supplier.id || index}`;
                                  const isExpanded = expandedSupplier === supplierKey;
                                  const material = supplier.materials?.find((m: any) => 
                                    m.materialName?.toLowerCase().includes(materialName.toLowerCase()) ||
                                    materialName.toLowerCase().includes(m.materialName?.toLowerCase() || '')
                                  ) || supplier.materials?.[0];
                                  
                                  return (
                                    <Card key={supplierKey} className="p-5 border-border/50 bg-card/50 backdrop-blur hover:shadow-lg transition-shadow">
                                      <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1">{supplier.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

                                        {/* Material Details */}
                                        {material && (
                                          <div className="pt-2 border-t border-border/30">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                              <div>
                                                <p className="text-xs text-muted-foreground mb-1">Price</p>
                                                <p className="font-bold text-primary text-lg">
                                                  ${Number(material.unitPrice || 0).toFixed(2)}/{material.unit}
                                                </p>
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
                                              {supplier.reliability && (
                                                <div>
                                                  <p className="text-xs text-muted-foreground mb-1">Reliability</p>
                                                  <p className="font-semibold text-success">{supplier.reliability}%</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Certifications */}
                                        {supplier.certifications && supplier.certifications.length > 0 && (
                                          <div className="flex flex-wrap gap-2">
                                            {supplier.certifications.slice(0, 3).map((cert: any, certIndex: number) => (
                                              <Badge key={certIndex} variant="outline" className="text-xs">
                                                {cert.type}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}

                                        {/* Contact Button - Expands Accordion */}
                                        <Button 
                                          className="w-full gap-2"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setExpandedSupplier(isExpanded ? null : supplierKey);
                                          }}
                                        >
                                          Contact Supplier
                                          <ArrowRight className="w-4 h-4" />
                                        </Button>

                                        {/* Expanded Details (Accordion-like) */}
                                        {isExpanded && (
                                          <div className="pt-4 border-t border-border/30 space-y-4 animate-in slide-in-from-top-2">
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
                                            {supplier.materials && supplier.materials.length > 1 && (
                                              <div>
                                                <p className="text-xs text-muted-foreground mb-2">All Materials</p>
                                                <div className="space-y-2">
                                                  {supplier.materials.map((mat: any, matIndex: number) => (
                                                    <div key={matIndex} className="p-2 bg-muted/30 rounded text-sm">
                                                      <p className="font-semibold">{mat.materialName}</p>
                                                      <p className="text-primary">${Number(mat.unitPrice || 0).toFixed(2)}/{mat.unit}</p>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            {supplier.certifications && supplier.certifications.length > 3 && (
                                              <div>
                                                <p className="text-xs text-muted-foreground mb-2">All Certifications</p>
                                                <div className="flex flex-wrap gap-2">
                                                  {supplier.certifications.map((cert: any, certIndex: number) => (
                                                    <Badge key={certIndex} variant="outline" className="text-xs">
                                                      {cert.type}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            <Button 
                                              variant="outline"
                                              className="w-full gap-2"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (supplier.website) {
                                                  window.open(supplier.website, '_blank', 'noopener,noreferrer');
                                                } else if (supplier.contactEmail) {
                                                  const subject = encodeURIComponent(`Inquiry about ${material?.materialName || 'materials'}`);
                                                  const body = encodeURIComponent(`Hello,\n\nI am interested in sourcing ${material?.materialName || 'materials'} from your company.\n\nCould you please provide more information about:\n- Pricing and MOQ\n- Lead times\n- Certifications\n- Sample availability\n\nThank you!`);
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
                                                  Send Email
                                                  <ArrowRight className="w-4 h-4" />
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
                      {productId && <PriceTrendChart productId={productId} />}
                    </div>
                  </TabsContent>

                  {/* Markets Tab - Where to SELL the Product */}
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
                            AI-predicted markets where you can sell <strong>{product?.name}</strong> across various countries
                          </p>
                        </div>
                      </div>
                      
                      {/* World Map with Market Locations */}
                      {productId ? (
                        <MarketMapWithForecasts productId={productId} />
                      ) : (
                        <Card className="p-12 text-center border-border/50 bg-card/50 backdrop-blur">
                          <p className="text-muted-foreground">Product information not available</p>
                        </Card>
                      )}
                    </div>

                    {/* Market Forecasts List - Where to Sell the Product */}
                    {productId ? (
                      <MarketForecastsList productId={productId} />
                    ) : (
                      <Card className="p-12 text-center border-border/50 bg-card/50 backdrop-blur">
                        <p className="text-muted-foreground">No market data available. Market analysis will be generated after BOM creation.</p>
                      </Card>
                    )}

                    {/* Global Market Analysis Chart - Product Sales Potential */}
                    {productId && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <LineChart className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">Product Market Analysis</h2>
                            <p className="text-sm text-muted-foreground">
                              Sales potential and demand analysis for <strong>{product?.name}</strong>
                            </p>
                          </div>
                        </div>
                        <MarketDemandChart productId={productId} />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit BOM Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (open && bom?.items) {
          setEditingItems([...bom.items]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bill of Materials</DialogTitle>
            <DialogDescription>
              Modify BOM items, quantities, and costs. Changes will create a new version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {bomCategories.map((category: any, catIndex: number) => {
              const categoryItems = editingItems.filter((item: any) => item.category === category.category);
              return (
                <div key={catIndex} className="space-y-2">
                  <h3 className="font-semibold text-lg">{category.category}</h3>
                  <div className="space-y-2">
                    {categoryItems.map((item: any, itemIndex: number) => {
                      const itemIdx = editingItems.findIndex((i: any) => i.id === item.id);
                      return (
                        <div key={itemIndex} className="grid grid-cols-4 gap-2 p-3 border rounded-lg">
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input value={item.name} disabled className="text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs">Quantity</Label>
                            <Input 
                              type="number" 
                              value={item.quantity} 
                              onChange={(e) => {
                                const newItems = [...editingItems];
                                if (itemIdx >= 0) {
                                  newItems[itemIdx] = { ...newItems[itemIdx], quantity: parseFloat(e.target.value) || 0 };
                                  setEditingItems(newItems);
                                }
                              }}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Unit Cost</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              value={item.unitCost || 0} 
                              onChange={(e) => {
                                const newItems = [...editingItems];
                                if (itemIdx >= 0) {
                                  const unitCost = parseFloat(e.target.value) || 0;
                                  const quantity = Number(newItems[itemIdx].quantity) || 0;
                                  newItems[itemIdx] = { 
                                    ...newItems[itemIdx], 
                                    unitCost,
                                    totalCost: unitCost * quantity
                                  };
                                  setEditingItems(newItems);
                                }
                              }}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Total Cost</Label>
                            <Input 
                              value={`$${((item.unitCost || 0) * (Number(item.quantity) || 0)).toFixed(2)}`} 
                              disabled 
                              className="text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingItems([]);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (bom?.id) {
                    updateBomMutation.mutate({ items: editingItems, bomId: bom.id });
                  }
                }}
                disabled={updateBomMutation.isPending || !bom?.id}
              >
                {updateBomMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
