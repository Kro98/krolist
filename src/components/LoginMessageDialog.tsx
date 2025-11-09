import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LoginMessage {
  id: string;
  title_en: string;
  title_ar: string | null;
  description_en: string;
  description_ar: string | null;
  display_times: number;
}

export function LoginMessageDialog() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [message, setMessage] = useState<LoginMessage | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (user) {
      checkForMessages();
    }
  }, [user]);

  const checkForMessages = async () => {
    if (!user) return;

    try {
      // Get active messages
      const { data: messages, error: messagesError } = await supabase
        .from('login_messages')
        .select('*')
        .eq('is_active', true);

      if (messagesError) throw messagesError;
      if (!messages || messages.length === 0) return;

      // Check which messages the user has already seen
      for (const msg of messages) {
        const { data: viewData, error: viewError } = await supabase
          .from('user_message_views')
          .select('view_count')
          .eq('user_id', user.id)
          .eq('message_id', msg.id)
          .maybeSingle();

        if (viewError && viewError.code !== 'PGRST116') throw viewError;

        const viewCount = viewData?.view_count || 0;

        // Show message if not yet reached display limit
        if (viewCount < msg.display_times) {
          setMessage(msg);
          setShowDialog(true);
          
          // Update view count
          if (viewData) {
            await supabase
              .from('user_message_views')
              .update({ 
                view_count: viewCount + 1,
                last_viewed_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .eq('message_id', msg.id);
          } else {
            await supabase
              .from('user_message_views')
              .insert({
                user_id: user.id,
                message_id: msg.id,
                view_count: 1
              });
          }
          
          break; // Show only one message at a time
        }
      }
    } catch (error) {
      console.error('Error checking login messages:', error);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    setMessage(null);
  };

  if (!message) return null;

  const title = language === 'ar' && message.title_ar ? message.title_ar : message.title_en;
  const description = language === 'ar' && message.description_ar ? message.description_ar : message.description_en;

  return (
    <Dialog open={showDialog} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={handleClose}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}