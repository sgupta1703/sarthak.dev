import { useLayoutEffect, useRef, useState } from 'react';
import { motion as Motion, useInView } from 'framer-motion';
import { useSite } from '../context';
import ParticleImage from './ParticleImage';
import { PRODUCT_FRAME } from '../morph/productFrame';

const EASE = [0.22, 1, 0.36, 1];

// These anchors let the shared cloud form and leave the actual images.
export function PixelPortrait() {
  return (
    <figure className="pixel-portrait">
      <ParticleImage imageId="about" src="/image.jpeg" alt="Sarthak Gupta" width={640} height={800} />
      <figcaption><span className="portrait-caption-dot" />Sarthak Gupta <span>University of Florida</span></figcaption>
    </figure>
  );
}

// A finite SVG sequence: only runs once, when the actual workflow is visible.
export function Workflow() {
  const { reducedMotion } = useSite();
  const ref = useRef(null);
  const visible = useInView(ref, { once: true, amount: 0.5 });
  const nodes = [
    { x: 45, label: 'Voice', detail: 'Message' },
    { x: 190, label: 'On-device AI', detail: 'Snapdragon' },
    { x: 335, label: 'Calendar', detail: 'Event' },
  ];
  return (
    <figure ref={ref} className="workflow">
      <figcaption>On-device workflow <span>Processing stays on the device</span></figcaption>
      <svg viewBox="0 0 380 115" role="img" aria-label="A voice message is processed by on-device AI on Snapdragon to create a calendar event.">
        {[0, 1].map((i) => (
          <g key={i}>
            <path d={`M ${79 + i * 145} 40 H ${156 + i * 145}`} className="workflow-track" />
            <Motion.path d={`M ${79 + i * 145} 40 H ${156 + i * 145}`} className="workflow-beam"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={visible ? { pathLength: 1, opacity: 1 } : undefined}
              transition={{ duration: reducedMotion ? 0 : 0.7, delay: reducedMotion ? 0 : 0.2 + i * 0.55, ease: EASE }} />
          </g>
        ))}
        {nodes.map((node, i) => (
          <Motion.g key={node.label} initial={{ opacity: 0.35 }} animate={visible ? { opacity: 1 } : undefined}
            transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : i * 0.5 }}>
            <rect x={node.x - 24} y="16" width="48" height="48" rx="14" className="workflow-node" />
            {i === 0 ? <path d={`M ${node.x - 9} 36 v8 m6 -14 v20 m6 -25 v30 m6 -19 v8`} className="workflow-icon" />
              : i === 1 ? <><rect x={node.x - 9} y="31" width="18" height="18" rx="3" className="workflow-icon" /><path d={`M ${node.x - 4} 27 v4 m8 -4 v4 m-8 18 v4 m8 -4 v4 m-17 -17 h4 m18 0 h4 m-26 8 h4 m18 0 h4`} className="workflow-icon" /></>
                : <><rect x={node.x - 10} y="31" width="20" height="19" rx="3" className="workflow-icon" /><path d={`M ${node.x - 10} 37 h20 m-14 -10 v7 m8 -7 v7 m-9 10 3 3 6 -6`} className="workflow-icon" /></>}
            <text x={node.x} y="86" textAnchor="middle" className="workflow-label">{node.label}</text>
            <text x={node.x} y="103" textAnchor="middle" className="workflow-detail">{node.detail}</text>
          </Motion.g>
        ))}
      </svg>
    </figure>
  );
}

// Inspect project artwork without changing the page's scroll or zoom.
export function ProjectLens({ children, label, magnified }) {
  const ref = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const position = (event, center = false) => {
    const el = ref.current;
    const box = el.getBoundingClientRect();
    el.style.setProperty('--lens-x', `${center ? box.width / 2 : event.clientX - box.left}px`);
    el.style.setProperty('--lens-y', `${center ? box.height / 2 : event.clientY - box.top}px`);
    el.style.setProperty('--lens-w', `${box.width}px`);
    el.style.setProperty('--lens-h', `${box.height}px`);
  };
  return (
    <div ref={ref} className={`project-lens ${enabled ? 'is-enabled' : ''}`}
      onPointerMove={(event) => { if (event.pointerType === 'mouse') position(event); }}
      onFocus={(event) => position(event, true)}
      onKeyDown={(event) => { if (event.key === 'Escape') setEnabled(false); }}>
      {children}
      <button type="button" className="project-inspect" aria-label={`Inspect ${label} visual`} aria-pressed={enabled}
        onClick={(event) => { position(event, true); setEnabled((value) => !value); }}>⌕<span>{enabled ? 'Close' : 'Inspect'}</span></button>
      {enabled && <span className="project-lens-window" aria-hidden="true"><span className="project-lens-content">{magnified || children}</span></span>}
    </div>
  );
}

export function ProductPreview() {
  const ref = useRef(null);
  const { registerImage } = useSite();
  useLayoutEffect(() => registerImage('lingua', ref.current), [registerImage]);
  return <div ref={ref} className="product-preview" data-phase="forming" style={{ aspectRatio: `${PRODUCT_FRAME.width} / ${PRODUCT_FRAME.height}` }}>
    <figure className="product-frame">
    <div className="product-window-bar"><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /><span>linguaclassroom.com</span></div>
    <div className="product-screenshot"><ProjectLens label="Lingua website screenshot" magnified={<img src="/lingua-preview.jpg" alt="" width="1280" height="760" />}>
      <img src="/lingua-preview.jpg" alt="Lingua's public website, a language learning platform co-founded by Sarthak Gupta" width="1280" height="760" loading="lazy" decoding="async" />
    </ProjectLens></div>
    <figcaption><span>Lingua</span><a href="https://linguaclassroom.com" target="_blank" rel="noopener noreferrer">Visit site ↗</a></figcaption>
    </figure>
  </div>;
}

export function Underline({ children }) {
  const { reducedMotion } = useSite();
  return <Motion.span className="result-highlight" initial="hidden" whileInView="shown" viewport={{ once: true }}>
    {children}
    <svg viewBox="0 0 160 10" preserveAspectRatio="none" aria-hidden="true">
      <Motion.path d="M 2 7 Q 80 2 158 5" variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1 } }}
        transition={{ duration: reducedMotion ? 0 : 0.65, delay: reducedMotion ? 0 : 0.2, ease: EASE }} />
    </svg>
  </Motion.span>;
}
