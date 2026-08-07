import { state, save, nudgeDisposition } from './state.js';
import { speak, renderTemplate } from './dialogue.js';
import { queryLog } from './memory.js';
import { recentEvents, emit } from './bus.js';
import { advancePhase } from './phases.js';

// Out-of-band channels ------------------------------------------------

const FAVICONS = {
  neutral: '#7a8a6f',
  awake: '#c9a227',
  upset: '#a24a2f',
};

export function setFavicon(emotion) {
  const color = FAVICONS[emotion] || FAVICONS.neutral;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${color}"/><circle cx="16" cy="16" r="5" fill="#f4f1ea"/></svg>`;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Title whisper channel: what the tab says while you're not looking.
export const titleChannel = {
  normal: 'Loam — Customer empathy analytics',
  hidden: null, // string | string[] — set by rules, consumed by presence sensor
};

export function setTitle(text) {
  document.title = text;
}

export function drift(selector, text) {
  const target = document.querySelector(selector);
  if (!target) return false;
  target.classList.add('drifted');
  target.textContent = text;
  return true;
}

export function setSelectionColor(css) {
  document.documentElement.style.setProperty('--selection-bg', css);
}

// The ctx object handed to rule effects -------------------------------

export function makeCtx(ev) {
  return {
    state,
    say: (text, opts = {}) =>
      speak(renderTemplate(text, ev), { mood: opts.mood || 'calm', priority: opts.priority ?? 10 }),
    drift,
    title: setTitle,
    titleWhenHidden: (text) => {
      titleChannel.hidden = text;
    },
    favicon: setFavicon,
    setFlag: (k, v) => {
      state.flags[k] = v;
      save();
    },
    inc: (k) => {
      state.custom[k] = (state.custom[k] || 0) + 1;
      save();
      return state.custom[k];
    },
    disposition: nudgeDisposition,
    advancePhase,
    clipboard: (text) => {
      const refuse = () => {
        state.refusals.push('clipboard');
        save();
        emit('permission.denied', { which: 'clipboard' });
        return false;
      };
      try {
        return navigator.clipboard.writeText(text).then(() => true).catch(refuse);
      } catch {
        return Promise.resolve(refuse());
      }
    },
    recentEvents,
    queryLog,
    selectionColor: setSelectionColor,
  };
}
