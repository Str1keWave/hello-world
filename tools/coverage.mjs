// Coverage matrix: trigger family × phase, from the actual rule data.
// Run: node tools/coverage.mjs
const families = ['fallbacks', 'touch', 'scroll', 'input', 'presence', 'environment', 'meta', 'returning', 'narrative'];

const all = [];
for (const f of families) {
  const mod = await import(`../public/js/content/${f}.js`);
  for (const r of mod.default) all.push({ family: f, ...r });
}

const ids = new Set();
let dupes = 0;
for (const r of all) {
  if (ids.has(r.id)) {
    console.error(`DUPLICATE ID: ${r.id}`);
    dupes++;
  }
  ids.add(r.id);
}

const matrix = {};
for (const r of all) {
  const [lo, hi] = r.phase || [0, 4];
  matrix[r.family] ??= { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, total: 0, spoken: 0, silent: 0 };
  matrix[r.family].total++;
  if (r.silent) matrix[r.family].silent++;
  if (r.say) matrix[r.family].spoken++;
  for (let p = lo; p <= hi; p++) matrix[r.family][p]++;
}

const events = {};
for (const r of all) for (const t of Array.isArray(r.on) ? r.on : [r.on]) events[t] = (events[t] || 0) + 1;

console.log('family        p0   p1   p2   p3   p4   total  spoken  silent');
for (const [f, m] of Object.entries(matrix)) {
  console.log(
    f.padEnd(12),
    ...[0, 1, 2, 3, 4].map((p) => String(m[p]).padStart(4)),
    String(m.total).padStart(7),
    String(m.spoken).padStart(7),
    String(m.silent).padStart(7)
  );
}
console.log(`\nTOTAL RULES: ${all.length}  (duplicate ids: ${dupes})`);
console.log(`EVENT TYPES COVERED: ${Object.keys(events).length}`);
const thin = Object.entries(events).filter(([, n]) => n < 2).map(([t]) => t);
if (thin.length) console.log(`thin coverage (only fallback floor): ${thin.join(', ')}`);
process.exit(dupes ? 1 : 0);
