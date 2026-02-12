import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SectionLocks {
  articles: boolean;
  stickers: boolean;
  loading: boolean;
}

/**
 * Combines two visibility sources:
 * 1. page_content section locks (admin toggle)
 * 2. feature_flags (Integration Hub flags: show_articles, show_stickers)
 *
 * A section is locked (hidden) if EITHER:
 *   - Its section lock is set to "locked", OR
 *   - Its feature flag exists AND is disabled
 */
export function useSectionLocks(): SectionLocks {
  const [locks, setLocks] = useState<SectionLocks>({
    articles: false,
    stickers: false,
    loading: true,
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [locksRes, flagsRes] = await Promise.all([
          supabase
            .from("page_content")
            .select("page_key, content_en")
            .in("page_key", ["section_lock_articles", "section_lock_stickers"]),
          supabase
            .from("feature_flags")
            .select("flag_key, is_enabled")
            .in("flag_key", ["show_articles", "show_stickers"]),
        ]);

        // Section locks from page_content
        const articlesLocked =
          locksRes.data?.find((r) => r.page_key === "section_lock_articles")
            ?.content_en === "locked";
        const stickersLocked =
          locksRes.data?.find((r) => r.page_key === "section_lock_stickers")
            ?.content_en === "locked";

        // Feature flags — only override if the flag exists
        const articlesFlag = flagsRes.data?.find(
          (f) => f.flag_key === "show_articles"
        );
        const stickersFlag = flagsRes.data?.find(
          (f) => f.flag_key === "show_stickers"
        );

        const articlesFlagDisabled = articlesFlag
          ? !articlesFlag.is_enabled
          : false;
        const stickersFlagDisabled = stickersFlag
          ? !stickersFlag.is_enabled
          : false;

        setLocks({
          articles: !!articlesLocked || articlesFlagDisabled,
          stickers: !!stickersLocked || stickersFlagDisabled,
          loading: false,
        });
      } catch {
        setLocks((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchAll();
  }, []);

  return locks;
}
