/**
 * Wires up prev/next navigation zones, keyboard arrows,
 * page indicator, and the fullscreen toggle button.
 */

/** @param {{ onPrev: () => void, onNext: () => void }} handlers */
export function initControls({ onPrev, onNext }) {
  document.getElementById('btn-prev').addEventListener('click', onPrev);
  document.getElementById('btn-next').addEventListener('click', onNext);

  // Keyboard: arrows navigate, Escape exits fullscreen
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); onPrev(); }
    if (e.key === 'ArrowRight' || e.key === 'PageDown')  { e.preventDefault(); onNext(); }
  });

  // Fullscreen toggle
  const btnFs = document.getElementById('btn-fullscreen');
  if (btnFs) {
    btnFs.addEventListener('click', toggleFullscreen);
  }

  // Keep aria-label in sync with fullscreen state
  document.addEventListener('fullscreenchange', () => {
    if (btnFs) {
      btnFs.setAttribute(
        'aria-label',
        document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'
      );
    }
  });
}

/**
 * Update the "N / Total" page indicator in the header.
 * @param {number} index   0-based current page index
 * @param {number} total
 */
export function updatePageIndicator(index, total) {
  const cur = document.getElementById('page-current');
  const tot = document.getElementById('page-total');
  if (cur) cur.textContent = index + 1;
  if (tot) tot.textContent = total;
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch { /* denied — e.g. during initial page load */ }
}
