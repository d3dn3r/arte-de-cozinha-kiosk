/**
 * Idle / attract screen with auto page-flip demo.
 *
 * After IDLE_MS of no user interaction:
 *   1. The attract overlay fades in over the book.
 *   2. The book automatically flips to the next page every FLIP_MS.
 *   3. When the last page is reached, it wraps back to page 0.
 *
 * Any touch / pointer event on the screen dismisses the overlay,
 * resets to page 1, and restarts the idle countdown.
 */

import { goToPage, nextPage, getCurrentPageIndex, getPageCount } from './flipbook.js';

const IDLE_MS = 90_000;  // 90 s idle before attract activates
const FLIP_MS =  6_000;  // 6 s between automatic page turns

let idleTimer     = null;
let flipInterval  = null;
let attractUp     = false;

/** @param {{ onDismiss?: () => void }} [opts] */
export function initAttract(opts = {}) {
  const screen = document.getElementById('attract-screen');

  function show() {
    if (attractUp) return;
    attractUp = true;

    goToPage(0);
    screen.classList.add('is-active');
    screen.setAttribute('aria-hidden', 'false');
    clearTimeout(idleTimer);

    // Begin auto-flipping
    flipInterval = setInterval(() => {
      const current = getCurrentPageIndex();
      const total   = getPageCount();
      // Wrap around when near the end (last or second-to-last page)
      if (total > 0 && current >= total - 2) {
        goToPage(0);
      } else {
        nextPage();
      }
    }, FLIP_MS);
  }

  function dismiss() {
    if (!attractUp) return;
    attractUp = false;

    clearInterval(flipInterval);
    flipInterval = null;

    screen.classList.remove('is-active');
    screen.setAttribute('aria-hidden', 'true');

    goToPage(0);          // reset reader to the beginning
    opts.onDismiss?.();
    resetTimer();
  }

  function resetTimer() {
    clearTimeout(idleTimer);
    if (!attractUp) {
      idleTimer = setTimeout(show, IDLE_MS);
    }
  }

  // Dismiss on any direct interaction with the attract overlay
  screen.addEventListener('pointerdown', dismiss);

  // Reset idle timer on any user activity
  const ACTIVITY = ['pointerdown', 'pointermove', 'keydown', 'wheel'];
  ACTIVITY.forEach((ev) => {
    document.addEventListener(ev, () => {
      if (!attractUp) resetTimer();
    }, { passive: true });
  });

  // Kick off the initial idle countdown
  resetTimer();
}
