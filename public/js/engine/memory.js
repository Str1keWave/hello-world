// Memory channels: localStorage (long-term), sessionStorage (working),
// cookies (redundant shadow copy), IndexedDB (full event log).

const LS_KEY = 'loam.m';
const SS_KEY = 'loam.s';
const DB_NAME = 'loam-log';
const STORE = 'events';
const LOG_CAP = 6000;

export const store = {
  loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  saveLocal(obj) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(obj));
    } catch {}
  },
  loadSession() {
    try {
      const raw = sessionStorage.getItem(SS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  saveSession(obj) {
    try {
      sessionStorage.setItem(SS_KEY, JSON.stringify(obj));
    } catch {}
  },
};

// --- cookies: a few key facts, so wiping one store but not the other is visible
export const cookies = {
  get(k) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + k + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  },
  set(k, v) {
    try {
      document.cookie = `${k}=${encodeURIComponent(v)}; max-age=${60 * 60 * 24 * 400}; path=/; SameSite=Lax`;
    } catch {}
  },
  writeShadow(state) {
    this.set('lm_v', String(state.visits));
    this.set('lm_t', String(state.lastSeen || Date.now()));
    if (state.name) this.set('lm_n', state.name);
    if (state.ending) this.set('lm_e', state.ending);
  },
  readShadow() {
    const v = this.get('lm_v');
    if (v === null) return null;
    return {
      visits: parseInt(v, 10) || 0,
      lastSeen: parseInt(this.get('lm_t') || '0', 10) || 0,
      name: this.get('lm_n'),
      ending: this.get('lm_e'),
    };
  },
};

// --- IndexedDB event log
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        const os = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        os.createIndex('type', 'type');
        os.createIndex('t', 't');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

let pendingWrites = [];
let flushScheduled = false;

export async function logEvent(type, data, t) {
  pendingWrites.push({ type, data: sanitize(data), t });
  if (!flushScheduled) {
    flushScheduled = true;
    setTimeout(flushLog, 1200);
  }
}

function sanitize(data) {
  // keep the log JSON-clean and small
  try {
    return data == null ? null : JSON.parse(JSON.stringify(data));
  } catch {
    return null;
  }
}

async function flushLog() {
  flushScheduled = false;
  const batch = pendingWrites;
  pendingWrites = [];
  const db = await openDB();
  if (!db || !batch.length) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const os = tx.objectStore(STORE);
    for (const e of batch) os.add(e);
  } catch {}
}

export async function queryLog(type, limit = 20) {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const src = type ? tx.objectStore(STORE).index('type') : tx.objectStore(STORE);
      const range = type ? IDBKeyRange.only(type) : null;
      const out = [];
      const req = src.openCursor(range, 'prev');
      req.onsuccess = () => {
        const cur = req.result;
        if (cur && out.length < limit) {
          out.push(cur.value);
          cur.continue();
        } else {
          resolve(out);
        }
      };
      req.onerror = () => resolve(out);
    } catch {
      resolve([]);
    }
  });
}

export async function logCount() {
  const db = await openDB();
  if (!db) return 0;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

// Trim oldest entries when the log grows past cap. Called once at boot.
export async function trimLog() {
  const db = await openDB();
  if (!db) return;
  const count = await logCount();
  if (count <= LOG_CAP) return;
  let toDelete = count - LOG_CAP;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (cur && toDelete > 0) {
        cur.delete();
        toDelete--;
        cur.continue();
      }
    };
  } catch {}
}
