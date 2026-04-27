/**
 * Table-of-contents drawer.
 * Builds a list from pages.json entries that have a non-empty `title`.
 * Highlights the active spread on each page flip.
 */

import { goToPage } from './flipbook.js';

let isOpen = false;

/**
 * @param {Array<{src: string, title: string}>} pages
 */
export function initTOC(pages) {
  const drawer  = document.getElementById('toc-drawer');
  const overlay = document.getElementById('toc-overlay');
  const btnOpen = document.getElementById('btn-toc');
  const btnClose = document.getElementById('btn-toc-close');
  const list    = document.getElementById('toc-list');

  // Build list items from titled pages only
  pages.forEach((page, index) => {
    if (!page.title?.trim()) return;

    const li  = document.createElement('li');
    li.className = 'toc-item';

    const btn = document.createElement('button');
    btn.className = 'toc-item__btn';
    btn.dataset.pageIndex = String(index);
    btn.innerHTML = `
      <span class="toc-item__number">${String(index + 1).padStart(3, '0')}</span>
      <span class="toc-item__title">${escapeHtml(page.title)}</span>
    `.trim();

    btn.addEventListener('click', () => {
      goToPage(index);
      close();
    });

    li.appendChild(btn);
    list.appendChild(li);
  });

  btnOpen.addEventListener('click',  () => (isOpen ? close() : open()));
  btnClose.addEventListener('click', close);
  overlay.addEventListener('click',  close);

  // Swipe-left anywhere on the drawer closes it
  let touchStartX = 0;
  drawer.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  drawer.addEventListener('touchend', (e) => {
    if (touchStartX - e.changedTouches[0].clientX > 60) close();
  }, { passive: true });

  function open() {
    isOpen = true;
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    btnOpen.setAttribute('aria-expanded', 'true');
    // Move focus into the drawer for accessibility
    btnClose.focus();
  }

  function close() {
    isOpen = false;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    btnOpen.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Highlight the TOC entry for the currently visible spread.
 * StPageFlip reports the left-hand page index; we highlight any
 * TOC entry whose page index falls within the current spread (±1).
 * @param {number} currentIndex
 */
export function updateTOCActive(currentIndex) {
  document.querySelectorAll('.toc-item__btn').forEach((btn) => {
    const idx = parseInt(btn.dataset.pageIndex, 10);
    btn.classList.toggle('is-active', idx === currentIndex || idx === currentIndex + 1);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
