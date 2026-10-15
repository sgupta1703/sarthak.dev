import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { frame, cancelFrame } from 'framer-motion';

/* ─── Main cloud shader ──────────────────────────────────────────────────────
   Each point blends from its slot in shape A to its slot in shape B. Midway it
   is thrown out along a random direction so the cloud bursts and re-forms.
   On load, points fly in from a wide field of dust (uIntro 0 → 1). Points
   that sit on a wire (flow ≥ 0) carry light pulses running outward. */
const cloudVertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aColFrom;
  attribute vec3 aColTo;
  attribute float aFlowFrom;
  attribute float aFlowTo;
  attribute float aPartFrom;
  attribute float aPartTo;
  attribute vec4 aRand;

  uniform float uT, uTime, uAngle, uScatter, uWobble, uPixelRatio, uIntro, uRepel;
  uniform float uScaleA, uScaleB, uSpinA, uSpinB, uSwayA, uSwayB, uTiltA, uTiltB;
  uniform float uRippleA, uRippleB, uOpacityA, uOpacityB, uDriftA, uDriftB;
  uniform float uMotionA, uMotionB, uImageA, uImageB, uSizeA, uSizeB;
  uniform vec3 uOffsetA, uOffsetB;
  uniform vec3 uInk, uAccent, uBackground, uSurface, uLine, uMuted;
  uniform vec2 uPointer;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
  vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
  vec3 rotZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); }

  vec3 imageColor(vec3 original, float part) {
    if (part > -0.5) return original;
    if (part > -1.5) return uBackground;
    if (part > -2.5) return uSurface;
    if (part > -3.5) return uLine;
    if (part > -4.5) return uInk;
    if (part > -5.5) return uAccent;
    return uMuted;
  }

  vec3 armPose(vec3 p, float part, float shoulder, float elbow, float open) {
    vec3 S = vec3(-0.7, -0.9, 0.0);
    vec3 E = vec3(0.35, 0.85, 0.0);
    vec3 W = vec3(1.75, 0.35, 0.0);
    if (part > 3.5 && part < 5.5) p.y += (part > 4.5 ? 1.0 : -1.0) * (open * 0.24 - 0.12);
    if (part > 2.5) p = rotZ(p - W, -shoulder - elbow - 0.12) + W;
    if (part > 1.5) p = rotZ(p - E, elbow) + E;
    if (part > 0.5) p = rotZ(p - S, shoulder) + S;
    return p;
  }

  vec3 articulate(vec3 p, float part, float motion) {
    if (motion > 1.5) {
      float phase = mod(uTime, 9.0) / 9.0;
      float shoulder = mix(-0.12, -0.72, smoothstep(0.0, 0.2, phase));
      float elbow = mix(-0.12, 0.1, smoothstep(0.0, 0.2, phase));
      float lift = smoothstep(0.3, 0.52, phase) * (1.0 - smoothstep(0.66, 0.84, phase));
      shoulder = mix(shoulder, 0.28, lift);
      elbow = mix(elbow, -0.65, lift);
      shoulder = mix(shoulder, -0.12, smoothstep(0.94, 1.0, phase));
      elbow = mix(elbow, -0.12, smoothstep(0.94, 1.0, phase));
      float open = 1.0 - smoothstep(0.2, 0.3, phase) + smoothstep(0.84, 0.94, phase);
      if (part > 5.5 && (phase < 0.3 || phase > 0.84)) return armPose(p, part, -0.72, 0.1, 0.0);
      return armPose(p, part, shoulder, elbow, open);
    }
    if (motion > 0.5) {
      float theta = mod(atan(p.x, p.z + 3.4) - uTime * 0.34 + 1.05, 2.1) - 1.05;
      p.x = 3.4 * sin(theta);
      p.z = 3.4 * cos(theta) - 3.4;
    }
    return p;
  }

  vec3 place(vec3 p, float part, float motion, float scale, float spin, float sway, float tilt, float ripple, vec3 offset, float drift) {
    p = articulate(p, part, motion);
    float r = length(p.xz);
    p.y += ripple * 0.3 * sin(r * 3.2 - uTime * 2.4) * exp(-r * 0.22) * smoothstep(0.2, 0.7, r);
    float ang = spin > 1.5 ? sin(uAngle * 0.8) * sway : uAngle * spin;
    p = rotY(p, ang);
    p = rotX(p, tilt);
    return p * scale + offset + vec3(0.0, drift, 0.0);
  }

  void main() {
    float seed = fract(aRand.w * 7.13);
    float t = clamp((uT - aRand.w * 0.3) / 0.7, 0.0, 1.0);
    float e = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
    float burst = sin(3.14159265 * t);

    vec3 a = place(aFrom, aPartFrom, uMotionA, uScaleA, uSpinA, uSwayA, uTiltA, uRippleA, uOffsetA, uDriftA);
    vec3 b = place(aTo, aPartTo, uMotionB, uScaleB, uSpinB, uSwayB, uTiltB, uRippleB, uOffsetB, uDriftB);
    vec3 p = mix(a, b, e);
    vec3 dir = aRand.xyz;
    p += rotY(dir, burst * 1.2) * burst * uScatter;
    p += uWobble * vec3(sin(uTime * 0.9 + aRand.w * 40.0), cos(uTime * 0.7 + aRand.x * 40.0), 0.0);

    float it = clamp((uIntro - aRand.w * 0.45) / 0.55, 0.0, 1.0);
    float ie = 1.0 - pow(1.0 - it, 3.0);
    vec3 dust = rotY(dir * 11.0, (1.0 - ie) * 2.0) + vec3(0.0, 0.0, -3.0);
    p = mix(dust, p, ie);

    vec4 world = modelMatrix * vec4(p, 1.0);
    vec2 d = world.xy - uPointer;
    float dist = length(d);
    world.xy += (d / max(dist, 1e-4)) * uRepel * smoothstep(1.3, 0.0, dist);

    // Light pulses along wires: one bright segment per trace, phased per trace.
    float flow = e < 0.5 ? aFlowFrom : aFlowTo;
    float along = fract(flow);
    float phase = fract(along - uTime * 0.5 + floor(flow) * 0.373);
    float pulse = step(0.0, flow) * smoothstep(0.14, 0.0, phase) * (1.0 - burst);

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    float sizeVar = 0.6 + seed * 0.85;
    gl_PointSize = mix(uSizeA, uSizeB, e) * sizeVar * uPixelRatio * (14.0 / -mv.z) * (1.0 + burst * 0.4 + pulse * 1.3);

    // Site colors drive objects and stars; photos retain their source pixels.
    vec3 source = mix(imageColor(aColFrom, aPartFrom), imageColor(aColTo, aPartTo), e);
    float tone = dot(source, vec3(0.2126, 0.7152, 0.0722));
    vec3 base = mix(uInk, uAccent, tone * 0.35);
    vColor = mix(base, uAccent, pulse * 0.65);
    float heldBlock = mix(step(5.5, aPartFrom) * step(1.5, uMotionA), step(5.5, aPartTo) * step(1.5, uMotionB), e);
    vColor = mix(vColor, uAccent, heldBlock);
    vColor = mix(vColor, source, mix(uImageA, uImageB, e));
    float depthFade = clamp(1.0 - (-mv.z - 13.0) * 0.06, 0.7, 1.0);
    float twinkle = 1.0;
    float alpha = depthFade * twinkle * mix(uOpacityA, uOpacityB, e) * (0.25 + 0.75 * ie);
    vAlpha = min(1.0, alpha + pulse * 0.6);
  }
`;

const pointFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.2, d);
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

/* Where a shape sits. Wide: text centered, objects right of the copy column,
   ambient fields fill the frame. Narrow: everything centered, objects high. */
function layoutFor(shape, viewport, wide, imageAnchors, screen, scroll) {
  if (shape.kind === 'image') {
    const rect = imageAnchors.get(shape.imageId)?.bounds;
    if (!rect) return { scale: 0, x: 0, y: 0 };
    return {
      scale: rect.width / screen.width * viewport.width,
      x: ((rect.left + rect.width / 2) / screen.width - 0.5) * viewport.width,
      y: (0.5 - (rect.top - scroll + rect.height / 2) / screen.height) * viewport.height,
    };
  }
  if (shape.kind === 'text') {
    const scale = Math.min(1.15, (viewport.width * (wide ? 0.8 : 0.9)) / shape.size);
    return { scale, x: 0, y: viewport.height * (wide ? 0.08 : 0.2) };
  }
  if (shape.kind === 'ambient') {
    const scale = viewport.width * (wide ? 1.08 : 1.5) / shape.size;
    return { scale, x: viewport.width * 0.08, y: viewport.height * 0.02 };
  }
  if (wide) {
    if (shape.columnSize) {
      // Fit the database and its orbiting pages into the open column. Reserve
      // a fixed gutter for the rail, including on smaller desktop viewports.
      const left = Math.max(28, screen.width * 0.06) + Math.min(620, screen.width * 0.48) + 28;
      const right = screen.width - 88;
      const width = Math.max(100, right - left) / screen.width * viewport.width;
      return {
        scale: Math.min(width * 0.9, viewport.height * 0.68) / shape.columnSize,
        x: (((left + right) / 2) / screen.width - 0.5) * viewport.width,
        y: -viewport.height * 0.01,
      };
    }
    const scale = Math.min(viewport.width * 0.36, viewport.height * 0.68) / shape.size;
    return { scale, x: viewport.width * (shape.side === 'left' ? -0.25 : 0.25), y: -viewport.height * 0.01 };
  }
  const scale = Math.min(viewport.width * 0.82, viewport.height * 0.36) / shape.size;
  return { scale, x: 0, y: viewport.height * 0.22 };
}

const ATTRS3 = ['aFrom', 'aTo', 'aColFrom', 'aColTo'];
const ATTRS1 = ['aFlowFrom', 'aFlowTo', 'aPartFrom', 'aPartTo'];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function Cloud({ shapes, indexRef, scrollRef, centersRef, pointerRef, imageAnchorsRef, wide, reducedMotion, palette }) {
  const count = shapes[0].positions.length / 3;
  const groupRef = useRef(null);
  const pairRef = useRef({ k: -1, a: null, b: null });
  const angleRef = useRef(0);
  const repelRef = useRef(0);
  const introRef = useRef(reducedMotion ? 1 : 0);
  const { viewport, gl, size, invalidate } = useThree();

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    for (const name of ATTRS3) g.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    for (const name of ATTRS1) g.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count).fill(-1), 1));
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const len = 0.35 + Math.random() * 0.65;
      rand.set([Math.cos(a) * s * len, Math.sin(a) * s * len, u * len, Math.random()], i * 4);
    }
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => {
    const u = {};
    for (const k of ['uT', 'uTime', 'uAngle', 'uScatter', 'uWobble', 'uPixelRatio', 'uIntro', 'uRepel',
      'uScaleA', 'uScaleB', 'uSpinA', 'uSpinB', 'uSwayA', 'uSwayB', 'uTiltA', 'uTiltB',
      'uRippleA', 'uRippleB', 'uOpacityA', 'uOpacityB', 'uDriftA', 'uDriftB', 'uMotionA', 'uMotionB', 'uImageA', 'uImageB', 'uSizeA', 'uSizeB']) u[k] = { value: 0 };
    u.uOffsetA = { value: new THREE.Vector3() };
    u.uOffsetB = { value: new THREE.Vector3() };
    u.uPointer = { value: new THREE.Vector2(99, 99) };
    for (const name of ['uInk', 'uAccent', 'uBackground', 'uSurface', 'uLine', 'uMuted']) u[name] = { value: new THREE.Color() };
    return u;
  }, []);

  useEffect(() => {
    const colors = { uInk: 'text', uAccent: 'accent', uBackground: 'bg', uSurface: 'surface', uLine: 'line-2', uMuted: 'text-3' };
    for (const [uniform, token] of Object.entries(colors)) uniforms[uniform].value.set(palette[token]).convertLinearToSRGB();
    invalidate();
  }, [palette, uniforms, invalidate]);

  // Built directly: R3F copies each entry of a `uniforms` prop into a new
  // object, so number values written per frame would never reach the GPU.
  const material = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: cloudVertex, fragmentShader: pointFragment, uniforms, transparent: true, depthWrite: false }),
    [uniforms],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const last = shapes.length - 1;
    const s = Math.max(0, Math.min(last, indexRef.current));
    let k = Math.floor(s);
    let t = s - k;
    if (k >= last) { k = last - 1; t = 1; }
    const A = shapes[k];
    const B = shapes[k + 1];
    const imageWeight = (A.kind === 'image' ? 1 - t : 0) + (B.kind === 'image' ? t : 0);
    const backgroundWeight = (A.kind === 'ambient' ? 1 - t : 0) + (B.kind === 'ambient' ? t : 0);

    const pair = pairRef.current;
    if (pair.k !== k || pair.a !== A || pair.b !== B) {
      const at = geometry.attributes;
      at.aFrom.array.set(A.positions);
      at.aTo.array.set(B.positions);
      at.aColFrom.array.set(A.colors);
      at.aColTo.array.set(B.colors);
      at.aFlowFrom.array.set(A.flow);
      at.aFlowTo.array.set(B.flow);
      at.aPartFrom.array.set(A.parts);
      at.aPartTo.array.set(B.parts);
      for (const name of [...ATTRS3, ...ATTRS1]) at[name].needsUpdate = true;
      pairRef.current = { k, a: A, b: B };
    }

    // Scroll drift: a held shape keeps rising gently with the page, so the
    // scene never feels parked while you read.
    const vh = Math.max(1, size.height);
    const centers = centersRef.current;
    const driftFor = (i) => {
      if (shapes[i].kind === 'image' || shapes[i].kind === 'ambient') return 0;
      const c = centers[i];
      if (c === undefined) return 0;
      const p = Math.max(-1.3, Math.min(1.3, (scrollRef.current - c) / vh));
      return reducedMotion ? 0 : p * viewport.height * 0.16;
    };

    const la = layoutFor(A, viewport, wide, imageAnchorsRef.current, size, scrollRef.current);
    const lb = layoutFor(B, viewport, wide, imageAnchorsRef.current, size, scrollRef.current);
    const u = uniforms;
    introRef.current = reducedMotion ? 1 : Math.min(1, introRef.current + dt / 1.1);
    u.uIntro.value = introRef.current;
    u.uT.value = t;
    u.uTime.value = reducedMotion ? 0 : state.clock.elapsedTime;
    // Consecutive background chapters share one galaxy; keep its arms intact.
    u.uScatter.value = reducedMotion || A.positions === B.positions ? 0 : 0.7;
    const interaction = Math.max(0, 1 - imageWeight - backgroundWeight);
    u.uWobble.value = reducedMotion ? 0 : 0.004 * interaction;
    u.uPixelRatio.value = gl.getPixelRatio();
    u.uScaleA.value = la.scale; u.uScaleB.value = lb.scale;
    u.uOffsetA.value.set(la.x, la.y, 0); u.uOffsetB.value.set(lb.x, lb.y, 0);
    u.uDriftA.value = driftFor(k); u.uDriftB.value = driftFor(k + 1);
    u.uSpinA.value = A.spin; u.uSpinB.value = B.spin;
    u.uSwayA.value = A.sway; u.uSwayB.value = B.sway;
    u.uTiltA.value = A.tilt; u.uTiltB.value = B.tilt;
    u.uRippleA.value = A.ripple; u.uRippleB.value = B.ripple;
    const revealA = A.kind === 'image' ? reducedMotion ? 1 : 1 - smooth(0.015, 0.11, Math.abs(s - k)) : 0;
    const revealB = B.kind === 'image' ? reducedMotion ? 1 : 1 - smooth(0.015, 0.11, Math.abs(s - k - 1)) : 0;
    u.uOpacityA.value = A.opacity * (1 - revealA); u.uOpacityB.value = B.opacity * (1 - revealB);
    u.uImageA.value = A.kind === 'image' ? 1 : 0;
    u.uImageB.value = B.kind === 'image' ? 1 : 0;
    const pointSize = (shape) => {
      if (shape.kind === 'image') return Math.max(2.8, (imageAnchorsRef.current.get(shape.imageId)?.bounds?.width || 380) * shape.spacing * 1.15);
      if (shape.kind === 'ambient') return wide ? 1.9 : 1.65;
      return wide ? 3.2 : 2.8;
    };
    u.uSizeA.value = pointSize(A); u.uSizeB.value = pointSize(B);
    u.uMotionA.value = reducedMotion ? 0 : A.motion;
    u.uMotionB.value = reducedMotion ? 0 : B.motion;

    // The galaxy holds its position through adjacent chapters. Only foreground
    // objects respond to scroll; background rotation follows elapsed time.
    if (!reducedMotion) angleRef.current += dt * 0.08;
    u.uAngle.value = reducedMotion ? 0.6 : angleRef.current + scrollRef.current * 0.00025 * (1 - backgroundWeight);

    // Pointer: soft repel plus a small, critically damped tilt of the cloud.
    const ptr = pointerRef.current;
    const follow = 1 - Math.exp(-dt * 5);
    repelRef.current += ((ptr.active && !reducedMotion ? 0.12 * interaction : 0) - repelRef.current) * follow;
    u.uRepel.value = repelRef.current;
    u.uPointer.value.set((ptr.x * viewport.width) / 2, (ptr.y * viewport.height) / 2);
    const g = groupRef.current;
    if (g) {
      g.rotation.x += ((reducedMotion ? 0 : -ptr.y * 0.035 * interaction) - g.rotation.x) * follow;
      g.rotation.y += ((reducedMotion ? 0 : ptr.x * 0.05 * interaction) - g.rotation.y) * follow;
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

// Render after Lenis and Motion on their shared clock. A slowly turning galaxy
// needs 30fps; document scrolling and foreground morphs keep the full refresh rate.
function RenderActivity({ reducedMotion, shapes, indexRef, scrollRef, palette }) {
  const { advance, size } = useThree();
  const dirty = useRef(true);
  const origin = useRef(performance.now());
  useEffect(() => { dirty.current = true; }, [palette, size, reducedMotion]);
  useEffect(() => {
    let awakeUntil = performance.now() + 1600;
    let lastDraw = 0;
    let lastScroll = scrollRef.current;
    let lastIndex = indexRef.current;
    const wake = (event) => {
      if (document.hidden || (reducedMotion && event.type === 'pointermove')) return;
      dirty.current = true;
      awakeUntil = performance.now() + 650;
    };
    const events = ['scroll', 'pointermove', 'resize', 'visibilitychange'];
    events.forEach((event) => window.addEventListener(event, wake, { passive: true }));
    const draw = ({ timestamp }) => {
      if (document.hidden) return;
      if (lastScroll !== scrollRef.current || lastIndex !== indexRef.current) dirty.current = true;
      lastScroll = scrollRef.current;
      lastIndex = indexRef.current;
      const s = Math.max(0, Math.min(shapes.length - 1, lastIndex));
      const k = Math.min(shapes.length - 2, Math.floor(s));
      const t = s - k;
      const a = shapes[k], b = shapes[k + 1];
      const background = (a.kind === 'ambient' && (b.kind === 'ambient' || t === 0)) || (b.kind === 'ambient' && t === 1);
      const animated = (a.animated && t < 1) || (b.animated && t > 0);
      if (!(dirty.current || (!reducedMotion && (animated || timestamp < awakeUntil)))) return;
      if (!reducedMotion && background && timestamp - lastDraw < 1000 / 30) return;
      dirty.current = false;
      lastDraw = timestamp;
      advance(Math.max(0, timestamp - origin.current) / 1000, false);
    };
    frame.render(draw, true);
    return () => {
      cancelFrame(draw);
      events.forEach((event) => window.removeEventListener(event, wake));
    };
  }, [advance, shapes, indexRef, scrollRef, reducedMotion]);
  return null;
}

export default function MorphCloud(props) {
  return (
    <Canvas
      className="morph-canvas"
      frameloop="never"
      camera={{ position: [0, 0, 14], fov: 35 }}
      dpr={1}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <RenderActivity reducedMotion={props.reducedMotion} shapes={props.shapes} indexRef={props.indexRef} scrollRef={props.scrollRef} palette={props.palette} />
      <Cloud {...props} />
    </Canvas>
  );
}
