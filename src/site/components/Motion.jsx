import { motion as Motion, useSpring } from 'framer-motion';
import { useSite } from '../context';

// The hit area stays still; only the contents follow the pointer.
export function Magnetic({ children, className = '', as = 'button', ...props }) {
  const { reducedMotion } = useSite();
  const x = useSpring(0, { stiffness: 320, damping: 30 });
  const y = useSpring(0, { stiffness: 320, damping: 30 });
  const Tag = as;
  const reset = () => { x.set(0); y.set(0); };
  return (
    <Tag
      {...props}
      className={`magnetic ${className}`}
      onPointerMove={(event) => {
        if (reducedMotion || event.pointerType !== 'mouse') return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * 0.07);
        y.set((event.clientY - rect.top - rect.height / 2) * 0.1);
      }}
      onPointerLeave={reset}
      onBlur={reset}
    >
      <Motion.span className="magnetic-inner" style={reducedMotion ? undefined : { x, y }}>{children}</Motion.span>
    </Tag>
  );
}

export function RollText({ children }) {
  return (
    <span className="roll-text">
      <span className="sr-only">{children}</span>
      <span className="roll-letters" aria-hidden="true">
        {Array.from(children).map((letter, i) => (
          <span className="roll-letter" key={i} style={{ '--letter': i }}>
            <span>{letter === ' ' ? '\u00a0' : letter}</span>
            <span>{letter === ' ' ? '\u00a0' : letter}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
