/* ─── Point-cloud shapes ─────────────────────────────────────────────────────
   Every shape resolves to exactly `count` points so any two can be blended
   index by index. Objects are built in their natural orientation (y up);
   tilt, spin, scale and placement happen in the vertex shader.

   Shape fields:
     kind     'text' (centered), 'object' (beside the copy), 'ambient' (backdrop)
     size     rough world-space diameter, used to fit the viewport
     spin     0 still, 1 turntable, 2 sway (amplitude `sway`)
     tilt     rotation toward the viewer around x, in radians
     ripple   1 animates a radial wave in y
     opacity  overall alpha multiplier
     flow     per-point wire position (trace id + 0..1 along it), -1 off-wire;
              the shader runs light pulses along it */

import { framedProduct, PRODUCT_FRAME, traceProductFrame } from './productFrame';

const TAU = Math.PI * 2;
const FONT = '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

function rgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

class Builder {
  constructor() { this.p = []; this.c = []; this.f = []; this.m = []; }
  add(x, y, z, c, flow = -1, part = 0) { this.p.push(x, y, z); this.c.push(c[0], c[1], c[2]); this.f.push(flow); this.m.push(part); }
  get size() { return this.p.length / 3; }
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Resample to exactly `count`, in random order so morphs cross-fly.
function finalize(b, count, meta) {
  const src = b.size;
  let pick;
  if (src >= count) pick = shuffle(Array.from({ length: src }, (_, i) => i)).slice(0, count);
  else pick = shuffle(Array.from({ length: count }, (_, i) => (i < src ? i : Math.floor(Math.random() * src))));
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const flow = new Float32Array(count);
  const parts = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    flow[i] = b.f[pick[i]];
    parts[i] = b.m[pick[i]];
    const s = pick[i] * 3;
    // duplicates get a hair of jitter so they don't stack exactly
    const j = i >= src && meta.kind !== 'image' ? 0.012 : 0;
    positions[i * 3] = b.p[s] + (Math.random() - 0.5) * j;
    positions[i * 3 + 1] = b.p[s + 1] + (Math.random() - 0.5) * j;
    positions[i * 3 + 2] = b.p[s + 2] + (Math.random() - 0.5) * j;
    colors[i * 3] = b.c[s];
    colors[i * 3 + 1] = b.c[s + 1];
    colors[i * 3 + 2] = b.c[s + 2];
  }
  return { positions, colors, flow, parts, motion: 0, spin: 0, sway: 0.55, tilt: 0, ripple: 0, opacity: 1, ...meta };
}

/* Draw onto a 2D canvas, then turn lit pixels into points. Red marks the
   primary color, green the secondary. */
function sampleCanvas(draw, { width, height, worldWidth, depth, step, primary, secondary, shade }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx);
  const data = ctx.getImageData(0, 0, width, height).data;
  const scale = worldWidth / width;
  const b = new Builder();
  const a = rgb(primary);
  const c = rgb(secondary || primary);
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      if (data[i] < 128 && data[i + 1] < 128) continue;
      const base = data[i + 1] >= 128 ? c : a;
      b.add(
        (x + (Math.random() - 0.5) * step - width / 2) * scale,
        -(y + (Math.random() - 0.5) * step - height / 2) * scale,
        (Math.random() - 0.5) * depth,
        shade ? shade(base, x / width, y / height) : base,
      );
    }
  }
  return b;
}

/* ─── Text ─────────────────────────────────────────────────────────────────── */
export function textShape(lines, { count, worldWidth = 12, weight = 700 }) {
  const fontSize = 220;
  const lineHeight = fontSize * 1.0;
  const font = `${weight} ${fontSize}px ${FONT}`;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const textWidth = Math.max(...lines.map((l) => probe.measureText(l).width));
  const width = Math.ceil(textWidth + 40);
  const height = Math.ceil(lineHeight * lines.length + 60);
  const top = rgb('#ffffff');
  const bottom = rgb('#b9c6ff');
  const b = sampleCanvas(
    (ctx) => {
      ctx.font = font;
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '-6px';
      lines.forEach((l, i) => ctx.fillText(l, width / 2, height / 2 + (i - (lines.length - 1) / 2) * lineHeight));
    },
    {
      width, height, worldWidth, depth: 0.14, step: 3, primary: '#ffffff',
      shade: (_, __, v) => mixRgb(top, bottom, Math.min(1, Math.max(0, (v - 0.2) * 1.1)) * 0.55),
    },
  );
  return finalize(b, count, { kind: 'text', size: worldWidth });
}

/* A photo is a real destination in the shared morph, with source-pixel
   colors and a normalized image plane. Its DOM anchor supplies its position. */
export function imageShape(src, { count, imageId, aspect, portrait = false, frame = false }) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      try {
        const columns = Math.ceil(Math.sqrt(count * aspect));
        const rows = Math.ceil(columns / aspect);
        const canvas = document.createElement('canvas');
        canvas.width = columns;
        canvas.height = rows;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const source = frame ? framedProduct(image) : image;
        const fit = Math.max(columns / source.width, rows / source.height);
        const cropWidth = columns / fit;
        const cropHeight = rows / fit;
        context.drawImage(source, (source.width - cropWidth) / 2, (source.height - cropHeight) * 0.25, cropWidth, cropHeight, 0, 0, columns, rows);
        const pixels = context.getImageData(0, 0, columns, rows).data;
        const builder = new Builder();
        for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
          const x = (column + 0.5) / columns;
          const y = (row + 0.5) / rows;
          // Match the portrait's arched frame, so assembled dots share its edge.
          if (portrait && y < 0.38 && ((x - 0.5) / 0.5) ** 2 + ((y - 0.38) / 0.38) ** 2 > 1) continue;
          const offset = (row * columns + column) * 4;
          if (pixels[offset + 3] < 32) continue;
          // Negative parts identify frame colors. The GPU recolors them live
          // without rebuilding the screenshot or changing any particle slots.
          let part = 0;
          if (frame) {
            const luminance = (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / (3 * 255);
            const frameY = y * PRODUCT_FRAME.height;
            if (frameY < PRODUCT_FRAME.bar) part = luminance < 0.5 ? -6 : luminance < 0.85 ? -3 : -1;
            if (frameY > PRODUCT_FRAME.bar + PRODUCT_FRAME.image) part = luminance < 0.3 ? -4 : luminance < 0.6 ? -5 : luminance < 0.85 ? -3 : -2;
          }
          builder.add(x - 0.5, (0.5 - y) / aspect, 0,
            [pixels[offset] / 255, pixels[offset + 1] / 255, pixels[offset + 2] / 255], -1, part);
        }
        if (frame) traceProductFrame((x, y, color) => {
          builder.add(x / source.width - 0.5, (0.5 - y / source.height) / aspect, 0, rgb(color), -1, -3);
        }, source.width / columns);
        resolve(finalize(builder, count, { kind: 'image', imageId, size: 1, aspect, spacing: 1 / columns }));
      } catch (error) { reject(error); }
    };
    image.onerror = reject;
    image.src = src;
  });
}

/* ─── Self-portrait from a photo (async) ─────────────────────────────────────
   The dots trace the subject's silhouette; once they settle, the renderer
   dissolves them into the photograph itself (see PhotoPlane). */
export const PORTRAIT_HEIGHT = 6.2;

export function portraitShape(src, { count }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const W = 240;
      const H = Math.round((W * img.height) / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, W, H).data;
      // Background color: average of the two top corners.
      const corner = (x0, y0) => {
        let r = 0, g = 0, bl = 0, n = 0;
        for (let y = y0; y < y0 + 12; y++) for (let x = x0; x < x0 + 12; x++) {
          const i = (y * W + x) * 4; r += data[i]; g += data[i + 1]; bl += data[i + 2]; n++;
        }
        return [r / n, g / n, bl / n];
      };
      const c1 = corner(2, 2);
      const c2 = corner(W - 14, 2);
      const bg = [(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2, (c1[2] + c2[2]) / 2];
      const b = new Builder();
      const worldH = PORTRAIT_HEIGHT;
      const s = worldH / H;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (y > H * 0.9 || (x > W * 0.86 && y > H * 0.86)) continue; // feathered bottom edge and watermark
          const i = (y * W + x) * 4;
          const r = data[i], g = data[i + 1], bl = data[i + 2];
          const dist = Math.hypot(r - bg[0], g - bg[1], bl - bg[2]);
          if (dist < 34) continue;
          const lum = (0.299 * r + 0.587 * g + 0.114 * bl) / 255;
          const nx = (x - W / 2) / (W / 2);
          const bulge = Math.sqrt(Math.max(0, 1 - nx * nx)) * 0.45;
          const col = [0.16 + (r / 255) * 0.9, 0.16 + (g / 255) * 0.9, 0.18 + (bl / 255) * 0.9];
          b.add(
            (x + Math.random() - 0.5 - W / 2) * s,
            -(y + Math.random() - 0.5 - H / 2) * s,
            bulge + (lum - 0.45) * 0.3 + (Math.random() - 0.5) * 0.04,
            col,
          );
        }
      }
      resolve(finalize(b, count, {
        kind: 'object', size: 6.4, spin: 2, sway: 0.16,
        photo: { src, aspect: img.width / img.height, height: worldH, bg: bg.map((v) => v / 255) },
      }));
    };
    img.onerror = reject;
    img.src = src;
  });
}

/* ─── SoC on a circuit board (Qualcomm) ────────────────────────────────────
   Traces leave every pin with Manhattan routing and end in a via. Each trace
   point carries its position along the wire so pulses can run outward. */
export function chipShape({ count }) {
  const b = new Builder();
  const pkg = rgb('#59616e');
  const edge = rgb('#3f454f');
  const die = rgb('#eef2f8');
  const pin = rgb('#e3b25a');
  const copper = rgb('#a77a33');
  const via = rgb('#f2d08a');
  const H = 1.05;
  const D = 0.55;
  for (let i = 0; i < 1500; i++) b.add((Math.random() * 2 - 1) * H, 0.13, (Math.random() * 2 - 1) * H, pkg);
  for (let i = 0; i < 420; i++) {
    const t = (Math.random() * 2 - 1) * H;
    const side = [[t, H], [t, -H], [H, t], [-H, t]][Math.floor(Math.random() * 4)];
    b.add(side[0], (Math.random() * 2 - 1) * 0.13, side[1], edge);
  }
  for (let i = 0; i < 900; i++) b.add((Math.random() * 2 - 1) * D, 0.2, (Math.random() * 2 - 1) * D, die);
  for (let i = 0; i < 420; i++) {
    const t = (Math.random() * 2 - 1) * D;
    const side = [[t, D], [t, -D], [D, t], [-D, t]][Math.floor(Math.random() * 4)];
    b.add(side[0], 0.22, side[1], die);
  }
  for (let g = -1; g <= 1; g++) {
    for (let i = 0; i < 50; i++) {
      const t = (Math.random() * 2 - 1) * D;
      b.add(g * 0.28, 0.23, t, die);
      b.add(t, 0.23, g * 0.28, die);
    }
  }

  // Pins and their traces; one routing per side, rotated into place.
  const pins = 8;
  const rot = (side, a, o) => [[a, o], [-o, a], [-a, -o], [o, -a]][side]; // (along, out) → (x, z)
  let traceId = 0;
  for (let side = 0; side < 4; side++) {
    for (let p = 0; p < pins; p++) {
      const along = -H + 0.2 + (p * (2 * H - 0.4)) / (pins - 1);
      for (let i = 0; i < 18; i++) {
        const [x, z] = rot(side, along + (Math.random() - 0.5) * 0.08, H + Math.random() * 0.22);
        b.add(x, -0.02, z, pin);
      }
      // Straight out, a 45° jog away from center, then straight to a via.
      const out1 = H + 0.25 + Math.random() * 0.35;
      const jog = (along >= 0 ? 1 : -1) * (0.25 + Math.random() * 0.75);
      const out2 = out1 + Math.abs(jog);
      const end = out2 + 0.5 + Math.random() * 1.1;
      const pts = [[along, H + 0.22], [along, out1], [along + jog, out2], [along + jog, end]];
      const segs = [];
      let total = 0;
      for (let k = 0; k < pts.length - 1; k++) {
        const len = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
        segs.push(len);
        total += len;
      }
      const id = traceId++;
      const n = Math.round(total / 0.02);
      for (let i = 0; i < n; i++) {
        let d = (i / n) * total;
        let k = 0;
        while (k < segs.length - 1 && d > segs[k]) { d -= segs[k]; k++; }
        const u = d / segs[k];
        const a0 = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u;
        const o0 = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u;
        const [x, z] = rot(side, a0 + (Math.random() - 0.5) * 0.02, o0);
        b.add(x, -0.02, z, copper, id + i / n);
      }
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * TAU;
        const r = 0.05 + Math.random() * 0.04;
        const [x, z] = rot(side, along + jog + Math.cos(a) * r, end + 0.08 + Math.sin(a) * r);
        b.add(x, -0.02, z, via, id + 0.999);
      }
    }
  }
  return finalize(b, count, { kind: 'object', size: 6.2, spin: 1, tilt: 0.66 });
}

/* ─── Speech bubble (Lingua) ───────────────────────────────────────────────── */
export function bubbleShape({ count }) {
  const width = 900;
  const height = 640;
  const b = sampleCanvas(
    (ctx) => {
      ctx.lineWidth = 22;
      ctx.strokeStyle = '#f00';
      ctx.lineJoin = 'round';
      const x = 60, y = 50, w = 780, h = 430, r = 120;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.lineTo(x + 300, y + h);
      ctx.lineTo(x + 190, y + h + 120);
      ctx.lineTo(x + 200, y + h);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = '#0f0';
      ctx.font = `700 190px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('¡Hola!', x + w / 2, y + h / 2 + 8);
    },
    { width, height, worldWidth: 5.4, depth: 0.32, step: 4, primary: '#f5f5f7', secondary: '#8fb8ff' },
  );
  return finalize(b, count, { kind: 'object', size: 5.4, spin: 2, sway: 0.28 });
}

/* ─── Database with incoming scraped fragments (FCI) ───────────────────────── */
export function databaseShape({ count }) {
  const b = new Builder();
  const wall = rgb('#7ee0b0');
  const rim = rgb('#eafff5');
  const frag = rgb('#a9b8c9');
  const R = 1.45;
  const H = 0.62;
  const gap = 0.22;
  for (let k = 0; k < 3; k++) {
    const y0 = -1.3 + k * (H + gap);
    for (let i = 0; i < 1500; i++) {
      const a = Math.random() * TAU;
      b.add(Math.cos(a) * R, y0 + Math.random() * H, Math.sin(a) * R, wall);
    }
    for (const yy of [y0, y0 + H]) {
      for (let i = 0; i < 380; i++) {
        const a = Math.random() * TAU;
        b.add(Math.cos(a) * R, yy, Math.sin(a) * R, rim);
      }
    }
  }
  // Lid
  const top = -1.3 + 2 * (H + gap) + H;
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * TAU;
    const r = R * Math.sqrt(Math.random());
    b.add(Math.cos(a) * r, top, Math.sin(a) * r, wall);
  }
  // Unstructured fragments orbiting above: little tilted "pages"
  for (let f = 0; f < 26; f++) {
    const a = Math.random() * TAU;
    const r = 2.1 + Math.random() * 1.1;
    const cx = Math.cos(a) * r;
    const cz = Math.sin(a) * r;
    const cy = 0.4 + Math.random() * 1.6;
    const rot = Math.random() * Math.PI;
    for (let i = 0; i < 30; i++) {
      const u = (Math.random() - 0.5) * 0.36;
      const v = (Math.random() - 0.5) * 0.26;
      b.add(cx + u * Math.cos(rot), cy + v, cz + u * Math.sin(rot), frag);
    }
  }
  return finalize(b, count, { kind: 'object', size: 5.6, columnSize: 7.4, spin: 1, tilt: 0.38 });
}

/* ─── Radio wavefront (EdgeAI Lab) ─────────────────────────────────────────── */
export function waveShape({ count }) {
  const b = new Builder();
  const inner = rgb('#9ce4ff');
  const outer = rgb('#3a8fd6');
  const mast = rgb('#f5f5f7');
  const R = 3.2;
  for (let i = 0; i < 6800; i++) {
    const r = R * Math.sqrt(Math.random());
    const a = Math.random() * TAU;
    b.add(Math.cos(a) * r, 0, Math.sin(a) * r, mixRgb(inner, outer, r / R));
  }
  for (let i = 0; i < 420; i++) {
    const a = Math.random() * TAU;
    b.add(Math.cos(a) * 0.04, Math.random() * 1.7, Math.sin(a) * 0.04, mast);
  }
  for (let i = 0; i < 180; i++) {
    const u = Math.random() * 2 - 1;
    const a = Math.random() * TAU;
    const s = Math.sqrt(1 - u * u);
    b.add(Math.cos(a) * s * 0.13, 1.75 + u * 0.13, Math.sin(a) * s * 0.13, mast);
  }
  return finalize(b, count, { kind: 'object', size: 6.4, spin: 1, tilt: 0.5, ripple: 1 });
}

/* ─── Curved film strip (VERG) ─────────────────────────────────────────────── */
export function filmShape({ count }) {
  const b = new Builder();
  const strip = rgb('#ff8a65');
  const frame = rgb('#ffd3c2');
  const play = rgb('#ffffff');
  const R = 3.4;
  const A = 1.05;
  const at = (theta, y) => [R * Math.sin(theta), y, R * Math.cos(theta) - R];
  // Sprocket bands with holes
  for (let i = 0; i < 4200; i++) {
    const th = (Math.random() * 2 - 1) * A;
    const sgn = Math.random() < 0.5 ? -1 : 1;
    const y = sgn * (0.7 + Math.random() * 0.25);
    const inHole = Math.abs(y) > 0.76 && Math.abs(y) < 0.89 && ((th + A) % 0.13) < 0.06;
    if (inHole) continue;
    b.add(...at(th, y), strip);
  }
  // Frame separators and edges
  for (let k = -2; k <= 2; k++) {
    const th = k * 0.42;
    for (let i = 0; i < 160; i++) b.add(...at(th + (Math.random() - 0.5) * 0.02, (Math.random() * 2 - 1) * 0.7), frame);
  }
  for (let i = 0; i < 900; i++) {
    const th = (Math.random() * 2 - 1) * A;
    b.add(...at(th, (Math.random() < 0.5 ? -1 : 1) * 0.7), frame);
  }
  // Frame content: soft image noise, and a play button in the center frame
  for (let i = 0; i < 1600; i++) {
    const th = (Math.random() * 2 - 1) * A;
    const y = (Math.random() * 2 - 1) * 0.66;
    if (Math.abs(th) < 0.2) continue;
    if (Math.random() > 0.35 + 0.3 * Math.sin(th * 7 + y * 4)) continue;
    b.add(...at(th, y), mixRgb(frame, strip, Math.random() * 0.6));
  }
  for (let i = 0; i < 700; i++) {
    const u = Math.random();
    const v = (Math.random() * 2 - 1) * (1 - u);
    b.add(...at(-0.08 + u * 0.22, v * 0.32), play);
  }
  return finalize(b, count, { kind: 'object', size: 6.6, spin: 2, sway: 0.18, tilt: 0.1, motion: 1, animated: true });
}

/* ─── Robotic arm with a parallel gripper (Machine Intelligence Lab) ──────── */
function capsule(b, from, to, r, n, color, part = 0) {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
  const len = Math.hypot(dx, dy, dz);
  const ax = [dx / len, dy / len, dz / len];
  const tmp = Math.abs(ax[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const u = [ax[1] * tmp[2] - ax[2] * tmp[1], ax[2] * tmp[0] - ax[0] * tmp[2], ax[0] * tmp[1] - ax[1] * tmp[0]];
  const ul = Math.hypot(...u);
  u[0] /= ul; u[1] /= ul; u[2] /= ul;
  const v = [ax[1] * u[2] - ax[2] * u[1], ax[2] * u[0] - ax[0] * u[2], ax[0] * u[1] - ax[1] * u[0]];
  for (let i = 0; i < n; i++) {
    const t = Math.random();
    const a = Math.random() * TAU;
    const c = Math.cos(a) * r, s = Math.sin(a) * r;
    b.add(from[0] + dx * t + u[0] * c + v[0] * s, from[1] + dy * t + u[1] * c + v[1] * s, from[2] + dz * t + u[2] * c + v[2] * s, color, -1, part);
  }
}

function joint(b, at, r, depth, n, color, rim, part = 0) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const onFace = Math.random() < 0.45;
    const rr = onFace ? r * Math.sqrt(Math.random()) : r;
    const z = onFace ? (Math.random() < 0.5 ? -depth : depth) : (Math.random() * 2 - 1) * depth;
    b.add(at[0] + Math.cos(a) * rr, at[1] + Math.sin(a) * rr, at[2] + z, onFace && rr > r * 0.85 ? rim : color, -1, part);
  }
}

export function armShape({ count }) {
  const b = new Builder();
  const body = rgb('#f5c242');
  const steel = rgb('#8e99a8');
  const rim = rgb('#f5f5f7');
  const finger = rgb('#dfe5ee');
  const part = rgb('#64d2ff');
  const X = -0.7; // shift so the reach is centered
  // Base plate and turntable
  for (let i = 0; i < 1400; i++) {
    const a = Math.random() * TAU;
    const top = Math.random() < 0.55;
    const r = top ? Math.sqrt(Math.random()) : 1.0;
    b.add(X + Math.cos(a) * r, -1.95 + (top ? 0.22 : Math.random() * 0.22), Math.sin(a) * r, top && r > 0.9 ? rim : steel);
  }
  capsule(b, [X, -1.73, 0], [X, -1.05, 0], 0.42, 900, body);
  joint(b, [X, -0.9, 0], 0.36, 0.42, 700, steel, rim);
  const elbow = [X + 1.05, 0.85, 0];
  capsule(b, [X, -0.9, 0], elbow, 0.22, 1300, body, 1);
  joint(b, elbow, 0.28, 0.33, 600, steel, rim, 1);
  const wrist = [X + 2.45, 0.35, 0];
  capsule(b, elbow, wrist, 0.17, 1100, body, 2);
  joint(b, wrist, 0.2, 0.24, 420, steel, rim, 2);
  // Palm and two parallel fingers holding a small part
  capsule(b, wrist, [X + 2.72, 0.25, 0], 0.15, 300, steel, 3);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 380; i++) {
      const t = Math.random();
      b.add(X + 2.72 + t * 0.5, 0.25 - t * 0.17 + side * 0.24 + (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.22, finger, -1, side < 0 ? 4 : 5);
    }
  }
  for (let i = 0; i < 360; i++) {
    const f = Math.floor(Math.random() * 3);
    const q = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() < 0.5 ? -1 : 1];
    const p = f === 0 ? [q[2], q[0], q[1]] : f === 1 ? [q[0], q[2], q[1]] : q;
    b.add(X + 3.07 + p[0] * 0.13, 0.17 + p[1] * 0.13, p[2] * 0.13, part, -1, 6);
  }
  // A small stationary pickup tray below the block, level with the base.
  for (let i = 0; i < 240; i++) {
    b.add(2.2 + Math.random(), -1.95, (Math.random() - 0.5) * 0.8, steel);
  }
  return finalize(b, count, { kind: 'object', size: 5.4, spin: 2, sway: 0.18, tilt: 0.06, motion: 2, animated: true });
}

/* ─── Stage spotlight (On stage) ───────────────────────────────────────────
   A lamp up and to the left throws an oblique beam onto the stage: bright
   near the lens, thinning toward the floor, with a hot pool where it lands. */
export function spotlightShape({ count }) {
  const b = new Builder();
  const lampC = rgb('#9aa4b2');
  const hot = rgb('#fff8e8');
  const beam = rgb('#ffe2a0');
  const dim = rgb('#7a6334');
  const pool = rgb('#ffd76a');
  const floor = rgb('#4d4433');
  const apex = [-1.9, 2.3, 0];
  const land = [0.5, -1.6, 0];
  const axis = [land[0] - apex[0], land[1] - apex[1], land[2] - apex[2]];
  const L = Math.hypot(...axis);
  const d = axis.map((v) => v / L);
  // frame perpendicular to the beam
  const u = [0, 0, 1];
  const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
  const at = (h, r, a) => [
    apex[0] + axis[0] * h + (u[0] * Math.cos(a) + v[0] * Math.sin(a)) * r,
    apex[1] + axis[1] * h + (u[1] * Math.cos(a) + v[1] * Math.sin(a)) * r,
    apex[2] + axis[2] * h + (u[2] * Math.cos(a) + v[2] * Math.sin(a)) * r,
  ];
  const r0 = 0.24;
  const R = 1.45;
  // Lamp housing, aimed down the beam
  for (let i = 0; i < 700; i++) {
    const h = -0.12 + Math.random() * 0.1;
    const a = Math.random() * TAU;
    b.add(...at(h, 0.32 + (Math.random() < 0.2 ? Math.random() * 0.05 : 0), a), lampC);
  }
  for (let i = 0; i < 220; i++) {
    const a = Math.random() * TAU;
    b.add(...at(-0.015, 0.3 * Math.sqrt(Math.random()), a), hot);
  }
  // Beam shell: dense and bright at the lens, thinning toward the floor
  for (let i = 0; i < 3300; i++) {
    const h = Math.pow(Math.random(), 1.6);
    const a = Math.random() * TAU;
    b.add(...at(h, r0 + (R - r0) * h, a), mixRgb(mixRgb(hot, beam, Math.min(1, h * 1.6)), dim, Math.max(0, h - 0.4)));
  }
  // Light-catching dust inside the beam
  for (let i = 0; i < 1300; i++) {
    const h = Math.random();
    const a = Math.random() * TAU;
    b.add(...at(h, (r0 + (R - r0) * h) * Math.sqrt(Math.random()), a), mixRgb(beam, dim, h * 0.8));
  }
  // Pool of light with a hot center, then the dim stage floor
  const cx = land[0];
  for (let i = 0; i < 2600; i++) {
    const a = Math.random() * TAU;
    const r = Math.pow(Math.random(), 0.7) * R * 1.15;
    b.add(cx + Math.cos(a) * r, land[1], Math.sin(a) * r * 0.9, mixRgb(hot, pool, Math.min(1, r / R)));
  }
  for (let i = 0; i < 1100; i++) {
    const x = -3.2 + Math.random() * 6.4;
    const z = -1.6 + Math.random() * 3.2;
    if (Math.hypot(x - cx, z) < R * 1.1) continue;
    b.add(x, land[1], z, floor);
  }
  for (let i = 0; i < 500; i++) b.add(-3.2 + Math.random() * 6.4, land[1], 1.6, mixRgb(floor, pool, 0.35));
  return finalize(b, count, { kind: 'object', size: 5.6, spin: 2, sway: 0.5, tilt: 0.28 });
}

/* ─── Tennis ball (Off the clock) ──────────────────────────────────────────── */
export function ballShape({ count }) {
  const b = new Builder();
  const felt = rgb('#d4f25a');
  const feltDark = rgb('#9fbf2a');
  const seam = rgb('#f7f7ef');
  const R = 1.95;
  const n = 6800;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * golden;
    const fuzz = R + (Math.random() - 0.5) * 0.08;
    b.add(Math.cos(a) * r * fuzz, y * fuzz, Math.sin(a) * r * fuzz, mixRgb(felt, feltDark, Math.random() * 0.5));
  }
  // Seam: x = a·cos t + b·cos 3t, y = a·sin t − b·sin 3t, z = 2√(ab)·sin 2t (unit sphere when a + b = 1)
  const A = 0.68;
  const B = 0.32;
  for (let i = 0; i < 1600; i++) {
    const t = Math.random() * TAU;
    const x = A * Math.cos(t) + B * Math.cos(3 * t);
    const y = A * Math.sin(t) - B * Math.sin(3 * t);
    const z = 2 * Math.sqrt(A * B) * Math.sin(2 * t);
    const rr = R * 1.012;
    b.add(x * rr + (Math.random() - 0.5) * 0.05, y * rr + (Math.random() - 0.5) * 0.05, z * rr, seam);
  }
  return finalize(b, count, { kind: 'object', size: 4.6, spin: 1, tilt: 0.3 });
}

/* ─── Spiral galaxy (ambient backdrop behind dense sections) ───────────────── */
export function galaxyShape({ count }) {
  const b = new Builder();
  const core = rgb('#b7c2ac');
  const armA = rgb('#7c8d72');
  const armB = rgb('#a1ac96');
  const star = rgb('#c1c8b9');
  const arms = Math.round(count * 0.78);
  const center = Math.round(count * 0.14);
  // Four winding arms with narrow dust lanes, plus a soft, uncrowded core.
  for (let i = 0; i < arms; i++) {
    const arm = i % 4;
    const r = 0.7 + Math.pow(Math.random(), 0.72) * 6;
    const angle = arm * Math.PI / 2 + Math.log(r + 0.5) * 2.3 + gauss() * 0.22;
    const radius = r + gauss() * 0.16;
    const color = mixRgb(core, arm % 2 ? armA : armB, Math.min(1, r / 3));
    b.add(Math.cos(angle) * radius, gauss() * 0.12, Math.sin(angle) * radius, color);
  }
  for (let i = 0; i < center; i++) {
    const angle = Math.random() * TAU;
    const radius = Math.sqrt(Math.random()) * 1.05;
    b.add(Math.cos(angle) * radius, gauss() * 0.16, Math.sin(angle) * radius, core);
  }
  for (let i = 0; i < count - arms - center; i++) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random()) * 7.2;
    b.add(Math.cos(a) * r, gauss() * 0.22, Math.sin(a) * r, star);
  }
  return finalize(b, count, { kind: 'ambient', size: 14.4, spin: 0.22, tilt: 1.08, opacity: 0.4, animated: true });
}
