// The creature keeps no records — only thresholds. localStorage only.
const KEY = 'sorrel';

let data = {
  movement: 1,
  nerves: null, // nerves.serialize()
  ratified: [], // wordIds
  used: {}, // wordId -> use count
  gaps: [], // wordIds permanently spent
  firstMotif: null,
  toyGifted: false,
  broken: false,
  repaired: false,
  named: false,
  ended: false,
};

export function loadPersist() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(data, JSON.parse(raw));
  } catch {}
  return data;
}

export function P() {
  return data;
}

export function saveP() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function mark(patch) {
  Object.assign(data, patch);
  saveP();
}
