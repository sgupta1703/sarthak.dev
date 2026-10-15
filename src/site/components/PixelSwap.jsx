import { motion as Motion } from 'framer-motion';
import { useSite } from '../context';

// Immediate panel changes keep the selected tab and its ARIA state in sync.
export default function PixelSwap({ value, children, className = '' }) {
  const { reducedMotion } = useSite();
  return (
    <Motion.div key={value} className={`pixel-swap ${className}`}
      initial={reducedMotion ? false : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
      {children(value)}
    </Motion.div>
  );
}
