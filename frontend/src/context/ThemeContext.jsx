import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const accentOptions = {
  coral: { label: 'Coral', light: '#ee6c4d', dark: '#ff8367' },
  ocean: { label: 'Océano', light: '#2d6a8e', dark: '#5da2c7' },
  violet: { label: 'Violeta', light: '#805ad5', dark: '#a78bfa' },
  emerald: { label: 'Esmeralda', light: '#2f855a', dark: '#68d391' },
  amber: { label: 'Ámbar', light: '#c47f14', dark: '#f6c453' },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('kendall-theme') || 'light');
  const [accent, setAccent] = useState(() => localStorage.getItem('kendall-accent') || 'coral');
  useEffect(() => {
    const selected = accentOptions[accent] || accentOptions.coral;
    const activeAccent = theme === 'dark' ? selected.dark : selected.light;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = accent;
    document.documentElement.style.setProperty('--coral', activeAccent);
    document.documentElement.style.setProperty('--accent', activeAccent);
    localStorage.setItem('kendall-theme', theme);
    localStorage.setItem('kendall-accent', accent);
  }, [theme, accent]);
  const value = useMemo(() => ({ theme, accent, accentOptions, isDark: theme === 'dark', setAccent, toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark') }), [theme, accent]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
