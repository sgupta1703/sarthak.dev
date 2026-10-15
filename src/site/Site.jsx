import { Suspense, lazy, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { SiteProvider } from './SiteContext';
import { useSite, useTheme } from './context';
import ThemeProvider from './ThemeProvider';
import { SECTIONS } from './sectionConfig';
import { EXPERIENCE } from './data';
import { PRODUCT_ASPECT } from './morph/productFrame';
import {
  textShape, imageShape, chipShape, databaseShape, waveShape,
  filmShape, armShape, ballShape, galaxyShape,
} from './morph/shapes';
import { Nav, Rail } from './Chrome';
import CommandPalette from './components/CommandPalette';
import { Toaster } from './components/Widgets';
import { Hero, About, Role, Projects, Stage, Skills, Court, Resume, Contact } from './Sections';
import './site.css';
import './components.css';
import './details.css';
import './themes.css';

const MorphCloud = lazy(() => import('./morph/MorphCloud'));

/* Images and objects share the same particle slots and scroll timeline. */
function useShapes(wide) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const count = wide ? 6500 : 2800;
    const fonts = document.fonts?.load ? document.fonts.load('700 220px Geist') : Promise.resolve();
    Promise.all([
      Promise.race([fonts, new Promise((r) => setTimeout(r, 1800))]),
      imageShape('/image.jpeg', { count, imageId: 'about', aspect: 4 / 5, portrait: true }).catch(() => null),
      imageShape('/lingua-preview.jpg', { count, imageId: 'lingua', aspect: PRODUCT_ASPECT, frame: true }).catch(() => null),
    ]).then(([, portrait, product]) => {
      if (cancelled) return;
      const galaxy = galaxyShape({ count });
      const lib = {
        name: textShape(wide ? ['SARTHAK GUPTA'] : ['SARTHAK', 'GUPTA'], { count, worldWidth: wide ? 12 : 7.4 }),
        hello: textShape(['SAY HI'], { count, worldWidth: 7 }),
        portrait: portrait || { ...galaxy, opacity: 0 },
        chip: chipShape({ count }),
        product: product || { ...galaxy, opacity: 0 },
        database: databaseShape({ count }),
        wave: waveShape({ count }),
        film: filmShape({ count }),
        arm: armShape({ count }),
        ball: ballShape({ count }),
        galaxy,
        galaxyDim: { ...galaxy, opacity: 0.34 },
      };
      const publish = () => setState({ count, shapes: SECTIONS.map((s) => ({ ...lib[s.shape], side: s.side || 'right' })) });
      publish();
    });
    return () => { cancelled = true; };
  }, [wide]);
  return state;
}

function Scene() {
  const { wide, reducedMotion, indexRef, scrollRef, centersRef, pointerRef, imageAnchorsRef } = useSite();
  const { theme } = useTheme();
  const built = useShapes(wide);
  return (
    <>
      <div className="stage-glow" aria-hidden="true" />
      {built && (
        <Suspense fallback={null}>
          <MorphCloud
            key={built.count} shapes={built.shapes}
            indexRef={indexRef}
            scrollRef={scrollRef}
            centersRef={centersRef}
            pointerRef={pointerRef}
            imageAnchorsRef={imageAnchorsRef}
            palette={theme.colors}
            wide={wide}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      )}
      <Nav />
      <Rail />
      <CommandPalette />
      <Toaster />
      <main className="site-main">
        <Hero />
        <About />
        {EXPERIENCE.map((e, k) => <Role key={e.id} exp={e} n={k + 1} />)}
        <Projects />
        <Stage />
        <Skills />
        <Court />
        <Resume />
        <Contact />
      </main>
    </>
  );
}

export default function Site({ lenis }) {
  useEffect(() => {
    document.documentElement.classList.add('site-root');
    return () => document.documentElement.classList.remove('site-root');
  }, []);
  return (
    <ThemeProvider><SiteProvider lenis={lenis} sections={SECTIONS}>
      <MotionConfig reducedMotion="user"><Scene /></MotionConfig>
    </SiteProvider></ThemeProvider>
  );
}
