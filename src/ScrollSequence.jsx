import { useEffect, useRef } from 'react';
import { cancelFrame, frame } from 'framer-motion';
import './ScrollSequence.css';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const FETCH_CONCURRENCY = 6;
const DECODE_CONCURRENCY = 3;
// A decoded 1600×900 frame is ~5.8 MB, so only a short window around the
// playhead stays decoded. The compressed files (~35 KB each) are all kept.
const AHEAD = 10;
const BEHIND = 4;

export default function ScrollSequence({
  frames,
  progress,
  className = '',
  style,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!ctx || !frames.length) return undefined;

    const count = frames.length;
    const last = count - 1;
    const blobs = new Array(count);
    const requested = new Array(count).fill(false);
    const bitmaps = new Map();
    const decoding = new Set();
    const controller = new AbortController();
    let position = clamp01(progress.get()) * last;
    let direction = 1;
    let fetching = 0;
    let disposed = false;
    let source = null;
    let painted = '';
    let pending = false;

    const windowRange = () => [
      Math.max(0, Math.floor(position) - (direction > 0 ? BEHIND : AHEAD)),
      Math.min(last, Math.ceil(position) + (direction > 0 ? AHEAD : BEHIND)),
    ];

    // Cover-fit; the backing store never holds more pixels than the source.
    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      let ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (source) ratio = Math.max(0.5, Math.min(ratio, 1 / Math.max(width / source.width, height / source.height)));
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      painted = '';
      draw();
    };

    const paint = (bitmap, alpha) => {
      const { width: cw, height: ch } = canvas;
      const scale = Math.max(cw / bitmap.width, ch / bitmap.height);
      const w = bitmap.width * scale;
      const h = bitmap.height * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(bitmap, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    // Blend the two frames around the playhead so motion is continuous
    // between frames; fall back to the nearest decoded frame while loading.
    function draw() {
      const base = Math.floor(position);
      const mix = Math.round((position - base) * 64) / 64;
      const a = bitmaps.get(base);
      const b = mix > 0 ? bitmaps.get(Math.min(last, base + 1)) : null;
      if (a && (b || mix === 0)) {
        const key = `${base}:${mix}`;
        if (key === painted) return;
        paint(a, 1);
        if (b) paint(b, mix);
        painted = key;
        return;
      }
      let nearest = null;
      let best = Infinity;
      for (const [index, bitmap] of bitmaps) {
        const d = Math.abs(index - position);
        if (d < best) { best = d; nearest = [index, bitmap]; }
      }
      if (!nearest || painted === `~${nearest[0]}`) return;
      paint(nearest[1], 1);
      painted = `~${nearest[0]}`;
    }

    const flush = () => { pending = false; draw(); };
    const requestDraw = () => {
      if (pending || disposed) return;
      pending = true;
      frame.render(flush);
    };

    const decode = () => {
      const [lo, hi] = windowRange();
      for (const [index, bitmap] of bitmaps) {
        if (index < lo - 2 || index > hi + 2) { bitmap.close(); bitmaps.delete(index); }
      }
      // Nearest first, so the frames on screen decode before the lookahead.
      const order = [];
      for (let i = lo; i <= hi; i += 1) if (blobs[i] && !bitmaps.has(i) && !decoding.has(i)) order.push(i);
      order.sort((x, y) => Math.abs(x - position) - Math.abs(y - position));
      for (const i of order) {
        if (decoding.size >= DECODE_CONCURRENCY) break;
        decoding.add(i);
        createImageBitmap(blobs[i])
          .then((bitmap) => {
            decoding.delete(i);
            const [from, to] = windowRange();
            if (disposed || i < from - 2 || i > to + 2) { bitmap.close(); return; }
            bitmaps.set(i, bitmap);
            if (!source) { source = { width: bitmap.width, height: bitmap.height }; resize(); }
            if (Math.abs(i - position) < 1.5 || painted.startsWith('~')) requestDraw();
            decode();
          })
          .catch(() => { decoding.delete(i); });
      }
    };

    const fetchNext = () => {
      while (!disposed && fetching < FETCH_CONCURRENCY) {
        let next = -1;
        let best = Infinity;
        for (let i = 0; i < count; i += 1) {
          if (requested[i]) continue;
          // Prefer frames in the direction of travel.
          const d = Math.abs(i - position) + ((i - position) * direction < 0 ? 6 : 0);
          if (d < best) { best = d; next = i; }
        }
        if (next < 0) return;
        requested[next] = true;
        fetching += 1;
        const index = next;
        fetch(frames[index], { signal: controller.signal })
          .then((res) => (res.ok ? res.blob() : null))
          .then((blob) => {
            if (!blob || disposed) return;
            blobs[index] = blob;
            const [lo, hi] = windowRange();
            if (index >= lo && index <= hi) decode();
          })
          .catch(() => {})
          .finally(() => {
            fetching -= 1;
            fetchNext();
          });
      }
    };

    let base = Math.floor(position);
    const unsubscribe = progress.on('change', (latest) => {
      const next = clamp01(latest) * last;
      if (next === position) return;
      direction = next > position ? 1 : -1;
      position = next;
      requestDraw();
      if (Math.floor(next) !== base) {
        base = Math.floor(next);
        decode();
      }
    });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    fetchNext();

    return () => {
      disposed = true;
      unsubscribe();
      cancelFrame(flush);
      ro.disconnect();
      controller.abort();
      bitmaps.forEach((bitmap) => bitmap.close());
      bitmaps.clear();
    };
  }, [frames, progress]);

  return (
    <div className={`scroll-seq ${className}`} style={style}>
      <canvas ref={canvasRef} className="scroll-seq__canvas" />
    </div>
  );
}
