import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle, XCircle, Bell, Mail, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FunnyLoadingText } from "@/components/FunnyLoadingText";

interface Order {
  id: string;
  products: any;
  total_amount: number;
  currency: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface OrderNotification {
  id: string;
  order_id: string;
  message_en: string;
  message_ar: string | null;
  is_read: boolean;
  created_at: string;
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchNotifications();
      subscribeToOrders();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, products, total_amount, currency, status, notes, created_at, updated_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('order-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setOrders(prev => 
              prev.map(order => 
                order.id === payload.new.id ? payload.new as Order : order
              )
            );
            
            const newStatus = (payload.new as Order).status;
            toast({
              title: "Order Updated",
              description: `Your order status changed to: ${newStatus}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as OrderNotification, ...prev]);
          toast({
            title: "New Notification",
            description: "You have a new message about your order",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'dismissed':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'dismissed':
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNotificationForOrder = (orderId: string) => {
    return notifications.find(n => n.order_id === orderId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[400px]">
        <FunnyLoadingText />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package className="h-8 w-8" />
          My Orders
        </h1>
        <p className="text-muted-foreground mt-2">Track your Krolist orders</p>
      </div>

      {/* Global notifications */}
      {notifications.length > 0 && (
        <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
          <Bell className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            You have {notifications.length} notification(s) requiring your attention. Please check your orders below.
          </AlertDescription>
        </Alert>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">
              Your Krolist orders will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const notification = getNotificationForOrder(order.id);
            
            return (
              <Card key={order.id} className={`overflow-hidden ${notification ? 'border-blue-500' : ''}`}>
                {/* Notification banner for this order */}
                {notification && (
                  <div className="bg-blue-500/10 border-b border-blue-500/30 p-4">
                    <div className="flex items-start gap-3">
                      <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                          {language === 'ar' && notification.message_ar 
                            ? notification.message_ar 
                            : notification.message_en}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-blue-500 text-blue-600 hover:bg-blue-500/10"
                            onClick={() => window.open('mailto:support@krolist.com', '_blank')}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email Us
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-blue-500 text-blue-600 hover:bg-blue-500/10"
                            onClick={() => window.open('https://twitter.com/krolist', '_blank')}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Social Media
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => markNotificationRead(notification.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Products:</h4>
                      <div className="space-y-2">
                        {Array.isArray(order.products) && order.products.map((product: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{product.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.current_price || product.price} {product.currency}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-bold text-primary">
                        {order.total_amount} {order.currency}
                      </span>
                    </div>

                    {order.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Notes:</span> {order.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}