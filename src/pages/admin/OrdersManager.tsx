import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Trash2, Eye, Package, List, Clock, Loader2, CheckCircle2, XCircle, Bell, AlertTriangle, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  products: any;
  total_amount: number;
  currency: string;
  status: string;
  notes: string | null;
  created_at: string;
  user_id: string | null;
  updated_at: string;
  admin_viewed_at: string | null;
  customer_data_cleared: boolean;
  contact_notification_sent: boolean;
}

interface OrderWithEmail extends Order {
  user_email?: string;
}

export default function OrdersManager() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithEmail | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrder = async (order: Order) => {
    // Mark as viewed if first time
    if (!order.admin_viewed_at && !order.customer_data_cleared) {
      const { error } = await supabase
        .from('orders')
        .update({ admin_viewed_at: new Date().toISOString() })
        .eq('id', order.id);

      if (!error) {
        order.admin_viewed_at = new Date().toISOString();
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, admin_viewed_at: order.admin_viewed_at } : o));
      }
    }
    
    setSelectedOrder(order);
    setNotesValue(order.notes || "");
    setShowDialog(true);
  };

  const handleClearCustomerData = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          customer_name: '[CLEARED]',
          customer_phone: '[CLEARED]',
          customer_data_cleared: true
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({ title: 'Customer data cleared for security' });
      
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id 
          ? { ...o, customer_name: '[CLEARED]', customer_phone: '[CLEARED]', customer_data_cleared: true } 
          : o
      ));
      
      setSelectedOrder({ 
        ...selectedOrder, 
        customer_name: '[CLEARED]', 
        customer_phone: '[CLEARED]', 
        customer_data_cleared: true 
      });
      setShowConfirmClear(false);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendContactNotification = async () => {
    if (!selectedOrder || !selectedOrder.user_id) {
      toast({
        title: 'Cannot send notification',
        description: 'This order has no associated user account',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create notification for the user
      const { error: notifError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: selectedOrder.id,
          user_id: selectedOrder.user_id,
          message_en: 'Please contact us via email or social media regarding your order. We need additional information to process it.',
          message_ar: 'يرجى التواصل معنا عبر البريد الإلكتروني أو وسائل التواصل الاجتماعي بخصوص طلبك. نحتاج معلومات إضافية لمعالجته.'
        });

      if (notifError) throw notifError;

      // Mark notification as sent
      const { error } = await supabase
        .from('orders')
        .update({ contact_notification_sent: true })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({ title: 'Notification sent to user' });
      
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id ? { ...o, contact_notification_sent: true } : o
      ));
      setSelectedOrder({ ...selectedOrder, contact_notification_sent: true });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({ 
        title: newStatus === 'dismissed' ? 'Order dismissed' : 'Order status updated' 
      });
      
      fetchOrders();
      
      if (newStatus === 'dismissed' || (showDialog && selectedOrder?.id === orderId)) {
        setShowDialog(false);
      }
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleProductCheck = async (orderId: string, productIndex: number, checked: boolean) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order || !Array.isArray(order.products)) return;

      const updatedProducts = [...order.products];
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        completed: checked
      };

      const { error } = await supabase
        .from('orders')
        .update({ products: updatedProducts })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, products: updatedProducts } : o
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, products: updatedProducts });
      }
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      toast({ title: 'Order deleted' });
      fetchOrders();
      setShowDialog(false);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border border-yellow-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-600 dark:text-blue-500 border border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-600 dark:text-green-500 border border-green-500/30';
      case 'dismissed':
      case 'cancelled': return 'bg-destructive/20 text-destructive border border-destructive/30';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const handleNotesUpdate = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ notes: notesValue })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({ title: 'Notes updated successfully' });
      
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id ? { ...o, notes: notesValue } : o
      ));
      
      setSelectedOrder({ ...selectedOrder, notes: notesValue });
      setEditingNotes(false);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    dismissed: orders.filter(o => o.status === 'dismissed').length,
  };

  if (isLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Orders Management</h2>
          </div>
        </div>
        <p className="text-muted-foreground">
          {orders.length} total orders
        </p>
        <Alert className="mt-4 border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-500">
            <strong>Security Notice:</strong> Customer names and phone numbers are shown only once for security. 
            After viewing, you should clear the data or send a contact notification to the user.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="relative">
            <List className="h-4 w-4 md:hidden" />
            <span className="hidden md:inline">All</span>
            {orderCounts.all > 0 && (
              <Badge variant="secondary" className="ml-2">{orderCounts.all}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            <Clock className="h-4 w-4 md:hidden" />
            <span className="hidden md:inline">Pending</span>
            {orderCounts.pending > 0 && (
              <Badge variant="secondary" className="ml-2">{orderCounts.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processing" className="relative">
            <Loader2 className="h-4 w-4 md:hidden" />
            <span className="hidden md:inline">Processing</span>
            {orderCounts.processing > 0 && (
              <Badge variant="secondary" className="ml-2">{orderCounts.processing}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative">
            <CheckCircle2 className="h-4 w-4 md:hidden" />
            <span className="hidden md:inline">Completed</span>
            {orderCounts.completed > 0 && (
              <Badge variant="secondary" className="ml-2">{orderCounts.completed}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="relative">
            <XCircle className="h-4 w-4 md:hidden" />
            <span className="hidden md:inline">Dismissed</span>
            {orderCounts.dismissed > 0 && (
              <Badge variant="secondary" className="ml-2">{orderCounts.dismissed}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No {statusFilter !== 'all' ? statusFilter : ''} orders found
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
          <Card key={order.id} className={order.customer_data_cleared ? 'border-yellow-500/30' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {order.customer_data_cleared ? (
                      <>
                        <EyeOff className="h-4 w-4 text-yellow-600" />
                        <span className="text-muted-foreground">[Data Cleared]</span>
                      </>
                    ) : (
                      order.customer_name
                    )}
                  </CardTitle>
                  {!order.customer_data_cleared && (
                    <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {order.admin_viewed_at && !order.customer_data_cleared && (
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                      Viewed
                    </Badge>
                  )}
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {Array.isArray(order.products) ? order.products.length : 0} items • {order.total_amount} {order.currency}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleUpdateStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          setEditingNotes(false);
          setNotesValue("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View order information and manage customer data
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Security warning for customer data */}
              {!selectedOrder.customer_data_cleared && (
                <Alert className="border-orange-500/50 bg-orange-500/10">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700 dark:text-orange-400">
                    This is a <strong>one-time view</strong> of customer contact information. 
                    Please save what you need and clear the data when done.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                {selectedOrder.customer_data_cleared ? (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Customer data has been cleared for security
                    </p>
                  </div>
                ) : (
                  <>
                    <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                  </>
                )}
                <p><strong>Order Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                
                {/* Action buttons for data management */}
                {!selectedOrder.customer_data_cleared && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-500/10"
                      onClick={() => setShowConfirmClear(true)}
                    >
                      <EyeOff className="h-4 w-4 mr-1" />
                      Clear Data
                    </Button>
                    {selectedOrder.user_id && !selectedOrder.contact_notification_sent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-500/10"
                        onClick={handleSendContactNotification}
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Send Contact Request
                      </Button>
                    )}
                    {selectedOrder.contact_notification_sent && (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Notification Sent
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-2">Products</h3>
                <div className="space-y-2">
                  {(Array.isArray(selectedOrder.products) ? selectedOrder.products : []).map((product: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg flex items-start gap-3">
                      <Checkbox
                        checked={product.completed || false}
                        onCheckedChange={(checked) => 
                          handleProductCheck(selectedOrder.id, index, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${product.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {product.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {product.store} • {product.price} {product.currency} × {product.quantity}
                        </p>
                        {product.product_url && (
                          <a 
                            href={product.product_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View Product
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Admin Notes</h3>
                  {!editingNotes && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingNotes(true);
                        setNotesValue(selectedOrder.notes || "");
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      className="w-full min-h-[100px] p-3 border rounded-md resize-y bg-background text-foreground"
                      placeholder="Add internal notes or tracking information..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleNotesUpdate}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNotes(false);
                          setNotesValue(selectedOrder.notes || "");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/30 rounded-md min-h-[60px]">
                    {selectedOrder.notes || (
                      <span className="text-muted-foreground text-sm">No notes added yet</span>
                    )}
                  </div>
                )}
              </div>

              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold">
                    Total: {selectedOrder.total_amount} {selectedOrder.currency}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
              onClick={() => selectedOrder && handleUpdateStatus(selectedOrder.id, 'dismissed')}
            >
              Dismiss Order
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedOrder && handleDelete(selectedOrder.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Order
            </Button>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Clear Data Dialog */}
      <Dialog open={showConfirmClear} onOpenChange={setShowConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Clear Customer Data?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete the customer's name and phone number from this order. 
              This action cannot be undone. Make sure you have saved the contact information if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearCustomerData}>
              Yes, Clear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}