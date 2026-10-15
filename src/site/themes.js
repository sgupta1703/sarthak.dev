const TOKENS = ['bg', 'surface', 'surface-soft', 'line', 'line-2', 'text', 'text-2', 'text-3', 'accent', 'accent-soft'];
const palette = (id, name, mode, values) => ({ id, name, mode, colors: Object.fromEntries(TOKENS.map((token, i) => [token, values[i]])) });

export const THEMES = [
  palette('porcelain', 'Porcelain', 'light', [
    '#fafbfc', '#ffffff', '#eff2f5', '#dce2e7', '#bdc8d1', '#19232e', '#465766', '#5b6c7a', '#176f87', '#e1f0f4',
  ]),
  palette('paper', 'Paper', 'light', [
    '#f8f4ec', '#fffdf8', '#eee7da', '#dfd6c5', '#c6b9a2', '#302a24', '#65594a', '#70624f', '#8b5734', '#f0e3d4',
  ]),
  palette('sage', 'Sage', 'light', [
    '#f6f5f2', '#ffffff', '#efefea', '#dedfda', '#c6c9c0', '#20211f', '#555c52', '#666b64', '#64745d', '#e8ede4',
  ]),
  palette('sand', 'Sand', 'light', [
    '#faf0e4', '#fff9f2', '#f1e1cd', '#e2ceba', '#c9af95', '#372a24', '#6e5142', '#785b49', '#a0452b', '#f5dfd2',
  ]),
  palette('mist', 'Mist', 'light', [
    '#eef3fa', '#f9fbff', '#e2eaf6', '#d1dced', '#afc1dc', '#1f2b45', '#4c5d7b', '#566885', '#395ac1', '#dfe7fb',
  ]),
  palette('rose', 'Rose', 'light', [
    '#fbf1f4', '#fffafc', '#f2e4ea', '#e6d3dc', '#cdb0c0', '#392935', '#6e5163', '#795b6d', '#9d3e69', '#f3dce7',
  ]),
  palette('ink', 'Ink', 'dark', [
    '#101113', '#191b1f', '#22252a', '#30353c', '#505a66', '#f1f4f8', '#bdc5cf', '#9aa7b6', '#9bc8e8', '#243645',
  ]),
  palette('midnight', 'Midnight', 'dark', [
    '#0c1528', '#142039', '#1b2b47', '#2c3e5e', '#4a6389', '#eaf0fd', '#bac9e3', '#97accd', '#8baaff', '#233b66',
  ]),
  palette('forest', 'Forest', 'dark', [
    '#101c18', '#172a22', '#1f352a', '#304b3d', '#4e6e5c', '#ecf3e9', '#b8cebd', '#97b49e', '#a4d69b', '#284632',
  ]),
  palette('plum', 'Plum', 'dark', [
    '#1c1423', '#291e32', '#35273e', '#4a3557', '#715680', '#f5ecfa', '#d0bbdc', '#b69cc5', '#d3a6ed', '#493255',
  ]),
  palette('espresso', 'Espresso', 'dark', [
    '#211a16', '#2d241e', '#3a2e26', '#514033', '#78604c', '#f5ede2', '#d2beaa', '#b89f86', '#e8b77d', '#4e3825',
  ]),
  palette('graphite', 'Graphite', 'dark', [
    '#1a1c1a', '#252825', '#303530', '#404940', '#606e60', '#eef2ea', '#c2cdbb', '#a4b49b', '#c1df8d', '#3a482c',
  ]),
];

export const THEME_STORAGE_KEY = 'portfolio-theme';
export const getTheme = (id) => THEMES.find((theme) => theme.id === id) || THEMES.find((theme) => theme.id === 'sage');

export function readTheme() {
  try { return getTheme(localStorage.getItem(THEME_STORAGE_KEY)); }
  catch { return getTheme('sage'); }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.dataset.themeMode = theme.mode;
  root.style.colorScheme = theme.mode;
  Object.entries(theme.colors).forEach(([token, value]) => root.style.setProperty(`--${token}`, value));
  root.style.setProperty('--on-accent', theme.mode === 'dark' ? theme.colors.bg : '#ffffff');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.bg);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme.mode);
}
