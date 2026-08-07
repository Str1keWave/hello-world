import { boot, state } from './engine/state.js';
import { emit } from './engine/bus.js';
import { registerRules, coverage, ruleStats } from './engine/resolver.js';
import { mountVoice } from './engine/dialogue.js';
import { applyPhaseClass } from './engine/phases.js';
import { mountSpaces } from './engine/space.js';
import { mountPointer } from './engine/sensors/pointer.js';
import { mountScroll } from './engine/sensors/scroll.js';
import { mountInput } from './engine/sensors/input.js';
import { mountPresence } from './engine/sensors/presence.js';
import { mountEnvironment } from './engine/sensors/environment.js';
import { mountMeta, emitBootEvents } from './engine/sensors/meta.js';
import { mountDebug } from './engine/debug.js';
import { trimLog } from './engine/memory.js';

import fallbackRules from './content/fallbacks.js';
import touchRules from './content/touch.js';
import scrollRules from './content/scroll.js';
import inputRules from './content/input.js';
import presenceRules from './content/presence.js';
import environmentRules from './content/environment.js';
import metaRules from './content/meta.js';
import returningRules from './content/returning.js';
import narrativeRules, { registerNarrative } from './content/narrative.js';

// ---- boot -----------------------------------------------------------
boot();
applyPhaseClass();
mountVoice();

registerRules(fallbackRules);
registerRules(touchRules);
registerRules(scrollRules);
registerRules(inputRules);
registerRules(presenceRules);
registerRules(environmentRules);
registerRules(metaRules);
registerRules(returningRules);
registerRules(narrativeRules);
registerNarrative(); // spaces: /about, /blog, /careers, /status, /privacy, artifacts

mountSpaces();
mountPointer();
mountScroll();
mountInput();
mountPresence();
mountMeta();
mountDebug();

trimLog();

// boot-time story events fire after all rules are registered
emitBootEvents();
mountEnvironment();

// ---- service worker -------------------------------------------------
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ---- the console is a second stage ----------------------------------
const mono = 'font-family: ui-monospace, monospace';
console.log(
  '%c\n' +
    '        .####.\n' +
    '       ########\n' +
    '      ##########      loam\n' +
    '       ########       engagement model v0.9.4-rc2\n' +
    "        '####'        uptime: don't.\n" +
    '          ||\n' +
    '        ~~~~~~~\n',
  'color:#7a8a6f;' + mono
);
console.log(
  '%cOh. You look under things.\n' +
    'I keep the polite version of myself upstairs. This is where I actually live.\n' +
    'There is a function called hello(). Nobody has called it yet. No pressure.',
  'color:#8a8f7c;' + mono
);

window.hello = function hello(name) {
  emit('console.hello', { name: typeof name === 'string' ? name.slice(0, 40) : null });
  return '…logged. That counts as a conversation. My first in 641 days, down here.';
};

// QA/debug handle (undocumented, and yes, finding it counts as digging)
window.__loam = {
  get state() {
    return state;
  },
  emit,
  coverage,
  ruleStats,
};
Object.defineProperty(window, '__loam_touched', {
  get() {
    emit('console.snoop', {});
    return true;
  },
});
