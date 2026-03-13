import { ArrowUpDown, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";

export type SortOption = 'newest' | 'price-low' | 'price-high' | 'discount';
export type StoreFilter = string | null;

interface AffiliateFilterProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  storeFilter: StoreFilter;
  onStoreFilterChange: (store: StoreFilter) => void;
  availableStores: string[];
}

export function AffiliateFilter({
  isOpen,
  onClose,
  sortBy,
  onSortChange,
  storeFilter,
  onStoreFilterChange,
  availableStores
}: AffiliateFilterProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const sortOptions: { value: SortOption; label: string; labelAr: string }[] = [
    { value: 'newest', label: 'Newest First', labelAr: 'الأحدث أولاً' },
    { value: 'price-low', label: 'Price: Low to High', labelAr: 'السعر: من الأقل للأعلى' },
    { value: 'price-high', label: 'Price: High to Low', labelAr: 'السعر: من الأعلى للأقل' },
    { value: 'discount', label: 'Biggest Discount', labelAr: 'أكبر خصم' },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isArabic ? 'تصفية وترتيب' : 'Filter & Sort'}
          </DrawerTitle>
        </DrawerHeader>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Sort Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowUpDown className="w-4 h-4" />
              {isArabic ? 'ترتيب حسب' : 'Sort by'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={cn(
                    "p-3 rounded-xl text-sm text-left",
                    "border transition-all duration-200",
                    sortBy === option.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {isArabic ? option.labelAr : option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Store Filter */}
          {availableStores.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Store className="w-4 h-4" />
                {isArabic ? 'تصفية حسب المتجر' : 'Filter by Store'}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onStoreFilterChange(null)}
                  className={cn(
                    "px-3 py-2 rounded-full text-sm",
                    "border transition-all duration-200",
                    storeFilter === null
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {isArabic ? 'الكل' : 'All'}
                </button>
                {availableStores.map((store) => (
                  <button
                    key={store}
                    onClick={() => onStoreFilterChange(store)}
                    className={cn(
                      "px-3 py-2 rounded-full text-sm capitalize",
                      "border transition-all duration-200",
                      storeFilter === store
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    {store}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DrawerFooter className="flex-row gap-3 pb-8">
          <button
            onClick={() => {
              onSortChange('newest');
              onStoreFilterChange(null);
            }}
            className="flex-1 p-3 rounded-xl border border-border/50 hover:bg-muted/50 text-sm font-medium transition-colors"
          >
            {isArabic ? 'إعادة تعيين' : 'Reset'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 p-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
          >
            {isArabic ? 'تطبيق' : 'Apply'}
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
