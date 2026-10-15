import { EXPERIENCE } from './data';

/* Page order. Each section holds one cloud shape while centered.
   anchor 'top' sections are tall flow sections that scroll from their top
   edge and keep their backdrop shape for most of their length. */
export const SECTIONS = [
  { id: 'top', shape: 'name', chapter: 'Intro' },
  { id: 'about', shape: 'portrait', chapter: 'About' },
  ...EXPERIENCE.map((e, i) => ({ id: e.id, shape: e.id === 'lingua' ? 'product' : e.shape, chapter: 'Work', side: i % 2 ? 'left' : 'right' })),
  { id: 'projects', shape: 'galaxy', chapter: 'Projects', anchor: 'top' },
  { id: 'stage', shape: 'galaxy', chapter: 'Recognition' },
  { id: 'skills', shape: 'galaxyDim', chapter: 'Skills', anchor: 'top' },
  { id: 'court', shape: 'ball', chapter: 'Off the clock' },
  { id: 'resume', shape: 'galaxy', chapter: 'Résumé', anchor: 'top' },
  { id: 'contact', shape: 'hello', chapter: 'Contact' },
];
