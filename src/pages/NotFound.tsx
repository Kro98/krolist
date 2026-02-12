import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Search, Gift, Tag, Sparkles, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { restApiUrl, restHeaders } from '@/config/supabase';
import { PageSEO } from '@/components/seo/PageSEO';

interface SuggestedProduct {
  id: string;
  title: string;
  image_url: string | null;
  current_price: number | null;
  currency: string | null;
}

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
    
    // Fetch a few random products as suggestions using raw RPC to avoid type recursion
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          restApiUrl('krolist_products?select=id,title,image_url,current_price,currency&is_active=eq.true&limit=4'),
          { headers: restHeaders }
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setSuggestedProducts(data);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    };
    
    fetchSuggestions();
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search-products?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const quickLinks = [
    { icon: Gift, label: isArabic ? 'المنتجات' : 'Products', to: '/products', color: 'from-pink-500 to-rose-500' },
    { icon: Tag, label: isArabic ? 'أكواد الخصم' : 'Promo Codes', to: '/promo-codes', color: 'from-violet-500 to-purple-500' },
    { icon: Sparkles, label: isArabic ? 'ستيكرات' : 'Stickers', to: '/stickers', color: 'from-amber-500 to-orange-500' },
  ];

  // Floating shapes for background
  const floatingShapes = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 30,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 2,
  }));

  return (
    <>
      <PageSEO
        title={isArabic ? 'الصفحة غير موجودة' : 'Page Not Found'}
        description={isArabic ? 'عذراً، الصفحة التي تبحث عنها غير موجودة.' : "Sorry, the page you're looking for doesn't exist."}
        noIndex={true}
      />
      
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted">
        {/* Animated background shapes */}
        {floatingShapes.map((shape) => (
          <motion.div
            key={shape.id}
            className="absolute rounded-full opacity-10 bg-gradient-to-br from-primary to-secondary"
            style={{
              width: shape.size,
              height: shape.size,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              delay: shape.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
          {/* Main 404 content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            {/* Animated 404 number */}
            <motion.div
              className="relative mb-6"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <span className="text-[150px] sm:text-[200px] font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-none">
                404
              </span>
              <motion.div
                className="absolute -top-4 -right-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Frown className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
              </motion.div>
            </motion.div>

            {/* Error message */}
            <motion.h1
              className="text-2xl sm:text-3xl font-bold mb-3 text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {isArabic ? 'عذراً، الصفحة غير موجودة!' : 'Oops! Page not found'}
            </motion.h1>
            
            <motion.p
              className="text-muted-foreground mb-8 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isArabic 
                ? 'يبدو أن هذه الصفحة قد انتقلت أو لم تعد موجودة. لا تقلق، لدينا الكثير من الأشياء الرائعة لاكتشافها!'
                : "This page seems to have wandered off. Don't worry, we have plenty of cool stuff to explore!"}
            </motion.p>

            {/* Search bar */}
            <motion.form
              onSubmit={handleSearch}
              className="flex gap-2 max-w-md mx-auto mb-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={isArabic ? 'ابحث عن منتج...' : 'Search for products...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" className="shrink-0">
                {isArabic ? 'بحث' : 'Search'}
              </Button>
            </motion.form>

            {/* Quick links */}
            <motion.div
              className="flex flex-wrap justify-center gap-3 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {quickLinks.map((link, index) => (
                <motion.div
                  key={link.to}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to={link.to}>
                    <Button
                      variant="outline"
                      className={`gap-2 border-2 hover:border-primary/50 transition-all`}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Back home button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/products">
                <Button size="lg" className="gap-2 text-lg px-8">
                  <Home className="w-5 h-5" />
                  {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Suggested products */}
          {suggestedProducts.length > 0 && (
            <motion.div
              className="mt-16 w-full max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-lg font-semibold text-center mb-6 text-muted-foreground">
                {isArabic ? 'قد يعجبك أيضاً' : 'You might also like'}
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {suggestedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Link to={`/products`} className="block">
                      <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
                        <div className="aspect-square bg-muted">
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-medium truncate text-foreground">
                            {product.title}
                          </p>
                          <p className="text-xs text-primary font-bold mt-1">
                            {product.current_price} {product.currency}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotFound;
