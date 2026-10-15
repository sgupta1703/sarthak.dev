import { motion as Motion } from 'framer-motion';
import { useSite } from '../context';

// Expand the decorative frame once. Content stays on the normal scroll layer
// instead of repainting a full section through an animated clip-path.
export default function ScrollExpand({ children }) {
  const { reducedMotion, wide } = useSite();
  return (
    <div className="scroll-expand">
      <Motion.div className="scroll-expand-frame" aria-hidden="true"
        initial={reducedMotion ? false : { scaleX: wide ? 0.96 : 1 }} whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.1 }} transition={{ duration: reducedMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }} />
      <div className="scroll-expand-content">{children}</div>
    </div>
  );
}
