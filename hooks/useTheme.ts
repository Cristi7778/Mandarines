'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const cached = localStorage.getItem('mandarines_theme') as Theme | null;
    if (cached) {
      setThemeState(cached);
      document.documentElement.setAttribute('data-theme', cached);
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      const saved = user?.user_metadata?.theme as Theme | undefined;
      if (saved) {
        setThemeState(saved);
        document.documentElement.setAttribute('data-theme', saved);
        localStorage.setItem('mandarines_theme', saved);
      }
    });
  }, []);

  async function setTheme(t: Theme) {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('mandarines_theme', t);
    await supabase.auth.updateUser({ data: { theme: t } });
  }

  return { theme, setTheme };
}
