import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  is_enabled: boolean;
  category: string;
  description: string | null;
  config: Record<string, any>;
}

export function useFeatureFlags() {
  const { data: flags = [], isLoading, refetch } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("flag_key");
      if (error) throw error;
      return (data || []) as FeatureFlag[];
    },
    staleTime: 60_000,
  });

  const isEnabled = (key: string): boolean => {
    const flag = flags.find((f) => f.flag_key === key);
    return flag?.is_enabled ?? false;
  };

  const getConfig = (key: string): Record<string, any> => {
    const flag = flags.find((f) => f.flag_key === key);
    return flag?.config ?? {};
  };

  return { flags, isLoading, isEnabled, getConfig, refetch };
}
