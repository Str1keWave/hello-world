import { emit } from '../bus.js';
import { state, save } from '../state.js';

const MASH = /^(asdf|asdfgh|qwer|qwerty|zxcv|jkl|hjkl|aaa+|xxx+|test|testing|abc|123|1234)/i;
const RUDE = /(fuck|shit|bitch|ass\b|dick|cunt|bastard)/i;

export function classifyName(raw) {
  const s = raw.trim();
  if (!s) return 'empty';
  if (/^loam$/i.test(s)) return 'own-name';
  if (RUDE.test(s)) return 'rude';
  if (MASH.test(s) || !/[aeiouy]/i.test(s)) return 'mash';
  if (/^[a-z][a-z'\- ]{1,29}$/i.test(s)) return 'plausible';
  return 'strange';
}

export function mountInput() {
  // --- selection & clipboard
  let selTimer = null;
  document.addEventListener('selectionchange', () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => {
      const sel = document.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (text.length > 3) {
        const anchor = sel.anchorNode?.parentElement;
        const section = anchor?.closest('section[id]')?.id || null;
        emit('text.select', { text: text.slice(0, 120), len: text.length, section });
      }
    }, 600);
  });

  document.addEventListener('copy', () => {
    const text = (document.getSelection()?.toString() || '').trim().slice(0, 120);
    emit('text.copy', { text });
  });
  document.addEventListener('cut', () => emit('text.cut', {}));
  document.addEventListener('paste', (e) => {
    const len = e.clipboardData ? (e.clipboardData.getData('text') || '').length : 0;
    emit('text.paste', { len });
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') emit('select.all', {});
    if (e.key === 'Tab' && !state.flags.keyboardNav) {
      state.flags.keyboardNav = true;
      save();
      emit('focus.keyboardnav', {});
    }
  });

  // --- the name field & form
  const form = document.getElementById('signup-form');
  const nameInput = document.getElementById('field-name');
  const emailInput = document.getElementById('field-email');
  if (!form || !nameInput) return;

  let prevVal = '';
  let lastKeyAt = 0;
  let keyGaps = [];
  let hesitated = false;

  for (const inp of [nameInput, emailInput].filter(Boolean)) {
    inp.addEventListener('focus', () => emit('input.focus', { field: inp.id }));
  }

  nameInput.addEventListener('input', () => {
    const v = nameInput.value;
    const t = Date.now();
    if (lastKeyAt) {
      const gap = t - lastKeyAt;
      keyGaps.push(gap);
      if (keyGaps.length > 40) keyGaps.shift();
      if (gap > 2500 && v.length >= 2 && !hesitated) {
        hesitated = true;
        emit('input.hesitation', { at: v.length });
      }
    }
    lastKeyAt = t;

    // typed-then-deleted: they emptied (or gutted) something real
    if (prevVal.length >= 4 && v.length <= prevVal.length - 4) {
      state.deletedText.push(prevVal);
      if (state.deletedText.length > 5) state.deletedText.shift();
      save();
      emit('input.deleted', { deleted: prevVal, remaining: v });
    }
    prevVal = v;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const kind = classifyName(name);
    const avgGap = keyGaps.length ? Math.round(keyGaps.reduce((a, b) => a + b, 0) / keyGaps.length) : null;

    if (kind === 'empty') {
      emit('input.submit.empty', {});
      return;
    }
    if (kind === 'plausible' || kind === 'strange') {
      state.name = name.slice(0, 30);
      save();
    }
    emit('input.submit.name', { name: name.slice(0, 60), kind, avgGap, email: !!emailInput?.value });
  });
}
