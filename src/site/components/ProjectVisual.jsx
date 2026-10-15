import { useId } from 'react';

/* Small animated diagrams for the project cards. Pure SVG + CSS; every
   animation is paused under prefers-reduced-motion (see components.css). */

function Timeline() {
  const eras = [30, 92, 150, 214, 282];
  return (
    <svg viewBox="0 0 320 150" className="pv">
      <line x1="16" y1="86" x2="304" y2="86" className="pv-line" />
      {eras.map((x, i) => (
        <g key={x} className="pv-pop" style={{ animationDelay: `${i * 0.35}s` }}>
          <circle cx={x} cy="86" r="5" className="pv-dot" />
          <rect x={x - 22} y={i % 2 ? 98 : 48} width="44" height="22" rx="6" className="pv-card" />
          <line x1={x - 14} y1={i % 2 ? 106 : 56} x2={x + 10} y2={i % 2 ? 106 : 56} className="pv-text" />
          <line x1={x - 14} y1={i % 2 ? 113 : 63} x2={x + 2} y2={i % 2 ? 113 : 63} className="pv-text pv-dim" />
        </g>
      ))}
      <circle cx="16" cy="86" r="4" className="pv-scrub" />
    </svg>
  );
}

function Voice() {
  return (
    <svg viewBox="0 0 320 150" className="pv">
      <circle cx="160" cy="75" r="34" className="pv-ring" />
      <circle cx="160" cy="75" r="48" className="pv-ring pv-ring-2" />
      {Array.from({ length: 23 }).map((_, i) => {
        const x = 46 + i * 10.4;
        if (x > 118 && x < 202) return null;
        return <rect key={i} x={x} y="55" width="4" height="40" rx="2" className="pv-bar" style={{ animationDelay: `${(i % 7) * 0.11}s` }} />;
      })}
      <circle cx="160" cy="75" r="18" className="pv-core" />
    </svg>
  );
}

function Frames() {
  return (
    <svg viewBox="0 0 320 150" className="pv">
      <g className="pv-slide">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i} transform={`translate(${i * 70 - 20} 30)`}>
            <rect width="62" height="90" rx="8" className={`pv-frame ${i === 2 ? 'pv-key' : ''}`} />
            <rect x="8" y="10" width="46" height="50" rx="4" className="pv-fill" />
            <line x1="8" y1="72" x2="44" y2="72" className="pv-text" />
            <line x1="8" y1="80" x2="32" y2="80" className="pv-text pv-dim" />
          </g>
        ))}
      </g>
      <path d="M 158 22 L 158 128" className="pv-anchor" />
    </svg>
  );
}

function Face() {
  const ring = Array.from({ length: 28 }).map((_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return [118 + Math.cos(a) * 38, 75 + Math.sin(a) * 46];
  });
  return (
    <svg viewBox="0 0 320 150" className="pv">
      <g className="pv-nod">
        {ring.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" className="pv-mesh" />)}
        <circle cx="104" cy="66" r="3.5" className="pv-dot" />
        <circle cx="132" cy="66" r="3.5" className="pv-dot" />
        <path d="M 104 92 Q 118 102 132 92" className="pv-line" />
      </g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={196 + i * 16} y={112 - (i + 1) * 12} width="10" height={(i + 1) * 12} rx="2" className="pv-vol" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </svg>
  );
}

function Reel() {
  const clipId = useId();
  return (
    <svg viewBox="0 0 320 150" className="pv">
      <rect x="128" y="8" width="64" height="134" rx="12" className="pv-frame" />
      <clipPath id={clipId}><rect x="132" y="12" width="56" height="126" rx="9" /></clipPath>
      <g clipPath={`url(#${clipId})`}>
        <g className="pv-scrollup">
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(136 ${16 + i * 62})`}>
              <rect width="48" height="56" rx="6" className="pv-fill" />
              <path d="M 19 20 L 31 28 L 19 36 Z" className="pv-play" />
            </g>
          ))}
        </g>
      </g>
      <rect x="40" y="62" width="64" height="26" rx="13" className="pv-card" />
      <text x="72" y="79" className="pv-label" textAnchor="middle">LIVE</text>
      <path d="M 106 75 L 124 75" className="pv-line pv-flow" />
      <rect x="216" y="62" width="64" height="26" rx="13" className="pv-card" />
      <text x="248" y="79" className="pv-label" textAnchor="middle">CLIP</text>
      <path d="M 196 75 L 214 75" className="pv-line pv-flow" />
    </svg>
  );
}

function Route() {
  return (
    <svg viewBox="0 0 320 150" className="pv">
      {Array.from({ length: 9 }).map((_, i) => <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="150" className="pv-grid" />)}
      {Array.from({ length: 5 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 37} x2="320" y2={i * 37} className="pv-grid" />)}
      <path d="M 40 118 C 80 118, 90 60, 140 64 S 200 110, 236 82 S 270 34, 288 30" className="pv-route" pathLength="1" />
      {[[40, 118], [140, 64], [236, 82], [288, 30]].map(([x, y], i) => (
        <g key={i} className="pv-pop" style={{ animationDelay: `${0.4 + i * 0.45}s` }}>
          <circle cx={x} cy={y} r="7" className="pv-pin" />
          <circle cx={x} cy={y} r="2.5" className="pv-pin-core" />
        </g>
      ))}
    </svg>
  );
}

function Checks() {
  return (
    <svg viewBox="0 0 320 150" className="pv">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(70 ${16 + i * 31})`}>
          <rect width="180" height="24" rx="8" className="pv-card" />
          <rect x="8" y="5" width="14" height="14" rx="4" className="pv-box" />
          <path d="M 11 12 L 14 15 L 20 8" className="pv-tick" style={{ animationDelay: `${0.3 + i * 0.5}s` }} pathLength="1" />
          <line x1="32" y1="12" x2={120 - i * 14} y2="12" className="pv-text" />
        </g>
      ))}
    </svg>
  );
}

const VISUALS = { timeline: Timeline, voice: Voice, frames: Frames, face: Face, reel: Reel, route: Route, checks: Checks };

export default function ProjectVisual({ kind }) {
  const V = VISUALS[kind];
  return V ? <V /> : null;
}
