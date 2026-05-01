import { useEffect, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import './ScrollSequence.css';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const PRELOAD_CONCURRENCY = 6;

export default function ScrollSequence({
  frames,
  progress,
  className = '',
  style,
}) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const readyRef = useRef([]);
  const lastIdxRef = useRef(0);
  const targetIdxRef = useRef(0);
  const drawnIdxRef = useRef(null);
  const drawRef = useRef(null);

  useEffect(() => {
    const imgs = new Array(frames.length);
    const ready = new Array(frames.length).fill(false);

    imagesRef.current = imgs;
    readyRef.current = ready;
    lastIdxRef.current = 0;
    targetIdxRef.current = 0;
    drawnIdxRef.current = null;

    let cancelled = false;
    let inFlight = 0;

    const pickNext = () => {
      const target = targetIdxRef.current;
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let k = 0; k < frames.length; k += 1) {
        if (imgs[k] !== undefined) continue;
        const dist = Math.abs(k - target);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = k;
        }
      }
      return bestIdx;
    };

    const pump = () => {
      while (!cancelled && inFlight < PRELOAD_CONCURRENCY) {
        const i = pickNext();
        if (i < 0) return;
        inFlight += 1;
        const img = new Image();
        img.decoding = 'async';
        imgs[i] = img;
        img.src = frames[i];
        img.decode()
          .then(() => {
            if (cancelled) return;
            ready[i] = true;
            if (i === lastIdxRef.current) drawRef.current?.(i);
          })
          .catch(() => {})
          .finally(() => {
            inFlight -= 1;
            if (!cancelled) pump();
          });
      }
    };

    pump();

    return () => {
      cancelled = true;
      imgs.forEach((img) => { if (img) img.src = ''; });
      imagesRef.current = [];
      readyRef.current = [];
    };
  }, [frames]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frames.length) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const draw = (idx) => {
      const img = imagesRef.current[idx];
      if (!readyRef.current[idx] || !img?.naturalWidth) return;

      const { width: cw, height: ch } = canvas;
      const { naturalWidth: iw, naturalHeight: ih } = img;
      const scale = Math.max(cw / iw, ch / ih);

      ctx.drawImage(
        img,
        (cw - iw * scale) / 2,
        (ch - ih * scale) / 2,
        iw * scale,
        ih * scale
      );
      drawnIdxRef.current = idx;
    };

    drawRef.current = draw;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      draw(lastIdxRef.current);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return () => {
      drawRef.current = null;
      ro.disconnect();
    };
  }, [frames]);

  useMotionValueEvent(progress, 'change', (latest) => {
    if (!frames.length) return;

    const idx = Math.min(
      frames.length - 1,
      Math.round(clamp01(latest) * (frames.length - 1))
    );
    targetIdxRef.current = idx;

    if (idx === lastIdxRef.current) return;

    lastIdxRef.current = idx;
    if (readyRef.current[idx]) {
      drawRef.current?.(idx);
      return;
    }

    for (let j = idx - 1; j >= 0; j -= 1) {
      if (readyRef.current[j]) {
        drawRef.current?.(j);
        return;
      }
    }
  });

  return (
    <div className={`scroll-seq ${className}`} style={style}>
      <canvas ref={canvasRef} className="scroll-seq__canvas" />
    </div>
  );
}
