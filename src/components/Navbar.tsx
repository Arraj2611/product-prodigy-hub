import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Plus, Bell, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "./AuthDialog";
import { useState, useEffect, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/services/api/notification.api";
import { formatDistanceToNow } from "date-fns";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const isActive = (path: string) => location.pathname === path;

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(3, false),
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refetch every 10 seconds for faster notification detection
  });

  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = notificationsData?.data?.unreadCount || 0;

  // Track seen notification IDs to detect new notifications (using ref to avoid re-renders)
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());

  // Dispatch notification:received event when new notifications are detected
  useEffect(() => {
    if (notificationsData?.data && notificationsData.data.notifications.length > 0) {
      const currentNotifications = notificationsData.data.notifications;
      const currentUnreadCount = notificationsData.data.unreadCount;
      
      // Find new unread notifications (not seen before)
      const newUnreadNotifications = currentNotifications.filter(
        (notif) => !notif.read && !seenNotificationIdsRef.current.has(notif.id)
      );
      
      // If we have new unread notifications, dispatch event
      if (newUnreadNotifications.length > 0) {
        // Dispatch event to notify Dashboard and other components
        window.dispatchEvent(new CustomEvent('notification:received', {
          detail: {
            notifications: newUnreadNotifications,
            unreadCount: currentUnreadCount
          }
        }));
        
        // Update seen notification IDs
        newUnreadNotifications.forEach((notif) => {
          seenNotificationIdsRef.current.add(notif.id);
        });
      }
      
      // Also update seen IDs for all current notifications (including read ones)
      // to avoid re-triggering when they become read
      currentNotifications.forEach((notif) => {
        seenNotificationIdsRef.current.add(notif.id);
      });
    }
  }, [notificationsData]);

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.metadata?.productId) {
      if (notification.type === 'BOM_GENERATED') {
        navigate(`/bom?productId=${notification.metadata.productId}`);
      } else if (notification.type === 'SUPPLIERS_FOUND') {
        navigate(`/sourcing?productId=${notification.metadata.productId}`);
      }
    }
  };

  // Listen for auth required events
  useEffect(() => {
    const handleAuthRequired = () => {
      if (!isAuthenticated) {
        setAuthDialogOpen(true);
      }
    };
    window.addEventListener('auth:required', handleAuthRequired);
    return () => window.removeEventListener('auth:required', handleAuthRequired);
  }, [isAuthenticated]);
  
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 group">
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
              to="/marketing"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/marketing") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Marketing
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/upload">
                  <Button size="sm" className="gap-2 shadow-md hover:shadow-lg transition-all">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Product</span>
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="relative">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <DropdownMenuItem disabled className="text-center text-muted-foreground py-6">
                        No notifications
                      </DropdownMenuItem>
                    ) : (
                      <>
                        {notifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                              !notification.read ? 'bg-primary/5' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`font-semibold text-sm ${
                                !notification.read ? 'text-primary' : ''
                              }`}>
                                {notification.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-center justify-center"
                          onClick={() => navigate('/notifications')}
                        >
                          View All Notifications
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium hidden sm:inline">
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              !isLoading && (
                <Button 
                  size="sm" 
                  onClick={() => setAuthDialogOpen(true)}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
              )
            )}
          </div>
        </div>
      </div>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </nav>
  );
};
