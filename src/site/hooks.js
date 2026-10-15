import { useEffect, useState } from 'react';
import { frame, cancelFrame } from 'framer-motion';
import Lenis from 'lenis';

/* ─── Lenis (shared by every page) ───────────────────────────────────────── */
export function useLenis() {
  const [lenis, setLenis] = useState(null);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const l = new Lenis({ lerp: 0.12, smoothWheel: !preference.matches, syncTouch: false, wheelMultiplier: 1, touchMultiplier: 1 });
    window.__lenis = l;
    setLenis(l);
    // Advance scroll before Motion measures its scroll-linked transforms.
    const loop = ({ timestamp }) => l.raf(timestamp);
    frame.setup(loop, true);
    const changePreference = () => { l.options.smoothWheel = !preference.matches; };
    preference.addEventListener('change', changePreference);
    return () => {
      cancelFrame(loop);
      preference.removeEventListener('change', changePreference);
      l.destroy();
      window.__lenis = null;
    };
  }, []);
  return lenis;
}

export function useMedia(query) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setMatch(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return match;
}
