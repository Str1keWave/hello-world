// Port Sorrel. Boot order matters: body first, senses second, story last.
import { loadPersist } from './persist.js';
import { initSkin } from './skin.js';
import { buildStage, toyEl as stageToy } from './stage.js';
import { mountTouch } from './touch.js';
import { mountNerves, restore as nervesRestore, serialize as nervesSerialize } from './nerves.js';
import { mountPlay } from './play.js';
import { initLanguage } from './language.js';
import { startArc } from './arc.js';
import { P, mark } from './persist.js';
import { DEBUG } from './tunables.js';

const persisted = loadPersist();

buildStage(document.getElementById('page'));
const toyEl = stageToy;
initSkin(document.getElementById('skin'), document.getElementById('aura'));
mountTouch();
mountNerves();
if (persisted.nerves) {
  try { nervesRestore(persisted.nerves); } catch {}
}
mountPlay(toyEl);
initLanguage();
startArc();

// thresholds persist — the only memory it keeps
function saveNerves() {
  try { mark({ nerves: nervesSerialize() }); } catch {}
}
addEventListener('pagehide', saveNerves);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveNerves();
});

// reduced motion: the bioluminescence dialect
try {
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const apply = () => import('./skin.js').then((s) => s.setReducedMotion(rm.matches));
  apply();
  rm.addEventListener?.('change', apply);
} catch {}

if (DEBUG) {
  import('./debug.js').then((d) => d.mountDebug());
}
