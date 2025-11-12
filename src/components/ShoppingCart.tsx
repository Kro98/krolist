import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart as CartIcon, Trash2, ExternalLink, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { replaceWithAffiliateLink } from '@/lib/affiliateLinks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
export function ShoppingCart({
  onAddClick
}: {
  onAddClick?: () => void;
}) {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    getCartItemsByStore,
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
  const itemsByStore = getCartItemsByStore();
  const handleDirectBuy = (store: string, products: typeof cartItems) => {
    const storeUrl = replaceWithAffiliateLink(`https://${store.toLowerCase()}.com`);
    const productUrls = products.map(p => replaceWithAffiliateLink(p.product_url)).join('\n');
    toast.success(`Opening ${store} store with ${products.length} products`);
    window.open(storeUrl, '_blank');
  };
  const handleKrolistOrder = async () => {
    if (!customerName || !customerPhone) {
      toast.error('Please provide your name and phone number');
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
      toast.success('Order submitted successfully! Admins will contact you soon.');
      clearCart();
      setShowKrolistOrder(false);
      setCustomerName('');
      setCustomerPhone('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };
  return <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <CartIcon className="h-5 w-5" />
            {totalItems > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {totalItems}
              </Badge>}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>{t('cart.title') || 'Shopping Cart'}</SheetTitle>
                <SheetDescription>
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} in cart
                </SheetDescription>
              </div>
              {onAddClick}
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {Object.keys(itemsByStore).length === 0 ? <div className="text-center py-12 text-muted-foreground">
                Your cart is empty
              </div> : <>
                {Object.entries(itemsByStore).map(([store, products]) => <div key={store} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{store}</h3>
                      <Badge>{products.length} items</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {products.map(item => <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                          {item.image_url && <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.current_price} {item.currency} × {item.quantity}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>)}
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 gap-2" onClick={() => handleDirectBuy(store, products)}>
                        <ExternalLink className="h-4 w-4" />
                        Buy from {store}
                      </Button>
                    </div>
                    <Separator />
                  </div>)}

                <div className="sticky bottom-0 bg-background pt-4 space-y-3">
                  <Button className="w-full gap-2 bg-primary" onClick={() => setShowKrolistOrder(true)}>
                    Buy through Krolist
                  </Button>
                  <Button variant="outline" className="w-full" onClick={clearCart}>
                    Clear Cart
                  </Button>
                </div>
              </>}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showKrolistOrder} onOpenChange={setShowKrolistOrder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order through Krolist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter your full name" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+966 XX XXX XXXX" />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Total Items: {totalItems}</p>
              <p>Admins will review your order and contact you shortly.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKrolistOrder(false)}>
              Cancel
            </Button>
            <Button onClick={handleKrolistOrder} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}