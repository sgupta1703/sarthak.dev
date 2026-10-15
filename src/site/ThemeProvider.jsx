import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeCtx } from './context';
import { applyTheme, DARK_QUERY, getTheme, readTheme, storedTheme, THEME_STORAGE_KEY } from './themes';

export default function ThemeProvider({ children }) {
  const [theme, setCurrent] = useState(readTheme);
  // Only an explicit pick is remembered, so the default can keep following the system.
  const setTheme = useCallback((id) => {
    const next = getTheme(id);
    try { localStorage.setItem(THEME_STORAGE_KEY, next.id); } catch { /* Keep previews usable when storage is unavailable. */ }
    setCurrent(next);
  }, []);
  useLayoutEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const follow = () => { if (!storedTheme()) setCurrent(readTheme()); };
    query.addEventListener('change', follow);
    return () => query.removeEventListener('change', follow);
  }, []);
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
