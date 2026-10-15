/* ─── Site content ───────────────────────────────────────────────────────────
   Everything the page says lives here. `**text**` marks the emphasis the
   résumé bolds; it renders as a highlight. */

export const PROFILE = {
  name: 'Sarthak Gupta',
  headline: 'Dreamer. Thinker. Builder.',
  email: 'sarthakgupta1703@gmail.com',
  phone: '(813) 501-9744',
  phoneHref: 'tel:8135019744',
  linkedin: 'https://www.linkedin.com/in/sarthak-gupta17/',
  linkedinLabel: 'linkedin.com/in/sarthak-gupta17',
  github: 'https://github.com/sgupta1703',
  githubUser: 'sgupta1703',
  site: 'sarthakg.dev',
  location: 'Gainesville, FL',
  timeZone: 'America/New_York',
  resume: '/Sarthak_Gupta_Resume.pdf',
};

export const EXPERIENCE = [
  {
    id: 'qualcomm',
    shape: 'chip',
    accent: '#e3b25a',
    org: 'Qualcomm',
    role: 'AI Software Engineering Intern',
    period: 'May 2026 – Aug 2026',
    location: 'San Diego, CA',
    headline: 'On-device AI that never leaves the phone.',
    bullets: [
      'Developed an **on-device AI pipeline** for **voice and image** processing that runs entirely on **Snapdragon** chips.',
      'Enabled use cases such as extracting meeting details (date, time, location) from a voice message in any messaging app and adding the event to the user’s calendar automatically, **without data leaving the device**.',
    ],
    stack: ['On-device AI', 'Snapdragon', 'Voice', 'Vision'],
  },
  {
    id: 'lingua',
    shape: 'bubble',
    accent: '#8fb8ff',
    org: 'Lingua',
    url: 'https://linguaclassroom.com',
    urlLabel: 'linguaclassroom.com',
    role: 'Co-Founder & Lead Engineer',
    period: 'Jan 2026 – Present',
    location: 'Gainesville, FL',
    headline: 'A classroom for every language.',
    bullets: [
      'Shipped an AI-powered LMS for K-12 world language teachers (**Next.js**, **Node.js**, **PostgreSQL**), live in Florida schools with **400+ users** and **3,000+ submissions**; led **FERPA/COPPA** compliance and cleared a school’s full technology and data-privacy review.',
      'Built **Deo**, a teacher-facing AI agent running a bounded **tool-calling loop** over **20+ tools**, with confirmation before any significant action and all-or-nothing creates, cutting setup from about 25 minutes to **under 90 seconds**.',
      'Validated AI output in code before it reaches students: server checks enforce structure and vocabulary coverage, a legibility check gates handwritten work, and scores are computed from per-turn model labels.',
      'Engineered the **Canvas LMS** integration on **LTI 1.3** (OIDC login, JWT verification, nonce replay protection, AGS grade passback) and moved tenant isolation into **Postgres Row-Level Security** with **40+ policies** over a 31-table schema.',
    ],
    stats: [
      { value: 400, suffix: '+', label: 'users' },
      { value: 3000, suffix: '+', label: 'submissions' },
      { text: '25m → 90s', label: 'course setup' },
      { value: 40, suffix: '+', label: 'RLS policies' },
    ],
    stack: ['Next.js', 'Node.js', 'PostgreSQL', 'LTI 1.3', 'Canvas LMS'],
  },
  {
    id: 'fci',
    shape: 'database',
    accent: '#7ee0b0',
    org: 'Florida Community Innovation Foundation',
    orgShort: 'FCI @ UF',
    role: 'AI Software Developer',
    period: 'Oct 2025 – May 2026',
    location: 'Gainesville, FL',
    headline: 'Agents that turn the messy web into a directory.',
    bullets: [
      'Designed and deployed **LangChain**-based **agentic pipelines** (**OpenAI APIs**, Python) that autonomously extract, validate, and structure nonprofit and government service data from unstructured web sources.',
      'Built scraping and data-cleaning pipelines for **5,000+ resource listings**, improving data coverage by **35%**.',
    ],
    stats: [
      { value: 5000, suffix: '+', label: 'resource listings' },
      { value: 35, suffix: '%', label: 'more coverage' },
    ],
    stack: ['LangChain', 'OpenAI API', 'Python', 'Scraping'],
  },
  {
    id: 'edgeai',
    shape: 'wave',
    accent: '#64d2ff',
    org: 'EdgeAI Lab @ University of Florida',
    orgShort: 'EdgeAI Lab',
    role: 'Undergraduate Student Researcher',
    period: 'Aug 2026 – Present',
    location: 'Gainesville, FL',
    headline: 'Testing AI-designed radios on real hardware.',
    bullets: [
      'Researching a **hardware-in-the-loop (HIL)** extension of NVIDIA’s **AI Telco Engineer**, an LLM-agent framework that designs wireless communication protocols in **Sionna** simulation, so candidate designs are evaluated on real radio hardware.',
      'Validating that the HIL testbed performs as expected by benchmarking hardware results against simulated-channel baselines.',
    ],
    stack: ['LLM agents', 'Sionna', 'Hardware-in-the-loop', 'Wireless'],
  },
  {
    id: 'verg',
    shape: 'film',
    accent: '#ff8a65',
    org: 'Virtual Experiences Research Group @ UF',
    orgShort: 'VERG Lab',
    role: 'Undergraduate Student Researcher',
    period: 'May 2025 – Present',
    location: 'Gainesville, FL',
    headline: 'Generative video for Air Force cadet training.',
    bullets: [
      'Developing an end-to-end **AI video generation pipeline** in **ComfyUI** for the **U.S. Air Force**, producing cadet training content on sexual assault prevention.',
      'Scaled the pipeline on **HiPerGator HPC** using **multi-node Slurm** jobs and parallelized **CUDA** workflows, processing **500 GB** of raw video/image data to generate **200 training videos** with automated text, voice, and visual effects.',
      'Co-authored an oral presentation at UF’s **Digital Health Symposium** (Feb 2026): “Leveraging generative AI’s ability to adapt sexual assault prevention training for Air Force Cadets: Establishing proof of concept.”',
    ],
    stats: [
      { value: 500, suffix: ' GB', label: 'raw video & images' },
      { value: 200, label: 'training videos' },
    ],
    stack: ['ComfyUI', 'HiPerGator', 'Slurm', 'CUDA'],
  },
  {
    id: 'mil',
    shape: 'arm',
    accent: '#f5c242',
    org: 'Machine Intelligence Lab @ UF',
    orgShort: 'Machine Intelligence Lab',
    role: 'Robotics Software Engineer',
    period: 'Jan 2025 – May 2026',
    location: 'Gainesville, FL',
    headline: 'Software for an autonomous submarine.',
    bullets: [
      'Developed a C++ **Gazebo** plugin in the **ROS2 control** framework for the SubjuGator 9 submarine’s gripper, integrating JointController and JointTrajectoryController for **2-DOF** velocity and position control.',
      'Integrated a Water Linked **Doppler Velocity Log (DVL)** in C++, Python, and Bash on Linux, raising the localization update rate to **10 Hz** and cutting drift from **12 m/hr to 4 m/hr** in sea trials.',
      'Advanced SubjuGator 9 to the **RoboSub 2025 semifinals**, placing **12th of 55** international teams.',
    ],
    stats: [
      { value: 10, suffix: ' Hz', label: 'localization' },
      { text: '12 → 4', label: 'drift, m/hr' },
      { text: '12th / 55', label: 'RoboSub 2025' },
    ],
    stack: ['C++', 'ROS2', 'Gazebo', 'Python', 'Linux'],
  },
];

export const PROJECTS = [
  {
    id: 'epoch',
    name: 'Epoch',
    visual: 'timeline',
    period: '2025 – Present',
    stack: ['React', 'Node.js', 'Express', 'Supabase', 'PostgreSQL', 'Gemini 2.5 Flash'],
    desc: 'Full-stack AI history education platform with role-based middleware, Supabase auth, multi-stage inference grading, and AI-generated learning content.',
    bullets: [
      '15+ Express route modules with teacher/student middleware and PostgreSQL jsonb units, quizzes, notes, timelines, and glossaries.',
      'Classroom assistant with structured function calling, plus a multi-stage pipeline grading free-text answers at 25-point resolution.',
    ],
  },
  {
    id: 'jarvis',
    name: 'JARVIS',
    visual: 'voice',
    period: '2025 – Present',
    stack: ['Python', 'Gemini 2.5 Flash', 'Whisper', 'openWakeWord', 'Kokoro ONNX', 'PyQt6', 'Chrome MV3'],
    desc: 'Local, always-on voice assistant: a multi-threaded daemon pipeline, a bounded tool-use orchestrator over 30+ tools, and a two-tier memory system.',
    bullets: [
      'Wake word → Whisper → Gemini → Kokoro TTS, with workers for Gmail push, notifications, screen watching, and a Chrome MV3 bridge.',
      'Two-stage confirmation for destructive operations and a direct-route fast path that bypasses the LLM.',
    ],
  },
  {
    id: 'dreammaker',
    name: 'DreamMaker',
    visual: 'frames',
    period: 'Mar – Apr 2026',
    award: '1st Place',
    stack: ['Python', 'OpenClaw', 'LangChain', 'Prompt engineering'],
    desc: '1st place at the Vobile Innovation Challenge × IGNITE: a multi-stage prompt-chaining pipeline that generates coherent two-minute AI video for Vobile’s DreamMaker platform.',
    bullets: [
      'Generates, evaluates, and refines creative concepts, held consistent with JSON-mode schemas and few-shot exemplars.',
      'Sliding-window visual grounding: 5-second segments, each re-anchored on the previous clip’s keyframe to stop cross-segment hallucination.',
    ],
  },
  {
    id: 'audionomous',
    name: 'Audionomous',
    visual: 'face',
    period: 'Oct – Nov 2025',
    stack: ['Python', 'OpenCV', 'MediaPipe', 'PyCAW', 'Arduino'],
    desc: 'Real-time vision-to-audio system that adjusts headphone volume from facial motion cues at 30 FPS, with ~95% detection stability under 200 ms latency.',
    bullets: [
      'MediaPipe FaceMesh (468 landmarks) with EMA temporal filtering.',
      'Serial pipeline with framing and checksum validation; multi-threaded PyCAW volume ramping.',
    ],
  },
  {
    id: 'playcast',
    name: 'PlayCast',
    visual: 'reel',
    period: 'Sep – Dec 2025',
    stack: ['React Native', 'Node.js', 'FFmpeg', 'Gemini API', 'Firebase'],
    desc: 'Cross-platform app delivering TikTok-style highlight reels from live sports, using SportsRadar timestamps and Gemini to score clips automatically.',
    bullets: [
      'Live-to-highlight FFmpeg pipeline with automated clip trimming.',
      'REST backend with range-enabled media streaming; Firestore for personalization.',
    ],
  },
  {
    id: 'faro',
    name: 'Faro',
    visual: 'route',
    period: 'Jan 2026',
    stack: ['React', 'Node.js', 'Express', 'Cohere', 'Yelp API', 'Leaflet', 'OSRM'],
    desc: 'Itinerary engine that turns a natural-language mood into a structured, map-rendered local plan with live routing and resilient multi-API orchestration.',
    bullets: [
      'Semantic tag generation and AI itinerary synthesis with structured JSON validation.',
      'Leaflet map with OSRM polyline routing and lifecycle-safe reflows.',
    ],
  },
  {
    id: 'one',
    name: 'One',
    visual: 'checks',
    period: 'Feb 2026',
    stack: ['React Native', 'Expo', 'TypeScript', 'Node.js', 'Cohere'],
    desc: 'Self-development app with category-based daily tasks and a conversational AI coach, backed by a Cohere-powered Node/Express API.',
    bullets: [
      'Category task feed with search and rapid task injection.',
      'AI coach with contextual guidance and session continuity.',
    ],
  },
];

export const AWARDS = [
  {
    title: '1st Place',
    event: 'Vobile Innovation Challenge × IGNITE',
    date: 'Apr 2026',
    note: 'DreamMaker: prompt-chained, keyframe-grounded AI video.',
  },
  {
    title: 'Regional Winner',
    event: 'ITServe Synergy Startup Cube Pitch Competition',
    date: '2026',
    note: 'Pitched Lingua.',
  },
  {
    title: 'Semifinalist · 12th of 55',
    event: 'RoboSub 2025',
    date: '2025',
    note: 'SubjuGator 9 with UF’s Machine Intelligence Lab.',
  },
  {
    title: 'Oral presentation',
    event: 'UF Digital Health Symposium',
    date: 'Feb 2026',
    note: 'Co-author: generative AI for Air Force cadet training.',
  },
];

export const CERTS = [
  { name: 'AWS Certified AI Practitioner', provider: 'Amazon Web Services' },
  { name: 'Fundamentals of Deep Learning', provider: 'NVIDIA DLI' },
  { name: 'Building Transformer-Based NLP Applications', provider: 'NVIDIA DLI' },
];

export const SKILLS = [
  { group: 'Languages', items: ['Python', 'C++', 'TypeScript', 'JavaScript', 'Java', 'SQL', 'Bash'] },
  { group: 'AI / ML', items: ['PyTorch', 'TensorFlow', 'LangChain', 'OpenAI API', 'CUDA', 'ComfyUI', 'OpenCV'] },
  { group: 'Systems & Robotics', items: ['Linux', 'Slurm (HPC)', 'ROS2', 'Gazebo', 'NVIDIA Isaac Sim', 'Git'] },
  { group: 'Web & Data', items: ['Next.js', 'React', 'React Native', 'Node.js', 'Express.js', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Firebase'] },
];
