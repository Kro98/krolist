import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MessageSquare, Link2, ExternalLink, Copy, Check } from 'lucide-react';
import { FunnyLoadingText } from '@/components/FunnyLoadingText';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SeasonalThemeManager from '@/components/admin/SeasonalThemeManager';
import { Slider } from '@/components/ui/slider';

interface LoginMessage {
  id: string;
  title_en: string;
  title_ar: string | null;
  description_en: string;
  description_ar: string | null;
  display_times: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LoginMessagesManager() {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const [messages, setMessages] = useState<LoginMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState<LoginMessage | null>(null);
  const [affiliateLinkCopied, setAffiliateLinkCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    display_times: 1,
    is_active: true,
  });

  const affiliateUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/affiliate` 
    : '/affiliate';

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('login_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
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

  const handleOpenDialog = (message?: LoginMessage) => {
    if (message) {
      setEditingMessage(message);
      setFormData({
        title_en: message.title_en,
        title_ar: message.title_ar || '',
        description_en: message.description_en,
        description_ar: message.description_ar || '',
        display_times: message.display_times,
        is_active: message.is_active,
      });
    } else {
      setEditingMessage(null);
      setFormData({
        title_en: '',
        title_ar: '',
        description_en: '',
        description_ar: '',
        display_times: 1,
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title_en || !formData.description_en) {
      toast({
        title: 'Error',
        description: 'English title and description are required',
        variant: 'destructive',
      });
      return;
    }

    const messageData = {
      title_en: formData.title_en,
      title_ar: formData.title_ar || null,
      description_en: formData.description_en,
      description_ar: formData.description_ar || null,
      display_times: formData.display_times,
      is_active: formData.is_active,
    };

    try {
      if (editingMessage) {
        const { error } = await supabase
          .from('login_messages')
          .update(messageData)
          .eq('id', editingMessage.id);

        if (error) throw error;
        toast({ title: 'Message updated' });
      } else {
        const { error } = await supabase
          .from('login_messages')
          .insert([messageData]);

        if (error) throw error;
        toast({ title: 'Message created' });
      }

      setShowDialog(false);
      fetchMessages();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this login message?')) return;

    try {
      const { error } = await supabase
        .from('login_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Message deleted' });
      fetchMessages();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copyAffiliateLink = () => {
    navigator.clipboard.writeText(affiliateUrl);
    setAffiliateLinkCopied(true);
    toast({ title: isArabic ? 'تم نسخ الرابط!' : 'Link copied!' });
    setTimeout(() => setAffiliateLinkCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <FunnyLoadingText />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="messages">
            {isArabic ? 'رسائل تسجيل الدخول' : 'Login Messages'}
          </TabsTrigger>
          <TabsTrigger value="themes">
            {isArabic ? 'ثيمات المناسبات' : 'Seasonal Themes'}
          </TabsTrigger>
          <TabsTrigger value="affiliate">
            {isArabic ? 'وضع الأفيليت' : 'Affiliate Mode'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="space-y-6">
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">{isArabic ? 'رسائل تسجيل الدخول' : 'Login Messages'}</h2>
                <p className="text-muted-foreground">
                  {isArabic ? 'إدارة الرسائل التي تظهر للمستخدمين عند تسجيل الدخول' : 'Manage messages shown to users when they log in'}
                </p>
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                {isArabic ? 'إضافة رسالة' : 'Add Message'}
              </Button>
            </div>

            <div className="grid gap-4">
              {messages.map((message) => (
                <Card key={message.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      {message.title_en}
                      {message.title_ar && <span className="text-muted-foreground text-sm">({message.title_ar})</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{message.description_en}</p>
                      {message.description_ar && (
                        <p className="text-sm text-muted-foreground" dir="rtl">{message.description_ar}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {isArabic ? 'عدد مرات العرض:' : 'Display times:'} {message.display_times}
                        </span>
                        <Switch
                          checked={message.is_active}
                          onCheckedChange={async (checked) => {
                            await supabase
                              .from('login_messages')
                              .update({ is_active: checked })
                              .eq('id', message.id);
                            fetchMessages();
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOpenDialog(message)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {isArabic ? 'تعديل' : 'Edit'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(message.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isArabic ? 'حذف' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="themes">
          <SeasonalThemeManager />
        </TabsContent>

        <TabsContent value="affiliate">
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{isArabic ? 'وضع الأفيليت' : 'Affiliate Mode'}</h2>
              <p className="text-muted-foreground">
                {isArabic 
                  ? 'صفحة مبسطة تعرض جميع المنتجات مع روابط الأفيليت فقط - بدون قائمة جانبية أو فئات'
                  : 'A simplified page showing all products with affiliate links only - no sidebar or categories'}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  {isArabic ? 'رابط صفحة الأفيليت' : 'Affiliate Page Link'}
                </CardTitle>
                <CardDescription>
                  {isArabic 
                    ? 'شارك هذا الرابط لعرض صفحة المنتجات المبسطة مع روابط الأفيليت'
                    : 'Share this link to display the simplified products page with affiliate links'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input 
                    value={affiliateUrl} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyAffiliateLink}
                    className="shrink-0"
                  >
                    {affiliateLinkCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(affiliateUrl, '_blank')}
                    className="shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">
                    {isArabic ? 'مميزات صفحة الأفيليت:' : 'Affiliate Page Features:'}
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {isArabic ? 'عرض شبكي مضغوط للمنتجات' : 'Compact grid display of products'}</li>
                    <li>• {isArabic ? 'شريط بحث سريع مع بانر بحث أمازون' : 'Quick search bar with Amazon search banner'}</li>
                    <li>• {isArabic ? 'بدون قائمة جانبية أو فئات' : 'No sidebar or categories'}</li>
                    <li>• {isArabic ? 'تحكم في عدد المنتجات في الصف' : 'Control products per row'}</li>
                    <li>• {isArabic ? 'روابط الأفيليت تعمل تلقائياً' : 'Affiliate links work automatically'}</li>
                    <li>• {isArabic ? 'تذييل بدون روابط سريعة' : 'Footer without quick links'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'إعدادات وضع الأفيليت' : 'Affiliate Mode Settings'}</CardTitle>
                <CardDescription>
                  {isArabic 
                    ? 'تخصيص سلوك صفحة الأفيليت'
                    : 'Customize affiliate page behavior'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{isArabic ? 'إخفاء زر التسجيل' : 'Hide Sign Up Button'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {isArabic 
                        ? 'إخفاء زر التسجيل وتسجيل الدخول من صفحة الأفيليت'
                        : 'Hide sign up and login buttons from affiliate page'}
                    </p>
                  </div>
                  <Switch 
                    checked={localStorage.getItem('affiliateHideAuth') === 'true'}
                    onCheckedChange={(checked) => {
                      localStorage.setItem('affiliateHideAuth', String(checked));
                      toast({ title: isArabic ? 'تم الحفظ' : 'Setting saved' });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{isArabic ? 'إظهار بانر أمازون' : 'Show Amazon Banner'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {isArabic 
                        ? 'عرض بانر "ابحث على أمازون" عند البحث'
                        : 'Display "Find on Amazon" banner when searching'}
                    </p>
                  </div>
                  <Switch 
                    checked={localStorage.getItem('affiliateShowAmazonBanner') !== 'false'}
                    onCheckedChange={(checked) => {
                      localStorage.setItem('affiliateShowAmazonBanner', String(checked));
                      toast({ title: isArabic ? 'تم الحفظ' : 'Setting saved' });
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">{isArabic ? 'عدد المنتجات الافتراضي في الصف' : 'Default Products Per Row'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {isArabic 
                        ? 'عدد المنتجات المعروضة في كل صف افتراضياً'
                        : 'Number of products displayed per row by default'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[parseInt(localStorage.getItem('affiliateDefaultPerRow') || '4', 10)]}
                      onValueChange={(value) => {
                        localStorage.setItem('affiliateDefaultPerRow', String(value[0]));
                        localStorage.setItem('affiliateProductsPerRow', String(value[0]));
                      }}
                      min={2}
                      max={6}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-medium">
                      {localStorage.getItem('affiliateDefaultPerRow') || '4'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMessage 
                ? (isArabic ? 'تعديل رسالة تسجيل الدخول' : 'Edit Login Message') 
                : (isArabic ? 'إضافة رسالة تسجيل الدخول' : 'Add Login Message')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{isArabic ? 'العنوان (إنجليزي) *' : 'Title (English) *'}</Label>
              <Input
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                placeholder="e.g., Welcome to Krolist!"
              />
            </div>

            <div>
              <Label>{isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}</Label>
              <Input
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                placeholder="مرحباً بك في كروليست!"
                dir="rtl"
              />
            </div>

            <div>
              <Label>{isArabic ? 'الوصف (إنجليزي) *' : 'Description (English) *'}</Label>
              <Textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Enter message description in English"
                rows={3}
              />
            </div>

            <div>
              <Label>{isArabic ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
              <Textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder="أدخل وصف الرسالة بالعربية"
                dir="rtl"
                rows={3}
              />
            </div>

            <div>
              <Label>{isArabic ? 'عدد مرات العرض' : 'Display Times (how many logins to show this message)'}</Label>
              <Input
                type="number"
                min="1"
                value={formData.display_times}
                onChange={(e) => setFormData({ ...formData, display_times: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isArabic 
                  ? 'الافتراضي هو 1 (تظهر مرة واحدة لكل مستخدم). اضبط أعلى لعرض عدة مرات.'
                  : 'Default is 1 (shown once per user). Set higher to show multiple times.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>{isArabic ? 'نشط (مرئي للمستخدمين عند تسجيل الدخول)' : 'Active (visible to users on login)'}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave}>
              {editingMessage ? (isArabic ? 'تحديث' : 'Update') : (isArabic ? 'إنشاء' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}