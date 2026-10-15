import { useRef, useState } from 'react';
import { AnimatePresence, motion as Motion, useInView } from 'framer-motion';
import { useSite } from '../context';
import { EXPERIENCE, PROJECTS, SKILLS } from '../data';
import { RollText } from './Motion';
import PixelSwap from './PixelSwap';

const EASE = [0.22, 1, 0.36, 1];
const COLORS = ['var(--accent)', 'color-mix(in srgb, var(--accent) 85%, var(--text))', 'color-mix(in srgb, var(--accent) 75%, var(--text))', 'color-mix(in srgb, var(--accent) 90%, var(--text))'];
const NOTES = [
  'From a first idea to a working system.',
  'Models, agents, and the tools to make them useful.',
  'Software that meets the physical world.',
  'Interfaces, services, and everything underneath.',
];
const ALIASES = {
  'OpenAI API': ['OpenAI'], 'Slurm (HPC)': ['Slurm'], 'Express.js': ['Express'],
  PostgreSQL: ['PostgreSQL', 'Postgres'], 'NVIDIA Isaac Sim': ['Isaac Sim'],
};
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function usageFor(name) {
  const re = new RegExp(`(^|[^A-Za-z0-9])(${(ALIASES[name] || [name]).map(escape).join('|')})(?![A-Za-z0-9])`, 'i');
  return [
    ...EXPERIENCE.filter((item) => re.test(`${item.stack.join(' ')} ${item.bullets.join(' ')}`))
      .map((item) => ({ id: item.id, label: item.orgShort || item.org })),
    ...PROJECTS.filter((item) => re.test(`${item.stack.join(' ')} ${item.desc}`))
      .map((item) => ({ id: 'projects', label: item.name })),
  ];
}

const GROUPS = SKILLS.map((group) => ({ ...group, items: group.items.map((name) => ({ name, usage: usageFor(name) })) }));

// The same 64 points reorganize into code, a network, a chip, and data layers.
function dotPosition(group, i) {
  const step = (i % 16) / 15;
  const segment = Math.floor(i / 16);
  if (group === 0) {
    const lines = [[66, 35, 33, 64], [33, 64, 66, 93], [94, 35, 127, 64], [127, 64, 94, 93]];
    const [x1, y1, x2, y2] = lines[segment];
    return [x1 + (x2 - x1) * step, y1 + (y2 - y1) * step];
  }
  if (group === 1) {
    const column = Math.floor(i / 8);
    const row = i % 8;
    const spread = 16 + Math.abs(column - 3.5) * 11;
    return [31 + column * 14, 64 + (row / 7 - 0.5) * spread * 1.6];
  }
  if (group === 2) {
    if (i < 36) return [55 + (i % 6) * 10, 39 + Math.floor(i / 6) * 10];
    const side = Math.floor((i - 36) / 7);
    const offset = ((i - 36) % 7) * 10;
    return [[50 + offset, 26], [118, 34 + offset], [50 + offset, 102], [42, 34 + offset]][side];
  }
  const layer = Math.floor(i / 16);
  const edge = Math.floor((i % 16) / 4);
  const t = (i % 4) / 4;
  const corners = [[80, 21], [125, 42], [80, 63], [35, 42], [80, 21]];
  return [corners[edge][0] + (corners[edge + 1][0] - corners[edge][0]) * t,
    corners[edge][1] + (corners[edge + 1][1] - corners[edge][1]) * t + layer * 15];
}

function DotGlyph({ group, picked, inView }) {
  const { reducedMotion } = useSite();
  return (
    <div className={`skill-glyph ${inView ? 'is-visible' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 160 128" fill="currentColor">
        {Array.from({ length: 64 }, (_, i) => {
          const [cx, cy] = dotPosition(group, i);
          return (
            <Motion.circle
              key={i}
              initial={false}
              animate={{ cx, cy, r: picked < 0 ? 1.7 : 1.45 + ((i + picked * 3) % 7) * 0.14 }}
              transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 95, damping: 15, delay: (i % 8) * 0.018 }}
              style={{ '--pulse-delay': `${-(i % 11) * 0.31}s` }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function SkillIndex() {
  const { reducedMotion, goTo } = useSite();
  const [group, setGroup] = useState(0);
  const [picked, setPicked] = useState(null);
  const tabRefs = useRef([]);
  const rootRef = useRef(null);
  const inView = useInView(rootRef, { margin: '80px' });
  const current = GROUPS[group];
  const selected = current.items.find((item) => item.name === picked);
  const transition = { duration: reducedMotion ? 0 : 0.28, ease: EASE };

  function selectGroup(index) {
    setGroup(index);
    setPicked(null);
  }

  function onTabKey(event, index) {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % GROUPS.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + GROUPS.length - 1) % GROUPS.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = GROUPS.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectGroup(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <Motion.div
      ref={rootRef}
      className="skill-index"
      style={{ '--skill-accent': COLORS[group] }}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reducedMotion ? 0 : 0.8, ease: EASE }}
    >
      <div className="skill-sidebar">
        <div className="skill-index-label"><span>Disciplines</span><span>01 — 04</span></div>
        <div className="skill-categories" role="tablist" aria-label="Skill categories" aria-orientation="vertical">
          {GROUPS.map((item, i) => (
            <button
              key={item.group}
              ref={(element) => { tabRefs.current[i] = element; }}
              id={`skill-tab-${i}`}
              role="tab"
              aria-selected={group === i}
              aria-controls={`skill-panel-${i}`}
              tabIndex={group === i ? 0 : -1}
              className={`skill-category ${group === i ? 'is-on' : ''}`}
              onClick={() => selectGroup(i)}
              onKeyDown={(event) => onTabKey(event, i)}
            >
              <span className="skill-category-number">0{i + 1}</span>
              <RollText>{item.group}</RollText>
              <span className="skill-category-count">{String(item.items.length).padStart(2, '0')}</span>
              {group === i && <Motion.span className="skill-category-line" layoutId="skill-category-line" transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 28 }} />}
            </button>
          ))}
        </div>
      </div>

      <div className="skill-workspace">
        <div className="skill-panel-head">
          <div>
            <span className="skill-index-label">In the toolkit <span className="skill-page-number">/ 0{group + 1}</span></span>
            <AnimatePresence mode="wait" initial={false}>
              <Motion.div key={group} initial={{ opacity: 0, y: reducedMotion ? 0 : 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -9 }} transition={transition}>
                <h3>{current.group}</h3>
                <p className="skill-description">{NOTES[group]}</p>
              </Motion.div>
            </AnimatePresence>
          </div>
          <DotGlyph group={group} picked={current.items.findIndex((item) => item.name === picked)} inView={inView} />
        </div>

        <PixelSwap value={group}>
          {(shownGroup) => GROUPS.map((category, categoryIndex) => (
          <div key={category.group} id={`skill-panel-${categoryIndex}`} role="tabpanel" aria-labelledby={`skill-tab-${categoryIndex}`} hidden={shownGroup !== categoryIndex}>
            {shownGroup === categoryIndex && (
              <Motion.ul className="skill-list" initial={reducedMotion ? false : 'hidden'} animate="show" variants={{ show: { transition: { staggerChildren: reducedMotion ? 0 : 0.038 } } }}>
                {category.items.map((item, i) => (
                  <Motion.li key={item.name} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} transition={transition}>
                    <button
                      className={`skill-item ${picked === item.name ? 'is-on' : ''}`}
                      aria-pressed={picked === item.name}
                      aria-describedby={picked === item.name ? 'skill-usage-detail' : undefined}
                      onFocus={() => setPicked(item.name)}
                      onClick={() => setPicked(item.name)}
                    >
                      <span className="skill-item-number">{String(i + 1).padStart(2, '0')}</span>
                      <span className="skill-item-name">{item.name}</span>
                      <span className="skill-item-arrow" aria-hidden="true">↗</span>
                    </button>
                  </Motion.li>
                ))}
              </Motion.ul>
            )}
          </div>
        ))}
        </PixelSwap>

        <div className={`skill-context ${selected ? 'has-selection' : ''}`} id="skill-usage-detail" aria-live="polite" aria-atomic="true">
        {selected && <>
          <span className="skill-context-label"><span className="is-on" />{selected.name}</span>
          <AnimatePresence mode="wait" initial={false}>
            <Motion.div key={picked} className="skill-context-body" initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.16 }}>
              {
                selected.usage.length ? <><span className="skill-used-label">Used in</span>{selected.usage.map((usage) => <button key={`${usage.id}-${usage.label}`} className="skill-usage-link" onClick={() => goTo(usage.id)}>{usage.label}<span aria-hidden="true">↗</span></button>)}</>
                  : <p>Part of my working toolkit.</p>
              }
            </Motion.div>
          </AnimatePresence>
        </>}
        </div>
      </div>
    </Motion.div>
  );
}
