import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Package, 
  Ruler, 
  DollarSign,
  Download,
  Edit,
  ArrowRight,
  Sparkles,
  Upload
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";

export default function BOM() {
  const navigate = useNavigate();
  const { isDemoStarted } = useDemo();

  // If demo not started, show empty state
  if (!isDemoStarted) {
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

  const bomData = {
    product: "Premium Denim Jacket",
    confidence: 94,
    totalCost: "$42.50",
    components: [
      {
        category: "Shell Fabrication",
        items: [
          {
            name: "14oz Selvedge Denim",
            type: "Primary Fabric",
            quantity: "2.5 meters",
            unit: "meter",
            unitCost: "$8.50",
            totalCost: "$21.25",
            source: "Japan",
            specs: "100% Cotton, Indigo Dyed, 14oz Weight"
          }
        ]
      },
      {
        category: "Trims & Hardware",
        items: [
          {
            name: "Copper Rivets",
            type: "Hardware",
            quantity: "12 pieces",
            unit: "piece",
            unitCost: "$0.15",
            totalCost: "$1.80",
            source: "Italy",
            specs: "Solid Copper, 8mm diameter"
          },
          {
            name: "Metal Buttons",
            type: "Closure",
            quantity: "6 pieces",
            unit: "piece",
            unitCost: "$0.45",
            totalCost: "$2.70",
            source: "Italy",
            specs: "Nickel-free metal, Shank style"
          },
          {
            name: "YKK Zipper",
            type: "Closure",
            quantity: "1 piece",
            unit: "piece",
            unitCost: "$2.50",
            totalCost: "$2.50",
            source: "Japan",
            specs: "Metal teeth, 18cm length"
          }
        ]
      },
      {
        category: "Notions",
        items: [
          {
            name: "Polyester Thread",
            type: "Sewing",
            quantity: "200 meters",
            unit: "meter",
            unitCost: "$0.02",
            totalCost: "$4.00",
            source: "China",
            specs: "40wt, Indigo color"
          },
          {
            name: "Fusible Interfacing",
            type: "Support",
            quantity: "0.5 meters",
            unit: "meter",
            unitCost: "$1.50",
            totalCost: "$0.75",
            source: "Taiwan",
            specs: "Lightweight, Woven"
          }
        ]
      },
      {
        category: "Labels & Packaging",
        items: [
          {
            name: "Woven Brand Label",
            type: "Branding",
            quantity: "2 pieces",
            unit: "piece",
            unitCost: "$0.35",
            totalCost: "$0.70",
            source: "India",
            specs: "Satin weave, Custom logo"
          },
          {
            name: "Care Label",
            type: "Labeling",
            quantity: "1 piece",
            unit: "piece",
            unitCost: "$0.10",
            totalCost: "$0.10",
            source: "India",
            specs: "Polyester, Printed"
          },
          {
            name: "Hang Tag",
            type: "Packaging",
            quantity: "1 piece",
            unit: "piece",
            unitCost: "$0.80",
            totalCost: "$0.80",
            source: "China",
            specs: "Recycled cardboard"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">{bomData.product}</h1>
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
            <Button variant="outline" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit BOM
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 border-border/50 bg-gradient-to-br from-success/5 to-success/10 backdrop-blur">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">AI Confidence</p>
                <p className="text-3xl font-bold">{bomData.confidence}%</p>
              </div>
              <div className="p-3 rounded-xl bg-success/20">
                <Sparkles className="w-6 h-6 text-success" />
              </div>
            </div>
            <Progress value={bomData.confidence} className="mt-4 h-2" />
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Components</p>
                <p className="text-3xl font-bold">
                  {bomData.components.reduce((acc, cat) => acc + cat.items.length, 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Across {bomData.components.length} categories</p>
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-to-br from-warning/5 to-warning/10 backdrop-blur">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                <p className="text-3xl font-bold">{bomData.totalCost}</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/20">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Per unit manufacturing</p>
          </Card>
        </div>

        {/* BOM Details */}
        <div className="space-y-6">
          {bomData.components.map((category, catIndex) => (
            <Card key={catIndex} className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
              <div className="p-6 bg-muted/30 border-b border-border/50">
                <h2 className="text-xl font-bold">{category.category}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {category.items.length} component{category.items.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="divide-y divide-border/50">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="p-6 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <Badge variant="outline">{item.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{item.specs}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{item.unitCost}/{item.unit}</span>
                          </div>
                          <Badge variant="secondary" className="gap-1.5">
                            <Package className="w-3 h-3" />
                            Source: {item.source}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{item.totalCost}</p>
                        <p className="text-xs text-muted-foreground mt-1">Total cost</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Next Steps */}
        <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Ready for the next step?</h3>
              <p className="text-sm text-muted-foreground">
                Explore global sourcing options and find the best suppliers
              </p>
            </div>
            <Button onClick={() => navigate("/sourcing")} className="gap-2 shadow-lg">
              View Sourcing Data
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
