import { Card } from "@/components/ui/card";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function HowToUseSearch() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Button variant="ghost" size="sm" onClick={() => navigate("/search-products")} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">How to Use Product Search</h1>
          </div>
          <p className="text-lg text-muted-foreground">Learn how to find and track the best deals on your favorite products</p>
        </div>
      </div>

      {/* Tutorial Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Section 1 */}
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Step 1: Enter Your Search Query</h2>
            <div className="space-y-4">
              {/* Placeholder for screenshot */}
              <div className="w-full h-64 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <p className="text-muted-foreground">Screenshot placeholder - Search bar example</p>
              </div>
              {/* Explanation space */}
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  Add your explanation here about how to enter search queries, what to search for, and best practices.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2 */}
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Step 2: Review Search Results</h2>
            <div className="space-y-4">
              {/* Placeholder for screenshot */}
              <div className="w-full h-64 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <p className="text-muted-foreground">Screenshot placeholder - Search results example</p>
              </div>
              {/* Explanation space */}
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  Add your explanation here about how to read search results, compare prices across sellers, and identify the best deals.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 3 */}
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Step 3: Track Products</h2>
            <div className="space-y-4">
              {/* Placeholder for screenshot */}
              <div className="w-full h-64 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <p className="text-muted-foreground">Screenshot placeholder - Track button example</p>
              </div>
              {/* Explanation space */}
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  Add your explanation here about how to track products, what happens when you track them, and how to view tracked products.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 4 */}
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Search Limits & Tips</h2>
            <div className="space-y-4">
              {/* Placeholder for screenshot */}
              <div className="w-full h-64 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <p className="text-muted-foreground">Screenshot placeholder - Search limits badge example</p>
              </div>
              {/* Explanation space */}
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  Add your explanation here about daily search limits, when they reset, and tips for making the most of your searches.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
