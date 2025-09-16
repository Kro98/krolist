import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Coffee, Gift, Star } from "lucide-react";

const donationTiers = [
  {
    name: "Coffee",
    amount: 5,
    icon: Coffee,
    description: "Buy me a coffee to fuel late-night coding sessions",
    color: "bg-amber-500"
  },
  {
    name: "Supporter",
    amount: 15,
    icon: Heart,
    description: "Show your appreciation for the app and its features",
    color: "bg-rose-500"
  },
  {
    name: "Champion",
    amount: 30,
    icon: Star,
    description: "Help prioritize new features and improvements",
    color: "bg-purple-500"
  },
  {
    name: "Patron",
    amount: 50,
    icon: Gift,
    description: "Support the long-term development of PriceTracker",
    color: "bg-blue-500"
  },
];

export default function Donation() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

      {/* Donation Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {donationTiers.map((tier) => (
          <Card key={tier.name} className="shadow-card hover:shadow-hover transition-all duration-300 text-center">
            <CardHeader>
              <div className="mx-auto mb-2">
                <div className={`${tier.color} p-3 rounded-full inline-flex`}>
                  <tier.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <div className="text-3xl font-bold text-primary">
                ${tier.amount}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {tier.description}
              </CardDescription>
              <Button className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200">
                Donate ${tier.amount}
              </Button>
            </CardContent>
          </Card>
        ))}
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

          <p className="text-sm text-muted-foreground">
            Even if you can't contribute financially, sharing the app with friends who might find it useful 
            is greatly appreciated! ❤️
          </p>
        </CardContent>
      </Card>

      {/* Alternative Support */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Other Ways to Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-1">Rate the App</h3>
              <p className="text-sm text-muted-foreground">Leave a review on app stores</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Heart className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-1">Share with Friends</h3>
              <p className="text-sm text-muted-foreground">Tell others about PriceTracker</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Gift className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-1">Provide Feedback</h3>
              <p className="text-sm text-muted-foreground">Help improve the app</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}