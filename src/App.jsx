import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
} from 'framer-motion';
import Lenis from 'lenis';
import './App.css';
import Particles from './Particles';

/* ─── Motion presets ─────────────────────────────────────────────────────── */
const SPRING = { type: 'spring', damping: 22, stiffness: 200 };
const SPRING_SOFT = { type: 'spring', damping: 28, stiffness: 120 };
const EASE_OUT = [0.16, 1, 0.3, 1];

const STAGGER_PARENT = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};
const STAGGER_CHILD = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 220 } },
};

/* ─── PageBackground (continuous scroll-driven color morph) ──────────────── */
function PageBackground() {
  const { scrollYProgress } = useScroll();
  // Calibrated to actual section positions — subtle shifts, no hard cuts.
  const bg = useTransform(
    scrollYProgress,
    [0,         0.18,      0.30,      0.40,      0.48,      0.58,      0.72,      0.86,      1],
    ['#080808', '#080808', '#0a0a0c', '#0a0e1c', '#0a0e1c', '#0c0c10', '#0a0a0a', '#0c0c10', '#080808']
  );
  return (
    <motion.div
      className="page-bg"
      style={{ backgroundColor: bg }}
      aria-hidden="true"
    />
  );
}

/* ─── useSectionScroll: opacity easing at section edges ──────────────────── */
function useSectionScroll() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.45, 1, 1, 0.45]);
  return { ref, opacity };
}

/* ─── ScrollProgress ─────────────────────────────────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { damping: 30, stiffness: 120, mass: 0.3 });
  return <motion.div className="scroll-progress" style={{ scaleX }} />;
}

/* ─── BackToTop ──────────────────────────────────────────────────────────── */
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 800);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          className="back-to-top"
          initial={{ opacity: 0, y: 24, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.7 }}
          whileHover={{ y: -4, scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={SPRING}
          onClick={() => {
            if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.4 });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Back to top"
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ─── AnimatedCounter ────────────────────────────────────────────────────── */
function AnimatedCounter({ value, decimals = 2, duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(value * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);
  return <span ref={ref}>{n.toFixed(decimals)}</span>;
}

/* ─── CharReveal ─────────────────────────────────────────────────────────── */
function CharReveal({ children, className = '', delay = 0, stagger = 0.025 }) {
  const text = String(children);
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-15%' }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {text.split('').map((c, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: '0.6em' },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 180 }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
          aria-hidden="true"
        >
          {c === ' ' ? ' ' : c}
        </motion.span>
      ))}
    </motion.span>
  );
}

/* ─── GithubActivity (live, public API, 5-min localStorage cache) ────────── */
const GH_USER = 'sgupta1703';
const GH_CACHE_KEY = 'gh-activity-v3';
const GH_CACHE_TTL = 5 * 60 * 1000; // 5 min

function ghRelativeTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function ghActionFor(e) {
  switch (e.type) {
    case 'PushEvent': {
      const n = e.payload?.commits?.length || 1;
      return `pushed ${n} commit${n > 1 ? 's' : ''} to`;
    }
    case 'PullRequestEvent':       return `${e.payload?.action || 'updated'} PR in`;
    case 'PullRequestReviewEvent': return 'reviewed PR in';
    case 'PullRequestReviewCommentEvent': return 'commented on PR in';
    case 'CreateEvent':            return `created ${e.payload?.ref_type || 'repo'} in`;
    case 'DeleteEvent':            return `deleted ${e.payload?.ref_type || 'ref'} in`;
    case 'WatchEvent':             return 'starred';
    case 'IssuesEvent': {
      const action = e.payload?.action;
      if (action === 'assigned') return 'was assigned an issue in';
      if (action === 'closed') return 'closed an issue in';
      if (action === 'opened') return 'opened an issue in';
      return `${action || 'updated'} an issue in`;
    }
    case 'IssueCommentEvent':      return 'commented on an issue in';
    case 'ForkEvent':              return 'forked';
    case 'ReleaseEvent':           return `${e.payload?.action || 'released'} a release in`;
    case 'CommitCommentEvent':     return 'commented on a commit in';
    case 'GollumEvent':            return 'edited the wiki in';
    case 'MemberEvent':            return 'joined as collaborator on';
    case 'PublicEvent':            return 'made public';
    default:                       return 'worked on';
  }
}

function fetchGithubEvents(user) {
  if (typeof window !== 'undefined') {
    try {
      const cached = JSON.parse(localStorage.getItem(GH_CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.t < GH_CACHE_TTL && cached.u === user) {
        return Promise.resolve(cached.d);
      }
    } catch {}
  }
  return fetch(`https://api.github.com/users/${user}/events/public?per_page=30`)
    .then((r) => {
      if (!r.ok) throw new Error('gh ' + r.status);
      return r.json();
    })
    .then((data) => {
      // Only cache non-empty arrays so a transient empty/error response
      // doesn't poison the cache for 5 minutes.
      if (Array.isArray(data) && data.length > 0) {
        try {
          localStorage.setItem(GH_CACHE_KEY, JSON.stringify({ t: Date.now(), u: user, d: data }));
        } catch {}
      }
      return data;
    });
}

function GithubActivity() {
  const [events, setEvents] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchGithubEvents(GH_USER)
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data)) { setFailed(true); return; }
        // Broad filter: any event with a repo
        const seen = new Set();
        const deduped = [];
        for (const e of data) {
          if (!e || !e.repo || !e.repo.name) continue;
          if (seen.has(e.repo.name)) continue;
          seen.add(e.repo.name);
          deduped.push(e);
          if (deduped.length >= 5) break;
        }
        setEvents(deduped);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[GithubActivity]', err);
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      className="gh-activity"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      <div className="gh-activity-header">
        <span className="gh-activity-label">
          <span className="gh-activity-dot" />
          Live · GitHub
        </span>
        <a
          href={`https://github.com/${GH_USER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="gh-activity-handle"
        >
          @{GH_USER} ↗
        </a>
      </div>
      {events === null && !failed && (
        <div className="gh-activity-state">Loading recent activity…</div>
      )}
      {failed && (
        <div className="gh-activity-state">Couldn't reach GitHub right now.</div>
      )}
      {events && events.length === 0 && (
        <div className="gh-activity-state">No recent public activity.</div>
      )}
      {events && events.length > 0 && (
        <ul className="gh-activity-list">
          {events.map((e, i) => (
            <li key={i} className="gh-activity-item">
              <span className="gh-action">{ghActionFor(e)}</span>
              <a
                href={`https://github.com/${e.repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gh-repo"
              >
                {e.repo.name.split('/')[1] || e.repo.name}
              </a>
              <span className="gh-time">{ghRelativeTime(e.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

/* ─── Reveal ─────────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, y = 40, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.85, delay: delay / 1000, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/* ─── MagneticBtn ────────────────────────────────────────────────────────── */
function MagneticBtn({ children, href, className = '', download }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { damping: 15, stiffness: 200, mass: 0.4 });
  const sy = useSpring(y, { damping: 15, stiffness: 200, mass: 0.4 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.3);
    y.set((e.clientY - r.top - r.height / 2) * 0.3);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.a
      ref={ref}
      href={href}
      target={download ? '_self' : '_blank'}
      rel="noopener noreferrer"
      download={download}
      className={`magnetic-btn ${className}`}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
    >
      {children}
    </motion.a>
  );
}

/* ─── TiltCard ───────────────────────────────────────────────────────────── */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useTransform(py, [-0.5, 0.5], [12, -12]);
  const ry = useTransform(px, [-0.5, 0.5], [-12, 12]);
  const srx = useSpring(rx, { damping: 18, stiffness: 200 });
  const sry = useSpring(ry, { damping: 18, stiffness: 200 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { px.set(0); py.set(0); };

  return (
    <motion.div
      ref={ref}
      className={`tilt-card ${className}`}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.02 }}
      transition={SPRING}
    >
      {children}
    </motion.div>
  );
}

/* ─── SloganHero ─────────────────────────────────────────────────────────── */
const SLOGAN_LINES = ['while (!success())', 'try();'];

function isKeyword(charIdx, lineIdx) {
  if (lineIdx === 0) return charIdx >= 8 && charIdx <= 14; // success
  if (lineIdx === 1) return charIdx >= 0 && charIdx <= 2;  // try
  return false;
}

function noise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // -1 to 1
}

const TYPING_PARENT = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.35 },
  },
};
const TYPING_CHAR = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function SloganChar({ char, i, progress, isKey }) {
  const yMul = noise(i + 1) * 1.5;      // -1.5 to 1.5  → up OR down
  const xMul = noise(i + 137) * 1.3;    // -1.3 to 1.3  → left OR right
  const rotMul = noise(i + 271) * 130;  // -130° to 130°

  const y = useTransform(progress, [0, 1], [0, 1700 * yMul]);
  const x = useTransform(progress, [0, 1], [0, 1500 * xMul]);
  const r = useTransform(progress, [0, 1], [0, rotMul]);

  if (char === ' ') {
    return (
      <motion.span
        className="slogan-space"
        variants={TYPING_CHAR}
        transition={{ duration: 0.04 }}
      >
        &nbsp;
      </motion.span>
    );
  }

  return (
    <motion.span
      className={`slogan-char ${isKey ? 'slogan-key' : ''}`}
      variants={TYPING_CHAR}
      transition={{ duration: 0.04 }}
      style={{ y, x, rotate: r }}
    >
      {char}
    </motion.span>
  );
}

function SloganHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const fadeOut = useTransform(scrollYProgress, [0.55, 0.95], [1, 0]);

  let globalIdx = 0;
  return (
    <section ref={ref} className="slogan-hero">
      <div className="slogan-bg">
        <div className="slogan-grid" />
        <div className="noise" />
      </div>

      <motion.div className="slogan-inner" style={{ opacity: fadeOut }}>
        <motion.h1
          className="slogan-text"
          aria-label={SLOGAN_LINES.join(' ')}
          variants={TYPING_PARENT}
          initial="hidden"
          animate="visible"
        >
          {SLOGAN_LINES.map((line, lineIdx) => (
            <div className="slogan-line" key={lineIdx}>
              {line.split('').map((char, charIdx) => {
                const idx = globalIdx++;
                return (
                  <SloganChar
                    key={`${lineIdx}-${charIdx}`}
                    char={char}
                    i={idx}
                    progress={scrollYProgress}
                    isKey={isKeyword(charIdx, lineIdx)}
                  />
                );
              })}
            </div>
          ))}
        </motion.h1>
      </motion.div>
    </section>
  );
}

/* ─── Marquee (CSS scroll, hover-pause via state) ────────────────────────── */
const MARQUEE_ITEMS = [
  'Python', 'C++', 'ROS2', 'PyTorch', 'LangChain', 'React', 'Node.js',
  'Computer Vision', 'NLP', 'Robotics', 'CUDA', 'FastAPI', 'TensorFlow',
  'React Native', 'OpenCV', 'Agile', 'RAG', 'Agentic AI', 'AWS', 'Firebase', 'MongoDB', 'ComfyUI',
];
function Marquee() {
  const [paused, setPaused] = useState(false);
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <motion.div
      className="marquee-wrap"
      aria-hidden="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 1, ease: EASE_OUT }}
    >
      <div className={`marquee-track ${paused ? 'marquee-paused' : ''}`}>
        {doubled.map((item, i) => (
          <span key={i} className="marquee-item">
            {item}<span className="marquee-sep">✦</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Nav ────────────────────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [open, setOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setHidden(y < window.innerHeight * 0.7);
    };
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    window.addEventListener('resize', fn, { passive: true });
    return () => {
      window.removeEventListener('scroll', fn);
      window.removeEventListener('resize', fn);
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      window.__lenis?.stop();
    } else {
      document.body.style.overflow = '';
      window.__lenis?.start();
    }
    return () => {
      document.body.style.overflow = '';
      window.__lenis?.start();
    };
  }, [open]);

  const links = ['About', 'Experience', 'Projects', 'Skills', 'Contact'];
  const scrollTo = (id) => {
    const el = document.getElementById(id.toLowerCase());
    if (!el) return;
    if (window.__lenis) {
      window.__lenis.scrollTo(el, { duration: 1.4, offset: -40 });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setOpen(false);
  };

  return (
    <motion.nav
      className={`nav ${scrolled ? 'nav-scrolled' : ''}`}
      initial={false}
      animate={{
        y: hidden ? -80 : 0,
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
      }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
    >
      <div className="nav-inner">
        <motion.div
          className="nav-logo"
          role="button"
          tabIndex={0}
          onClick={() => {
            if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.4 });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          whileHover={{ scale: 1.08, rotate: -4 }}
          whileTap={{ scale: 0.92 }}
          transition={SPRING}
        >
          SG
        </motion.div>

        <div className={`nav-links ${open ? 'nav-open' : ''}`}>
          {links.map((l) => (
            <motion.button
              key={l}
              className="nav-link"
              onClick={() => scrollTo(l)}
              onHoverStart={() => setHoveredLink(l)}
              onHoverEnd={() => setHoveredLink(null)}
              whileTap={{ scale: 0.95 }}
            >
              <span>{l}</span>
              {hoveredLink === l && (
                <motion.span
                  className="nav-link-underline"
                  layoutId="navUnderline"
                  transition={SPRING}
                />
              )}
            </motion.button>
          ))}
          <motion.a
            href="/Sarthak_Gupta_Resume.pdf"
            download
            className="nav-cta"
            whileHover={{ y: -2, scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING}
          >
            Resume ↓
          </motion.a>
        </div>

        <button
          className={`nav-burger ${open ? 'burger-active' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </motion.nav>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const imgYScroll = useTransform(scrollY, [0, 1200], [0, 120]);
  const imgScale = useTransform(scrollY, [0, 800], [1, 1.06]);
  const orbYScroll = useTransform(scrollY, [0, 1200], [0, 200]);

  // Mouse parallax for hero image
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const sx = useSpring(mvX, { damping: 28, stiffness: 100 });
  const sy = useSpring(mvY, { damping: 28, stiffness: 100 });

  useEffect(() => {
    const fn = (e) => {
      mvX.set((e.clientX / window.innerWidth - 0.5) * -22);
      mvY.set((e.clientY / window.innerHeight - 0.5) * -22);
    };
    window.addEventListener('mousemove', fn, { passive: true });
    return () => window.removeEventListener('mousemove', fn);
  }, [mvX, mvY]);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-bg">
        <motion.div className="hero-orb orb-1" style={{ y: orbYScroll }} />
        <motion.div className="hero-orb orb-2" style={{ y: orbYScroll }} />
        <div className="noise" />
      </div>

      <div className="hero-content">
        <motion.div
          className="hero-eyebrow"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
        >
          <span className="eyebrow-line" />
          Computer Science · University of Florida · Class of 2027
          <span className="eyebrow-line" />
        </motion.div>

        <h1 className="hero-name">
          <span className="name-line">
            <CharReveal stagger={0.04}>SARTHAK</CharReveal>
          </span>
          <span className="name-line name-gold">
            <CharReveal stagger={0.04} delay={0.25}>GUPTA</CharReveal>
          </span>
        </h1>

        <motion.div
          className="hero-status"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: EASE_OUT }}
        >
          <span>Incoming @ Qualcomm</span>
          <span className="hero-status-sep">·</span>
          <span className="hero-status-period">Summer 2026</span>
        </motion.div>
        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE_OUT }}
        >
          Robotics · AI · Full-Stack · Researcher
        </motion.p>

        <motion.div
          className="hero-actions"
          initial="hidden"
          animate="visible"
          variants={STAGGER_PARENT}
          transition={{ delayChildren: 0.85 }}
        >
          <motion.div variants={STAGGER_CHILD}>
            <MagneticBtn href="https://www.linkedin.com/in/sarthak-gupta17/" className="btn-primary">
              LinkedIn ↗
            </MagneticBtn>
          </motion.div>
          <motion.div variants={STAGGER_CHILD}>
            <MagneticBtn href="https://github.com/sgupta1703" className="btn-ghost">
              GitHub ↗
            </MagneticBtn>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="hero-img-wrap"
        style={{ x: sx, y: sy }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, delay: 0.4, ease: EASE_OUT }}
      >
        <motion.div className="hero-img-ring" />
        <motion.div className="hero-img-ring ring-2" />
        <motion.a
          href="https://www.linkedin.com/in/sarthak-gupta17/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ y: imgYScroll, scale: imgScale }}
          whileHover={{ scale: 1.04 }}
          transition={SPRING}
        >
          <img src="/image.jpeg" alt="Sarthak Gupta" className="hero-img" />
        </motion.a>
      </motion.div>

    </section>
  );
}

/* ─── About ──────────────────────────────────────────────────────────────── */
function About() {
  const { ref, opacity } = useSectionScroll();
  const COURSES = [
    'Introduction to Software Engineering',
    'Computer Organization',
    'Advanced Programming Fundamentals',
    'Data Structures and Algorithms',
    'Introduction to Virtual Reality',
    'Computational Linear Algebra',
    'Multivariable Calculus (III)',
    'Discrete Structures',
    'Information and Database Systems Design',
    'Engineering Statistics',
    'Operating Systems',
    'Business Finance',
  ];
  return (
    <motion.section ref={ref} id="about" className="section" style={{ opacity }}>
      <div className="container">
        <Reveal><div className="section-label">01 — About</div></Reveal>
        <div className="about-grid">
          <div className="about-left-col">
            <Reveal delay={100}>
              <h2 className="section-heading">
                <CharReveal>Dreamer.</CharReveal><br />
                <CharReveal delay={0.15}>Thinker.</CharReveal><br />
                <em><CharReveal delay={0.3}>Builder.</CharReveal></em>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <motion.div
                className="gpa-badge"
                whileHover={{ y: -4, scale: 1.03 }}
                transition={SPRING}
              >
                <span className="gpa-num">
                  <AnimatedCounter value={3.68} decimals={2} /> GPA
                </span>
                <span className="gpa-divider" />
                <span className="gpa-label">University of Florida</span>
              </motion.div>
            </Reveal>
            <Reveal delay={300}>
              <GithubActivity />
            </Reveal>
          </div>
          <div className="about-text-col">
            <Reveal delay={250}>
              <p className="about-p">
                I'm a sophomore at the <span className="gold">University of Florida</span> pursuing
                a B.S. in Computer Science with a minor in Accounting.
              </p>
            </Reveal>
            <Reveal delay={340}>
              <p className="about-p">
                My interests lie in <span className="gold">Machine Learning</span>, particularly Computer Vision
                and Natural Language Processing, alongside Robotics and full-stack software engineering.
                I love working on problems at the edge of what's possible.
              </p>
            </Reveal>
            <Reveal delay={420}>
              <p className="about-p">
                In my free time, you'll find me on the tennis court or pickleball court.
              </p>
            </Reveal>
            <Reveal delay={500}>
              <div className="about-courses">
                <div className="courses-label">Relevant Coursework</div>
                <motion.div
                  className="courses-grid"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-10%' }}
                  variants={STAGGER_PARENT}
                >
                  {COURSES.map((c) => (
                    <motion.span
                      key={c}
                      className="course-tag"
                      variants={STAGGER_CHILD}
                      whileHover={{ y: -3, scale: 1.06, color: 'var(--gold)' }}
                      transition={SPRING}
                    >
                      {c}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── Experience ─────────────────────────────────────────────────────────── */
const EXPERIENCE = [
  {
    role: 'Robotics Software Developer',
    org: 'Machine Intelligence Lab @ UF',
    period: 'Jan 2025 – May 2026',
    tag: 'Research',
    bullets: [
      'Developing a C++ Gazebo plugin within the ROS2 control framework for SubjuGator 9\'s gripper, integrating JointController and JointTrajectoryController for 2-DOF velocity and position control.',
      'Integrated a Water-Linked DVL using Bash, Linux, Python and C++; increased localization to 10 Hz and reduced drift from 12 m/hr → 4 m/hr during sea trials.',
      'Advanced SubjuGator 9 to the semifinals of RoboSub 2025, ranking 12th of 55 international teams.',
    ],
  },
  {
    role: 'Undergraduate Researcher',
    org: 'VERG Lab @ University of Florida',
    period: 'May 2025 – Present',
    tag: 'Research',
    bullets: [
      'Developing an end-to-end AI video generation pipeline in ComfyUI for the U.S. Air Force, producing cadet training content on sexual assault prevention.',
      'Deployed on HiPerGator HPC processing 500 GB of raw data and generating 200 training videos with automated text, voice, and visual effects.',
      'Research abstract accepted to the 2nd Annual Digital Health Symposium at UF/FSU.',
    ],
  },
  {
    role: 'AI Developer Intern',
    org: 'Florida Resource Map Project @ FCI Foundation',
    period: 'Oct 2025 – Present',
    tag: 'Industry',
    bullets: [
      'Designing and deploying LLM-driven agentic pipelines using LangChain, OpenAI APIs, and Python to autonomously extract, validate, and structure non-profit and government service data from unstructured web sources.',
      'Built scraping and data-cleaning pipelines processing 5,000+ resource listings related to food, housing, and mental health; improved data coverage by 35%.',
      'Implemented a RAG system with vector search for resource recommendations, increasing query accuracy and contextual relevance by 40%.',
    ],
  },
];

const METRIC_REGEX = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:\s?(?:%|Hz|GB|MB|FPS|ms|m\/hr|kg|km|x|°|th|st|nd|rd|\+))?)/g;

const METRIC_VARIANT = {
  hidden: { scale: 0.7, opacity: 0.3 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', damping: 18, stiffness: 220, delay: 0.3 },
  },
};

const MARK_VARIANT = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.45, ease: EASE_OUT, delay: 0.12 } },
};

function highlightMetrics(text) {
  const parts = text.split(METRIC_REGEX);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <motion.span key={i} className="metric-highlight" variants={METRIC_VARIANT}>
          {part}
        </motion.span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function LiveDot() {
  return (
    <motion.span
      className="live-dot"
      animate={{ scale: [1, 1.45, 1], opacity: [1, 0.55, 1] }}
      transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    />
  );
}

function Incoming() {
  const { ref, opacity } = useSectionScroll();
  return (
    <motion.section ref={ref} id="incoming" className="section section-incoming" style={{ opacity }}>
      <div className="container incoming-container">
        <Reveal>
          <div className="section-label">02 — What's Next</div>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="section-heading incoming-heading">
            <em><CharReveal>Summer 2026</CharReveal></em>
            {' · '}
            <CharReveal delay={0.25}>Incoming Intern</CharReveal>
          </h2>
        </Reveal>
        <div className="incoming-stage">
          <div className="incoming-logo-wrap">
            <motion.img
              src="/Qualcomm-emblem.png"
              alt="Qualcomm"
              className="incoming-logo"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 1, delay: 0.35, ease: EASE_OUT }}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function ExpPeriod({ period }) {
  if (period.endsWith('Present')) {
    const before = period.slice(0, period.length - 'Present'.length);
    return (
      <div className="exp-period">
        {before}<LiveDot />Present
      </div>
    );
  }
  return <div className="exp-period">{period}</div>;
}

function Experience() {
  const [active, setActive] = useState(0);
  const { ref, opacity } = useSectionScroll();
  return (
    <motion.section ref={ref} id="experience" className="section section-dark exp-section" style={{ opacity }}>
      <div className="container">
        <Reveal><div className="section-label">03 — Experience</div></Reveal>
        <Reveal delay={100}>
          <h2 className="section-heading">
            Where I've<br /><em>Worked &amp; Researched</em>
          </h2>
        </Reveal>
        <div className="exp-layout exp-desktop">
          <div className="exp-tabs">
            {EXPERIENCE.map((e, i) => (
              <motion.button
                key={i}
                className={`exp-tab ${active === i ? 'exp-tab-active' : ''}`}
                onClick={() => setActive(i)}
                whileHover={{ x: 4 }}
                transition={SPRING}
              >
                {active === i && (
                  <motion.span
                    className="exp-tab-bg"
                    layoutId="expTabBg"
                    transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                  />
                )}
                <motion.span
                  className={`exp-tab-tag tag-${e.tag.toLowerCase()}`}
                  whileHover={{ scale: 1.08, y: -1 }}
                  transition={SPRING}
                >
                  {e.tag}
                </motion.span>
                <span className="exp-tab-role">{e.role}</span>
                <span className="exp-tab-org">{e.org}</span>
              </motion.button>
            ))}
          </div>
          <div className="exp-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                className="exp-panel exp-panel-active"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              >
                <div className="exp-header">
                  <div>
                    <div className="exp-role">{EXPERIENCE[active].role}</div>
                    <div className="exp-org">{EXPERIENCE[active].org}</div>
                  </div>
                  <ExpPeriod period={EXPERIENCE[active].period} />
                </div>
                <motion.div
                  className="exp-divider"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
                  style={{ originX: 0 }}
                />
                <motion.ul
                  className="exp-bullets"
                  initial="hidden"
                  animate="visible"
                  variants={STAGGER_PARENT}
                >
                  {EXPERIENCE[active].bullets.map((b, j) => (
                    <motion.li key={j} className="exp-bullet" variants={STAGGER_CHILD}>
                      <motion.span className="exp-bullet-mark" variants={MARK_VARIANT} />
                      {highlightMetrics(b)}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: stacked roles, no tabs, no boxes */}
        <div className="exp-mobile-list">
          {EXPERIENCE.map((e, i) => (
            <motion.div
              key={i}
              className="exp-mobile-item"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: EASE_OUT }}
            >
              <div className="exp-mobile-meta">
                <span className={`exp-tab-tag tag-${e.tag.toLowerCase()}`}>{e.tag}</span>
                <ExpPeriod period={e.period} />
              </div>
              <div className="exp-mobile-role">{e.role}</div>
              <div className="exp-mobile-org">{e.org}</div>
              <motion.div
                className="exp-divider"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
                style={{ originX: 0 }}
              />
              <motion.ul
                className="exp-bullets"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-10%' }}
                variants={STAGGER_PARENT}
              >
                {e.bullets.map((b, j) => (
                  <motion.li key={j} className="exp-bullet" variants={STAGGER_CHILD}>
                    <motion.span className="exp-bullet-mark" variants={MARK_VARIANT} />
                    {highlightMetrics(b)}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ─── Projects ───────────────────────────────────────────────────────────── */
const PROJECTS = [
  {
    name: 'Epoch',
    stack: 'React · Node.js · Express.js · Supabase · PostgreSQL · Gemini 2.5 Flash',
    period: '2025 – Present',
    desc: 'Full-stack AI history education platform with role-based middleware guards, Supabase auth, multi-stage inference grading, and AI-generated learning content.',
    bullets: [
      'Architected 15+ Express.js route modules with role-based middleware (teacher/student) and PostgreSQL jsonb columns storing units, quizzes, assignments, notes, timelines, and AI-generated glossaries.',
      'AI classroom assistant with structured function-calling for resource authoring + multi-stage inference pipeline grading free-text responses at 25-point resolution.',
      'Synthesizes cross-phase SA and MCQ results into scored wrapups with misconception detection and unit-level revisit recommendations.',
    ],
    index: '01',
  },
  {
    name: 'JARVIS',
    stack: 'Python · Gemini 2.5 Flash · openWakeWord · Whisper · Kokoro ONNX · PyQt6 · Chrome MV3',
    period: '2025 – Present',
    desc: 'Local always-on voice assistant: multi-threaded daemon pipeline, bounded tool-use orchestrator over 30+ function-calling tools, and a two-tier memory system.',
    bullets: [
      'Daemon pipeline: openWakeWord → Whisper STT → Gemini → Kokoro TTS, plus workers for Gmail push watch, scheduled notifications, screen watching, and a Chrome MV3 bridge streaming live DOM/tab context.',
      'Bounded tool-use orchestrator over 30+ tools (shell, fs, git, PyAutoGUI, browser, Gmail) with malformed-call retry, sentinel stripping, two-stage confirmation for destructive ops, and a direct-route fast path bypassing the LLM.',
      'Two-tier memory: short-term buffer + long-term JSON with tokenized top-K retrieval, importance decay, learned triggers; vision loop grounds describe/act on scoped screenshots fused with DOM snapshots.',
    ],
    index: '02',
  },
  {
    name: 'DreamMaker · Vobile × IGNITE',
    stack: 'Python · OpenCLAW · LangChain · Prompt Engineering',
    period: 'Mar 2026 – Apr 2026',
    desc: '1st place at the CADE Museum Students Thinking Big event — multi-stage prompt chaining pipeline that generates coherent two-minute AI video for Vobile\'s DreamMaker platform.',
    bullets: [
      'Multi-stage prompt chaining pipeline using OpenCLAW + LangChain to autonomously generate, evaluate, and refine AI-driven creative concepts; structured output schemas with JSON mode and few-shot exemplars.',
      'Sliding-window visual grounding: video generated in 5-second segments, extracting a reference keyframe after each clip and re-injecting it as a visual context anchor into the next prompt.',
      'Eliminated cross-segment hallucination and maintained scene coherence across full two-minute output.',
    ],
    index: '03',
    award: '1st Place',
  },
  {
    name: 'Audionomous',
    stack: 'Python · OpenCV · MediaPipe · PyCAW · Arduino',
    period: 'Oct 2025 – Nov 2025',
    desc: 'AI-driven real-time vision–audio modulation system adjusting headphone volume from facial motion cues at 30 FPS via USB-serial with ~95% detection stability under 200ms latency.',
    bullets: [
      'High-throughput serial pipeline with NICL framing and checksum validation',
      'MediaPipe FaceMesh (468 landmarks) with EMA temporal filtering',
      'Multi-threaded PyCAW subsystem with atomic cancellation and async ramping',
    ],
    index: '04',
  },
  {
    name: 'PlayCast',
    stack: 'React Native · Node.js · FFmpeg · Gemini API · Firebase',
    period: 'Sep 2025 – Dec 2025',
    desc: 'Cross-platform mobile app delivering TikTok-style real-time highlight reels from live sports using SportsRadar timestamps + Gemini NLP for automated clip scoring.',
    bullets: [
      'Live-to-highlight FFmpeg pipeline with automated clip trimming',
      'REST backend with range-enabled media streaming',
      'Firebase Firestore for user interactions and personalization',
    ],
    index: '05',
  },
  {
    name: 'Faro',
    stack: 'React · Node.js · Express · Cohere · Yelp API · Leaflet · OSRM',
    period: 'Jan 2026',
    desc: 'AI-powered itinerary engine that converts natural-language mood prompts into structured, map-rendered local plans with live routing and resilient multi-API orchestration.',
    bullets: [
      'Semantic tag generation + AI itinerary synthesis with structured JSON validation',
      'Yelp aggregation, deduplication, distance/rating ranking, and text normalization matching',
      'Live Leaflet map rendering with OSRM polyline routing and lifecycle-safe reflows',
    ],
    index: '06',
  },
  {
    name: 'One',
    stack: 'React Native (Expo) · TypeScript · Node.js · Express · Cohere API',
    period: 'Feb 2026',
    desc: 'AI-powered self-development app delivering category-based daily tasks and an integrated coaching system via a React Native client and Cohere-backed Node/Express API.',
    bullets: [
      'Category-based task feed with search and rapid task injection',
      'Cohere-powered task generation endpoint with structured response handling',
      'Conversational AI coach with contextual guidance and session continuity',
    ],
    index: '07',
  },
];

/* Project Carousel — preserved drag/momentum logic, wrapped cards in motion */
function ProjectCarousel() {
  const trackRef = useRef(null);
  const autoScrollSpeed = 0.6;
  const isPaused = useRef(false);
  const rafRef = useRef(null);
  const scrollPos = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const momentumRaf = useRef(null);
  const didDrag = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    scrollPos.current = track.scrollLeft;
    const tick = () => {
      if (!isPaused.current && !isDragging.current) {
        scrollPos.current += autoScrollSpeed;
        const half = track.scrollWidth / 2;
        if (scrollPos.current >= half) scrollPos.current -= half;
        track.scrollLeft = scrollPos.current;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const onMouseEnter = () => { isPaused.current = true; };
  const onMouseLeave = () => { if (!isDragging.current) isPaused.current = false; };

  const startDrag = (clientX) => {
    cancelAnimationFrame(momentumRaf.current);
    isDragging.current = true;
    didDrag.current = false;
    dragStartX.current = clientX;
    dragStartScroll.current = trackRef.current.scrollLeft;
    lastX.current = clientX;
    lastTime.current = performance.now();
    velocity.current = 0;
    trackRef.current.style.cursor = 'grabbing';
  };
  const moveDrag = (clientX) => {
    if (!isDragging.current) return;
    const dx = clientX - dragStartX.current;
    if (Math.abs(dx) > 3) didDrag.current = true;
    const now = performance.now();
    const dt = now - lastTime.current || 1;
    velocity.current = (clientX - lastX.current) / dt;
    lastX.current = clientX;
    lastTime.current = now;
    const newScroll = dragStartScroll.current - dx;
    trackRef.current.scrollLeft = newScroll;
    scrollPos.current = newScroll;
  };
  const endDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    trackRef.current.style.cursor = 'grab';
    let vel = -velocity.current * 16;
    const momentum = () => {
      if (Math.abs(vel) < 0.3) { isPaused.current = false; return; }
      scrollPos.current += vel;
      const half = trackRef.current.scrollWidth / 2;
      if (scrollPos.current >= half) scrollPos.current -= half;
      if (scrollPos.current < 0) scrollPos.current += half;
      trackRef.current.scrollLeft = scrollPos.current;
      vel *= 0.92;
      momentumRaf.current = requestAnimationFrame(momentum);
    };
    momentumRaf.current = requestAnimationFrame(momentum);
  };

  const onMouseDown = (e) => { e.preventDefault(); startDrag(e.clientX); };
  const onMouseMove = (e) => moveDrag(e.clientX);
  const onMouseUp = () => endDrag();
  const onTouchStart = (e) => startDrag(e.touches[0].clientX);
  const onTouchMove = (e) => moveDrag(e.touches[0].clientX);
  const onTouchEnd = () => endDrag();

  const allCards = [...PROJECTS, ...PROJECTS];

  return (
    <div className="carousel-outer">
      <div className="carousel-fade carousel-fade-left" />
      <div className="carousel-fade carousel-fade-right" />
      <div
        ref={trackRef}
        className="carousel-track"
        onMouseEnter={onMouseEnter}
        onMouseLeave={() => { onMouseLeave(); endDrag(); }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {allCards.map((p, i) => (
          <motion.div
            key={i}
            className="carousel-item"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-5%' }}
            transition={{ duration: 0.7, delay: (i % PROJECTS.length) * 0.08, ease: EASE_OUT }}
          >
            <TiltCard className="project-card">
              <div className="project-top">
                <span className="project-index">{p.index}</span>
                {p.award && (
                  <motion.span
                    className="project-award"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', damping: 16, stiffness: 220, delay: 0.3 }}
                  >
                    ★ {p.award}
                  </motion.span>
                )}
                <span className="project-period">{p.period}</span>
              </div>
              <div className="project-name">{p.name}</div>
              <div className="project-stack">{p.stack}</div>
              <p className="project-desc">{p.desc}</p>
              <ul className="project-bullets">
                {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
              <div className="project-line" />
            </TiltCard>
          </motion.div>
        ))}
      </div>
      <div className="carousel-dots" aria-hidden="true">
        {PROJECTS.map((_, i) => <div key={i} className="carousel-dot" />)}
      </div>
    </div>
  );
}

function Projects() {
  const { ref, opacity } = useSectionScroll();
  return (
    <motion.section ref={ref} id="projects" className="section projects-section" style={{ opacity }}>
      <div className="container">
        <Reveal><div className="section-label">04 — Projects</div></Reveal>
        <Reveal delay={100}>
          <h2 className="section-heading">
            <CharReveal>Selected</CharReveal><br />
            <em><CharReveal delay={0.2}>Works</CharReveal></em>
          </h2>
        </Reveal>
      </div>
      <Reveal delay={200}>
        <ProjectCarousel />
      </Reveal>
    </motion.section>
  );
}

/* ─── Skills ─────────────────────────────────────────────────────────────── */
const SKILLS = {
  Languages: ['Java', 'Python', 'JavaScript', 'C++', 'R', 'MATLAB'],
  'Frameworks & Platforms': ['TypeScript', 'Angular.js', 'React.js', 'Node.js', 'Express.js', 'LangChain', 'FastAPI', 'TensorFlow', 'ROS2', 'PyTorch', 'React Native', 'Expo', 'Firebase', 'MongoDB', 'GIS'],
  'Tools & Tech': ['Git', 'NVIDIA Isaac Sim', 'OpenCV', 'OpenMV', 'AWS Polly', 'Figma', 'Ubuntu/Linux', 'QGIS', 'ArcGIS Pro', 'ComfyUI', 'CUDA', 'Slurm'],
  Methodologies: ['SDLC', 'Agile', 'Scrum', 'RAG Pipelines', 'Sensor Fusion', 'Agentic AI'],
};

const CERTS = [
  { name: 'AWS Certified AI Practitioner', provider: 'Amazon Web Services', year: '2025' },
  { name: 'AWS Certified Cloud Practitioner', provider: 'Amazon Web Services', year: '2025' },
  { name: 'Building Transformer-Based NLP Applications', provider: 'NVIDIA', year: '2025' },
  { name: 'Fundamentals of Deep Learning', provider: 'NVIDIA', year: '2025' },
  { name: 'Intermediate Web Development (WEB102)', provider: 'CodePath', year: '2025' },
];

function SkillRow({ cat, items }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 85%', 'end 15%'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0.22, 1, 1, 0.3]);

  return (
    <motion.div ref={ref} className="skill-row" style={{ opacity }}>
      <div className="skill-row-gutter">
        <div className="skill-row-label">{cat}</div>
      </div>
      <motion.div
        className="skill-row-words"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-15%' }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.035 } },
        }}
      >
        {items.map((s) => (
          <motion.span
            key={s}
            className="skill-word"
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { type: 'spring', damping: 22, stiffness: 200 },
              },
            }}
            whileHover={{ y: -3 }}
          >
            {s}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}

function Skills() {
  const { ref, opacity } = useSectionScroll();
  return (
    <motion.section ref={ref} id="skills" className="section section-skills" style={{ opacity }}>
      <div className="container">
        <Reveal><div className="section-label">05 — Skills &amp; Certifications</div></Reveal>
        <Reveal delay={100}>
          <h2 className="section-heading">
            <CharReveal>Technical</CharReveal><br />
            <em><CharReveal delay={0.2}>Skills</CharReveal></em>
          </h2>
        </Reveal>
        <div className="skills-typo">
          {Object.entries(SKILLS).map(([cat, items]) => (
            <SkillRow key={cat} cat={cat} items={items} />
          ))}
        </div>
        <div className="certs-list">
          <div className="certs-list-heading">Certifications</div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-15%' }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {CERTS.map((c) => (
              <motion.div
                key={c.name}
                className="cert-row"
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { type: 'spring', damping: 22, stiffness: 200 },
                  },
                }}
                whileHover={{ x: 6 }}
              >
                <span className="cert-row-year">{c.year}</span>
                <span className="cert-row-name">{c.name}</span>
                <span className="cert-row-provider">{c.provider}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── Contact ────────────────────────────────────────────────────────────── */
function Contact() {
  const { ref, opacity } = useSectionScroll();
  return (
    <motion.section ref={ref} id="contact" className="section contact-section" style={{ opacity }}>
      <div className="container">
        <div className="contact-inner">
          <Reveal><div className="section-label">06 — Contact</div></Reveal>
          <div className="contact-grid">
            <div className="contact-text-col">
              <Reveal delay={100}>
                <h2 className="contact-heading">
                  <CharReveal>Let's build</CharReveal><br />
                  <CharReveal delay={0.18}>something</CharReveal><br />
                  <em><CharReveal delay={0.36}>together.</CharReveal></em>
                </h2>
              </Reveal>
              <Reveal delay={250}>
                <p className="contact-sub">Open to collaborations and any interesting projects.</p>
              </Reveal>
            </div>
            <div className="contact-links-col">
              <Reveal delay={350}>
                <motion.div
                  className="contact-links"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-10%' }}
                  variants={STAGGER_PARENT}
                >
                  {[
                    { label: 'Email', value: 'sarthakgupta1703@gmail.com', href: 'mailto:sarthakgupta1703@gmail.com', external: false },
                    { label: 'Phone', value: '(813) 501-9744', href: 'tel:8135019744', external: false },
                    { label: 'LinkedIn', value: 'linkedin.com/in/sarthak-gupta17', href: 'https://www.linkedin.com/in/sarthak-gupta17/', external: true },
                    { label: 'GitHub', value: 'github.com/sgupta1703', href: 'https://github.com/sgupta1703', external: true },
                  ].map((c) => (
                    <motion.a
                      key={c.label}
                      href={c.href}
                      target={c.external ? '_blank' : undefined}
                      rel={c.external ? 'noopener noreferrer' : undefined}
                      className="contact-link-btn"
                      variants={STAGGER_CHILD}
                      whileHover={{ x: 8, scale: 1.01 }}
                      transition={SPRING}
                    >
                      <span className="contact-link-label">{c.label}</span>
                      <span className="contact-link-value">{c.value}</span>
                      <motion.span
                        className="contact-link-arrow"
                        whileHover={{ rotate: -45 }}
                        transition={SPRING}
                      >↗</motion.span>
                    </motion.a>
                  ))}
                </motion.div>
              </Reveal>
            </div>
          </div>
        </div>
        <div className="footer-line">
          <div className="footer-left">© 2026 Sarthak Gupta</div>
          <div className="footer-right">Gainesville, FL · University of Florida</div>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── useLenis: buttery 120fps smooth scroll ─────────────────────────────── */
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential ease-out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      lerp: 0.1,
    });
    window.__lenis = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
}

/* ─── App ────────────────────────────────────────────────────────────────── */
export default function App() {
  useLenis();
  return (
    <>
      <PageBackground />
      <ScrollProgress />
      <Nav />
      <main>
        <SloganHero />
        <div className="hero-zone">
          <Particles
            particleColors={["#ffffff"]}
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover
            alphaParticles={false}
            disableRotation={false}
            pixelRatio={1}
            className="particles-hero"
          />
          <Hero />
          <Marquee />
        </div>
        <About />
        <Incoming />
        <Experience />
        <Projects />
        <Skills />
        <Contact />
      </main>
      <BackToTop />
    </>
  );
}
