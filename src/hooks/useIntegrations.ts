import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceIntegration {
  id: string;
  service_key: string;
  service_name: string;
  category: string;
  is_enabled: boolean;
  config: Record<string, any>;
  secret_keys: string[];
  description: string | null;
  icon_url: string | null;
  docs_url: string | null;
}

export function useIntegrations() {
  const { data: integrations = [], isLoading, refetch } = useQuery({
    queryKey: ["service-integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_integrations")
        .select("*")
        .order("category, service_name");
      if (error) throw error;
      return (data || []) as ServiceIntegration[];
    },
    staleTime: 60_000,
  });

  const isServiceEnabled = (key: string): boolean => {
    const svc = integrations.find((s) => s.service_key === key);
    return svc?.is_enabled ?? false;
  };

  const getServiceConfig = (key: string): Record<string, any> => {
    const svc = integrations.find((s) => s.service_key === key);
    return svc?.config ?? {};
  };

  return { integrations, isLoading, isServiceEnabled, getServiceConfig, refetch };
}
