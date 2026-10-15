import { createContext, useContext } from 'react';

/* Stable values: refs, motion values and callbacks. Changes rarely, so the
   sections that read it don't re-render while scrolling. */
export const SiteCtx = createContext(null);
export const useSite = () => useContext(SiteCtx);

/* The nearest section index. Only the nav and rail subscribe to it. */
export const ActiveCtx = createContext(0);
export const useActive = () => useContext(ActiveCtx);

export const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

export const useIndex = (id) => {
  const { sections } = useSite();
  return sections.findIndex((s) => s.id === id);
};
