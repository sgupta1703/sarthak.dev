import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSite } from '../context';
import { EXPERIENCE, PROFILE } from '../data';
import { copyText, isMac } from '../actions';

export default function CommandPalette() {
  const { goTo } = useSite();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const lastFocus = useRef(null);

  const items = useMemo(() => {
    const go = (id) => () => goTo(id);
    const open = (href) => () => window.open(href, '_blank', 'noopener');
    return [
      { group: 'Go to', label: 'Intro', action: go('top') },
      { group: 'Go to', label: 'About', action: go('about') },
      ...EXPERIENCE.map((e) => ({ group: 'Work', label: e.orgShort || e.org, hint: e.role, action: go(e.id) })),
      { group: 'Go to', label: 'Projects', action: go('projects') },
      { group: 'Go to', label: 'Awards & presentations', hint: 'recognition, competitions and talks', action: go('stage') },
      { group: 'Go to', label: 'Skills', action: go('skills') },
      { group: 'Go to', label: 'Contact', action: go('contact') },
      { group: 'Actions', label: 'Copy email address', hint: PROFILE.email, action: () => copyText(PROFILE.email, 'Email copied') },
      { group: 'Go to', label: 'Résumé viewer', action: go('resume') },
      { group: 'Actions', label: 'Download résumé (PDF)', action: () => window.open(PROFILE.resume, '_blank') },
      { group: 'Links', label: 'LinkedIn', hint: PROFILE.linkedinLabel, action: open(PROFILE.linkedin) },
      { group: 'Links', label: 'GitHub', hint: `@${PROFILE.githubUser}`, action: open(PROFILE.github) },
      { group: 'Links', label: 'Lingua', hint: 'linguaclassroom.com', action: open('https://linguaclassroom.com') },
      { group: 'Links', label: 'Ideas notebook', action: () => { window.location.hash = '#experiment'; } },
    ];
  }, [goTo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => `${it.group} ${it.label} ${it.hint || ''}`.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    const toggle = () => setOpen((v) => !v);
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('site:palette', toggle);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('site:palette', toggle);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const lenis = window.__lenis;
    if (open) {
      lastFocus.current = document.activeElement;
      setQuery('');
      setCursor(0);
      lenis?.stop();
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    } else {
      lenis?.start();
      lastFocus.current?.focus?.({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => { setCursor(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const run = (it) => {
    setOpen(false);
    requestAnimationFrame(() => it.action());
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(filtered.length - 1, c + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    else if (e.key === 'Enter' && filtered[cursor]) { e.preventDefault(); run(filtered[cursor]); }
  };

  let lastGroup = null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <motion.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            initial={{ opacity: 0, y: -12, scale: 0.97, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, scale: 0.98, filter: 'blur(6px)' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            onKeyDown={onKeyDown}
          >
            <div className="palette-input-row">
              <span className="palette-search" aria-hidden="true">⌕</span>
              <input
                ref={inputRef}
                className="palette-input"
                placeholder="Jump to a section, copy my email, open a link…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={filtered[cursor] ? `palette-item-${cursor}` : undefined}
              />
              <kbd className="kbd">esc</kbd>
            </div>
            <ul id="palette-list" className="palette-list" role="listbox" ref={listRef} data-lenis-prevent>
              {filtered.length === 0 && <li className="palette-empty">Nothing matches “{query}”.</li>}
              {filtered.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <li key={`${it.group}-${it.label}`} role="presentation">
                    {header && <div className="palette-group">{header}</div>}
                    <div
                      id={`palette-item-${i}`}
                      role="option"
                      aria-selected={i === cursor}
                      data-index={i}
                      className={`palette-item ${i === cursor ? 'is-active' : ''}`}
                      onMouseMove={() => setCursor(i)}
                      onClick={() => run(it)}
                    >
                      <span className="palette-label">{it.label}</span>
                      {it.hint && <span className="palette-hint">{it.hint}</span>}
                      <span className="palette-enter" aria-hidden="true">↵</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="palette-foot">
              <span><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> to move</span>
              <span><kbd className="kbd">↵</kbd> to select</span>
              <span><kbd className="kbd">{isMac() ? '⌘' : 'Ctrl'}</kbd><kbd className="kbd">K</kbd> to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
