// assets/js/main.js

/**********************
 * Disable page zoom  *
 **********************/
// Block Ctrl/Cmd +/−/0 zoom keys
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) {
    e.preventDefault();
  }
});
// Block trackpad pinch-to-zoom (Ctrl/Cmd + wheel)
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey || e.metaKey) e.preventDefault();
}, { passive: false });
// Block iOS Safari pinch gesture
document.addEventListener('gesturestart', (e) => e.preventDefault());
// Reduce double-tap zoom chance on clickable elements
document.documentElement.style.touchAction = 'manipulation';

/***************************
 * Photo grid (no clicks)  *
 ***************************/
const MAX_SHOW = 26;
const grid = document.getElementById('photo-grid');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderGrid(list) {
  if (!grid) return;
  grid.innerHTML = '';
  list.forEach(({ thumb, src, caption }) => {
    if (!src) return;
    const tile = document.createElement('div');
    tile.className = 'grid-item';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = thumb || src;
    img.alt = caption || 'Portfolio image';

    tile.appendChild(img);
    grid.appendChild(tile);
  });
}

async function buildGrid() {
  if (!grid) return;
  try {
    const res = await fetch('assets/photos.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const photos = await res.json();
    if (!Array.isArray(photos)) throw new Error('photos.json must be an array');

    // Shuffle and pick 26
    const shuffled = shuffle(photos.slice());
    let pick = shuffled.slice(0, Math.min(MAX_SHOW, shuffled.length));

    // Avoid showing the exact same set back-to-back
    const last = (sessionStorage.getItem('lastPhotos') || '')
      .split(',')
      .filter(Boolean);
    const key = (p) => p.src;
    const isSameSet = (list) => list.every((p) => last.includes(key(p)));
    if (last.length && photos.length > MAX_SHOW) {
      let attempts = 6;
      while (attempts-- && isSameSet(pick)) {
        pick = shuffle(photos.slice()).slice(0, MAX_SHOW);
      }
    }
    sessionStorage.setItem('lastPhotos', pick.map((p) => p.src).join(','));

    renderGrid(pick);
  } catch (err) {
    console.error('Failed to load photos.json:', err);
    const note = document.createElement('p');
    note.textContent = 'Could not load portfolio images.';
    note.style.color = '#a00';
    grid.appendChild(note);
  }
}

buildGrid();
