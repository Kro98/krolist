import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Undertone = 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'custom';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
  undertone: Undertone;
  setUndertone: (undertone: Undertone) => void;
  customHue: number;
  setCustomHue: (hue: number) => void;
}

const undertoneColors: Record<Undertone, string> = {
  orange: '31 98% 51%',
  blue: '217 91% 59%',
  green: '142 71% 45%',
  purple: '271 81% 56%',
  red: '0 84% 60%',
  custom: '31 98% 51%', // Will be overridden by customHue
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });

  const [undertone, setUndertone] = useState<Undertone>(() => {
    return (localStorage.getItem('undertone') as Undertone) || 'orange';
  });

  const [customHue, setCustomHue] = useState<number>(() => {
    const saved = localStorage.getItem('customHue');
    return saved ? parseInt(saved) : 31;
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    let resolvedTheme: 'light' | 'dark';
    
    if (theme === 'system') {
      resolvedTheme = getSystemTheme();
    } else {
      resolvedTheme = theme;
    }
    
    setActualTheme(resolvedTheme);
    
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    let hslValue = undertoneColors[undertone];
    
    // If custom undertone, use the custom hue value
    if (undertone === 'custom') {
      hslValue = `${customHue} 85% 55%`;
    }
    
    root.style.setProperty('--primary', hslValue);
    root.style.setProperty('--ring', hslValue);
    root.style.setProperty('--sidebar-ring', hslValue);
    root.style.setProperty('--sidebar-primary', hslValue);
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${hslValue}), hsl(${hslValue.replace(/(\d+)%/, (_, p) => `${parseInt(p) + 10}%`)}))`);
    root.style.setProperty('--shadow-card', `0 4px 6px -1px hsl(${hslValue} / 0.1), 0 2px 4px -2px hsl(${hslValue} / 0.1)`);
    root.style.setProperty('--shadow-hover', `0 10px 15px -3px hsl(${hslValue} / 0.15), 0 4px 6px -4px hsl(${hslValue} / 0.1)`);
    
    localStorage.setItem('undertone', undertone);
  }, [undertone, customHue]);

  useEffect(() => {
    localStorage.setItem('customHue', customHue.toString());
  }, [customHue]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme, undertone, setUndertone, customHue, setCustomHue }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};