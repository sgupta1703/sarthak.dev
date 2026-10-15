import { Fragment, useEffect, useRef, useState } from 'react';
import { motion as Motion, useInView } from 'framer-motion';
import { useSite } from '../context';

const EASE = [0.22, 1, 0.36, 1];

/* `**text**` → highlighted run. */
export function Rich({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => (i % 2 ? <strong key={i} className="hl">{p}</strong> : <Fragment key={i}>{p}</Fragment>));
}

/* Words unfold through a mask, like type passing through a printing gate. */
export function BlurText({ text, as: Tag = 'span', className = '', delay = 0, stagger = 0.045, once = true }) {
  const { reducedMotion } = useSite();
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: '-12% 0px' });
  const words = text.split(' ');
  return (
    <Tag ref={ref} className={`blur-text ${className}`}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="word-mask"
        >
          <Motion.span
            className="blur-word"
            initial={reducedMotion ? false : { y: '105%', rotate: 0 }}
            animate={inView || reducedMotion ? { y: 0, rotate: 0 } : undefined}
            transition={{ duration: reducedMotion ? 0 : 0.55, ease: EASE, delay: reducedMotion ? 0 : delay + i * stagger }}
          >
            {w}{i < words.length - 1 ? '\u00a0' : ''}
          </Motion.span>
        </span>
      ))}
    </Tag>
  );
}

/* Counts up once when scrolled into view. */
export function NumberTicker({ value, decimals = 0, suffix = '', prefix = '', duration = 0.85, className = '' }) {
  const { reducedMotion } = useSite();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(reducedMotion ? value : 0);
  useEffect(() => {
    if (!inView || reducedMotion) { if (reducedMotion) setN(value); return; }
    const start = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      setN(value * (1 - Math.pow(1 - t, 4)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reducedMotion]);
  const shown = n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} className={`ticker ${className}`}>
      <span className="ticker-sizer" aria-hidden="true">{prefix}{value.toLocaleString('en-US', { minimumFractionDigits: decimals })}{suffix}</span>
      <span className="ticker-live">{prefix}{shown}{suffix}</span>
    </span>
  );
}
