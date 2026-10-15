import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion, useInView } from 'framer-motion';
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
          <Motion.div
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
          </Motion.div>
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
