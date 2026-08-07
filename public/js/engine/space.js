import { emit } from './bus.js';
import { state } from './state.js';

// The narrative layer: nav links "break" into these full-screen spaces.
// Content registers a renderer per path; unregistered paths get the 404
// that isn't (which is itself phase-aware via the renderer for '*').

const spaces = new Map();

// Base path of the deployment (works at "/" and under a subpath like
// "/hello-world/"): this file lives at BASE + "js/engine/space.js".
export const BASE = new URL('../../', import.meta.url).pathname;

function logicalOf(fullPath) {
  return fullPath.startsWith(BASE) ? '/' + fullPath.slice(BASE.length) : fullPath;
}

export function registerSpace(path, render) {
  spaces.set(path, render);
}

let spaceEl = null;
let openPath = null;

export function mountSpaces() {
  spaceEl = document.getElementById('space');

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    e.preventDefault();
    const path = logicalOf(new URL(link.href, location.href).pathname);
    try {
      history.pushState({ loam: 'space', path }, '', BASE + path.slice(1));
    } catch {}
    openPath = path;
    renderPath(path);
  });

  // deep link straight into a space
  const logical = logicalOf(location.pathname);
  if (logical !== '/' && logical !== '/index.html' && logical !== '/404.html') {
    openPath = logical;
    renderPath(logical);
  }
}

export function renderPath(path) {
  const render = spaces.get(path) || spaces.get('*');
  if (!render) return;
  const html = render(state, path);
  if (html == null) return;
  // Early phases fake a loading state. (Phase 3 admits this was a lie.)
  if (state.phase <= 1 && path !== '/end') {
    spaceEl.innerHTML = `<div class="space-inner"><p class="muted">Loading…</p></div>`;
    spaceEl.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (!spaceEl.hidden) finishRender(path, html);
    }, 1100);
    return;
  }
  finishRender(path, html);
}

function finishRender(path, html) {
  spaceEl.innerHTML = `<div class="space-inner">${html}</div>`;
  spaceEl.hidden = false;
  spaceEl.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  emit('page.404', { path });

  spaceEl.querySelectorAll('[data-close-space]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeSpace();
    })
  );
  // let renderers wire their own extras
  spaceEl.dispatchEvent(new CustomEvent('space:open', { detail: { path } }));
}

export function closeSpace() {
  if (!spaceEl || spaceEl.hidden) return;
  spaceEl.hidden = true;
  spaceEl.innerHTML = '';
  document.body.style.overflow = '';
  openPath = null;
  try {
    history.pushState({ loam: 'room' }, '', BASE);
  } catch {}
  emit('space.close', {});
}

export function currentSpace() {
  return openPath;
}

export function spaceRoot() {
  return spaceEl;
}
