import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { useEffect } from "react";
declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, config: Record<string, string>) => void;
    };
  }
}
export default function Donation() {
  useEffect(() => {
    // Load Ko-fi widget script
    const script = document.createElement('script');
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;
    script.onload = () => {
      if (window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.draw('krolist', {
          'type': 'floating-chat',
          'floating-chat.donateButton.text': 'Donate',
          'floating-chat.donateButton.background-color': '#fcbf47',
          'floating-chat.donateButton.text-color': '#323842'
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  return <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-gradient-primary p-4 rounded-full">
            <Heart className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Support PriceTracker</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          PriceTracker is a passion project built to help people save money on their purchases. 
          Your support helps keep the app running and enables new features.
        </p>
      </div>

      {/* Thank You Message */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Thank You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for considering supporting PriceTracker! Your generosity means the world to me and helps ensure 
            that this tool remains free and continues to improve.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What your support helps with:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Server costs for web scraping and price monitoring</li>
              <li>Development of new features and improvements</li>
              <li>Adding support for more stores and regions</li>
              <li>Enhanced notification systems</li>
              <li>Mobile app development</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Free Forever</Badge>
            <Badge variant="secondary">No Ads</Badge>
            <Badge variant="secondary">Open Source</Badge>
            <Badge variant="secondary">Community Driven</Badge>
          </div>

          <p className="text-sm text-muted-foreground">Even if you can't contribute financially, sharing this project with friends who might find it useful is greatly appreciated! ❤️</p>
        </CardContent>
      </Card>

    </div>;
}