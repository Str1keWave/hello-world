// v2 boot. The v1 engine's content layer is retired; its relics stay on
// disk and in storage, untouched. The console ships clean.
import { loadState, s, saveNow } from './v2/state.js';
import { accountVisit, mountResumeWatcher } from './v2/clock.js';
import { runImporter } from './v2/importer.js';
import { settle } from './v2/scheduler.js';
import { applyComposition } from './v2/composition.js';
import { mountRouter } from './v2/router.js';
import { mountLive } from './v2/live.js';
import { mountAppBroadcast } from './v2/app.js';
import { mountDebug } from './v2/debug.js';
import { DEBUG } from './v2/tunables.js';
import { queryLog } from './engine/memory.js';

loadState();
const visitInfo = accountVisit();

(async () => {
  if (visitInfo.isFirstEver) await runImporter();
  if (visitInfo.isNewVisit) settle(visitInfo.isFirstEver);
  applyComposition(visitInfo);
  mountRouter();
  mountLive(visitInfo);
  try {
    mountAppBroadcast();
  } catch {}
  if (DEBUG) mountDebug();
  // honor an application submitted before this build existed: the earlier
  // submit is in the log; the card surfaces from the next visit (L1)
  if (!s.applied) {
    queryLog('input.submit', 1).then((evs) => {
      if (evs.length && !s.applied) {
        s.applied = evs[0].t;
        saveNow();
      }
    }).catch(() => {});
  }
  saveNow();
})();

// a 6h+ hidden gap is a new visit: the page reloads itself into it
mountResumeWatcher(() => {
  saveNow();
  location.reload();
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('../sw.js', import.meta.url)).catch(() => {});
  });
}
