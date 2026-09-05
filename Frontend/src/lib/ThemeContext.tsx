// TOPLINE
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchSettings, saveSettings } from './api';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: 'light' | 'dark';
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      return saved;
    }
    const cookieMatch = document.cookie.match(/(?:^|;\s*)portal_theme=([^;]*)/);
    if (cookieMatch && (cookieMatch[1] === 'light' || cookieMatch[1] === 'dark' || cookieMatch[1] === 'system')) {
      return cookieMatch[1] as Theme;
    }
  } catch (e) {}
  return 'dark'; // Default to deep government dark theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [isMounted, setIsMounted] = useState(false);

  const applyTheme = useCallback((activeTheme: Theme) => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    const body = window.document.body;

    let effective: 'light' | 'dark' = 'dark';
    if (activeTheme === 'system') {
      effective = getSystemTheme();
    } else {
      effective = activeTheme;
    }

    setResolvedTheme(effective);

    // Apply attribute and class for universal CSS compatibility
    root.setAttribute('data-theme', effective);
    if (body) body.setAttribute('data-theme', effective);

    if (effective === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Persist to storage and cookie
    try {
      localStorage.setItem('theme', activeTheme);
      sessionStorage.setItem('theme', activeTheme);
      document.cookie = `portal_theme=${activeTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
  }, []);

  // Initialize theme on mount and fetch persisted backend preference
  useEffect(() => {
    setIsMounted(true);
    const initial = getInitialTheme();
    applyTheme(initial);

    // If localStorage already had an explicit theme, sync it to backend
    const rawLocal = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const localExplicit: Theme | null = (rawLocal === 'light' || rawLocal === 'dark' || rawLocal === 'system') ? rawLocal : null;

    fetchSettings().then(s => {
      if (localExplicit) {
        // Local preference takes precedence, update backend if different
        if (s && s.theme !== localExplicit) {
          saveSettings({ ...s, theme: localExplicit }).catch(() => {});
        }
      } else if (s?.theme && (s.theme === 'light' || s.theme === 'dark' || s.theme === 'system')) {
        // No local preference yet, use backend saved setting
        setThemeState(s.theme);
        applyTheme(s.theme);
      }
    }).catch(() => {});
  }, [applyTheme]);

  // Listen to OS system color scheme changes when theme is 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    // Asynchronously save to backend setting if possible
    fetchSettings().then(current => {
      saveSettings({ ...current, theme: newTheme }).catch(() => {});
    }).catch(() => {});
  };

  const toggleTheme = () => {
    const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
