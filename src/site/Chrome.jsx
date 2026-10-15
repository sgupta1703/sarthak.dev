import { useMemo, useState } from 'react';
import { motion as Motion, useTransform } from 'framer-motion';
import { useActive, useSite } from './context';
import { EXPERIENCE } from './data';
import { openPalette, isMac } from './actions';
import { Magnetic, RollText } from './components/Motion';
import ThemePicker from './components/ThemePicker';

/* Content enters once, then travels naturally with the document. Particle
   transitions never change the copy's visibility or move its scroll target. */
export function Pinned({ index, className = '', children }) {
  const { reducedMotion } = useSite();
  return (
    <Motion.div className={className} data-section-index={index}
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </Motion.div>
  );
}

const NAV = [
  { label: 'About', id: 'about', chapters: ['About'] },
  { label: 'Work', id: EXPERIENCE[0].id, chapters: ['Work'] },
  { label: 'Projects', id: 'projects', chapters: ['Projects', 'Recognition'] },
  { label: 'Skills', id: 'skills', chapters: ['Skills'] },
  { label: 'Contact', id: 'contact', chapters: ['Contact'] },
];

export function Nav() {
  const { sections, progress, shapeIndex, reducedMotion } = useSite();
  const active = useActive();
  const chapter = sections[active]?.chapter;
  const [hovered, setHovered] = useState(null);
  const solid = useTransform(shapeIndex, [0, 0.4], [0.85, 1]);
  const capsuleTransition = reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 430, damping: 36 };
  return (
    <Motion.header className="nav" initial={reducedMotion ? false : { opacity: 0, top: -20 }} animate={{ opacity: 1, top: 18 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={(event) => {
        if (reducedMotion || event.pointerType !== 'mouse') return;
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--nav-x', `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty('--nav-y', `${event.clientY - rect.top}px`);
      }}>
      <Motion.span className="nav-glass" style={{ opacity: solid }} aria-hidden="true" />
      <span className="nav-spotlight" aria-hidden="true" />
      <Magnetic as="a" href="#top" className="nav-mark" aria-label="Sarthak Gupta — back to top">
        <span className="nav-emblem" aria-hidden="true">
          <svg className="nav-orbit" viewBox="0 0 36 36"><circle className="nav-orbit-track" cx="18" cy="18" r="16" /><Motion.circle className="nav-orbit-progress" cx="18" cy="18" r="16" style={{ pathLength: progress }} /></svg>
          <span className="nav-mark-dots">{Array.from({ length: 9 }, (_, i) => <span key={i} style={{ '--dot': i }} />)}</span>
        </span>
        <span className="nav-name">Sarthak<span className="nav-surname"> Gupta</span><span className="nav-name-period">.</span></span>
      </Magnetic>
      <nav className="nav-links" aria-label="Primary" onPointerLeave={() => setHovered(null)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(null); }}>
        {NAV.map((l) => {
          const on = l.chapters.includes(chapter);
          return (
            <a key={l.id} href={`#${l.id}`} className={`nav-link ${on ? 'is-on' : ''}`} aria-current={on ? 'location' : undefined}
              onPointerEnter={() => setHovered(l.id)} onFocus={() => setHovered(l.id)}>
              {on && <Motion.span layoutId="nav-active" className="nav-capsule" transition={capsuleTransition} aria-hidden="true" />}
              {hovered === l.id && !on && <Motion.span layoutId="nav-hover" className="nav-hover" transition={capsuleTransition} aria-hidden="true" />}
              <RollText>{l.label}</RollText>
              {on && <span className="nav-marker" aria-hidden="true" />}
            </a>
          );
        })}
      </nav>
      <div className="nav-end">
        <ThemePicker />
        <button className="nav-k" onClick={openPalette} aria-label="Open command menu" title={`${isMac() ? '⌘' : 'Ctrl'} K`}>
          <span className="nav-k-desktop" aria-hidden="true">{isMac() ? '⌘' : 'Ctrl'}<span>K</span></span>
          <span className="nav-k-mobile"><RollText>Menu</RollText></span>
        </button>
        <Magnetic as="a" href="#resume" className={`nav-cta border-sweep ${chapter === 'Résumé' ? 'is-on' : ''}`} aria-current={chapter === 'Résumé' ? 'location' : undefined}>
          <RollText>Résumé</RollText><span className="nav-cta-arrow" aria-hidden="true">↗</span>
        </Magnetic>
      </div>
      <span className="nav-soft-edge" aria-hidden="true" />
    </Motion.header>
  );
}

/* Chapter rail on the right edge; Work shows a tick per role. */
export function Rail() {
  const { sections, goTo } = useSite();
  const active = useActive();
  const chapters = useMemo(() => {
    const out = [];
    sections.forEach((s, i) => {
      const last = out[out.length - 1];
      if (last && last.label === s.chapter) last.members.push(i);
      else out.push({ label: s.chapter, id: s.id, members: [i] });
    });
    return out;
  }, [sections]);
  return (
    <nav className="rail" aria-label="Sections">
      {chapters.map((c) => {
        const on = c.members.includes(active);
        return (
          <button key={c.id} className={`rail-item ${on ? 'is-on' : ''}`} onClick={() => goTo(c.id)} aria-current={on ? 'true' : undefined}>
            <span className="rail-label">{c.label}</span>
            {c.members.length > 1 ? (
              <span className="rail-ticks" aria-hidden="true">
                {c.members.map((m) => <RailTick key={m} index={m} />)}
              </span>
            ) : (
              <span className="rail-dot" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function RailTick({ index: m }) {
  const { shapeIndex } = useSite();
  const opacity = useTransform(shapeIndex, [m - 1, m - 0.4, m, m + 0.4, m + 1], [0.3, 0.55, 1, 0.55, 0.3]);
  const scaleY = useTransform(shapeIndex, [m - 0.5, m, m + 0.5], [1, 1.8, 1]);
  return <Motion.span className="rail-tick" style={{ opacity, scaleY }} />;
}
