import { Heart, Coffee } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, config: Record<string, string>) => void;
    };
  }
}

export default function Donation() {
  useEffect(() => {
    sessionStorage.removeItem('kofi-dismissed');
    
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
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleDonate = () => {
    window.open('https://ko-fi.com/krolist', '_blank');
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Heart className="h-8 w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Support Krolist</h1>
          <p className="text-muted-foreground">
            Your support helps keep Krolist free and enables new features for everyone.
          </p>
        </div>

        <Button 
          onClick={handleDonate}
          size="lg"
          className="gap-2"
        >
          <Coffee className="h-4 w-4" />
          Buy me a coffee
        </Button>

        <p className="text-sm text-muted-foreground">
          Thank you for your support! ❤️
        </p>
      </div>
    </div>
  );
}
