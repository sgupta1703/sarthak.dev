import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationFrame, useInView, useMotionValue } from 'framer-motion';
import { useSite } from '../context';

/* ─── Toasts ─────────────────────────────────────────────────────────────── */
export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const on = (e) => {
      const item = e.detail;
      setItems((prev) => [...prev.slice(-2), item]);
      setTimeout(() => setItems((prev) => prev.filter((p) => p.id !== item.id)), 2600);
    };
    window.addEventListener('site:toast', on);
    return () => window.removeEventListener('site:toast', on);
  }, []);
  return (
    <div className="toaster" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            className="toast"
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(6px)' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          >
            <span className="toast-check" aria-hidden="true">✓</span>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Spotlight card: a soft light and border glow follow the pointer ────── */
export function SpotlightCard({ as: Tag = 'div', className = '', children, style, ...rest }) {
  const ref = useRef(null);
  const visible = useInView(ref, { margin: '100px' });
  const { reducedMotion } = useSite();
  const onMove = (e) => {
    if (reducedMotion || e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <Tag ref={ref} data-visible={visible} className={`spot ${className}`} style={style} onPointerMove={onMove} {...rest}>
      {children}
    </Tag>
  );
}

/* ─── Live clock in a given time zone ─────────────────────────────────────── */
export function LocalTime({ timeZone, seconds = false, className = '' }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone, hour: 'numeric', minute: '2-digit', second: seconds ? '2-digit' : undefined, timeZoneName: 'short',
  });
  return <time className={className} dateTime={now.toISOString()}>{fmt.format(now)}</time>;
}

/* ─── Marquee whose speed and direction follow scroll velocity ───────────── */
export function VelocityMarquee({ items, speed = 36, direction = 1, className = '' }) {
  const { velocity, reducedMotion } = useSite();
  const x = useMotionValue(0);
  const trackRef = useRef(null);
  const period = useRef(0);
  const dirRef = useRef(direction);
  const COPIES = 4;

  useEffect(() => {
    const measure = () => { if (trackRef.current) period.current = trackRef.current.scrollWidth / COPIES; };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [items]);

  useAnimationFrame((_, delta) => {
    if (reducedMotion || !period.current) return;
    const v = velocity.get();
    if (v > 0.5) dirRef.current = direction;
    else if (v < -0.5) dirRef.current = -direction;
    const boost = 1 + Math.min(5, Math.abs(v) * 0.12);
    let next = x.get() - dirRef.current * speed * boost * (delta / 1000);
    const p = period.current;
    if (next <= -p) next += p;
    if (next > 0) next -= p;
    x.set(next);
  });

  return (
    <div className={`marquee ${className}`} aria-hidden="true">
      <motion.div ref={trackRef} className="marquee-track" style={{ x }}>
        {Array.from({ length: COPIES }).flatMap((_, c) =>
          items.map((item, i) => (
            <span key={`${c}-${i}`} className="marquee-item">
              {item}
              <span className="marquee-sep">✦</span>
            </span>
          )),
        )}
      </motion.div>
    </div>
  );
}
