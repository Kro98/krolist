import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MessageSquare } from 'lucide-react';

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
  const { t } = useLanguage();
  const [messages, setMessages] = useState<LoginMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState<LoginMessage | null>(null);
  
  const [formData, setFormData] = useState({
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    display_times: 1,
    is_active: true,
  });

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

  if (isLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Login Messages</h2>
          <p className="text-muted-foreground">Manage messages shown to users when they log in</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Message
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
                    Display times: {message.display_times}
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
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(message.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMessage ? 'Edit Login Message' : 'Add Login Message'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title (English) *</Label>
              <Input
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                placeholder="e.g., Welcome to Krolist!"
              />
            </div>

            <div>
              <Label>Title (Arabic)</Label>
              <Input
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                placeholder="مرحباً بك في كروليست!"
                dir="rtl"
              />
            </div>

            <div>
              <Label>Description (English) *</Label>
              <Textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Enter message description in English"
                rows={3}
              />
            </div>

            <div>
              <Label>Description (Arabic)</Label>
              <Textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder="أدخل وصف الرسالة بالعربية"
                dir="rtl"
                rows={3}
              />
            </div>

            <div>
              <Label>Display Times (how many logins to show this message)</Label>
              <Input
                type="number"
                min="1"
                value={formData.display_times}
                onChange={(e) => setFormData({ ...formData, display_times: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default is 1 (shown once per user). Set higher to show multiple times.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active (visible to users on login)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingMessage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}