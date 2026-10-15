import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeCtx } from './context';
import { applyTheme, getTheme, readTheme, THEME_STORAGE_KEY } from './themes';

export default function ThemeProvider({ children }) {
  const [theme, setCurrent] = useState(readTheme);
  const setTheme = useCallback((id) => setCurrent(getTheme(id)), []);
  useLayoutEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(THEME_STORAGE_KEY, theme.id); } catch { /* Keep previews usable when storage is unavailable. */ }
  }, [theme]);
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
