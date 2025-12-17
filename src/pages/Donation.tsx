import { Heart, Coffee, Sparkles, Star, Trophy, Target } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import confetti from "canvas-confetti";
declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, config: Record<string, string>) => void;
    };
  }
}
const milestones = [{
  target: 10,
  label: "First 10 Coffees",
  icon: Coffee,
  achieved: true
}, {
  target: 50,
  label: "Server Costs Covered",
  icon: Target,
  achieved: false
}, {
  target: 100,
  label: "New Feature Fund",
  icon: Sparkles,
  achieved: false
}, {
  target: 250,
  label: "Mobile App Development",
  icon: Trophy,
  achieved: false
}];
const recentSupporters = [{
  name: "Anonymous",
  amount: "☕",
  date: "Dec 2024"
}, {
  name: "Ahmed K.",
  amount: "☕☕",
  date: "Dec 2024"
}, {
  name: "Sarah M.",
  amount: "☕",
  date: "Nov 2024"
}, {
  name: "Anonymous",
  amount: "☕☕☕",
  date: "Nov 2024"
}, {
  name: "Khalid A.",
  amount: "☕",
  date: "Oct 2024"
}];
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
    // Fire confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: {
        y: 0.6
      },
      colors: ['#FF5E5B', '#fcbf47', '#00D4AA', '#7C3AED', '#F472B6']
    });

    // Fire side confetti
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: {
          x: 0
        },
        colors: ['#FF5E5B', '#fcbf47', '#00D4AA']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: {
          x: 1
        },
        colors: ['#FF5E5B', '#fcbf47', '#00D4AA']
      });
    }, 150);
    window.open('https://ko-fi.com/krolist', '_blank');
  };
  const currentProgress = 12; // Current coffee count

  return <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/25 animate-bounce">
            <Heart className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Support Krolist
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Help us keep Krolist free, fast, and full of features for everyone.
            </p>
          </div>

          <Button onClick={handleDonate} size="lg" className="gap-2 text-lg px-8 py-6 bg-[#FF5E5B] hover:bg-[#FF5E5B]/90 shadow-lg shadow-[#FF5E5B]/25 transition-all hover:scale-105">
            <Coffee className="h-5 w-5" />
            Buy me a coffee
          </Button>
        </div>
      </div>

      <div className="max-w-4xl space-y-12 px-0 mx-0">
        {/* Progress Section */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Milestones</h2>
            </div>
            
            <div className="space-y-4">
              {milestones.map((milestone, index) => {
              const progress = Math.min(currentProgress / milestone.target * 100, 100);
              const Icon = milestone.icon;
              return <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${milestone.achieved ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={milestone.achieved ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                          {milestone.label}
                        </span>
                        {milestone.achieved && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            ✓ Achieved
                          </span>}
                      </div>
                      <span className="text-muted-foreground">{currentProgress}/{milestone.target}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${milestone.achieved ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/20'}`} style={{
                    width: `${progress}%`
                  }} />
                    </div>
                  </div>;
            })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Supporters */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold">Recent Supporters</h2>
            </div>
            
            <div className="space-y-3 px-0 mx-0">
              {recentSupporters.map((supporter, index) => <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-medium">
                      {supporter.name.charAt(0)}
                    </div>
                    <span className="font-medium">{supporter.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg">{supporter.amount}</span>
                    <span className="text-xs text-muted-foreground">{supporter.date}</span>
                  </div>
                </div>)}
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              Join {recentSupporters.length}+ amazing supporters! 🎉
            </p>
          </CardContent>
        </Card>

        {/* Thank You */}
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">
            Every coffee helps keep Krolist running. Thank you! ❤️
          </p>
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => <Sparkles key={i} className="h-4 w-4 text-primary/60 animate-pulse" style={{
            animationDelay: `${i * 200}ms`
          }} />)}
          </div>
        </div>
      </div>
    </div>;
}