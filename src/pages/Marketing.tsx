import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CampaignROIChart } from "@/components/charts/CampaignROIChart";
import { EngagementFunnelChart } from "@/components/charts/EngagementFunnelChart";
import { 
  TrendingUp, 
  Users, 
  MousePointerClick,
  DollarSign,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Play,
  Pause,
  BarChart3,
  Target
} from "lucide-react";

export default function Marketing() {
  const campaigns = [
    {
      id: 1,
      name: "Premium Denim Launch - Instagram",
      platform: "Instagram",
      icon: Instagram,
      status: "active",
      budget: "$2,500",
      spent: "$1,840",
      reach: "145K",
      engagement: "8.2K",
      conversions: "234",
      roi: "185%",
      progress: 73
    },
    {
      id: 2,
      name: "Facebook Carousel Ads",
      platform: "Facebook",
      icon: Facebook,
      status: "active",
      budget: "$1,800",
      spent: "$1,120",
      reach: "98K",
      engagement: "5.4K",
      conversions: "156",
      roi: "142%",
      progress: 62
    },
    {
      id: 3,
      name: "Twitter Brand Awareness",
      platform: "Twitter",
      icon: Twitter,
      status: "paused",
      budget: "$1,200",
      spent: "$450",
      reach: "67K",
      engagement: "3.1K",
      conversions: "89",
      roi: "98%",
      progress: 38
    }
  ];

  const analytics = [
    {
      metric: "Total Reach",
      value: "310K",
      change: "+24%",
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      metric: "Engagement Rate",
      value: "6.8%",
      change: "+1.2%",
      icon: MousePointerClick,
      color: "text-success",
      bg: "bg-success/10"
    },
    {
      metric: "Total Conversions",
      value: "479",
      change: "+18%",
      icon: TrendingUp,
      color: "text-warning",
      bg: "bg-warning/10"
    },
    {
      metric: "Average ROI",
      value: "152%",
      change: "+12%",
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10"
    }
  ];

  const contentPipeline = [
    {
      type: "Product Photography",
      status: "Published",
      platforms: ["Instagram", "Facebook"],
      engagement: "High",
      posts: 12
    },
    {
      type: "Behind the Scenes",
      status: "Scheduled",
      platforms: ["Instagram", "TikTok"],
      engagement: "Medium",
      posts: 8
    },
    {
      type: "Customer Testimonials",
      status: "In Production",
      platforms: ["Facebook", "Twitter"],
      engagement: "High",
      posts: 6
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Marketing Command Center
          </h1>
          <p className="text-muted-foreground">
            AI-powered campaign management and social media automation
          </p>
        </div>

        {/* Analytics Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {analytics.map((stat, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-lg transition-all border-border/50 bg-card/50 backdrop-blur"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.metric}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-success flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change} vs last period
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Active Campaigns */}
        <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Active Campaigns</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Automated social media campaigns across platforms
                </p>
              </div>
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                Create Campaign
              </Button>
            </div>
          </div>
          
          <div className="divide-y divide-border/50">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6 hover:bg-muted/20 transition-colors">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
                        <campaign.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <Badge 
                            variant={campaign.status === "active" ? "default" : "secondary"}
                            className="gap-1"
                          >
                            {campaign.status === "active" ? (
                              <Play className="w-3 h-3" />
                            ) : (
                              <Pause className="w-3 h-3" />
                            )}
                            {campaign.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Budget</p>
                            <p className="font-semibold">{campaign.budget}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Spent</p>
                            <p className="font-semibold text-primary">{campaign.spent}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Reach</p>
                            <p className="font-semibold">{campaign.reach}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Conversions</p>
                            <p className="font-semibold text-success">{campaign.conversions}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">ROI</p>
                            <p className="font-semibold text-warning">{campaign.roi}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Budget Used</span>
                            <span className="font-medium">{campaign.progress}%</span>
                          </div>
                          <Progress value={campaign.progress} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        Analytics
                      </Button>
                      <Button 
                        size="sm" 
                        variant={campaign.status === "active" ? "outline" : "default"}
                      >
                        {campaign.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Content Pipeline */}
        <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-2xl font-bold">Content Pipeline</h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated content across all social platforms
            </p>
          </div>
          
          <div className="divide-y divide-border/50">
            {contentPipeline.map((content, index) => (
              <div key={index} className="p-6 hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg">{content.type}</h3>
                      <Badge variant="outline">{content.status}</Badge>
                      <Badge 
                        variant={content.engagement === "High" ? "default" : "secondary"}
                        className="gap-1"
                      >
                        <TrendingUp className="w-3 h-3" />
                        {content.engagement} Engagement
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {content.platforms.map((platform, pIndex) => (
                          <Badge key={pIndex} variant="secondary" className="gap-1.5">
                            {platform === "Instagram" && <Instagram className="w-3 h-3" />}
                            {platform === "Facebook" && <Facebook className="w-3 h-3" />}
                            {platform === "Twitter" && <Twitter className="w-3 h-3" />}
                            {platform === "TikTok" && <Youtube className="w-3 h-3" />}
                            {platform}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {content.posts} posts
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    View Content
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Analytics Charts */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Campaign Analytics</h2>
              <p className="text-sm text-muted-foreground">
                Detailed performance metrics and conversion insights
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CampaignROIChart />
            <EngagementFunnelChart />
          </div>

          {/* AI Recommendations */}
          <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-3">AI Marketing Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Increase TikTok Budget</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        TikTok shows 220% ROI. Consider reallocating 30% from Twitter for maximum efficiency.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                    <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Optimize Posting Times</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Engagement peaks at 7-9 PM EST. Schedule posts during this window for 24% higher reach.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                    <Users className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Target Lookalike Audiences</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create lookalike audiences from your top 5% converters to reduce CPA by estimated 18%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
