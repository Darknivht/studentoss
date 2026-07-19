import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNwColorScheme } from 'nativewind';
import { Appearance } from 'react-native';

export type ThemePref = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemePref;
  resolved: 'light' | 'dark';
  setTheme: (t: ThemePref) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'studentos.theme';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { setColorScheme } = useNwColorScheme();
  const [theme, setThemeState] = useState<ThemePref>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  // Load persisted pref
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setThemeState(v);
    });
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const resolved: 'light' | 'dark' = theme === 'system' ? systemScheme : theme;

  // Sync with NativeWind
  useEffect(() => {
    setColorScheme(resolved);
  }, [resolved, setColorScheme]);

  const setTheme = (t: ThemePref) => {
    setThemeState(t);
    AsyncStorage.setItem(STORAGE_KEY, t).catch(() => {});
  };

  const toggle = () => setTheme(resolved === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
