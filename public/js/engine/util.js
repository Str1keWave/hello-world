export const now = () => Date.now();

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function humanizeGap(ms) {
  const m = ms / 60000;
  if (m < 1) return 'under a minute';
  if (m < 2) return 'a minute';
  if (m < 60) return `${Math.round(m)} minutes`;
  const h = m / 60;
  if (h < 1.5) return 'an hour';
  if (h < 24) return `${Math.round(h)} hours`;
  const d = h / 24;
  if (d < 1.5) return 'a day';
  if (d < 7) return `${Math.round(d)} days`;
  const w = d / 7;
  if (w < 1.5) return 'a week';
  if (w < 8) return `${Math.round(w)} weeks`;
  return 'a long time';
}

export function gapBucket(ms) {
  const m = ms / 60000;
  if (m < 3) return 'moments';
  if (m < 60) return 'minutes';
  if (m < 60 * 24) return 'hours';
  if (m < 60 * 24 * 7) return 'days';
  return 'weeks';
}

export function hourBucket(h) {
  if (h >= 0 && h < 5) return 'deepnight';
  if (h < 9) return 'earlymorning';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 22) return 'evening';
  return 'latenight';
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function timeStamp(t) {
  const d = new Date(t);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function debounce(fn, ms) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

export function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const t = now();
    if (t - last >= ms) {
      last = t;
      fn(...args);
    }
  };
}
