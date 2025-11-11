import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Upload as UploadIcon, 
  Image as ImageIcon, 
  Video, 
  X,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!productName || files.length === 0) {
      toast.error("Please add product name and at least one image");
      return;
    }
    
    toast.success("Product uploaded successfully! AI is analyzing...");
    setTimeout(() => {
      navigate("/bom");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Upload Product
          </h1>
          <p className="text-muted-foreground">
            Upload images or videos of your product, and let AI decompose it into materials
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  placeholder="e.g., Premium Denim Jacket"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Product Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product in detail - material, features, closure type, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] bg-background resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  More details help AI generate accurate material breakdown
                </p>
              </div>

              <div className="space-y-2">
                <Label>Upload Media *</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 hover:border-primary/50 transition-colors bg-background/50">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center gap-3 cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <UploadIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Click to upload</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        PNG, JPG, MP4 up to 20MB
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files ({files.length})</Label>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                          {file.type.startsWith("image") ? (
                            <ImageIcon className="w-5 h-5 text-primary" />
                          ) : (
                            <Video className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Preview & Info */}
          <div className="space-y-6">
            <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Our advanced AI will analyze your product images and videos to identify:
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm ml-13">
                  <li className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5">1</Badge>
                    <span>Material composition and fabric types</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5">2</Badge>
                    <span>Required components and trims</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5">3</Badge>
                    <span>Estimated material quantities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5">4</Badge>
                    <span>Manufacturing Bill of Materials (BOM)</span>
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
              <h3 className="font-semibold mb-4">Upload Tips</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Use high-resolution images for best AI accuracy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Include multiple angles (front, back, detail shots)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Good lighting helps identify material textures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Videos should focus on product details and construction</span>
                </li>
              </ul>
            </Card>

            <Button 
              onClick={handleSubmit}
              className="w-full gap-2 shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Sparkles className="w-4 h-4" />
              Generate BOM with AI
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
