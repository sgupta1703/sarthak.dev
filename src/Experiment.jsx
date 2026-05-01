import { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import ScrollSequence from './ScrollSequence';
import IdeaVisual from './IdeaVisuals';
import './Experiment.css';

const FRAME_COUNT = 240;
const FRAMES = Array.from(
  { length: FRAME_COUNT },
  (_, i) => `/photos/ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`
);

const TILT_RANGE = 6;
const MotionDiv = motion.div;
const MotionSection = motion.section;

const PANELS = [
  {
    variant: 'hero',
    eyebrow: '/ ideas',
    title: 'Things I want to build.',
    body: 'A working list of products, agents, and experiments I keep coming back to. Some are sketches, some are half-prototyped. All of them feel worth the time.',
  },
  {
    variant: 'left',
    kind: 'voice-pr',
    number: '01',
    eyebrow: 'Voice + Code',
    title: 'Pair-program by voice.',
    body: 'A reviewer agent that reads your open PR aloud while you walk, surfaces what looks wrong, and lets you reply by voice. Code review is the last engineering task that still demands you sit at a screen.',
  },
  {
    variant: 'right',
    kind: 'paper-bookmark',
    number: '02',
    eyebrow: 'CV / Reading',
    title: 'Bookmarks for paper books.',
    body: 'A small camera that watches when you fold a page corner, underline a sentence, or photograph a quote, and turns it into structured highlights you can actually search. The gap between what you read and what you can find later is huge.',
  },
  {
    variant: 'left',
    kind: 'lab-notes',
    number: '03',
    eyebrow: 'Robotics / Field',
    title: 'An agent that takes lab notes.',
    body: 'Voice and vision sitting in the corner of a robotics lab during sea trials, narrating what is failing in real time and writing the post-trial debrief. Engineers should not be the ones taking field notes.',
  },
  {
    variant: 'right',
    kind: 'ask-writer',
    number: '04',
    eyebrow: 'Tools for thinking',
    title: 'A writer that asks what is missing.',
    body: 'Every text editor formats characters. None format ideas. Build one that notices when a paragraph is half an argument and asks the question you skipped.',
  },
  {
    variant: 'left',
    kind: 'disappear-chat',
    number: '05',
    eyebrow: 'Social / Inversions',
    title: 'A chat where slow messages disappear.',
    body: 'Most apps optimize for engagement. Almost none optimize for response time. One group chat, one rule: reply in two minutes or the thread evaporates. The conversations that survive are the ones worth having.',
  },
  {
    variant: 'right',
    kind: 'stroke-watcher',
    number: '06',
    eyebrow: 'Education / Vision',
    title: 'A tutor that watches the strokes.',
    body: 'A tablet app where a kid solves a math problem with their finger, and a vision model traces every step they took, not just the answer. Misunderstanding starts somewhere specific. The grade alone never tells you where.',
  },
  {
    variant: 'left',
    kind: 'local-agent',
    number: '07',
    eyebrow: 'Local-first agents',
    title: 'Your context should not leave the room.',
    body: 'Every agent framework assumes the cloud. Build a runtime that lives on a Mac mini at home, holds the real version of your life, and refuses to stream it anywhere. The point is not capability. It is sovereignty.',
  },
  {
    variant: 'outro',
    eyebrow: 'Sarthak Gupta',
    title: 'More to come.',
    body: 'These are the ones loud enough to write down. If any of them sound interesting, reach out — I would rather build them with someone.',
  },
];

export default function Experiment() {
  const { scrollYProgress } = useScroll();

  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const rotX = useSpring(mvX, { damping: 32, stiffness: 90 });
  const rotY = useSpring(mvY, { damping: 32, stiffness: 90 });
  const sceneScale = useTransform(scrollYProgress, [0, 0.16, 0.84, 1], [1.08, 1.02, 1.02, 1.08]);
  const stageOpacity = useTransform(scrollYProgress, [0, 0.04, 0.94, 1], [0.55, 1, 1, 0.55]);

  useEffect(() => {
    window.__lenis?.scrollTo?.(0, { immediate: true });
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const cx = e.clientX / window.innerWidth - 0.5;
      const cy = e.clientY / window.innerHeight - 0.5;
      mvX.set(cy * -TILT_RANGE);
      mvY.set(cx * TILT_RANGE);
    };

    const onLeave = () => {
      mvX.set(0);
      mvY.set(0);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [mvX, mvY]);

  return (
    <main className="experiment-page">
      <a className="experiment-home" href="/#about" aria-label="Back to about">
        <span className="experiment-home-arrow" aria-hidden="true">←</span>
        <span className="experiment-home-label">Back</span>
      </a>
      <MotionDiv className="experiment-backdrop" style={{ opacity: stageOpacity }} aria-hidden="true">
        <div className="scene-3d-perspective">
          <MotionDiv
            className="scene-3d-tilt"
            style={{ rotateX: rotX, rotateY: rotY, scale: sceneScale }}
          >
            <ScrollSequence
              frames={FRAMES}
              progress={scrollYProgress}
            />
          </MotionDiv>
          <div className="scene-3d-vignette" />
          <div className="scene-3d-grain" />
        </div>
      </MotionDiv>

      <div className="experiment-content">
        {PANELS.map((panel) => (
          <MotionSection
            className={`experiment-panel experiment-panel--${panel.variant}`}
            key={panel.title}
            initial={{ opacity: 0, y: 42 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.45, once: false }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            {panel.kind ? (
              <div className="experiment-pair">
                <div className="experiment-copy">
                  {panel.number && <div className="experiment-number">{panel.number}</div>}
                  <div className="experiment-eyebrow">{panel.eyebrow}</div>
                  <h1 className="experiment-title">{panel.title}</h1>
                  <p className="experiment-body">{panel.body}</p>
                </div>
                <div className="experiment-visual">
                  <IdeaVisual kind={panel.kind} />
                </div>
              </div>
            ) : (
              <div className="experiment-copy">
                {panel.number && <div className="experiment-number">{panel.number}</div>}
                <div className="experiment-eyebrow">{panel.eyebrow}</div>
                <h1 className="experiment-title">{panel.title}</h1>
                <p className="experiment-body">{panel.body}</p>
                {panel.variant === 'hero' && <div className="experiment-scroll-cue">Keep scrolling</div>}
                {panel.variant === 'outro' && <a className="experiment-back" href="/">Back to portfolio</a>}
              </div>
            )}
          </MotionSection>
        ))}
      </div>
    </main>
  );
}
