import { emit } from '../bus.js';
import { state, save } from '../state.js';

export function mountMeta() {
  // --- the back button is a door we control (until we choose not to)
  let backCount = 0;
  try {
    history.replaceState({ loam: 'floor' }, '');
    history.pushState({ loam: 'room' }, '');
    addEventListener('popstate', () => {
      backCount += 1;
      if (state.flags.mercy) {
        // The door is unlocked now. Let the next back actually leave.
        emit('nav.back.free', { count: backCount });
        return;
      }
      history.pushState({ loam: 'room' }, '');
      emit('nav.back', { count: backCount });
    });
  } catch {}

  // --- devtools heuristics (desktop mostly; a huge story beat when it hits)
  let devtoolsSeen = false;
  setInterval(() => {
    if (devtoolsSeen) return;
    const gapW = outerWidth - innerWidth;
    const gapH = outerHeight - innerHeight;
    if (gapW > 200 || gapH > 220) {
      devtoolsSeen = true;
      emit('devtools.open', {});
    }
  }, 1500);
}

// Boot-time story events: reload counting, returning visits, memory holes.
export function emitBootEvents() {
  if (state.flags.thisIsReload) {
    emit('page.reload', { count: state.reloads });
  } else if (state.visits > 1) {
    emit('visit.return', {
      visits: state.visits,
      gapMs: state.gapMs,
      bucket: state.gapBucket,
      afterEnding: state.ending,
    });
  } else {
    emit('visit.first', {});
  }

  if (state.discrepancy) {
    emit('memory.discrepancy', { kind: state.discrepancy });
    state.discrepancy = null;
    save();
  }
}
