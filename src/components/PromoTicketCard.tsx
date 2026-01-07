import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Clock, Calendar, Edit, Trash2, Scissors } from "lucide-react";
import { format } from "date-fns";
import { getStoreIcon, getStoreById } from "@/config/stores";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

interface PromoTicketCardProps {
  promo: {
    id: string;
    code: string;
    store: string;
    description: string;
    expires: string;
    used: boolean;
    reusable: boolean;
    custom_image_url?: string;
    custom_shop_name?: string;
    custom_icon_url?: string;
    card_color?: string;
    card_background?: string;
  };
  isKrolist?: boolean;
  onCopy: (code: string) => void;
  onEdit?: (promo: any) => void;
  onDelete?: (id: string) => void;
  getTimeUntilExpiration: (date: string) => { text: string; variant: "default" | "secondary" | "destructive" };
}

export default function PromoTicketCard({
  promo,
  isKrolist = false,
  onCopy,
  onEdit,
  onDelete,
  getTimeUntilExpiration,
}: PromoTicketCardProps) {
  const { t } = useLanguage();
  const storeIcon = promo.custom_icon_url || promo.custom_image_url || getStoreIcon(promo.store);
  const storeConfig = getStoreById(promo.store.toLowerCase());
  const displayName = promo.custom_shop_name || promo.store;
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Get gradient based on custom color or brand
  const getGradientStyle = () => {
    // If custom card_color is provided, use it
    if (promo.card_color) {
      return { background: `linear-gradient(135deg, ${promo.card_color}, ${promo.card_color}88)` };
    }
    // Otherwise use brand color
    const brandColor = storeConfig?.brandColor || 'primary';
    const gradients: Record<string, string> = {
      purple: 'linear-gradient(135deg, rgb(124, 58, 237), rgb(91, 33, 182))',
      orange: 'linear-gradient(135deg, rgb(249, 115, 22), rgb(194, 65, 12))',
      blue: 'linear-gradient(135deg, rgb(59, 130, 246), rgb(29, 78, 216))',
      yellow: 'linear-gradient(135deg, rgb(234, 179, 8), rgb(161, 98, 7))',
      red: 'linear-gradient(135deg, rgb(239, 68, 68), rgb(185, 28, 28))',
      pink: 'linear-gradient(135deg, rgb(236, 72, 153), rgb(190, 24, 93))',
      slate: 'linear-gradient(135deg, rgb(71, 85, 105), rgb(30, 41, 59))',
    };
    return { background: gradients[brandColor] || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))' };
  };

  const isUsed = promo.used && !promo.reusable;

  return (
    <div 
      className={`relative group ${isUsed ? 'opacity-60' : ''}`}
      style={{
        animation: hasAnimated ? 'none' : 'ticket-appear 0.5s ease-out forwards',
        opacity: hasAnimated ? 1 : 0,
      }}
    >
      {/* Ticket shape with perforated edges */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
        {/* Shimmer overlay on first appear */}
        <div 
          className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
          style={{
            opacity: hasAnimated ? 0 : 1,
            transition: 'opacity 0.5s ease-out 0.3s',
          }}
        >
          <div 
            className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              animation: 'ticket-shimmer 0.8s ease-out forwards',
              animationDelay: '0.2s',
            }}
          />
        </div>

        {/* Background with store icon or custom image */}
        <div className="absolute inset-0" style={getGradientStyle()}>
          {/* Custom background image */}
          {promo.card_background && (
            <img 
              src={promo.card_background} 
              alt={displayName}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          {/* Legacy custom_image_url support */}
          {!promo.card_background && promo.custom_image_url && (
            <img 
              src={promo.custom_image_url} 
              alt={displayName}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          {/* Large store icon as watermark (only for non-custom images) */}
          {storeIcon && !promo.custom_image_url && !promo.card_background && !promo.custom_icon_url && (
            <div className="absolute -right-8 -bottom-8 opacity-20">
              <img 
                src={storeIcon} 
                alt={displayName}
                className="w-40 h-40 object-contain"
              />
            </div>
          )}
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full" />
            <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full" />
            <div className="absolute bottom-4 left-4 w-2 h-2 bg-white rounded-full" />
            <div className="absolute bottom-4 right-4 w-2 h-2 bg-white rounded-full" />
          </div>
        </div>

        {/* Perforated edge left */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-background rounded-full" />
        
        {/* Perforated edge right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-background rounded-full" />

        {/* Dashed line for tear */}
        <div className="absolute left-6 right-6 top-1/2 border-t-2 border-dashed border-white/20" />

        {/* Content */}
        <div className="relative z-10 p-5">
          {/* Top section - Code & Store */}
          <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
              {storeIcon && (
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden shadow-inner">
                  <img 
                    src={storeIcon} 
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
                  {displayName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {isKrolist && (
                    <Badge className="bg-white/20 text-white border-white/30 text-[10px] px-1.5 py-0">
                      Krolist
                    </Badge>
                  )}
                  {promo.reusable && (
                    <Badge className="bg-emerald-500/30 text-emerald-100 border-emerald-400/30 text-[10px] px-1.5 py-0">
                      <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                      {t('promo.reusable')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Scissors className="w-5 h-5 text-white/40 rotate-90" />
          </div>

          {/* Code display */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
            <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">{t('promo.code')}</p>
            <p className="font-mono font-bold text-white text-2xl tracking-wider">
              {promo.code}
            </p>
          </div>

          {/* Description */}
          <p className="text-white/80 text-sm mb-3 line-clamp-2">
            {promo.description}
          </p>

          {/* Bottom section - Expiry & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-white/60 text-xs">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(promo.expires), 'MMM dd, yyyy')}</span>
              </div>
              <Badge 
                variant={getTimeUntilExpiration(promo.expires).variant}
                className="text-[10px] w-fit bg-white/20 border-white/30"
              >
                <Clock className="h-2.5 w-2.5 mr-1" />
                {getTimeUntilExpiration(promo.expires).text}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {!isKrolist && onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(promo)}
                  className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white border-0"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
              {!isKrolist && onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(promo.id)}
                  className="h-8 w-8 p-0 bg-white/10 hover:bg-red-500/30 text-white border-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onCopy(promo.code)}
                disabled={isUsed}
                className="bg-white text-slate-900 hover:bg-white/90 font-semibold px-4 shadow-lg"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                {t('promo.copy')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
