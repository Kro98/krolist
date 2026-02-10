import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SectionLocks {
  articles: boolean;
  stickers: boolean;
  loading: boolean;
}

export function useSectionLocks(): SectionLocks {
  const [locks, setLocks] = useState<SectionLocks>({
    articles: false,
    stickers: false,
    loading: true,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('page_content')
          .select('page_key, content_en')
          .in('page_key', ['section_lock_articles', 'section_lock_stickers']);

        const articlesLocked = data?.find(r => r.page_key === 'section_lock_articles')?.content_en === 'locked';
        const stickersLocked = data?.find(r => r.page_key === 'section_lock_stickers')?.content_en === 'locked';

        setLocks({ articles: !!articlesLocked, stickers: !!stickersLocked, loading: false });
      } catch {
        setLocks(prev => ({ ...prev, loading: false }));
      }
    };
    fetch();
  }, []);

  return locks;
}
