import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type SeasonalTheme = 'none' | 'ramadan' | 'eid';

interface SeasonalThemeContextType {
  activeTheme: SeasonalTheme;
  isLoading: boolean;
  setTheme: (theme: SeasonalTheme) => Promise<void>;
  refreshTheme: () => Promise<void>;
}

const SeasonalThemeContext = createContext<SeasonalThemeContextType | undefined>(undefined);

export function SeasonalThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<SeasonalTheme>('none');
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('site_theme_settings')
        .select('theme_key, is_active')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setActiveTheme(data.theme_key as SeasonalTheme);
      } else {
        setActiveTheme('none');
      }
    } catch (error) {
      console.error('Error fetching theme:', error);
      setActiveTheme('none');
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (theme: SeasonalTheme) => {
    try {
      // First, deactivate all themes
      await supabase
        .from('site_theme_settings')
        .update({ is_active: false })
        .neq('theme_key', '');

      // If not 'none', activate the selected theme
      if (theme !== 'none') {
        await supabase
          .from('site_theme_settings')
          .update({ is_active: true })
          .eq('theme_key', theme);
      }

      setActiveTheme(theme);
    } catch (error) {
      console.error('Error setting theme:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchActiveTheme();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('theme_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_theme_settings' },
        () => {
          fetchActiveTheme();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-ramadan', 'theme-eid');
    
    if (activeTheme === 'ramadan') {
      root.classList.add('theme-ramadan');
    } else if (activeTheme === 'eid') {
      root.classList.add('theme-eid');
    }
  }, [activeTheme]);

  return (
    <SeasonalThemeContext.Provider value={{ 
      activeTheme, 
      isLoading, 
      setTheme, 
      refreshTheme: fetchActiveTheme 
    }}>
      {children}
    </SeasonalThemeContext.Provider>
  );
}

export const useSeasonalTheme = () => {
  const context = useContext(SeasonalThemeContext);
  if (context === undefined) {
    throw new Error('useSeasonalTheme must be used within a SeasonalThemeProvider');
  }
  return context;
};
