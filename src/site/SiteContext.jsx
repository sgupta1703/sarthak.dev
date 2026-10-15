import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import { ActiveCtx, SiteCtx } from './context';
import { useMedia } from './hooks';

/* Piecewise-linear map from scroll position to a fractional section index. */
function indexAt(scroll, knots) {
  if (!knots.length || scroll <= knots[0][0]) return knots.length ? knots[0][1] : 0;
  for (let i = 1; i < knots.length; i++) {
    const [x1, v1] = knots[i];
    if (scroll <= x1) {
      const [x0, v0] = knots[i - 1];
      return x1 === x0 ? v1 : v0 + ((v1 - v0) * (scroll - x0)) / (x1 - x0);
    }
  }
  return knots[knots.length - 1][1];
}

const smooth = (a, b, value) => { const t = Math.max(0, Math.min(1, (value - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ─── Site scroll state ──────────────────────────────────────────────────────
   One fractional section index drives the cloud and navigation. Content
   scrolls in normal document flow; tall sections hold their backdrop. */
export function SiteProvider({ lenis, sections, children }) {
  const wide = useMedia('(min-width: 900px)');
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)');
  const shapeIndex = useMotionValue(0);
  const velocity = useMotionValue(0);
  const progress = useMotionValue(0);
  const indexRef = useRef(0);
  const scrollRef = useRef(0);
  const centersRef = useRef([]);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const imageAnchorsRef = useRef(new Map());
  const els = useRef([]);
  const knots = useRef([]);
  const maxScroll = useRef(0);
  const activeRef = useRef(0);
  const registrations = useRef([]);
  const [active, setActive] = useState(0);

  const update = useCallback((scroll) => {
    scrollRef.current = scroll;
    const s = indexAt(scroll, knots.current);
    for (const anchor of imageAnchorsRef.current.values()) {
      const distance = Math.abs(s - anchor.index);
      const reveal = reducedMotion ? 1 : 1 - smooth(0.015, 0.11, distance);
      if (anchor.reveal !== reveal) {
        anchor.element.style.setProperty('--image-reveal', String(reveal));
        anchor.reveal = reveal;
      }
      const phase = reveal >= 0.999 ? 'image' : reveal > 0 ? 'resolving' : s < anchor.index ? 'forming' : 'dispersing';
      if (anchor.phase !== phase) {
        anchor.element.dataset.phase = phase;
        anchor.phase = phase;
      }
    }
    indexRef.current = s;
    shapeIndex.set(s);
    const max = maxScroll.current;
    progress.set(max > 0 ? Math.min(1, Math.max(0, scroll / max)) : 0);
    const nearest = Math.round(s);
    if (nearest !== activeRef.current) { activeRef.current = nearest; setActive(nearest); }
  }, [shapeIndex, progress, reducedMotion]);

  const compute = useCallback(() => {
    const vh = window.innerHeight;
    const max = Math.max(0, document.documentElement.scrollHeight - vh);
    maxScroll.current = max;
    const out = [];
    const centers = [];
    for (const anchor of imageAnchorsRef.current.values()) {
      const rect = anchor.element.getBoundingClientRect();
      anchor.bounds = { left: rect.left, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
    }
    sections.forEach((s, i) => {
      const el = els.current[i];
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const h = el.offsetHeight;
      const image = imageAnchorsRef.current.get(s.id)?.bounds;
      const center = Math.min(max, Math.max(0, image ? image.top + image.height / 2 - vh / 2 : top + h / 2 - vh / 2));
      const hold = image ? Math.max(vh * 0.12, (vh - image.height) * 0.35) : s.anchor === 'top' ? Math.max(vh * 0.06, (h - vh) * 0.35) : vh * 0.1;
      centers[i] = center;
      out.push([center - hold, i], [center + hold, i]);
    });
    for (let i = 1; i < out.length; i++) if (out[i][0] <= out[i - 1][0]) out[i][0] = out[i - 1][0] + 1;
    knots.current = out;
    centersRef.current = centers;
    update(window.scrollY);
  }, [sections, update]);

  const registerImage = useCallback((id, element) => {
    const anchor = { element, index: sections.findIndex((section) => section.id === id), bounds: null };
    imageAnchorsRef.current.set(id, anchor);
    let raf = 0;
    const measure = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(compute); };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      if (imageAnchorsRef.current.get(id) === anchor) imageAnchorsRef.current.delete(id);
    };
  }, [sections, compute]);

  useEffect(() => {
    if (!lenis) return;
    const onScroll = (l) => {
      update(l.scroll);
      velocity.set(l.velocity);
    };
    lenis.on('scroll', onScroll);
    return () => lenis.off('scroll', onScroll);
  }, [lenis, update, velocity]);

  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    els.current.forEach((el) => { if (el) ro.observe(el); });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [compute]);

  useEffect(() => {
    const move = (e) => {
      pointerRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
        active: e.pointerType === 'mouse',
      };
    };
    const leave = () => { pointerRef.current = { ...pointerRef.current, active: false }; };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, []);

  const register = useCallback((i) => {
    registrations.current[i] ||= (el) => { els.current[i] = el; };
    return registrations.current[i];
  }, []);

  const goTo = useCallback((id, opts = {}) => {
    const i = sections.findIndex((s) => s.id === id);
    const el = els.current[i];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const target = Math.max(0, Math.min(max, top - (sections[i].anchor === 'top' ? 88 : 0)));
    const distance = Math.abs(target - window.scrollY);
    const immediate = opts.immediate || reducedMotion;
    if (opts.history !== false) window.history.replaceState(null, '', id === 'top' ? window.location.pathname + window.location.search : `#${id}`);
    if (lenis) lenis.scrollTo(target, { immediate, force: true, duration: Math.min(0.78, 0.48 + distance / 50000), easing: (t) => 1 - Math.pow(1 - t, 3) });
    else window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
  }, [lenis, sections, reducedMotion]);

  // One handler for every real section link, including future content links.
  useEffect(() => {
    const navigate = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      const id = url.hash.slice(1);
      if (!sections.some((section) => section.id === id)) return;
      event.preventDefault();
      goTo(id);
    };
    document.addEventListener('click', navigate);
    return () => document.removeEventListener('click', navigate);
  }, [goTo, sections]);

  // Deep links: /#lingua lands on that section once layout settles.
  useEffect(() => {
    if (!lenis) return;
    const id = window.location.hash.slice(1);
    if (!id || !sections.some((s) => s.id === id)) return;
    const t = setTimeout(() => goTo(id, { immediate: true, history: false }), 120);
    return () => clearTimeout(t);
  }, [lenis, sections, goTo]);

  const value = useMemo(() => ({
    sections, wide, reducedMotion, shapeIndex, velocity, progress,
    indexRef, scrollRef, centersRef, pointerRef, imageAnchorsRef, registerImage, register, goTo,
  }), [sections, wide, reducedMotion, shapeIndex, velocity, progress, registerImage, register, goTo]);

  return (
    <SiteCtx.Provider value={value}>
      <ActiveCtx.Provider value={active}>{children}</ActiveCtx.Provider>
    </SiteCtx.Provider>
  );
}
