import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdSlots {
  clientId: string;
  donationSlot: string;
  productBannerSlot: string;
  articleInlineSlot: string;
  interstitialSlot: string;
}

const defaults: AdSlots = {
  clientId: "ca-pub-2793689855806571",
  donationSlot: "",
  productBannerSlot: "",
  articleInlineSlot: "",
  interstitialSlot: "",
};

const keyMap: Record<string, keyof AdSlots> = {
  adsense_client_id: "clientId",
  adsense_slot_donation: "donationSlot",
  adsense_slot_product_banner: "productBannerSlot",
  adsense_slot_article_inline: "articleInlineSlot",
  adsense_slot_interstitial: "interstitialSlot",
};

export function useAdSlots() {
  const [slots, setSlots] = useState<AdSlots>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_settings")
        .select("setting_key, setting_value")
        .in("setting_key", Object.keys(keyMap));

      if (error) throw error;

      const updated = { ...defaults };
      data?.forEach((row) => {
        const field = keyMap[row.setting_key];
        if (field && row.setting_value) {
          updated[field] = row.setting_value;
        }
      });
      setSlots(updated);
    } catch (err) {
      console.error("Failed to load ad slots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  return { slots, loading, refetch: fetchSlots };
}
