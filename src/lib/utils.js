/**
 * Returns a function that delays invoking `fn` until after `wait` ms
 * have elapsed since the last invocation.
 * @param {() => void} fn
 * @param {number} wait  milliseconds
 */
export function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}
