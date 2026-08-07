// Tiny synchronous event bus. Names and payloads: docs/room3/CONTRACT.md.
const map = new Map();

export function on(type, fn) {
  if (!map.has(type)) map.set(type, new Set());
  map.get(type).add(fn);
  return () => map.get(type).delete(fn);
}

export function emit(type, data) {
  const set = map.get(type);
  if (set) for (const fn of [...set]) {
    try { fn(data); } catch (e) { /* silent; debug overlay surfaces state */ }
  }
  const all = map.get('*');
  if (all) for (const fn of [...all]) {
    try { fn(type, data); } catch (e) {}
  }
}
