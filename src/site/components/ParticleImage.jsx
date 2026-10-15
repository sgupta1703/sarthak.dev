import { useLayoutEffect, useRef } from 'react';
import { useSite } from '../context';

// The image is the sharp endpoint of the shared particle morph. The scene
// samples this source and follows this exact rectangle in document space.
export default function ParticleImage({ imageId, src, alt, width, height }) {
  const rootRef = useRef(null);
  const { registerImage } = useSite();
  useLayoutEffect(() => registerImage(imageId, rootRef.current), [imageId, registerImage]);

  return <div ref={rootRef} className="particle-image" data-phase="forming" style={{ aspectRatio: `${width} / ${height}` }}>
    <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
  </div>;
}
