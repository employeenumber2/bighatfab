/**********************
 * Disable page zoom  *
 **********************/
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault();
});
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey || e.metaKey) e.preventDefault();
}, { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.documentElement.style.touchAction = 'manipulation';

/***************************
 * Photo grid (no clicks)  *
 ***************************/
const MAX_SHOW = 24;
const grid = document.getElementById('photo-grid');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function render(list) {
  if (!grid) return;
  grid.innerHTML = '';
  list.forEach(({ src, thumb }) => {
    const tile = document.createElement('div');
    tile.className = 'grid-item';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = thumb || src;
    img.alt = ''; // purely visual tiles

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

    // shuffle and show 24
    const pick = shuffle(photos.slice()).slice(0, Math.min(MAX_SHOW, photos.length));
    render(pick);
  } catch (err) {
    console.error('Failed to load photos.json:', err);
  }
}

buildGrid();
