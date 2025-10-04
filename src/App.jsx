import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { supabase } from "./Components/supabaseClient";
import Login from "./Components/Login";

export default function App() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [siteLoadTime] = useState(performance.now());
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUser(data.session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const publicCommands = ['help', 'me', 'resume', 'contact', 'skills', 'clear'];
  
  const devCommands = ['login', 'logout', 'whoami', 'dev', 'secret'];

  const commandNames = user ? [...publicCommands, ...devCommands] : [...publicCommands, 'login'];

  const computeSuggestions = (rawInput) => {
    if (!rawInput.startsWith('/')) return [];
    const trimmed = rawInput.slice(1);
    const q = trimmed.trim().toLowerCase();
    if (!q) return commandNames;
    return commandNames.filter(name => name.startsWith(q));
  };


  useEffect(() => {
    setSuggestions(computeSuggestions(input));
  }, [input, user]);

  const commands = {
    help: () => ({
      type: 'output',
      content: (
        <div>
          <div className="section-title">Available commands:</div>
          <div className="box">
            <div><span className="prompt-symbol">/help</span> - Show this help message</div>
            <div><span className="prompt-symbol">/me</span> - Learn about Me</div>
            <div><span className="prompt-symbol">/resume</span> - View resume</div>
            <div><span className="prompt-symbol">/contact</span> - Get contact information</div>
            <div><span className="prompt-symbol">/skills</span> - View technical skills</div>
            <div><span className="prompt-symbol">/clear</span> - Clear terminal</div>
            {!user && (
              <div><span className="prompt-symbol">/login</span> - Developer login</div>
            )}
            {user && (
              <>
                <div style={{ marginTop: 12, color: 'var(--accent-cyan)' }}>
                  <div className="subtle">Developer Commands:</div>
                </div>
                <div><span className="prompt-symbol">/logout</span> - Sign out</div>
                <div><span className="prompt-symbol">/whoami</span> - Show current user</div>
                <div><span className="prompt-symbol">/dev</span> - Developer tools</div>
                <div><span className="prompt-symbol">/secret</span> - Show secret info</div>
              </>
            )}
          </div>
        </div>
      )
    }),

    me: () => ({
      type: 'output',
      content: (
        <div>
          <div className="section-title">About Sarthak Gupta</div>
          <div className="box">
            <p>Hello! I'm a sophomore at the University of Florida pursuing a degree in Computer Science</p>
            <p>With a strong foundation in computer science and problem-solving, I have a deep interest in Machine Learning, particularly in the areas of Computer Vision and Natural Language Processing.</p>
            <p>P.S. I like playing Tennis and Pickle Ball</p>
          </div>
        </div>
      )
    }),

    resume: () => ({
      type: 'output',
      content: (
        <div>
          <div className="section-title">Resume</div>
          <div className="box">
            <div>
              <div className="subtle">Education</div>
              <div style={{ paddingLeft: 12 }}>
                <div className="name-highlight">
                  Bachelor of Science in Computer Science, Minor in Accounting
                </div>
                <div className="subtle">
                  University of Florida • Aug 2024 - Dec 2027
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="subtle">Experience</div>
              <div style={{ paddingLeft: 12 }}>
                <div>
                  <div className="name-highlight">Robotics Software Developer</div>
                  <div className="subtle">
                    Machine Intelligence Lab @ University of Florida • January 2025 - Present
                  </div>
                  <div className="subtle" style={{ marginTop: 6 }}>
                    Integrated the Water-Linked Doppler Velocity Log (DVL) into the SubjuGator 9 autonomous maritime system using ROS2, Bash, Linux, Python, and C++, enabling enhanced navigation and localization capabilities. Resolved symbolic link installation issues in colcon build by addressing path resolution and build dependencies to ensure an error-free compilation environment. Advanced to the semifinals of RoboSub 2025 with SubjuGator 9, competing against international teams in autonomous underwater robotics.
                  </div>
                </div>
              </div>

              <div style={{ paddingLeft: 12 }}>
                <div>
                  <div className="name-highlight">
                    Human-Computer Interaction (HCI) Research Intern
                  </div>
                  <div className="subtle">
                    Virtual Experience Research Group (VERG) Lab @ University of Florida • May 2025 - Present
                  </div>
                  <div className="subtle" style={{ marginTop: 6 }}>
                    Designing an interactive virtual human training system for the U.S. Air Force focusing on sexual assault prevention workflows. Leveraging AWS Polly for speech synthesis and Synthesia for avatar-driven video modules to deliver scalable training content. Prototyping conversational UI and user flows in Figma to align with human-centered design principles.
                  </div>
                </div>
              </div>

              <div style={{ paddingLeft: 12 }}>
                <div>
                  <div className="name-highlight">Geospatial AI Intern</div>
                  <div className="subtle">
                    Ecosystem Services AI Lab @ University of Florida • May 2025 - August 2025
                  </div>
                  <div className="subtle" style={{ marginTop: 6 }}>
                    Created image annotations and spatial labels using QGIS and ArcGIS Pro to support supervised model training and validation. Developed Python ETL scripts to acquire, clean, and process spatial datasets (Google Street View, OpenStreetMap, Flickr, U.S. Census, Google Earth Engine). Produced GIS visualizations and outreach assets using Matplotlib, ggplot2, and ArcGIS tools.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="subtle">Projects</div>
<div style={{ marginTop: 12 }}>
  <div className="name-highlight">
    PlayCast
    <span className="subtle">
      &nbsp;| React-Native, Expo, Node.js, Express.js, Google Gemini API, Firebase
    </span>
    <span className="subtle" style={{ marginLeft: 8 }}>
      (
      <a
        href="https://github.com/sgupta1703/Playcast"  // <-- replace with repo link if available
        target="_blank"
        rel="noopener noreferrer"
        className="subtle"
        style={{ textDecoration: 'underline', color: 'var(--accent-cyan)' }}
      >
        See in GitHub
      </a>
      )
    </span>
  </div>
  <div className="subtle">Sept 2025 – Present</div>
  <ul style={{ marginTop: 6 }}>
    <li>Developed a mobile-first app delivering real-time TikTok/Instagram-style highlight reels from live sports, with a React Native frontend (expo-av, Reanimated) supporting low-latency playback, vertical reel navigation, and swipe-right panels for play context.</li>
    <li>Implemented a Node.js + Express backend serving highlight videos and normalized metadata via REST endpoints, with per-sport directory mapping and range-enabled static media delivery.</li>
    <li>Engineered a live-to-highlight pipeline with FFmpeg for ingest/trim, SportsRadar play-by-play for timestamp alignment, and Google Gemini API for NLP-based scoring and context generation.</li>
    <li>Integrated Firebase Firestore to persist likes/skips/favorites, powering real-time personalization and adaptive feed ranking.</li>
  </ul>
</div>




              <div style={{ paddingLeft: 12 }}>
                <div>
                  <div className="name-highlight">
                    J.A.R.V.I.S
                    <span className="subtle">
                      &nbsp;| Python, PyQt6, Vosk, Porcupine, Google Gemini API, OpenGL
                    </span>
                    <span className="subtle" style={{ marginLeft: 8 }}>
                      (
                      <a
                        href="https://github.com/sgupta1703/J.A.R.V.I.S"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="subtle"
                        style={{ textDecoration: 'underline', color: 'var(--accent-cyan)' }}
                      >
                        See in GitHub
                      </a>
                      )
                    </span>
                  </div>
                  <div className="subtle">June 2025 – Present</div>
                  <ul style={{ marginTop: 6 }}>
                    <li>Engineered a multithreaded Python voice assistant using pvporcupine for low-latency wake-word detection and Vosk + sounddevice for offline real-time speech-to-text.</li>
                    <li>Integrated Google Gemini API for contextual NLP and WeatherAPI with IP-based geolocation; optimized TTS with pyttsx3.</li>
                    <li>Built a PyQt6 interface with a real-time OpenGL waveform visualizer and animated UI feedback.</li>
                    <li>Added extensible voice-command handlers for file system ops and system controls (lock, screenshot, app launch).</li>
                  </ul>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className="name-highlight">
                    ExpressCart
                    <span className="subtle">
                      &nbsp;| React.js, Node.js, Express.js, MongoDB, JWT
                    </span>
                    <span className="subtle" style={{ marginLeft: 8 }}>
                      (
                      <a
                        href="https://github.com/sgupta1703/Express-Cart"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="subtle"
                        style={{ textDecoration: 'underline', color: 'var(--accent-cyan)' }}
                      >
                        See in GitHub
                      </a>
                      )
                    </span>
                  </div>
                  <div className="subtle">May 2025 – July 2025</div>
                  <ul style={{ marginTop: 6 }}>
                    <li>Developed a full-stack e-commerce app with React.js frontend and RESTful Express.js backend.</li>
                    <li>Implemented modular async routing in Express.js for scalable architecture.</li>
                    <li>Created MongoDB-backed CRUD endpoints for products, users, and orders.</li>
                    <li>Integrated JWT authentication and role-based authorization across the stack.</li>
                  </ul>
                </div>
{/* 
                <div style={{ marginTop: 12 }}>
                  <div className="name-highlight">
                    Yoogle <span className="subtle">| React.js, Tailwind CSS, Python, FastAPI</span>
                  </div> */}
                <div>
                  <div className="name-highlight">
                    Yoogle
                    <span className="subtle">
                      &nbsp;| React.js, Tailwind CSS, Python, FastAPI
                    </span>
                    <span className="subtle" style={{ marginLeft: 8 }}>
                      (
                      <a
                        href="https://github.com/jithenms/cop3530-project3"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="subtle"
                        style={{ textDecoration: 'underline', color: 'var(--accent-cyan)' }}
                      >
                        See in GitHub
                      </a>
                      )
                    </span>
                  </div>
                  <div className="subtle">Mar 2025 – Apr 2025</div>
                  <ul style={{ marginTop: 6 }}>
                    <li>Implemented an autocomplete benchmarking system comparing Trie vs HashMap latency on large datasets.</li>
                    <li>Preprocessed AOL query logs via Python regex scripts for URL stripping and NSFW filtering.</li>
                    <li>Built a FastAPI backend with async endpoints for high-throughput suggestions.</li>
                    <li>Integrated a React + Tailwind frontend for live autocomplete and performance visualization.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }),

    contact: () => ({
      type: 'output',
      content: (
        <div>
          <div className="section-title">Contact Information</div>
          <div className="box">
            <div>
              <span className="prompt-symbol">Email:</span>{' '}
              <a href="mailto:sarthak.gupta@ufl.edu" target="_blank" rel="noopener noreferrer">
                sarthak.gupta@ufl.edu
              </a>
            </div>
            <div>
              <span className="prompt-symbol">LinkedIn:</span>{' '}
              <a href="https://www.linkedin.com/in/sarthak-gupta17/" target="_blank" rel="noopener noreferrer">
                linkedin.com/in/sarthak-gupta17
              </a>
            </div>
            <div>
              <span className="prompt-symbol">GitHub:</span>{' '}
              <a href="https://github.com/sgupta1703" target="_blank" rel="noopener noreferrer">
                github.com/sgupta1703
              </a>
            </div>
            <div>
              <span className="prompt-symbol">Personal Website:</span>{' '}
              <a href="https://sarthak-dev-msdl.vercel.app/" target="_blank" rel="noopener noreferrer">
                Terminal By Sarthak Gupta
              </a>
            </div>
          </div>
          <div className="subtle" style={{ marginTop: 8 }}>
            Feel free to reach out for collaboration opportunities or just to say hello!
          </div>
        </div>
      )
    }),

    skills: () => ({
      type: 'output',
      content: (
        <div>
          <div className="section-title">Technical Skills</div>
          <div className="box">
            <div style={{ marginBottom: 8 }}>
              <div className="subtle">Languages</div>
              <div style={{ paddingLeft: 12 }} className="subtle">
                Java, Python, JavaScript, C++, MATLAB
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div className="subtle">Frameworks & Platforms</div>
              <div style={{ paddingLeft: 12 }} className="subtle">
                React.js, Node.js, Express.js, ROS2, GIS
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div className="subtle">Tools & Technologies</div>
              <div style={{ paddingLeft: 12 }} className="subtle">
                OpenCV, AWS Polly, Figma, Ubuntu, Linux
              </div>
            </div>
            <div>
              <div className="subtle">Developer Tools</div>
              <div style={{ paddingLeft: 12 }} className="subtle">
                Git, VS Code, PyCharm, IntelliJ, Eclipse
              </div>
            </div>
          </div>
        </div>
      )
    }),

    clear: () => ({ type: 'clear' }),

    login: () => {
      if (user) {
        return {
          type: 'output',
          content: (
            <div className="box">
              <span className="name-highlight">Already logged in as:</span> {user.email}
            </div>
          )
        };
      }
      setShowLogin(true);
      return {
        type: 'output',
        content: (
          <div className="box">
            <div className="name-highlight">Opening login panel...</div>
          </div>
        )
      };
    },

    logout: () => {
      if (!user) {
        return {
          type: 'error',
          content: 'Not logged in. Use /login to authenticate.'
        };
      }
      supabase.auth.signOut();
      return {
        type: 'output',
        content: (
          <div className="box">
            <div className="name-highlight">Successfully logged out!</div>
            <div className="subtle">Developer commands are now hidden.</div>
          </div>
        )
      };
    },

    whoami: () => {
      if (!user) {
        return {
          type: 'error',
          content: 'Access denied. Use /login to authenticate.'
        };
      }
      return {
        type: 'output',
        content: (
          <div>
            <div className="section-title">Current User</div>
            <div className="box">
              <div><span className="prompt-symbol">Email:</span> {user.email}</div>
              <div><span className="prompt-symbol">ID:</span> {user.id}</div>
              <div><span className="prompt-symbol">Last Sign In:</span> {new Date(user.last_sign_in_at).toLocaleString()}</div>
              <div><span className="prompt-symbol">Role:</span> <span className="name-highlight">Developer</span></div>
            </div>
          </div>
        )
      };
    },

    dev: () => {
      if (!user) {
        return {
          type: 'error',
          content: 'Access denied. Use /login to authenticate.'
        };
      }
      return {
        type: 'output',
        content: (
          <div>
            <div className="section-title">Developer Tools</div>
            <div className="box">
              <div className="name-highlight">System Status</div>
              <div style={{ paddingLeft: 12, marginTop: 6 }}>
                <div><span className="prompt-symbol">React Version:</span> {React.version}</div>
                <div><span className="prompt-symbol">Environment:</span> {process.env.NODE_ENV || 'development'}</div>
                <div><span className="prompt-symbol">User Agent:</span> {navigator.userAgent.substring(0, 50)}...</div>
                <div><span className="prompt-symbol">Commands in History:</span> {commandHistory.length}</div>
              </div>
            </div>
          </div>
        )
      };
    },

    secret: () => {
      if (!user) {
        return {
          type: 'error',
          content: 'Access denied.'
        };
      }

      const unique = new Set(commandHistory);
      const first = commandHistory[0];
      const last = commandHistory[commandHistory.length - 1];

      return {
        type: 'output',
        content: (
          <div>
            <div className="section-title">Session Analytics</div>
            <div className="box">
              <div className="name-highlight">Session Insights</div>
              <div style={{ paddingLeft: 12, marginTop: 6 }}>
                <div>
                  <span className="prompt-symbol">Total Commands:</span>{' '}
                  <span className="name-highlight">{commandHistory.length}</span>
                </div>
                {first && (
                  <div>
                    <span className="prompt-symbol">First Command:</span>{' '}
                    {first}
                  </div>
                )}
                {last && (
                  <div>
                    <span className="prompt-symbol">Last Command:</span>{' '}
                    {last}
                  </div>
                )}
                <div>
                  <span className="prompt-symbol">Approx Uptime:</span>{' '}
                  {Math.round((performance.now() - siteLoadTime) / 1000)}s
                </div>
                <div>
                  <span className="prompt-symbol">Screen:</span>{' '}
                  {window.innerWidth}×{window.innerHeight}
                </div>
              </div>

              <div className="subtle" style={{ marginTop: 16 }}>
                Data is generated locally for this session only.
              </div>
            </div>
          </div>
        )
      };
    }};
const handleSubmit = (rawInput) => {
  if (!rawInput || !rawInput.trim()) return;

  const displayInput = rawInput;
  const newHistoryEntry = { type: 'command', content: displayInput };

  if (!rawInput.startsWith('/')) {
    setHistory(prev => [...prev, newHistoryEntry, {
      type: 'error',
      content: `Invalid input: "${displayInput}". Commands must start with /. Type /help for available commands.`
    }]);
    setCommandHistory(prev => [...prev, displayInput]);
    setHistoryIndex(-1);
    setInput('');
    return;
  }

  const command = rawInput.slice(1).toLowerCase().trim();

  if (command === 'clear') {
    setHistory([]);
  } else if (commands[command]) {
    if (devCommands.includes(command) && command !== 'login' && !user) {
      setHistory(prev => [...prev, newHistoryEntry, {
        type: 'error',
        content: 'Access denied. Developer command requires authentication. Use /login to access.'
      }]);
    } else {
      const result = commands[command]();
      if (result.type === 'clear') {
        setHistory([]);
      } else {
        setHistory(prev => [...prev, newHistoryEntry, result]);
      }
    }
  } else {
    setHistory(prev => [...prev, newHistoryEntry, {
      type: 'error',
      content: `Command not found: ${displayInput}. Type /help for available commands.`
    }]);
  }

  setCommandHistory(prev => [...prev, displayInput]);
  setHistoryIndex(-1);
  setInput('');
};


  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(input);
      return;
    }

    if (e.key === 'Tab') {
      if (suggestions && suggestions.length > 0) {
        e.preventDefault();
        const top = suggestions[0];
        setInput('/' + top);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(commandHistory[nextIndex]);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      if (historyIndex === -1) {
        return;
      }
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      }
      return;
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const topSuggestion = suggestions && suggestions.length > 0 ? suggestions[0] : null;
  let ghostRemaining = '';

  if (topSuggestion && input.startsWith('/')) {
    const trimmed = input.slice(1);
    if (trimmed.toLowerCase() !== topSuggestion.toLowerCase() && trimmed.trim() !== '') {
      ghostRemaining = topSuggestion.slice(trimmed.length);
    }
  }
  const ghostPrefix = input || '';
  const ghostText = ghostRemaining ? `${ghostPrefix}${ghostRemaining}` : '';
  const handleLoginSuccess = () => {
    setShowLogin(false);
    setHistory(prev => [...prev, {
      type: 'output',
      content: (
        <div className="box">
          <div className="name-highlight">Successfully authenticated!</div>
          <div className="subtle">Developer commands are now available. Type /help to see them.</div>
        </div>
      )
    }]);
  };

  return (
    <div className="app" onClick={(e) => {
      if (!showLogin && !e.target.closest('.login-panel')) {
        inputRef.current?.focus();
      }
    }}>
      <div className="terminal" ref={terminalRef}>
        <div className="terminal-header">
          <div className="traffic">
            <span className="btn red" />
            <span className="btn yellow" />
            <span className="btn green" />
          </div>
        </div>
        <div className="content">
          <div className="site-title">Sar·thak Gup·ta</div>
          <div className="phonetic">/ˈsɑːr-thək ˈɡʊp-tə/</div>
          <div className="subtitle">noun · proper</div>
          <div className="tagline">
            <span className="name-highlight">Sarthak Gupta</span> — Thinker, Builder, Dreamer, Doer
            {user && <span style={{ color: 'var(--accent-cyan)', marginLeft: 160 }}>DEV MODE</span>}
          </div>

          <div className="history">
            {history.map((item, index) => (
              <div key={index} className="item">
                {item.type === 'command' && (
                  <div className="command-row">
                    <span className="prompt-symbol">&gt;_</span>
                    <span className="command-text">{item.content}</span>
                  </div>
                )}
                {item.type === 'output' && (
                  <div className="output">{item.content}</div>
                )}
                {item.type === 'error' && (
                  <div className="error">{item.content}</div>
                )}
              </div>
            ))}
          </div>

          {showLogin && (
            <div className="login-panel" style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <Login 
                onClose={() => setShowLogin(false)}
                onSuccess={handleLoginSuccess}
              />
            </div>
          )}

          <div className="input-row" style={{ position: 'relative' }}>
            <span className="prompt-symbol">&gt;_</span>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 36,
                top: 12,
                pointerEvents: 'none',
                whiteSpace: 'pre',
                fontFamily: 'inherit',
                fontSize: '1rem',
                color: 'rgba(200,200,200,0.45)',
                zIndex: 1,
                userSelect: 'none'
              }}
            >
              <span style={{ color: 'transparent' }}>{ghostPrefix}</span>
              {ghostRemaining ? <span>{ghostRemaining}</span> : null}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setHistoryIndex(-1);
              }}
              onKeyDown={onKeyDown}
              className="input"
              autoComplete="off"
              spellCheck="false"
              style={{ position: 'relative', zIndex: 2 }}
            />
          </div>

          {history.length === 0 && !input && (
            <div className="hint">type /help to see a list of commands</div>
          )}
        </div>
      </div>
    </div>
  );
}