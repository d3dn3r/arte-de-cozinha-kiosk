/**
 * Optional soft page-flip audio.
 *
 * Place a short audio file at public/assets/audio/flip.mp3.
 * All failures are swallowed — audio is enhancement only.
 * AudioContext must be resumed inside a user-gesture handler;
 * call resumeAudioContext() on first interaction.
 */

/** @type {AudioContext | null} */
let ctx = null;

/** @type {AudioBuffer | null} */
let flipBuffer = null;

function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

/**
 * Fetch and decode the flip sound. Call once at startup.
 * @param {string} url  e.g. '/assets/audio/flip.mp3'
 */
export async function loadFlipAudio(url) {
  try {
    const audioCtx   = getContext();
    const response   = await fetch(url);
    if (!response.ok) return;
    const arrayBuf   = await response.arrayBuffer();
    flipBuffer       = await audioCtx.decodeAudioData(arrayBuf);
  } catch {
    /* audio file missing or decode failed — silently skip */
  }
}

/**
 * Play the flip sound. No-ops if audio hasn't loaded.
 */
export function playFlipSound() {
  if (!flipBuffer || !ctx) return;
  try {
    const source = ctx.createBufferSource();
    source.buffer = flipBuffer;
    // Slight low-pass to soften the sound in a quiet gallery space
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 6000;
    source.connect(filter);
    filter.connect(ctx.destination);
    source.start(0);
  } catch { /* fail silently */ }
}

/**
 * Resume a suspended AudioContext. Must be called from inside a
 * user-gesture event handler (pointerdown, click, etc.).
 */
export function resumeAudioContext() {
  ctx?.resume().catch(() => {});
}
