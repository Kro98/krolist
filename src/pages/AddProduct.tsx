import { AddProductForm } from "@/components/AddProductForm";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AddProduct() {
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link to="/products">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
        </Link>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <AddProductForm />
      </div>

      {/* Help Section */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg">Supported Stores</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              SHEIN
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Noon
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Amazon
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium mb-2">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Paste any product URL from supported stores</li>
              <li>We automatically extract the product details</li>
              <li>Choose your tracking frequency (daily/weekly)</li>
              <li>Get notified when prices change</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}