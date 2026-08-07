import { emit } from '../bus.js';
import { hourBucket } from '../util.js';

// Read once at boot, weaponize narratively. Each signal is its own event
// so rules can react (or bank it) independently.
export function mountEnvironment() {
  const d = new Date();
  emit('env.time', { hour: d.getHours(), minute: d.getMinutes(), bucket: hourBucket(d.getHours()), day: d.getDay() });

  try {
    emit('env.scheme', { dark: matchMedia('(prefers-color-scheme: dark)').matches });
  } catch {}
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) emit('env.reducedMotion', {});
  } catch {}

  emit('env.language', { lang: navigator.language || 'unknown' });

  const conn = navigator.connection;
  if (conn) emit('env.connection', { type: conn.effectiveType, saveData: !!conn.saveData });

  if (navigator.deviceMemory) emit('env.memory', { gb: navigator.deviceMemory });

  const params = new URLSearchParams(location.search);
  const entries = [...params.entries()].filter(([k]) => k !== 'debug');
  if (entries.length || document.referrer) {
    emit('env.referral', { params: Object.fromEntries(entries), referrer: document.referrer || null });
  }

  if (navigator.getBattery) {
    navigator.getBattery().then((b) => {
      emit('env.battery', { level: Math.round(b.level * 100), charging: b.charging });
    }).catch(() => {});
  }

  // incognito heuristic: private windows report tiny storage quotas
  if (navigator.storage?.estimate) {
    navigator.storage.estimate().then(({ quota }) => {
      if (quota && quota < 200 * 1024 * 1024) emit('env.incognito', { quotaMB: Math.round(quota / 1048576) });
    }).catch(() => {});
  }
}
