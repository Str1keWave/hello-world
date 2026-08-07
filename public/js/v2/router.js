// Minimal SPA router for the subpages. No traps: the back button works.
import { s } from './state.js';
import { renderStatus } from './status.js';
import { renderSubpage } from './pages.js';
import { renderApp } from './app.js';
import { logEvent } from '../engine/memory.js';

export const BASE = new URL('../../', import.meta.url).pathname;

function logical(fullPath) {
  return fullPath.startsWith(BASE) ? '/' + fullPath.slice(BASE.length) : fullPath;
}

let el = null;

export function mountRouter() {
  el = document.getElementById('space');

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    e.preventDefault();
    const path = logical(new URL(link.href, location.href).pathname);
    try {
      history.pushState({ v2: path }, '', BASE + path.slice(1));
    } catch {}
    open(path);
  });

  addEventListener('popstate', () => {
    const path = logical(location.pathname);
    if (path === '/' || path === '/index.html' || path === '/404.html') close();
    else open(path);
  });

  const deep = logical(location.pathname);
  if (deep !== '/' && deep !== '/index.html' && deep !== '/404.html') open(deep);
}

export function open(path) {
  if (s.ended) return; // the sunset is the only page now
  let html = null;
  if (path === '/status') html = renderStatus();
  else if (path === '/app') {
    logEvent('app.probe', {}, Date.now());
    html = renderApp();
  } else html = renderSubpage(path);
  if (html == null) return;

  el.innerHTML = `<div class="space-inner">${html}</div>`;
  el.hidden = false;
  el.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  el.querySelectorAll('[data-close-space]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        history.pushState({ v2: '/' }, '', BASE);
      } catch {}
      close();
    })
  );
  el.dispatchEvent(new CustomEvent('space:open', { detail: { path } }));
}

export function close() {
  if (!el || el.hidden) return;
  el.hidden = true;
  el.innerHTML = '';
  document.body.style.overflow = '';
}
