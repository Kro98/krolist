import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Languages, Loader2, Check, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface BilingualInputProps {
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
  onChangeEn: (value: string) => void;
  onChangeAr: (value: string) => void;
  placeholderEn?: string;
  placeholderAr?: string;
  multiline?: boolean;
  maxLength?: number;
  context?: string;
  className?: string;
  debounceMs?: number;
}

export const BilingualInput = ({
  labelEn,
  labelAr,
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  placeholderEn = '',
  placeholderAr = '',
  multiline = false,
  maxLength,
  context,
  className,
  debounceMs = 1500,
}: BilingualInputProps) => {
  const [isTranslatingToAr, setIsTranslatingToAr] = useState(false);
  const [isTranslatingToEn, setIsTranslatingToEn] = useState(false);
  const [pendingTranslation, setPendingTranslation] = useState<{ text: string; target: 'ar' | 'en' } | null>(null);
  const [translationSuccess, setTranslationSuccess] = useState<'ar' | 'en' | null>(null);
  const [autoTranslateEn, setAutoTranslateEn] = useState(true);
  const [autoTranslateAr, setAutoTranslateAr] = useState(true);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranslatedEnRef = useRef<string>('');
  const lastTranslatedArRef = useRef<string>('');

  const translateText = useCallback(async (text: string, targetLanguage: 'ar' | 'en') => {
    if (!text.trim()) return;
    
    const setLoading = targetLanguage === 'ar' ? setIsTranslatingToAr : setIsTranslatingToEn;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text, targetLanguage, context },
      });

      if (error) throw error;

      if (data?.translatedText) {
        if (targetLanguage === 'ar') {
          onChangeAr(data.translatedText);
          lastTranslatedArRef.current = data.translatedText;
        } else {
          onChangeEn(data.translatedText);
          lastTranslatedEnRef.current = data.translatedText;
        }
        setTranslationSuccess(targetLanguage);
        setTimeout(() => setTranslationSuccess(null), 2000);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setLoading(false);
    }
  }, [context, onChangeAr, onChangeEn]);

  // Handle English input change with debounced auto-translate
  const handleEnChange = useCallback((value: string) => {
    onChangeEn(value);
    
    if (!autoTranslateAr || !value.trim() || value === lastTranslatedEnRef.current) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setPendingTranslation({ text: value, target: 'ar' });
    
    debounceTimerRef.current = setTimeout(() => {
      translateText(value, 'ar');
      setPendingTranslation(null);
    }, debounceMs);
  }, [autoTranslateAr, debounceMs, onChangeEn, translateText]);

  // Handle Arabic input change with debounced auto-translate
  const handleArChange = useCallback((value: string) => {
    onChangeAr(value);
    
    if (!autoTranslateEn || !value.trim() || value === lastTranslatedArRef.current) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setPendingTranslation({ text: value, target: 'en' });
    
    debounceTimerRef.current = setTimeout(() => {
      translateText(value, 'en');
      setPendingTranslation(null);
    }, debounceMs);
  }, [autoTranslateEn, debounceMs, onChangeAr, translateText]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const InputComponent = multiline ? Textarea : Input;
  
  const renderTranslationIndicator = (target: 'ar' | 'en') => {
    const isTranslating = target === 'ar' ? isTranslatingToAr : isTranslatingToEn;
    const isPending = pendingTranslation?.target === target;
    const isSuccess = translationSuccess === target;
    
    if (isTranslating) {
      return (
        <div className="flex items-center gap-1 text-xs text-primary animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Translating...</span>
        </div>
      );
    }
    
    if (isSuccess) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-500">
          <Check className="w-3 h-3" />
          <span>Translated</span>
        </div>
      );
    }
    
    if (isPending) {
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3" />
          <span>Will translate...</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {/* English Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${labelEn}-en`}>{labelEn}</Label>
          <div className="flex items-center gap-2">
            {renderTranslationIndicator('ar')}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 text-xs gap-1",
                autoTranslateAr ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => setAutoTranslateAr(!autoTranslateAr)}
              title={autoTranslateAr ? "Auto-translate to Arabic enabled" : "Auto-translate to Arabic disabled"}
            >
              <Languages className="w-3 h-3" />
              → AR
              {autoTranslateAr ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            </Button>
          </div>
        </div>
        <InputComponent
          id={`${labelEn}-en`}
          value={valueEn}
          onChange={(e) => handleEnChange(e.target.value)}
          placeholder={placeholderEn}
          maxLength={maxLength}
          className={multiline ? "h-20" : ""}
        />
        {maxLength && (
          <p className="text-xs text-muted-foreground">
            {valueEn.length}/{maxLength} characters
          </p>
        )}
      </div>
      
      {/* Arabic Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${labelAr}-ar`}>{labelAr}</Label>
          <div className="flex items-center gap-2">
            {renderTranslationIndicator('en')}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 text-xs gap-1",
                autoTranslateEn ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => setAutoTranslateEn(!autoTranslateEn)}
              title={autoTranslateEn ? "Auto-translate to English enabled" : "Auto-translate to English disabled"}
            >
              <Languages className="w-3 h-3" />
              → EN
              {autoTranslateEn ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            </Button>
          </div>
        </div>
        <InputComponent
          id={`${labelAr}-ar`}
          value={valueAr}
          onChange={(e) => handleArChange(e.target.value)}
          placeholder={placeholderAr}
          maxLength={maxLength}
          dir="rtl"
          className={multiline ? "h-20" : ""}
        />
        {maxLength && (
          <p className="text-xs text-muted-foreground text-right" dir="rtl">
            {valueAr.length}/{maxLength} حرف
          </p>
        )}
      </div>
    </div>
  );
};
