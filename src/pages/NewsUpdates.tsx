import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Megaphone, Sparkles, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { AdSpace } from "@/components/AdSpace";
interface NewsItem {
  id: string;
  title: string;
  date: string;
  category: "announcement" | "update" | "feature";
  content: string;
}
const newsItems: NewsItem[] = [{
  id: "1",
  title: "Welcome to Our Price Comparison Platform!",
  date: "2025-10-12",
  category: "announcement",
  content: "We're excited to launch our affiliate price comparison platform. Search for products across multiple Saudi stores including Noon, Amazon, and more. Get the best deals with our real-time price tracking."
}, {
  id: "2",
  title: "New Feature: Product Search",
  date: "2025-10-12",
  category: "feature",
  content: "Introducing our powerful product search feature! Search across Noon and Amazon to find the best prices. Our affiliate links help support the platform while you save money."
}, {
  id: "3",
  title: "Coming Soon: More Stores",
  date: "2025-10-12",
  category: "update",
  content: "We're working on adding support for Shein, IKEA, Namshi, Trendyol, ASOS, and more Saudi retailers. Stay tuned!"
}];
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "announcement":
      return <Megaphone className="h-4 w-4" />;
    case "feature":
      return <Sparkles className="h-4 w-4" />;
    case "update":
      return <Calendar className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};
const getCategoryColor = (category: string) => {
  switch (category) {
    case "announcement":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
    case "feature":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
    case "update":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30";
  }
};
export default function NewsUpdates() {
  const {
    t
  } = useLanguage();
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">News & Updates</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/privacy-policy')} className="gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </Button>
          </div>
          <p className="text-lg text-muted-foreground">
            Stay informed about new features, announcements, and platform updates
          </p>
        </div>
      </div>

      {/* Main Layout with Ad Spaces */}
      <div className="flex gap-6 items-start py-8">
        {/* Left Ad Spaces */}
        <div className="w-[250px] sticky top-6 hidden lg:flex flex-col gap-6">
          <AdSpace height="h-[250px]" />
          <AdSpace height="h-[600px]" />
        </div>

        {/* News Items */}
        <div className="flex-1 max-w-4xl px-4">
          <div className="space-y-6">
            {newsItems.map((item, index) => <Card key={item.id} className="p-6 hover:shadow-lg transition-all">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getCategoryColor(item.category)} border`}>
                        <span className="flex items-center gap-1.5">
                          {getCategoryIcon(item.category)}
                          <span className="capitalize">{item.category}</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(item.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-semibold">{item.title}</h2>

                  <Separator />

                  {/* Content */}
                  <p className="text-muted-foreground leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </Card>)}
          </div>

          {/* Future Plans Section */}
          <Card className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-background border-2 border-primary/20">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">What's Next?</h2>
              </div>
              <Separator />
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Integration with more Saudi stores (Shein, IKEA, Namshi, Trendyol, ASOS)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Price history tracking and alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>User accounts and saved product lists</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Advanced filtering and sorting options</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Mobile app for iOS and Android</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Right Ad Spaces */}
        <div className="w-[250px] sticky top-6 hidden lg:flex flex-col gap-6">
          <AdSpace height="h-[250px]" />
          <AdSpace height="h-[250px]" className="py-[450px]" />
        </div>
      </div>
    </div>;
}