import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Languages, Loader2, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface BilingualBlockInputProps {
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
  onChangeEn: (value: string) => void;
  onChangeAr: (value: string) => void;
  placeholderEn?: string;
  placeholderAr?: string;
  multiline?: boolean;
  rows?: number;
  context?: string;
  className?: string;
  debounceMs?: number;
  showLabels?: boolean;
}

export const BilingualBlockInput = ({
  labelEn,
  labelAr,
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  placeholderEn = '',
  placeholderAr = '',
  multiline = false,
  rows = 3,
  context = 'article content',
  className,
  debounceMs = 1500,
  showLabels = true,
}: BilingualBlockInputProps) => {
  const [isTranslatingToAr, setIsTranslatingToAr] = useState(false);
  const [isTranslatingToEn, setIsTranslatingToEn] = useState(false);
  const [pendingTranslation, setPendingTranslation] = useState<{ target: 'ar' | 'en' } | null>(null);
  const [translationSuccess, setTranslationSuccess] = useState<'ar' | 'en' | null>(null);
  
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

  const handleEnChange = useCallback((value: string) => {
    onChangeEn(value);
    
    if (!value.trim() || value === lastTranslatedEnRef.current) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setPendingTranslation({ target: 'ar' });
    
    debounceTimerRef.current = setTimeout(() => {
      translateText(value, 'ar');
      setPendingTranslation(null);
    }, debounceMs);
  }, [debounceMs, onChangeEn, translateText]);

  const handleArChange = useCallback((value: string) => {
    onChangeAr(value);
    
    if (!value.trim() || value === lastTranslatedArRef.current) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setPendingTranslation({ target: 'en' });
    
    debounceTimerRef.current = setTimeout(() => {
      translateText(value, 'en');
      setPendingTranslation(null);
    }, debounceMs);
  }, [debounceMs, onChangeAr, translateText]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const InputComponent = multiline ? Textarea : Input;
  
  const renderStatus = (target: 'ar' | 'en') => {
    const isTranslating = target === 'ar' ? isTranslatingToAr : isTranslatingToEn;
    const isPending = pendingTranslation?.target === target;
    const isSuccess = translationSuccess === target;
    
    if (isTranslating) {
      return <Loader2 className="w-3 h-3 animate-spin text-primary" />;
    }
    if (isSuccess) {
      return <Check className="w-3 h-3 text-green-500" />;
    }
    if (isPending) {
      return <Sparkles className="w-3 h-3 text-muted-foreground animate-pulse" />;
    }
    return <Languages className="w-3 h-3 text-muted-foreground/50" />;
  };

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <div className="space-y-1.5">
        {showLabels && (
          <div className="flex items-center justify-between">
            <Label className="text-xs">{labelEn}</Label>
            <div className="flex items-center gap-1">
              {renderStatus('ar')}
              <span className="text-[10px] text-muted-foreground">→ AR</span>
            </div>
          </div>
        )}
        <InputComponent
          value={valueEn}
          onChange={(e) => handleEnChange(e.target.value)}
          placeholder={placeholderEn}
          className={cn("text-sm", multiline && `min-h-[${rows * 24}px]`)}
          style={multiline ? { minHeight: `${rows * 24}px` } : undefined}
        />
      </div>
      
      <div className="space-y-1.5">
        {showLabels && (
          <div className="flex items-center justify-between">
            <Label className="text-xs">{labelAr}</Label>
            <div className="flex items-center gap-1">
              {renderStatus('en')}
              <span className="text-[10px] text-muted-foreground">→ EN</span>
            </div>
          </div>
        )}
        <InputComponent
          value={valueAr}
          onChange={(e) => handleArChange(e.target.value)}
          placeholder={placeholderAr}
          dir="rtl"
          className={cn("text-sm", multiline && `min-h-[${rows * 24}px]`)}
          style={multiline ? { minHeight: `${rows * 24}px` } : undefined}
        />
      </div>
    </div>
  );
};

// Specialized component for HTML content blocks
interface BilingualHtmlBlockProps {
  valueEn: string;
  valueAr: string;
  onChangeEn: (value: string) => void;
  onChangeAr: (value: string) => void;
  context?: string;
}

export const BilingualHtmlBlock = ({
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  context = 'article body content with HTML formatting',
}: BilingualHtmlBlockProps) => {
  const [isTranslatingToAr, setIsTranslatingToAr] = useState(false);
  const [isTranslatingToEn, setIsTranslatingToEn] = useState(false);
  const [pendingTranslation, setPendingTranslation] = useState<{ target: 'ar' | 'en' } | null>(null);
  const [translationSuccess, setTranslationSuccess] = useState<'ar' | 'en' | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranslatedEnRef = useRef<string>('');
  const lastTranslatedArRef = useRef<string>('');

  const translateText = useCallback(async (text: string, targetLanguage: 'ar' | 'en') => {
    if (!text.trim()) return;
    
    const setLoading = targetLanguage === 'ar' ? setIsTranslatingToAr : setIsTranslatingToEn;
    setLoading(true);
    
    try {
      // For HTML content, we instruct to preserve HTML tags
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { 
          text, 
          targetLanguage, 
          context: `${context}. IMPORTANT: Preserve all HTML tags exactly as they are. Only translate the text content between tags.` 
        },
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

  const handleEnChange = useCallback((value: string) => {
    onChangeEn(value);
    
    if (!value.trim() || value === lastTranslatedEnRef.current) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setPendingTranslation({ target: 'ar' });
    
    debounceTimerRef.current = setTimeout(() => {
      translateText(value, 'ar');
      setPendingTranslation(null);
    }, 2000); // Longer debounce for HTML content
  }, [onChangeEn, translateText]);

  const handleArChange = useCallback((value: string) => {
    onChangeAr(value);
    
    if (!value.trim() || value === lastTranslatedArRef.current) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setPendingTranslation({ target: 'en' });
    
    debounceTimerRef.current = setTimeout(() => {
      translateText(value, 'en');
      setPendingTranslation(null);
    }, 2000);
  }, [onChangeAr, translateText]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const renderStatus = (target: 'ar' | 'en') => {
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
          <span>Done</span>
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
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Content (English) - HTML supported</Label>
          {renderStatus('ar')}
        </div>
        <Textarea
          value={valueEn}
          onChange={(e) => handleEnChange(e.target.value)}
          placeholder="<p>Your content here...</p>"
          className="min-h-[150px] font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Content (Arabic) - HTML supported</Label>
          {renderStatus('en')}
        </div>
        <Textarea
          value={valueAr}
          onChange={(e) => handleArChange(e.target.value)}
          placeholder="<p>المحتوى هنا...</p>"
          className="min-h-[150px] font-mono text-sm"
          dir="rtl"
        />
      </div>
    </div>
  );
};

// FAQ item component with auto-translation
interface BilingualFaqItemProps {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
  onQuestionChange: (en: string, ar: string) => void;
  onAnswerChange: (en: string, ar: string) => void;
}

export const BilingualFaqItem = ({
  question,
  questionAr,
  answer,
  answerAr,
  onQuestionChange,
  onAnswerChange,
}: BilingualFaqItemProps) => {
  return (
    <div className="space-y-2">
      <BilingualBlockInput
        labelEn="Question (English)"
        labelAr="Question (Arabic)"
        valueEn={question}
        valueAr={questionAr}
        onChangeEn={(v) => onQuestionChange(v, questionAr)}
        onChangeAr={(v) => onQuestionChange(question, v)}
        placeholderEn="Question (English)"
        placeholderAr="السؤال (عربي)"
        context="FAQ question for product article"
      />
      <BilingualBlockInput
        labelEn="Answer (English)"
        labelAr="Answer (Arabic)"
        valueEn={answer}
        valueAr={answerAr}
        onChangeEn={(v) => onAnswerChange(v, answerAr)}
        onChangeAr={(v) => onAnswerChange(answer, v)}
        placeholderEn="Answer (English)"
        placeholderAr="الجواب (عربي)"
        multiline
        rows={3}
        context="FAQ answer for product article"
      />
    </div>
  );
};
