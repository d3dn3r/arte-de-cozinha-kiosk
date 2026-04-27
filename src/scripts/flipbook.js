/**
 * Thin wrapper around StPageFlip (npm: page-flip).
 *
 * Designed for a landscape two-page spread on a 3:2 display.
 * `size: 'stretch'` lets the library scale to fill the container;
 * width/height define the single-page aspect ratio (portrait 3:4).
 *
 * White-letterbox fix
 * ───────────────────
 * StPageFlip's internal Render.clear() does:
 *   ctx.fillStyle = "white";
 *   ctx.fillRect(0, 0, canvas.width, canvas.height);
 * on every animation frame.  CSS rules and inline-style removal cannot
 * reach drawn canvas pixels, so we intercept fillRect on the 2D context
 * and replace that specific call with clearRect (transparent).
 *
 * We hook the canvas the moment StPageFlip appends it to the DOM
 * (MutationObserver in watchForCanvas) so the very first drawFrame
 * already uses transparent letterbox areas instead of white.
 * The observer disconnects immediately after patching — no ongoing cost.
 */

import { PageFlip } from 'page-flip';

/** @type {PageFlip | null} */
let pageFlip = null;

/**
 * @param {HTMLElement} containerEl  The #flipbook div
 * @param {Array<{src: string, title: string}>} pages
 * @param {(currentIndex: number, total: number) => void} onPageChange
 * @returns {PageFlip}
 */
export function initFlipbook(containerEl, pages, onPageChange) {
  // Patch the canvas the instant StPageFlip creates it — before
  // the first drawFrame() fires — so the initial render is clean.
  watchForCanvas(containerEl);

  pageFlip = new PageFlip(containerEl, {
    // Single-page natural dimensions — ratio is what matters with size:stretch
    width:  768,
    height: 1024,
    size:   'stretch',

    // Floor / ceiling for the stretch scaling
    minWidth:  280,
    maxWidth:  1200,
    minHeight: 380,
    maxHeight: 1600,

    // Landscape book: always show two pages side-by-side
    usePortrait:        false,

    // showCover: false → every page pairs into a full spread
    showCover:          false,

    // Flip animation
    flippingTime:       650,
    drawShadow:         true,
    maxShadowOpacity:   0.45,

    // Mouse / touch interaction
    useMouseEvents:     true,
    swipeDistance:      40,
    mobileScrollSupport: false,

    startPage: 0,
  });

  pageFlip.loadFromImages(pages.map((p) => p.src));

  pageFlip.on('flip', (e) => {
    onPageChange(e.data, pageFlip.getPageCount());
  });

  pageFlip.on('init', (e) => {
    onPageChange(e.data, pageFlip.getPageCount());
    // Belt-and-suspenders in case watchForCanvas fired before loadFromImages
    patchAllCanvases(containerEl);
    // Strip any inline background styles on wrapper divs, keep stripping on mutations
    stripInlineBackgrounds(containerEl);
    watchForStyleMutations(containerEl);
  });

  return pageFlip;
}

// ── Canvas transparent-letterbox patch ───────────────────────────────

/**
 * Patches a canvas context so StPageFlip's Render.clear()
 * (fillStyle=white, full-canvas fillRect) becomes a transparent clearRect.
 *
 * The patch is idempotent (__sfpPatched guard) and only intercepts the
 * exact full-canvas white fill; shadow gradients are left untouched.
 */
function patchCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx || ctx.__sfpPatched) return;
  ctx.__sfpPatched = true;

  const origFillRect = ctx.fillRect.bind(ctx);
  ctx.fillRect = function (x, y, w, h) {
    if (
      (this.fillStyle === '#ffffff' || this.fillStyle === 'white') &&
      x === 0 && y === 0 &&
      w === canvas.width && h === canvas.height
    ) {
      this.clearRect(0, 0, w, h);
      return;
    }
    origFillRect(x, y, w, h);
  };
}

function patchAllCanvases(root) {
  root.querySelectorAll('canvas').forEach(patchCanvas);
}

/**
 * One-shot MutationObserver that patches the StPageFlip canvas the
 * instant it is appended to the DOM (before the first drawFrame call).
 * Disconnects immediately after finding the canvas — zero ongoing cost.
 */
function watchForCanvas(root) {
  const observer = new MutationObserver((mutations, obs) => {
    let patched = false;
    for (const { type, addedNodes } of mutations) {
      if (type !== 'childList') continue;
      for (const node of addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.tagName === 'CANVAS') { patchCanvas(node); patched = true; }
        node.querySelectorAll?.('canvas').forEach(c => { patchCanvas(c); patched = true; });
      }
    }
    if (patched) obs.disconnect();
  });
  observer.observe(root, { childList: true, subtree: true });
}

// ── Inline background stripping ───────────────────────────────────────

/**
 * Removes inline `background` / `background-color` from StPageFlip's
 * shadow wrapper divs.  IMG and CANVAS are skipped intentionally.
 */
function stripInlineBackgrounds(root) {
  root.querySelectorAll('*').forEach((el) => {
    if (el.tagName === 'IMG' || el.tagName === 'CANVAS') return;
    el.style.removeProperty('background');
    el.style.removeProperty('background-color');
  });
}

/**
 * Ongoing MutationObserver that re-strips inline backgrounds whenever
 * StPageFlip mutates shadow element styles during flip animations.
 * Debounced to one pass per rAF to avoid layout thrashing.
 */
function watchForStyleMutations(root) {
  let rafId = null;
  new MutationObserver(() => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      stripInlineBackgrounds(root);
      rafId = null;
    });
  }).observe(root, {
    childList:       true,
    subtree:         true,
    attributes:      true,
    attributeFilter: ['style'],
  });
}

// ── Public navigation API ─────────────────────────────────────────────

export function prevPage()  { pageFlip?.flipPrev('bottom'); }
export function nextPage()  { pageFlip?.flipNext('bottom'); }

/** @param {number} index */
export function goToPage(index) { pageFlip?.flip(index, 'bottom'); }

export function getCurrentPageIndex() { return pageFlip?.getCurrentPageIndex() ?? 0; }
export function getPageCount()        { return pageFlip?.getPageCount() ?? 0; }
