/* Small side-effect helpers shared by components. */

export function toast(message) {
  window.dispatchEvent(new CustomEvent('site:toast', { detail: { message, id: `${Date.now()}-${Math.random()}` } }));
}

export async function copyText(text, message = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    toast('Couldn’t copy. Select the text instead.');
  }
}

export const openPalette = () => window.dispatchEvent(new Event('site:palette'));
export const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
