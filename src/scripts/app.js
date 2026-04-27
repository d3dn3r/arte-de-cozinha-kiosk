/**
 * Application bootstrap.
 * Fetches pages.json, wires up every module, and handles
 * the first-interaction fullscreen + audio-context resume.
 */

import { initFlipbook, prevPage, nextPage, goToPage, getCurrentPageIndex } from './flipbook.js';
import { initControls, updatePageIndicator } from './controls.js';
import { initAttract } from './attract.js';
import { loadFlipAudio, playFlipSound, resumeAudioContext } from './audio.js';
import { debounce } from '../lib/utils.js';

export async function boot() {
  // ── Service worker ─────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('[SW] Registration failed:', err));
  }

  // ── Load page manifest ─────────────────────────────────────────
  let catalogueTitle = 'Museum Collection';
  let pages = [];

  try {
    const resp = await fetch('/pages.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    pages = data.pages ?? [];
    if (data.title) catalogueTitle = data.title;
  } catch (err) {
    showError('Could not load pages.json. Add page images and update the manifest.');
    console.error('[app] Failed to load pages.json:', err);
    return;
  }

  if (pages.length === 0) {
    showError('pages.json contains no pages. Add JPEGs to public/assets/pages/ and update pages.json.');
    return;
  }

  document.title = catalogueTitle;

  // Propagate title to attract screen
  const attractTitle = document.querySelector('.attract__title');
  if (attractTitle) attractTitle.textContent = catalogueTitle;

  // ── Flipbook ───────────────────────────────────────────────────
  const flipbookEl = document.getElementById('flipbook');
  initFlipbook(flipbookEl, pages, onPageChange);

  // ── Controls ───────────────────────────────────────────────────
  initControls({
    onPrev: () => { resumeAudioContext(); prevPage(); },
    onNext: () => { resumeAudioContext(); nextPage(); },
  });

  // ── Attract screen ─────────────────────────────────────────────
  initAttract();

  // ── Audio ──────────────────────────────────────────────────────
  loadFlipAudio('/assets/audio/flip.mp3');

  // ── First-interaction: fullscreen + audio context ──────────────
  let firstInteractionDone = false;
  function onFirstInteraction() {
    if (firstInteractionDone) return;
    firstInteractionDone = true;
    resumeAudioContext();
    document.documentElement
      .requestFullscreen({ navigationUI: 'hide' })
      .catch(() => { /* kiosk shell may have already claimed fullscreen */ });
  }
  document.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true });

  // ── Handle container resize (orientation change / Edge DevTools) ──
  const container = document.getElementById('flipbook-container');
  if (window.ResizeObserver) {
    new ResizeObserver(
      debounce(() => {
        // StPageFlip auto-resizes with size:'stretch'; nudging to the
        // current page keeps it in sync after large layout shifts.
        goToPage(getCurrentPageIndex());
      }, 200)
    ).observe(container);
  }
}

/** @param {number} index @param {number} total */
function onPageChange(index, total) {
  updatePageIndicator(index, total);
  playFlipSound();
}

/** @param {string} message */
function showError(message) {
  document.body.innerHTML = `
    <div style="
      color: #ece5d8;
      background: #16120e;
      font-family: 'Segoe UI', sans-serif;
      font-size: 1rem;
      padding: 3rem;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    ">
      <p style="max-width: 40ch; line-height: 1.6;">${message}</p>
    </div>
  `;
}
