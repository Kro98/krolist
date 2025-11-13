import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart as CartIcon, Trash2, Plus, Minus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { replaceWithAffiliateLink } from '@/lib/affiliateLinks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import krolistCartLogo from '@/assets/krolist-cart-custom.png';
export function ShoppingCart({
  onAddClick
}: {
  onAddClick?: React.ReactNode;
}) {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    updateQuantity,
    totalItems
  } = useCart();
  const {
    t,
    currency
  } = useLanguage();
  const {
    user
  } = useAuth();
  const [showKrolistOrder, setShowKrolistOrder] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalAmount = cartItems.reduce((sum, item) => sum + item.current_price * item.quantity, 0);
  const handleDirectBuy = () => {
    // Group products by store
    const stores = [...new Set(cartItems.map(item => item.store))];
    stores.forEach(store => {
      const storeProducts = cartItems.filter(item => item.store === store);
      const storeUrl = replaceWithAffiliateLink(`https://${store.toLowerCase()}.com`);
      window.open(storeUrl, '_blank');
    });
    toast.success(t('cart.toast.openingStores'));
  };
  const handleKrolistOrder = async () => {
    if (!customerName || !customerPhone) {
      toast.error(t('cart.orderDialog.namePhoneRequired'));
      return;
    }
    setIsSubmitting(true);
    try {
      const orderData = {
        user_id: user?.id || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        products: cartItems.map(item => ({
          id: item.id,
          title: item.title,
          store: item.store,
          price: item.current_price,
          currency: item.currency,
          quantity: item.quantity,
          product_url: item.product_url
        })),
        total_amount: cartItems.reduce((sum, item) => sum + item.current_price * item.quantity, 0),
        currency: currency,
        status: 'pending'
      };
      const {
        error
      } = await supabase.from('orders').insert([orderData]);
      if (error) throw error;
      toast.success(t('cart.orderDialog.success'));
      clearCart();
      setShowKrolistOrder(false);
      setCustomerName('');
      setCustomerPhone('');
    } catch (error: any) {
      toast.error(error.message || t('cart.orderDialog.error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  return <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative mx-0">
            <CartIcon className="h-5 w-5" />
            {totalItems > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {totalItems}
              </Badge>}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header with gradient background */}
          <SheetHeader className="bg-gradient-to-r from-[hsl(31,98%,51%)] to-[hsl(38,90%,55%)] p-6 pb-8 relative py-[15px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={krolistCartLogo} alt="Krolist" className="h-24 w-24" />
                <div>
                  <SheetTitle className="text-white text-2xl font-bold">
                    {t('cart.title')}
                  </SheetTitle>
                </div>
              </div>
              {onAddClick}
            </div>
          </SheetHeader>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                {t('cart.emptyCart')}
              </div> : <>
                {cartItems.map(item => <div key={item.id} className="bg-primary/10 dark:bg-primary/20 rounded-lg p-3 flex items-center gap-3 relative border border-primary/20">
                    {/* Product Image */}
                    {item.image_url && <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>}
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-foreground">
                        {item.title}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {item.current_price} {item.currency}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-foreground/90 rounded-full px-2 py-1">
                      <button onClick={() => {
                  if (item.quantity > 1) {
                    updateQuantity(item.id, item.quantity - 1);
                  }
                }} className="w-6 h-6 rounded-full bg-background text-foreground flex items-center justify-center hover:bg-background/80 transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-background font-bold min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-background text-foreground flex items-center justify-center hover:bg-background/80 transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button onClick={() => removeFromCart(item.id)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>)}
              </>}
          </div>

          {/* Footer with Total and Buttons */}
          {cartItems.length > 0 && <div className="border-t border-border p-4 space-y-3 bg-card">
              {/* Total */}
              <div className="flex items-center justify-between px-2">
                <span className="text-xl font-bold text-foreground">{t('cart.total')}</span>
                <span className="text-2xl font-bold text-foreground">
                  {totalAmount.toFixed(2)} {currency}
                </span>
              </div>

              {/* Action Button */}
              <Button onClick={() => setShowKrolistOrder(true)} className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold">
                {t('cart.sendOrder')}
              </Button>
            </div>}
        </SheetContent>
      </Sheet>

      <Dialog open={showKrolistOrder} onOpenChange={setShowKrolistOrder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cart.orderDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('cart.orderDialog.fullName')} *</Label>
              <Input id="name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t('cart.orderDialog.fullNamePlaceholder')} />
            </div>
            <div>
              <Label htmlFor="phone">{t('cart.orderDialog.phone')} *</Label>
              <Input id="phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder={t('cart.orderDialog.phonePlaceholder')} />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>{t('cart.orderDialog.totalItems')}: {totalItems}</p>
              <p>{t('cart.orderDialog.description')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKrolistOrder(false)}>
              {t('cart.orderDialog.cancel')}
            </Button>
            <Button onClick={handleKrolistOrder} disabled={isSubmitting}>
              {isSubmitting ? t('cart.orderDialog.submitting') : t('cart.orderDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}