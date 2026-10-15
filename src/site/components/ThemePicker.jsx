import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useSite, useTheme } from '../context';
import { THEMES } from '../themes';

function focusOption(root, option) {
  if (!option) return;
  option.focus({ preventScroll: true });
  const panel = root.querySelector('.theme-panel');
  const bounds = panel.getBoundingClientRect();
  const target = option.getBoundingClientRect();
  if (target.top < bounds.top + 8) panel.scrollTop -= bounds.top + 8 - target.top;
  else if (target.bottom > bounds.bottom - 8) panel.scrollTop += target.bottom - bounds.bottom + 8;
}

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const { reducedMotion } = useSite();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => focusOption(rootRef.current, rootRef.current?.querySelector('[aria-checked="true"]')));
    const outside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('pointerdown', outside); };
  }, [open]);

  const navigate = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    const steps = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 };
    const current = THEMES.findIndex((option) => option.id === theme.id);
    let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = THEMES.length - 1;
    else if (event.key in steps) next = (current + steps[event.key] + THEMES.length) % THEMES.length;
    else return;
    event.preventDefault();
    const option = THEMES[next];
    setTheme(option.id);
    focusOption(rootRef.current, rootRef.current?.querySelector(`[data-theme-option="${option.id}"]`));
  };

  return <div className="theme-picker" ref={rootRef} onKeyDown={open ? navigate : undefined}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={triggerRef} className="theme-toggle" type="button" aria-label="Choose color theme"
      aria-expanded={open} aria-controls={open ? panelId : undefined} title={`Theme: ${theme.name}`}
      onClick={() => setOpen((value) => !value)}>
      <span className="theme-toggle-icon" aria-hidden="true"><span /><span /><span /><span /></span>
      <span className="theme-toggle-label">Theme</span>
    </button>
    <AnimatePresence>
      {open && <Motion.div id={panelId} className="theme-panel" data-lenis-prevent
        initial={reducedMotion ? false : { opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>
        <div className="theme-panel-heading"><div><p id={`${panelId}-label`}>Color themes</p><span>Find your palette.</span></div>
          <button type="button" className="theme-close" aria-label="Close color themes" onClick={close}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" /></svg>
          </button>
        </div>
        <div role="radiogroup" aria-labelledby={`${panelId}-label`}>
          {['light', 'dark'].map((mode) => <div className="theme-group" key={mode}>
            <p className="theme-group-label">{mode === 'light' ? 'Light' : 'Dark'}</p>
            <div className="theme-options">
              {THEMES.filter((option) => option.mode === mode).map((option) => {
                const selected = option.id === theme.id;
                return <button key={option.id} type="button" className="theme-option" role="radio"
                  aria-checked={selected} aria-label={option.name} tabIndex={selected ? 0 : -1}
                  data-theme-option={option.id} onClick={() => setTheme(option.id)}
                  style={{ '--preview-bg': option.colors.bg, '--preview-text': option.colors.text, '--preview-accent': option.colors.accent, '--preview-line': option.colors['line-2'] }}>
                  <span className="theme-swatches" aria-hidden="true"><span /><span /><span /></span>
                  <span className="theme-option-name">{option.name}</span>
                  {selected && <svg className="theme-selected" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7" /></svg>}
                </button>;
              })}
            </div>
          </div>)}
        </div>
        <p className="theme-panel-status" role="status" aria-live="polite"><span aria-hidden="true" />{theme.name} selected</p>
      </Motion.div>}
    </AnimatePresence>
  </div>;
}
