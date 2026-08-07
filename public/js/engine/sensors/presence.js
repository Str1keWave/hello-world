import { emit } from '../bus.js';
import { titleChannel } from '../ctx.js';

export function mountPresence() {
  // --- tab visibility + title whisper channel
  let hiddenAt = 0;
  let titleTimer = null;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      emit('tab.hide', {});
      // rules set titleChannel.hidden before/at tab.hide; apply shortly after
      setTimeout(() => {
        if (!document.hidden) return;
        const msg = titleChannel.hidden;
        if (!msg) return;
        if (Array.isArray(msg)) {
          let i = 0;
          document.title = msg[0];
          titleTimer = setInterval(() => {
            i = (i + 1) % msg.length;
            document.title = msg[i];
          }, 4500);
        } else {
          document.title = msg;
        }
      }, 350);
    } else {
      clearInterval(titleTimer);
      document.title = titleChannel.normal;
      const awayMs = hiddenAt ? Date.now() - hiddenAt : 0;
      emit('tab.show', { awayMs, awaySec: Math.round(awayMs / 1000) });
    }
  });

  // --- idle detection with escalating thresholds
  const THRESHOLDS = [
    [30000, 'idle.30'],
    [120000, 'idle.120'],
    [600000, 'idle.600'],
  ];
  let idleSince = Date.now();
  let firedIdle = new Set();
  let wasIdle = false;

  function activity() {
    const idleMs = Date.now() - idleSince;
    if (wasIdle && idleMs > 30000) {
      emit('active.return', { idleMs, idleSec: Math.round(idleMs / 1000) });
    }
    idleSince = Date.now();
    firedIdle.clear();
    wasIdle = false;
  }

  for (const evt of ['pointerdown', 'pointermove', 'scroll', 'keydown', 'touchstart']) {
    addEventListener(evt, activity, { passive: true });
  }

  setInterval(() => {
    if (document.hidden) return;
    const idleMs = Date.now() - idleSince;
    for (const [ms, type] of THRESHOLDS) {
      if (idleMs >= ms && !firedIdle.has(type)) {
        firedIdle.add(type);
        wasIdle = true;
        emit(type, { idleMs });
      }
    }
  }, 5000);

  // --- viewport & orientation
  let baseH = innerHeight;
  addEventListener('resize', () => {
    const focused = document.activeElement;
    const typing = focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA');
    if (typing && innerHeight < baseH * 0.75) {
      emit('resize.keyboard', {});
    } else if (!typing && Math.abs(innerHeight - baseH) > 120) {
      emit('resize.viewport', { h: innerHeight });
      baseH = innerHeight;
    }
  });
  addEventListener('orientationchange', () => emit('orient.change', {}));

  // --- connection
  addEventListener('offline', () => emit('net.offline', {}));
  addEventListener('online', () => emit('net.online', {}));
}
