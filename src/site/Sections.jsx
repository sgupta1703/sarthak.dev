import { motion } from 'framer-motion';
import { useSite, useIndex } from './context';
import { Pinned } from './Chrome';
import { AWARDS, CERTS, EXPERIENCE, PROFILE, PROJECTS } from './data';
import { BlurText, NumberTicker, Rich } from './components/Text';
import { SpotlightCard } from './components/Widgets';
import { PixelPortrait, ProductPreview, ProjectLens, Underline, Workflow } from './components/Details';
import { Magnetic, RollText } from './components/Motion';
import ProjectVisual from './components/ProjectVisual';
import SkillIndex from './components/SkillIndex';
import ScrollExpand from './components/ScrollExpand';
import ResumeViewer from './components/ResumeViewer';
import BrandIcon from './components/BrandIcon';

const EASE = [0.22, 1, 0.36, 1];

function Kicker({ children, accent }) {
  return (
    <p className="kicker" style={accent ? { '--acc': accent } : undefined}>
      <span className="kicker-dot" aria-hidden="true" />
      {children}
    </p>
  );
}

function LiveDot() {
  return <span className="live-dot" aria-hidden="true" />;
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
export function Hero() {
  const { register, goTo, reducedMotion } = useSite();
  const i = useIndex('top');
  return (
    <section id="top" ref={register(i)} className="sec sec-hero">
      <h1 className="sr-only">Sarthak Gupta</h1>
      <Pinned index={i} className="hero-bottom">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.35, ease: EASE }}
        >
          <p className="hero-line">{PROFILE.headline}</p>
          <p className="hero-meta">B.S./M.S. Computer Science · University of Florida · {PROFILE.location}</p>
          <div className="hero-actions">
            <Magnetic className="btn btn-primary" onClick={() => goTo(EXPERIENCE[0].id)}><RollText>See the work</RollText><span aria-hidden="true">↗</span></Magnetic>
            <Magnetic as="a" href="#resume" className="btn btn-ghost border-sweep"><RollText>Résumé</RollText></Magnetic>
          </div>
        </motion.div>
      </Pinned>
      <div className="hero-cue" aria-hidden="true"><span /></div>
    </section>
  );
}

/* ─── About ──────────────────────────────────────────────────────────────── */
export function About() {
  const { register } = useSite();
  const i = useIndex('about');
  return (
    <section id="about" ref={register(i)} className="sec sec-pinned">
      <div className="sec-sticky about-layout">
        <Pinned index={i} className="sec-copy">
          <Kicker>About</Kicker>
          <h2 className="h-display"><BlurText text="Dreamer. Thinker. Builder." /></h2>
          <p className="lead">
            I’m a junior at the University of Florida in the combined B.S./M.S. Computer Science program, with a minor in Economics.
          </p>
          <p className="body">
            I build AI that has to hold up outside a notebook: on-device pipelines on Snapdragon at Qualcomm, LLM agents for wireless
            research at UF’s EdgeAI Lab, generative video on a supercomputer for the U.S. Air Force, and robotics software at UF’s
            Machine Intelligence Lab. I also co-founded Lingua, an AI-powered LMS that’s live in Florida schools.
          </p>
          <dl className="facts">
            <div><dt>Based in</dt><dd>{PROFILE.location}</dd></div>
            <div><dt>Studying</dt><dd>B.S./M.S. CS, UF</dd></div>
          </dl>
        </Pinned>
        <PixelPortrait />
      </div>
    </section>
  );
}

/* ─── Experience ─────────────────────────────────────────────────────────── */
export function Role({ exp, n }) {
  const { register } = useSite();
  const i = useIndex(exp.id);
  const live = exp.period.endsWith('Present');
  return (
    <section id={exp.id} ref={register(i)} className={`sec sec-pinned sec-role ${n % 2 === 0 ? 'is-reversed' : ''}`}>
      {n === 1 && <h2 className="sr-only">Experience</h2>}
      <div className={`sec-sticky ${exp.id === 'lingua' ? 'role-with-preview' : ''}`}>
        <Pinned index={i} className="sec-copy role-copy">
          <div className="role-kicker">
            <Kicker>Experience</Kicker>
            <span className="role-count">{String(n).padStart(2, '0')} / {String(EXPERIENCE.length).padStart(2, '0')}</span>
            <span className="role-ticks" aria-hidden="true">
              {EXPERIENCE.map((e, k) => <span key={e.id} className={k + 1 === n ? 'is-on' : ''} />)}
            </span>
          </div>
          {exp.url ? (
            <a className="role-org role-org-link" href={exp.url} target="_blank" rel="noopener noreferrer">{exp.org} ↗</a>
          ) : (
            <p className="role-org">{exp.org}</p>
          )}
          <h3 className="h-role"><BlurText text={exp.headline} /></h3>
          <p className="role-title">
            <span>{exp.role}</span>
            <span className="role-dot" aria-hidden="true">·</span>
            <span className="role-period">{live && <LiveDot />}{exp.period}</span>
            <span className="role-dot" aria-hidden="true">·</span>
            <span>{exp.location}</span>
          </p>
          <ul className="bullets">
            {exp.bullets.map((b, k) => (
              <motion.li
                key={k}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-5% 0px' }}
                transition={{ duration: 0.6, delay: 0.15 + k * 0.08, ease: EASE }}
              >
                <Rich text={b} />
              </motion.li>
            ))}
          </ul>
          {exp.stats && (
            <dl className="stats">
              {exp.stats.map((s) => (
                <div key={s.label} className="stat">
                  <dt>{s.label}</dt>
                  <dd><Underline>{s.text ? s.text : <NumberTicker value={s.value} suffix={s.suffix || ''} />}</Underline></dd>
                </div>
              ))}
            </dl>
          )}
          <ul className="chips chips-role">
            {exp.stack.map((t) => <li key={t} className="chip">{t}</li>)}
          </ul>
          {exp.id === 'qualcomm' && <Workflow />}
        </Pinned>
        {exp.id === 'lingua' && <ProductPreview />}
      </div>
    </section>
  );
}

/* ─── Projects: a responsive grid in the normal page flow ────────────────── */
function ProjectCard({ p, k }) {
  return (
    <SpotlightCard as={motion.article} className="card proj-card"
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }} transition={{ duration: 0.5, delay: (k % 3) * 0.06, ease: EASE }}>
      <div className="proj-visual"><ProjectLens label={p.name}><ProjectVisual kind={p.visual} /></ProjectLens></div>
      <div className="proj-body">
        <div className="proj-meta">
          <span className="proj-index">{String(k + 1).padStart(2, '0')}</span>
          <span className="proj-period">{p.period}</span>
          {p.award && <span className="badge-award">★ {p.award}</span>}
        </div>
        <h3 className="proj-name">{p.name}</h3>
        <p className="proj-desc">{p.desc}</p>
        <ul className="proj-bullets">{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
        <ul className="chips chips-sm">{p.stack.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
      </div>
    </SpotlightCard>
  );
}

export function Projects() {
  const { register } = useSite();
  const i = useIndex('projects');

  return (
    <section
      id="projects"
      ref={register(i)}
      className="sec sec-projects"
    >
      <div className="proj-sticky">
        <div className="wrap proj-head">
          <div>
            <Kicker>Projects</Kicker>
            <h2 className="h-section"><BlurText text="Selected work." /></h2>
          </div>
        </div>
        <div className="wrap proj-track">
          {PROJECTS.map((p, k) => <ProjectCard key={p.id} p={p} k={k} />)}
          <a className="card proj-more" href={PROFILE.github} target="_blank" rel="noopener noreferrer">
            <span className="card-label">More</span>
            <span className="proj-more-title">Everything else lives on GitHub</span>
            <span className="card-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Recognition: awards, finals and talks ───────────────────────────────── */
export function Stage() {
  const { register } = useSite();
  const i = useIndex('stage');
  return (
    <section id="stage" ref={register(i)} className="sec sec-pinned">
      <div className="sec-sticky">
        <Pinned index={i} className="sec-copy">
          <Kicker>Recognition</Kicker>
          <h2 className="h-display h-display-sm"><BlurText text="Awards & presentations." /></h2>
          <ol className="awards">
            {AWARDS.map((a, k) => (
              <motion.li
                key={a.event}
                className="award"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + k * 0.08, ease: EASE }}
              >
                <span className="award-date">{a.date}</span>
                <div>
                  <p className="award-title">{a.title} <span className="award-event">· {a.event}</span></p>
                  <p className="award-note">{a.note}</p>
                </div>
              </motion.li>
            ))}
          </ol>
          <p className="card-label certs-label">Certifications</p>
          <ul className="certs">
            {CERTS.map((c) => (
              <li key={c.name} className="cert"><span className="cert-name">{c.name}</span><span className="cert-by">{c.provider}</span></li>
            ))}
          </ul>
        </Pinned>
      </div>
    </section>
  );
}

/* ─── Skills ─────────────────────────────────────────────────────────────── */
export function Skills() {
  const { register } = useSite();
  const i = useIndex('skills');
  return (
    <section id="skills" ref={register(i)} className="sec sec-flow sec-skills">
      <ScrollExpand>
      <div className="wrap">
        <div className="skills-heading">
          <div className="sec-head">
            <Kicker>Skills</Kicker>
            <h2 className="h-section"><BlurText text="The toolbox." /></h2>
          </div>
        </div>
        <SkillIndex />
      </div>
      </ScrollExpand>
    </section>
  );
}

/* ─── Off the clock ──────────────────────────────────────────────────────── */
export function Court() {
  const { register } = useSite();
  const i = useIndex('court');
  return (
    <section id="court" ref={register(i)} className="sec sec-pinned sec-court">
      <div className="sec-sticky">
        <Pinned index={i} className="sec-copy">
          <Kicker>Off the clock</Kicker>
          <h2 className="h-display"><BlurText text="On the court." /></h2>
          <p className="lead">When I’m not building, you’ll find me on the tennis or pickleball court.</p>
        </Pinned>
      </div>
    </section>
  );
}

/* ─── Résumé ─────────────────────────────────────────────────────────────── */
export function Resume() {
  const { register } = useSite();
  const i = useIndex('resume');
  return (
    <section id="resume" ref={register(i)} className="sec sec-flow sec-resume">
      <div className="wrap">
        <div className="sec-head sec-head-center">
          <Kicker>Résumé</Kicker>
          <h2 className="h-section"><BlurText text="The one-pager." /></h2>
          <p className="lead resume-sub">Last updated {PROFILE.resumeUpdated}</p>
        </div>
        <ResumeViewer />
      </div>
    </section>
  );
}

/* ─── Contact ────────────────────────────────────────────────────────────── */
export function Contact() {
  const { register, goTo } = useSite();
  const i = useIndex('contact');
  const links = [
    { label: 'Email', icon: 'gmail', href: `mailto:${PROFILE.email}` },
    { label: 'LinkedIn', icon: 'linkedin', href: PROFILE.linkedin, external: true },
    { label: 'GitHub', icon: 'github', href: PROFILE.github, external: true },
  ];
  return (
    <section id="contact" ref={register(i)} className="sec sec-contact">
      <Pinned index={i} className="contact-inner">
        <h2 className="h-section contact-title"><BlurText text="Let’s build something together." /></h2>
        <p className="lead contact-sub">Open to collaborations and interesting projects.</p>
        <div className="contact-actions">
          {links.map((l) => (
            <Magnetic as="a" key={l.label} className="btn btn-ghost" href={l.href} target={l.external ? '_blank' : undefined} rel={l.external ? 'noopener noreferrer' : undefined}>
              <BrandIcon name={l.icon} /><RollText>{l.label}</RollText><span aria-hidden="true">↗</span>
            </Magnetic>
          ))}
        </div>
        <p className="contact-meta">
          <span>{PROFILE.location}</span>
        </p>
      </Pinned>
      <footer className="footer">
        <span>© 2026 {PROFILE.name}</span>
        <a className="footer-link" href="#experiment">Ideas notebook</a>
        <button className="footer-top" onClick={() => goTo('top')}>Back to top ↑</button>
      </footer>
    </section>
  );
}
