import { useCallback, useEffect, useRef, useState } from 'react';
import { motion as Motion, useScroll, useTransform } from 'framer-motion';
import { useSite } from '../context';
import { PROFILE } from '../data';
import { toast } from '../actions';

/* pdf.js loads only when the viewer approaches the viewport. */
let pdfjsPromise = null;
function loadPdfjs() {
  pdfjsPromise ||= Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  });
  return pdfjsPromise;
}

const ZOOMS = [0.75, 1, 1.25, 1.5, 2];
const LOUPE = 180;        // lens diameter, css px
const MAGNIFY = 2.4;      // lens magnification
const FILE = PROFILE.resume.split('/').pop();

export default function ResumeViewer() {
  const { reducedMotion, wide } = useSite();
  const stageRef = useRef(null);
  const scrollRef = useRef(null);
  const canvasRef = useRef(null);
  const textRef = useRef(null);
  const lensRef = useRef(null);
  const hiResRef = useRef(null);
  const libRef = useRef(null);
  const pageRef = useRef(null);
  const taskRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [pages, setPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [links, setLinks] = useState([]);
  const [loupeOn, setLoupeOn] = useState(false);

  // A lifted sheet comes forward and up, settling before its toolbar reaches the nav.
  // Follow scroll directly so scrubbing backwards reverses the same movement.
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start 0.95', 'start 0.16'] });
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [-20, -8, 0]);
  const rotateZ = useTransform(scrollYProgress, [0, 0.5, 1], [-2, -0.7, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.87, 0.95, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [170, 65, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 1], [0.35, 1, 1]);

  // Load the document when the viewer gets close.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    let cancelled = false;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setStatus('loading');
      try {
        const lib = await loadPdfjs();
        const doc = await lib.getDocument(PROFILE.resume).promise;
        const page = await doc.getPage(1);
        if (cancelled) return;
        libRef.current = lib;
        pageRef.current = page;
        setPages(doc.numPages);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, []);

  // Fit width follows the container.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setFitWidth(Math.min(880, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const render = useCallback(async () => {
    const page = pageRef.current;
    const lib = libRef.current;
    const canvas = canvasRef.current;
    const textEl = textRef.current;
    const width = fitWidth || Math.min(880, scrollRef.current?.clientWidth || 0);
    if (!page || !lib || !canvas || !textEl || !width) return;
    const base = page.getViewport({ scale: 1 });
    const cssW = Math.round(width * zoom);
    const viewport = page.getViewport({ scale: cssW / base.width });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    setDims({ w: viewport.width, h: viewport.height });

    taskRef.current?.cancel();
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    const task = page.render({
      canvas,
      canvasContext: canvas.getContext('2d'),
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
    });
    taskRef.current = task;
    try { await task.promise; } catch { return; }

    // Selectable text over the canvas.
    textEl.replaceChildren();
    textEl.style.setProperty('--total-scale-factor', String(viewport.scale));
    textEl.style.setProperty('--scale-factor', String(viewport.scale));
    await new lib.TextLayer({ textContentSource: page.streamTextContent(), container: textEl, viewport }).render();

    // Clickable links from the PDF's own annotations.
    const annots = await page.getAnnotations();
    setLinks(annots.filter((a) => a.subtype === 'Link' && a.url).map((a) => {
      const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(a.rect);
      return { url: a.url, left: Math.min(x1, x2), top: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
    }));

  }, [fitWidth, zoom]);

  useEffect(() => {
    if (status !== 'ready') return undefined;
    const t = setTimeout(render, 60);
    return () => clearTimeout(t);
  }, [status, render]);

  // Build the extra, large PDF canvas only when magnification is requested.
  // It never competes with the entrance animation when the loupe is off.
  useEffect(() => {
    const page = pageRef.current;
    if (!loupeOn || !wide || status !== 'ready' || !page || !fitWidth) return undefined;
    let cancelled = false;
    const lens = lensRef.current;
    const hi = document.createElement('canvas');
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.round(fitWidth * zoom) / base.width * MAGNIFY });
    hi.width = Math.floor(viewport.width);
    hi.height = Math.floor(viewport.height);
    const task = page.render({ canvas: hi, canvasContext: hi.getContext('2d'), viewport });
    task.promise.then(() => { if (!cancelled) hiResRef.current = hi; }).catch(() => {});
    return () => {
      cancelled = true;
      task.cancel();
      hiResRef.current = null;
      lens?.classList.remove('is-on');
    };
  }, [status, loupeOn, wide, fitWidth, zoom]);

  const onMove = (e) => {
    if (!loupeOn || !wide || !hiResRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const yy = e.clientY - r.top;
    const lensCanvas = lensRef.current;
    if (!lensCanvas) return;
    lensCanvas.style.left = `${x}px`;
    lensCanvas.style.top = `${yy}px`;
    lensCanvas.classList.add('is-on');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (lensCanvas.width !== LOUPE * dpr) {
      lensCanvas.width = LOUPE * dpr;
      lensCanvas.height = LOUPE * dpr;
    }
    const ctx = lensCanvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, lensCanvas.width, lensCanvas.height);
    ctx.drawImage(hiResRef.current, x * MAGNIFY - LOUPE / 2, yy * MAGNIFY - LOUPE / 2, LOUPE, LOUPE, 0, 0, lensCanvas.width, lensCanvas.height);
  };

  const zi = ZOOMS.indexOf(zoom);
  const setZoomStep = (d) => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, zi + d))]);
  const ratio = dims.w ? dims.h / dims.w : 11 / 8.5;
  const sheetW = dims.w || fitWidth;
  const sheetH = dims.w ? dims.h : fitWidth * ratio;

  return (
    <div className="viewer" ref={stageRef}>
      <Motion.div className="viewer-stage" style={reducedMotion ? undefined : { rotateX, rotateZ, scale, y, opacity, transformPerspective: 1600 }}>
        <div className="viewer-bar">
          <div className="viewer-file">
            <span className="viewer-badge" aria-hidden="true">PDF</span>
            <div>
              <p className="viewer-name">{FILE}</p>
              <p className="viewer-sub">{pages} page · rendered live from the source file</p>
            </div>
          </div>
          <div className="viewer-tools" role="toolbar" aria-label="Résumé viewer">
            <div className="viewer-zoom">
              <button className="viewer-btn" onClick={() => setZoomStep(-1)} disabled={zi <= 0} aria-label="Zoom out">−</button>
              <button className="viewer-pct" onClick={() => setZoom(1)} aria-label="Fit to width">{Math.round(zoom * 100)}%</button>
              <button className="viewer-btn" onClick={() => setZoomStep(1)} disabled={zi >= ZOOMS.length - 1} aria-label="Zoom in">+</button>
            </div>
            {wide && (
              <button className={`viewer-btn viewer-toggle ${loupeOn ? 'is-on' : ''}`} onClick={() => setLoupeOn((v) => !v)} aria-pressed={loupeOn} title="Magnifier">
                <span aria-hidden="true">⌕</span><span className="viewer-btn-label">Loupe</span>
              </button>
            )}
            <a className="viewer-btn" href={PROFILE.resume} target="_blank" rel="noopener noreferrer" title="Open in a new tab">
              <span aria-hidden="true">↗</span><span className="viewer-btn-label">Open</span>
            </a>
            <a className="viewer-btn viewer-primary" href={PROFILE.resume} download="Sarthak_Gupta_Resume.pdf" onClick={() => toast('Downloading résumé (PDF)')}>
              <span aria-hidden="true">↓</span><span className="viewer-btn-label">Download</span>
            </a>
          </div>
        </div>

        <div className="viewer-scroll" ref={scrollRef} data-lenis-prevent={zoom > 1 ? '' : undefined}>
          <div
            className={`viewer-page ${loupeOn && wide ? 'has-loupe' : ''}`}
            style={{ width: sheetW || '100%', height: sheetH || undefined }}
            onPointerMove={onMove}
            onPointerLeave={() => lensRef.current?.classList.remove('is-on')}
          >
            <canvas ref={canvasRef} className="viewer-canvas" style={{ width: sheetW, height: sheetH }} aria-label="Résumé of Sarthak Gupta" role="img" />
            <div ref={textRef} className="textLayer" />
            {links.map((l) => (
              <a
                key={`${l.url}-${l.left}-${l.top}`}
                className="viewer-link"
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ left: l.left, top: l.top, width: l.width, height: l.height }}
                aria-label={l.url.replace(/^mailto:/, '')}
              />
            ))}
            {status !== 'ready' && (
              <div className="viewer-skeleton">
                {status === 'error' ? (
                  <p>Couldn’t render the PDF here. <a href={PROFILE.resume} target="_blank" rel="noopener noreferrer">Open it directly</a>.</p>
                ) : (
                  Array.from({ length: 14 }).map((_, i) => <span key={i} style={{ width: `${[60, 90, 70, 95, 80, 40][i % 6]}%` }} />)
                )}
              </div>
            )}
            <canvas ref={lensRef} className="viewer-lens" aria-hidden="true" />
          </div>
        </div>
      </Motion.div>
    </div>
  );
}
