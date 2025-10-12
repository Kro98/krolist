import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, PenLine } from "lucide-react";
import { ManualProductForm } from "./ManualProductForm";

type Mode = 'select' | 'search' | 'manual';

export function AddProductForm() {
  const [mode, setMode] = useState<Mode>('select');
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate('/search-products');
  };

  const handleManualClick = () => {
    setMode('manual');
  };

  const handleBack = () => {
    setMode('select');
  };

  if (mode === 'manual') {
    return <ManualProductForm onBack={handleBack} />;
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-card">
      <CardHeader className="text-center">
        <CardTitle>Add a Product</CardTitle>
        <CardDescription>
          Choose how you'd like to add a product to track
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search Option */}
          <button
            onClick={handleSearchClick}
            className="group relative overflow-hidden rounded-lg border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Search for Products</h3>
                <p className="text-sm text-muted-foreground">
                  Search across multiple stores and compare prices from different sellers
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs bg-muted px-2 py-1 rounded">Amazon</span>
                <span className="text-xs bg-muted px-2 py-1 rounded">Noon</span>
                <span className="text-xs bg-muted px-2 py-1 rounded">More...</span>
              </div>
            </div>
          </button>

          {/* Manual Option */}
          <button
            onClick={handleManualClick}
            className="group relative overflow-hidden rounded-lg border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <PenLine className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Add Manually</h3>
                <p className="text-sm text-muted-foreground">
                  Paste a product URL and we'll auto-fill the details, or enter everything manually
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs bg-muted px-2 py-1 rounded">Any URL</span>
                <span className="text-xs bg-muted px-2 py-1 rounded">Full Control</span>
              </div>
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
