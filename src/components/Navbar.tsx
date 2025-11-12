import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Plus, Bell, User, RotateCcw } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { toast } from "sonner";

export const Navbar = () => {
  const location = useLocation();
  const { isDemoStarted, resetDemo } = useDemo();
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleResetDemo = () => {
    resetDemo();
    toast.success("Demo reset! Start fresh from Upload page");
    window.location.href = "/upload";
  };
  
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/upload" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              SourceFlow
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/dashboard") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/upload"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/upload") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Upload Product
            </Link>
            <Link
              to="/bom"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/bom") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              BOM
            </Link>
            <Link
              to="/sourcing"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/sourcing") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Sourcing
            </Link>
            <Link
              to="/marketing"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/marketing") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Marketing
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            {isDemoStarted && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleResetDemo}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Demo</span>
              </Button>
            )}
            <Button size="sm" className="gap-2 shadow-md hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Project</span>
            </Button>
            <Button size="icon" variant="ghost" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>
            <Button size="icon" variant="ghost">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
