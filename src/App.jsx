import { useEffect, useState } from 'react';
import Experiment from './Experiment';
import Site from './site/Site';
import { useLenis } from './site/hooks';

function useHashRoute() {
  const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''));
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return hash;
}

export default function App() {
  const lenis = useLenis();
  const hash = useHashRoute();
  if (hash === '#experiment') return <Experiment />;
  return <Site lenis={lenis} />;
}
