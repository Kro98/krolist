import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, PenLine } from "lucide-react";
import { ManualProductForm } from "./ManualProductForm";
import { useLanguage } from "@/contexts/LanguageContext";

type Mode = 'select' | 'search' | 'manual';

export function AddProductForm() {
  const [mode, setMode] = useState<Mode>('select');
  const navigate = useNavigate();
  const { t } = useLanguage();

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
        <CardTitle>{t('products.addProduct')}</CardTitle>
        <CardDescription>
          {t('products.addProductDesc')}
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
                <h3 className="text-lg font-semibold mb-2">{t('products.searchForProducts')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('products.searchProductsDesc')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs bg-muted px-2 py-1 rounded">Amazon</span>
                <span className="text-xs bg-muted px-2 py-1 rounded">Noon</span>
                <span className="text-xs bg-muted px-2 py-1 rounded">{t('products.more')}</span>
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
                <h3 className="text-lg font-semibold mb-2">{t('products.addManually')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('products.addManuallyDesc')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs bg-muted px-2 py-1 rounded">{t('products.anyURL')}</span>
                <span className="text-xs bg-muted px-2 py-1 rounded">{t('products.fullControl')}</span>
              </div>
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
