import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Particles from './Particles';

function useInView(threshold = 0.08) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function Reveal({ children, delay = 0, y = 40, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`reveal ${inView ? 'reveal-in' : ''} ${className}`}
      style={{ '--delay': `${delay}ms`, '--y': `${y}px` }}>
      {children}
    </div>
  );
}

function MagneticBtn({ children, href, className = '', download }) {
  const btnRef = useRef(null);
  const onMove = e => {
    const b = btnRef.current.getBoundingClientRect();
    btnRef.current.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.3}px, ${(e.clientY - b.top - b.height / 2) * 0.3}px)`;
  };
  const onLeave = () => { btnRef.current.style.transform = ''; };
  return (
    <a ref={btnRef} href={href} target={download ? '_self' : '_blank'} rel="noopener noreferrer"
      download={download} className={`magnetic-btn ${className}`}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </a>
  );
}

function TiltCard({ children, className = '' }) {
  const cardRef = useRef(null);
  const glowRef = useRef(null);
  const onMove = e => {
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    cardRef.current.style.transform = `perspective(900px) rotateX(${(y - 0.5) * -12}deg) rotateY(${(x - 0.5) * 12}deg) scale3d(1.02,1.02,1.02)`;
    glowRef.current.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(201,162,86,0.2), transparent 65%)`;
  };
  const onLeave = () => {
    cardRef.current.style.transform = '';
    glowRef.current.style.background = 'transparent';
  };
  return (
    <div ref={cardRef} className={`tilt-card ${className}`} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div ref={glowRef} className="tilt-glow" />
      {children}
    </div>
  );
}

const MARQUEE_ITEMS = [
  'Python', 'C++', 'ROS2', 'PyTorch', 'LangChain', 'React', 'Node.js',
  'Computer Vision', 'NLP', 'Robotics', 'CUDA', 'FastAPI', 'TensorFlow',
  'React Native', 'OpenCV', 'Agile', 'RAG', 'Agentic AI', 'AWS', 'Firebase', 'MongoDB', 'ComfyUI',
];
function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="marquee-item">
            {item}<span className="marquee-sep">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const links = ['About', 'Experience', 'Projects', 'Skills', 'Contact'];
  const scrollTo = id => { document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' }); setOpen(false); };
  return (
    <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="nav-inner">
        <div className="nav-logo" role="button" tabIndex={0} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          SG
        </div>
        <div className={`nav-links ${open ? 'nav-open' : ''}`}>
          {links.map(l => <button key={l} className="nav-link" onClick={() => scrollTo(l)}>{l}</button>)}
          <a href="/Sarthak_Gupta_Resume.pdf" download className="nav-cta">Resume ↓</a>
        </div>
        <button className={`nav-burger ${open ? 'burger-active' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}

function Hero() {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 120); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const fn = e => {
      const dx = (e.clientX / window.innerWidth - 0.5);
      const dy = (e.clientY / window.innerHeight - 0.5);
      el.style.transform = `translate(${dx * -18}px, ${dy * -18}px)`;
    };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-orb orb-1" />
        <div className="hero-orb orb-2" />
        <div className="noise" />
      </div>
      <div className={`hero-content ${loaded ? 'hero-loaded' : ''}`}>
        <div className="hero-eyebrow">
          <span className="eyebrow-line" />
          Computer Science · University of Florida · Class of 2027
          <span className="eyebrow-line" />
        </div>
        <h1 className="hero-name">
          <span className="name-line">SARTHAK</span>
          <span className="name-line name-gold">GUPTA</span>
        </h1>
        <p className="hero-sub">Robotics · AI · Full-Stack · Researcher</p>
        <div className="hero-actions">
          <MagneticBtn href="https://www.linkedin.com/in/sarthak-gupta17/" className="btn-primary">LinkedIn ↗</MagneticBtn>
          <MagneticBtn href="https://github.com/sgupta1703" className="btn-ghost">GitHub ↗</MagneticBtn>
        </div>
      </div>
      <div className={`hero-img-wrap ${loaded ? 'hero-loaded' : ''}`} ref={imgRef}>
        <div className="hero-img-ring" />
        <div className="hero-img-ring ring-2" />
        <a href="https://www.linkedin.com/in/sarthak-gupta17/" target="_blank" rel="noopener noreferrer">
          <img src="/image.jpeg" alt="Sarthak Gupta" className="hero-img" />
        </a>
      </div>
      <div className="scroll-hint">
        <div className="scroll-line" />
        <span>Scroll</span>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <Reveal><div className="section-label">01 — About</div></Reveal>
        <div className="about-grid">
          <div className="about-left-col">
            <Reveal delay={100}>
              <h2 className="section-heading">Dreamer.<br />Thinker.<br /><em>Builder.</em></h2>
            </Reveal>
            <Reveal delay={200}>
              <div className="gpa-badge">
                <span className="gpa-num">3.68 GPA</span>
                <span className="gpa-divider" />
                <span className="gpa-label">University of Florida</span>
              </div>
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
                <div className="courses-grid">
                  {['Data Structures & Algorithms', 'Operating Systems', 'Computer Networks', 'Database Systems', 'Linear Algebra', 'Discrete Structures', 'Virtual Reality', 'Software Engineering', 'Programming Language Concepts'].map(c => (
                    <span key={c} className="course-tag">{c}</span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

const EXPERIENCE = [
  {
    role: 'Robotics Software Developer',
    org: 'Machine Intelligence Lab @ UF',
    period: 'Jan 2025 – Present',
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
    org: 'Florida Community Innovation Foundation',
    period: 'Oct 2025 – Dec 2025',
    tag: 'Industry',
    bullets: [
      'Designing LLM-driven agentic pipelines with LangChain, OpenAI APIs, and Python to autonomously extract and structure non-profit service data from unstructured web sources.',
      'Built scraping pipelines processing 5,000+ resource listings; improved data coverage by 35%.',
      'Implemented a RAG system with vector search for resource recommendations, increasing query accuracy by 40%.',
    ],
  },
];

function Experience() {
  const [active, setActive] = useState(0);
  return (
    <section id="experience" className="section section-dark">
      <div className="container">
        <Reveal><div className="section-label">02 — Experience</div></Reveal>
        <Reveal delay={100}><h2 className="section-heading">Where I've<br /><em>Worked & Researched</em></h2></Reveal>
        <div className="exp-layout">
          <div className="exp-tabs">
            {EXPERIENCE.map((e, i) => (
              <button key={i} className={`exp-tab ${active === i ? 'exp-tab-active' : ''}`} onClick={() => setActive(i)}>
                <span className="exp-tab-tag">{e.tag}</span>
                <span className="exp-tab-role">{e.role}</span>
                <span className="exp-tab-org">{e.org}</span>
              </button>
            ))}
          </div>
          <div className="exp-content">
            {EXPERIENCE.map((e, i) => (
              <div key={i} className={`exp-panel ${active === i ? 'exp-panel-active' : ''}`}>
                <div className="exp-header">
                  <div>
                    <div className="exp-role">{e.role}</div>
                    <div className="exp-org">{e.org}</div>
                  </div>
                  <div className="exp-period">{e.period}</div>
                </div>
                <ul className="exp-bullets">
                  {e.bullets.map((b, j) => (
                    <li key={j} className="exp-bullet" style={{ animationDelay: `${j * 80}ms` }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const PROJECTS = [
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
    index: '01',
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
    index: '02',
  },
  {
    name: 'J.A.R.V.I.S',
    stack: 'Python · PyQt6 · Vosk · Porcupine · Gemini API · OpenGL',
    period: 'Jun 2025 – Present',
    desc: 'Multithreaded offline voice assistant with wake-word detection, real-time speech-to-text, and a PyQt6 interface featuring an OpenGL waveform visualizer.',
    bullets: [
      'Low-latency wake-word detection with pvporcupine',
      'Gemini API integration for contextual NLP + WeatherAPI geolocation',
      'Extensible voice-command handlers for system controls and file operations',
    ],
    index: '03',
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
    index: '04',
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
    index: '05',
  },
];

/* ─── Project Carousel ───────────────────────────────────────────────────────── */
function ProjectCarousel() {
  const trackRef = useRef(null);

  // Auto-scroll state
  const autoScrollSpeed = 0.6; // px per frame
  const isPaused = useRef(false);
  const rafRef = useRef(null);
  const scrollPos = useRef(0);

  // Drag state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const momentumRaf = useRef(null);

  // For preventing click after drag
  const didDrag = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Sync scrollPos with actual DOM on mount
    scrollPos.current = track.scrollLeft;

    const tick = () => {
      if (!isPaused.current && !isDragging.current) {
        scrollPos.current += autoScrollSpeed;
        // Infinite loop: if we've scrolled past half, reset to 0
        const half = track.scrollWidth / 2;
        if (scrollPos.current >= half) scrollPos.current -= half;
        track.scrollLeft = scrollPos.current;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ── Hover pause ── */
  const onMouseEnter = () => { isPaused.current = true; };
  const onMouseLeave = () => {
    if (!isDragging.current) isPaused.current = false;
  };

  /* ── Drag to scroll ── */
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

    // Momentum flick
    let vel = -velocity.current * 16; // scale to px/frame
    const momentum = () => {
      if (Math.abs(vel) < 0.3) {
        // hand back to auto-scroll
        isPaused.current = false;
        return;
      }
      scrollPos.current += vel;
      const half = trackRef.current.scrollWidth / 2;
      if (scrollPos.current >= half) scrollPos.current -= half;
      if (scrollPos.current < 0) scrollPos.current += half;
      trackRef.current.scrollLeft = scrollPos.current;
      vel *= 0.92; // friction
      momentumRaf.current = requestAnimationFrame(momentum);
    };
    momentumRaf.current = requestAnimationFrame(momentum);
  };

  // Mouse events
  const onMouseDown = e => { e.preventDefault(); startDrag(e.clientX); };
  const onMouseMove = e => moveDrag(e.clientX);
  const onMouseUp   = () => endDrag();

  // Touch events
  const onTouchStart = e => startDrag(e.touches[0].clientX);
  const onTouchMove  = e => moveDrag(e.touches[0].clientX);
  const onTouchEnd   = () => endDrag();

  const allCards = [...PROJECTS, ...PROJECTS];

  return (
    <div className="carousel-outer">
      <div className="carousel-fade carousel-fade-left" />
      <div className="carousel-fade carousel-fade-right" />

      <div
        ref={trackRef}
        className="carousel-track"
        onMouseEnter={onMouseEnter}
        onMouseLeave={e => { onMouseLeave(); endDrag(); }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {allCards.map((p, i) => (
          <div key={i} className="carousel-item">
            <TiltCard className="project-card">
              <div className="project-top">
                <span className="project-index">{p.index}</span>
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
          </div>
        ))}
      </div>

      {/* Scroll hint dots */}
      <div className="carousel-dots" aria-hidden="true">
        {PROJECTS.map((_, i) => (
          <div key={i} className="carousel-dot" />
        ))}
      </div>
    </div>
  );
}

function Projects() {
  return (
    <section id="projects" className="section projects-section">
      <div className="container">
        <Reveal><div className="section-label">03 — Projects</div></Reveal>
        <Reveal delay={100}>
          <h2 className="section-heading">Selected<br /><em>Works</em></h2>
        </Reveal>
      </div>
      <Reveal delay={200}>
        <ProjectCarousel />
      </Reveal>
    </section>
  );
}

const SKILLS = {
  Languages: ['Java', 'Python', 'JavaScript', 'C++', 'R', 'MATLAB'],
  'Frameworks & Platforms': ['React.js', 'React Native', 'Node.js', 'Express.js', 'LangChain', 'FastAPI', 'TensorFlow', 'PyTorch', 'ROS2', 'Firebase', 'MongoDB', 'Angular.js', 'TypeScript', 'Expo'],
  'Tools & Tech': ['Git', 'OpenCV', 'NVIDIA Isaac Sim', 'AWS Polly', 'Figma', 'Ubuntu/Linux', 'QGIS', 'ArcGIS Pro', 'ComfyUI', 'CUDA / Slurm'],
  Methodologies: ['Agile / Scrum', 'SDLC', 'RAG Pipelines', 'Sensor Fusion', 'Agentic AI'],
};

const CERTS = [
  { name: 'AWS Certified AI Practitioner', provider: 'Amazon Web Services', year: '2025' },
  { name: 'AWS Certified Cloud Practitioner', provider: 'Amazon Web Services', year: '2025' },
  { name: 'Building Transformer-Based NLP Applications', provider: 'NVIDIA', year: '2025' },
  { name: 'Fundamentals of Deep Learning', provider: 'NVIDIA', year: '2025' },
  { name: 'Intermediate Web Development (WEB102)', provider: 'CodePath', year: '2025' },
];

function SkillGroup({ cat, items, delay }) {
  return (
    <Reveal delay={delay}>
      <div className="skill-group">
        <div className="skill-cat">{cat}</div>
        <div className="skill-items">
          {items.map(s => <span key={s} className="skill-tag">{s}</span>)}
        </div>
      </div>
    </Reveal>
  );
}

function Skills() {
  return (
    <section id="skills" className="section section-dark">
      <div className="container">
        <Reveal><div className="section-label">04 — Skills & Certifications</div></Reveal>
        <Reveal delay={100}><h2 className="section-heading">Technical<br /><em>Skills</em></h2></Reveal>
        <div className="skills-layout">
          <div className="skills-col">
            {Object.entries(SKILLS).map(([cat, items], i) => (
              <SkillGroup key={cat} cat={cat} items={items} delay={i * 80} />
            ))}
          </div>
          <div className="certs-col">
            <Reveal delay={200}>
              <div className="certs-heading">Certifications</div>
              {CERTS.map((c) => (
                <div key={c.name} className="cert-card">
                  <div className="cert-year">{c.year}</div>
                  <div className="cert-info">
                    <div className="cert-name">{c.name}</div>
                    <div className="cert-provider">{c.provider}</div>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="section contact-section">
      <div className="container">
        <div className="contact-inner">
          <Reveal><div className="section-label">05 — Contact</div></Reveal>
          <Reveal delay={100}>
            <h2 className="contact-heading">Let's build<br />something<br /><em>together.</em></h2>
          </Reveal>
          <Reveal delay={250}>
            <p className="contact-sub">Open to collaborations and any interesting projects.</p>
          </Reveal>
          <Reveal delay={350}>
            <div className="contact-links">
              <a href="mailto:sarthakgupta1703@gmail.com" className="contact-link-btn">
                <span className="contact-link-label">Email</span>
                <span className="contact-link-value">sarthakgupta1703@gmail.com</span>
                <span className="contact-link-arrow">↗</span>
              </a>
              <a href="https://www.linkedin.com/in/sarthak-gupta17/" target="_blank" rel="noopener noreferrer" className="contact-link-btn">
                <span className="contact-link-label">LinkedIn</span>
                <span className="contact-link-value">linkedin.com/in/sarthak-gupta17</span>
                <span className="contact-link-arrow">↗</span>
              </a>
              <a href="https://github.com/sgupta1703" target="_blank" rel="noopener noreferrer" className="contact-link-btn">
                <span className="contact-link-label">GitHub</span>
                <span className="contact-link-value">github.com/sgupta1703</span>
                <span className="contact-link-arrow">↗</span>
              </a>
            </div>
          </Reveal>
        </div>
        <div className="footer-line">
          <div className="footer-left">© 2025 Sarthak Gupta</div>
          <div className="footer-right">Gainesville, FL · University of Florida</div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
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
        <Experience />
        <Projects />
        <Skills />
        <Contact />
      </main>
    </>
  );
}