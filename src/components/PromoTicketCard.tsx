import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Clock, Calendar, Edit, Trash2, Scissors } from "lucide-react";
import { format } from "date-fns";
import { getStoreIcon, getStoreById } from "@/config/stores";
import { useLanguage } from "@/contexts/LanguageContext";

interface PromoTicketCardProps {
  promo: {
    id: string;
    code: string;
    store: string;
    description: string;
    expires: string;
    used: boolean;
    reusable: boolean;
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
  const storeIcon = getStoreIcon(promo.store);
  const storeConfig = getStoreById(promo.store.toLowerCase());
  
  // Get brand color class based on store
  const getBrandGradient = () => {
    const brandColor = storeConfig?.brandColor || 'primary';
    const gradients: Record<string, string> = {
      purple: 'from-purple-600/90 via-purple-700/85 to-purple-900/90',
      orange: 'from-orange-500/90 via-orange-600/85 to-orange-800/90',
      blue: 'from-blue-600/90 via-blue-700/85 to-blue-900/90',
      yellow: 'from-yellow-500/90 via-yellow-600/85 to-yellow-800/90',
      red: 'from-red-500/90 via-red-600/85 to-red-800/90',
      pink: 'from-pink-500/90 via-pink-600/85 to-pink-800/90',
      slate: 'from-slate-600/90 via-slate-700/85 to-slate-900/90',
    };
    return gradients[brandColor] || 'from-primary/90 via-primary/85 to-primary/90';
  };

  const isUsed = promo.used && !promo.reusable;

  return (
    <div className={`relative group ${isUsed ? 'opacity-60' : ''}`}>
      {/* Ticket shape with perforated edges */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
        {/* Background with store icon */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getBrandGradient()}`}>
          {/* Large store icon as watermark */}
          {storeIcon && (
            <div className="absolute -right-8 -bottom-8 opacity-20">
              <img 
                src={storeIcon} 
                alt={promo.store}
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
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-2 shadow-inner">
                  <img 
                    src={storeIcon} 
                    alt={promo.store}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
                  {promo.store}
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
