import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import './IdeaVisuals.css';

const VIEWPORT = { amount: 0.4, once: false };
const EASE = [0.16, 1, 0.3, 1];

/* 01 — Voice PR Review */
function VoicePRVisual() {
  const lines = [
    { kind: 'context', text: 'function handleSubmit(form) {' },
    { kind: 'context', text: '  const url = endpoint(form.id);' },
    { kind: 'remove',  text: '  return await fetch(url);' },
    { kind: 'add',     text: '  return await fetchWithRetry(url, 3);' },
    { kind: 'context', text: '}' },
  ];
  return (
    <div className="iv iv-voice">
      <div className="iv-card">
        <div className="iv-card-bar">
          <span className="iv-dot" />
          <span className="iv-card-title">pr #482 · auth-retries.ts</span>
          <span className="iv-card-meta">+1 −1</span>
        </div>
        <div className="iv-diff">
          {lines.map((l, i) => (
            <motion.div
              key={i}
              className={`iv-diff-line iv-diff--${l.kind}`}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.4, delay: i * 0.14, ease: EASE }}
            >
              <span className="iv-diff-mark">
                {l.kind === 'add' ? '+' : l.kind === 'remove' ? '−' : ' '}
              </span>
              <span className="iv-diff-code">{l.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="iv-voice-row">
        <div className="iv-voice-wave" aria-hidden="true">
          {Array.from({ length: 22 }).map((_, i) => (
            <motion.span
              key={i}
              className="iv-voice-bar"
              animate={{ scaleY: [0.25, 1, 0.5, 0.9, 0.3] }}
              transition={{
                duration: 1.4 + ((i * 13) % 5) * 0.12,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: (i % 7) * 0.06,
              }}
            />
          ))}
        </div>
        <div className="iv-voice-caption">
          <span className="iv-voice-time">0:14</span>
          <span>narrating · 2 concerns</span>
        </div>
      </div>
    </div>
  );
}

/* 02 — Paper Bookmarks */
function PaperBookmarkVisual() {
  const lineWidths = [78, 88, 92, 84, 70, 90, 64];
  const targetIdx = 3;
  return (
    <div className="iv iv-paper">
      <div className="iv-paper-page">
        {lineWidths.map((w, i) => (
          <div
            key={i}
            className={`iv-paper-line ${i === targetIdx ? 'iv-paper-line--target' : ''}`}
            style={{ width: `${w}%` }}
          >
            {i === targetIdx && (
              <motion.span
                className="iv-paper-highlight"
                animate={{ scaleX: [0, 1, 1, 0] }}
                transition={{
                  duration: 5.4,
                  times: [0, 0.35, 0.78, 1],
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 0.4,
                }}
              />
            )}
          </div>
        ))}
        <div className="iv-paper-corner" />
      </div>
      <motion.div
        className="iv-paper-snippet"
        animate={{ opacity: [0, 0, 1, 1, 0], y: [10, 10, 0, 0, -4] }}
        transition={{
          duration: 5.4,
          times: [0, 0.42, 0.55, 0.85, 1],
          repeat: Infinity,
          ease: EASE,
          repeatDelay: 0.4,
        }}
      >
        <div className="iv-paper-quote">
          "the system was wrong because the model never saw the field"
        </div>
        <div className="iv-paper-meta">
          <span>Atlas of AI</span>
          <span>·</span>
          <span>p. 142</span>
          <span>·</span>
          <span>captured 14:02</span>
        </div>
      </motion.div>
    </div>
  );
}

/* 03 — Lab Notes Agent */
function LabNotesVisual() {
  const logs = [
    { t: '14:02:11', kind: 'info', msg: 'DVL_NODE init ok' },
    { t: '14:02:13', kind: 'info', msg: 'thrust_pid armed · profile=cruise' },
    { t: '14:02:18', kind: 'info', msg: 'sensor_drift +0.12 m/s' },
    { t: '14:02:22', kind: 'warn', msg: 'heading_jitter 4.1°' },
    { t: '14:02:24', kind: 'ok',   msg: 'recovery applied · settled in 6s' },
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((v) => (v + 1) % (logs.length + 4)), 1100);
    return () => clearInterval(id);
  }, [logs.length]);
  const visible = Math.min(step, logs.length);
  const showSummary = step > logs.length;
  return (
    <div className="iv iv-lab">
      <div className="iv-term">
        <div className="iv-term-bar">
          <span /><span /><span />
          <span className="iv-term-bar-name">trial-14.log</span>
        </div>
        <div className="iv-term-body">
          {logs.slice(0, visible).map((l, i) => (
            <motion.div
              key={`${step}-${i}`}
              className={`iv-term-line iv-term-line--${l.kind}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="iv-term-t">{l.t}</span>
              <span className="iv-term-msg">{l.msg}</span>
            </motion.div>
          ))}
          {visible < logs.length && <span className="iv-term-cursor" />}
        </div>
      </div>
      <motion.div
        className="iv-lab-summary"
        initial={false}
        animate={{
          opacity: showSummary ? 1 : 0,
          y: showSummary ? 0 : 10,
        }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="iv-lab-summary-h">
          <span>trial 14 · debrief</span>
          <span className="iv-lab-summary-tag">auto</span>
        </div>
        <div className="iv-lab-summary-b">
          heading drift recovered after 6s — flag thruster recalibration before next run.
        </div>
      </motion.div>
    </div>
  );
}

/* 04 — Writer that asks what's missing */
function AskWriterVisual() {
  const lines = [
    { w: 92, em: false },
    { w: 86, em: false },
    { w: 78, em: true },
    { w: 88, em: false },
    { w: 70, em: false },
  ];
  return (
    <div className="iv iv-writer">
      <div className="iv-writer-doc">
        <div className="iv-writer-h">draft · "why ranking fails on long tail"</div>
        {lines.map((line, i) => (
          <motion.div
            key={i}
            className={`iv-writer-line ${line.em ? 'iv-writer-line--em' : ''}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.13, ease: EASE }}
            style={{ width: `${line.w}%` }}
          />
        ))}
      </div>
      <motion.div
        className="iv-writer-margin"
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.6, delay: 1.4, ease: EASE }}
      >
        <div className="iv-writer-q">?</div>
        <div className="iv-writer-q-text">
          you say <em>"scaled"</em> but never say by how much. add a number?
        </div>
      </motion.div>
    </div>
  );
}

/* 05 — Disappearing chat */
function DisappearChatVisual() {
  const messages = [
    { from: 'them', text: 'lab today?', delay: 0 },
    { from: 'me',   text: 'yeah, 30m',  delay: 1.2 },
    { from: 'them', text: 'see u',      delay: 2.4 },
  ];
  const cycle = 6.6;
  return (
    <div className="iv iv-chat">
      <div className="iv-chat-frame">
        <div className="iv-chat-head">
          <span>core · 4 online</span>
          <span className="iv-chat-rule">reply &lt; 2:00 or it disappears</span>
        </div>
        <div className="iv-chat-body">
          {messages.map((m, i) => (
            <div key={i} className={`iv-chat-row iv-chat-row--${m.from}`}>
              <motion.div
                className="iv-chat-bubble"
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [6, 0, 0, -2],
                }}
                transition={{
                  duration: cycle,
                  times: [0, 0.08, 0.85, 1],
                  delay: m.delay,
                  repeat: Infinity,
                  ease: EASE,
                }}
              >
                {m.text}
              </motion.div>
              <motion.div
                className="iv-chat-timer"
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: cycle,
                  times: [0, 0.1, 0.85, 1],
                  delay: m.delay,
                  repeat: Infinity,
                }}
              >
                <motion.span
                  className="iv-chat-timer-fill"
                  animate={{ scaleX: [1, 0] }}
                  transition={{
                    duration: cycle * 0.78,
                    delay: m.delay + 0.1,
                    ease: 'linear',
                    repeat: Infinity,
                    repeatDelay: cycle * 0.22,
                  }}
                />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 06 — Tutor that watches the strokes */
function StrokeWatcherVisual() {
  return (
    <div className="iv iv-stroke">
      <div className="iv-stroke-pad">
        <svg viewBox="0 0 200 90" className="iv-stroke-svg" preserveAspectRatio="xMidYMid meet">
          <motion.path
            d="M 18 26 Q 18 14 32 14 Q 46 14 46 28 Q 46 40 18 66 L 50 66"
            stroke="#fff8ef"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
          />
          <motion.path
            d="M 70 40 L 90 40 M 80 30 L 80 50"
            stroke="#c9a256"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, delay: 1.4, ease: EASE }}
          />
          <motion.path
            d="M 108 18 Q 122 12 130 18 Q 138 26 124 38 Q 138 46 132 60 Q 122 70 108 66"
            stroke="#fff8ef"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.9, delay: 1.9, ease: EASE }}
          />
          <motion.path
            d="M 152 36 L 178 36 M 152 50 L 178 50"
            stroke="#c9a256"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, delay: 2.8, ease: EASE }}
          />
        </svg>
      </div>
      <motion.div
        className="iv-stroke-trace"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.6, delay: 3.4, ease: EASE }}
      >
        <div className="iv-stroke-trace-row">
          <span className="iv-stroke-step">step 1</span>
          <span>drew "2" left-to-right · normal</span>
        </div>
        <div className="iv-stroke-trace-row iv-stroke-trace-row--flag">
          <span className="iv-stroke-step">step 2</span>
          <span>paused 4.1s on "+" · uncertainty</span>
        </div>
        <div className="iv-stroke-trace-row">
          <span className="iv-stroke-step">step 3</span>
          <span>finished "3 = " confidently</span>
        </div>
      </motion.div>
    </div>
  );
}

/* 07 — Local-first agents */
function LocalAgentVisual() {
  const orbCount = 6;
  return (
    <div className="iv iv-local">
      <div className="iv-local-stage">
        <div className="iv-local-fence" />
        <div className="iv-local-box">
          <div className="iv-local-box-glow" />
          <div className="iv-local-box-label">mac mini · home</div>
        </div>
        {Array.from({ length: orbCount }).map((_, i) => {
          const angle = (i / orbCount) * 360;
          return (
            <motion.span
              key={i}
              className="iv-local-orb"
              animate={{ rotate: [angle, angle + 360] }}
              transition={{
                duration: 14 + (i % 3) * 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <span className="iv-local-orb-dot" />
            </motion.span>
          );
        })}
      </div>
      <div className="iv-local-legend">
        <div className="iv-local-legend-row">
          <span className="iv-local-legend-mark iv-local-legend-mark--ok" />
          <span>journal · calendar · search history</span>
        </div>
        <div className="iv-local-legend-row">
          <span className="iv-local-legend-mark iv-local-legend-mark--ok" />
          <span>local embeddings · 14k items</span>
        </div>
        <div className="iv-local-legend-row">
          <span className="iv-local-legend-mark iv-local-legend-mark--blocked" />
          <span>nothing leaves the room</span>
        </div>
      </div>
    </div>
  );
}

const VISUALS = {
  'voice-pr':       VoicePRVisual,
  'paper-bookmark': PaperBookmarkVisual,
  'lab-notes':      LabNotesVisual,
  'ask-writer':     AskWriterVisual,
  'disappear-chat': DisappearChatVisual,
  'stroke-watcher': StrokeWatcherVisual,
  'local-agent':    LocalAgentVisual,
};

export default function IdeaVisual({ kind }) {
  const Cmp = VISUALS[kind];
  if (!Cmp) return null;
  return <Cmp />;
}
