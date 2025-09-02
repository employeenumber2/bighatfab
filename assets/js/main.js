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
const MAX_SHOW = 26;
const CONCURRENCY = 6;
const grid = document.getElementById('photo-grid');

function shuffle(arr){ for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr }

function loadImage(src, thumb){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = thumb || src;
    img.alt = ""; // no visible fallback text
    img.onload = () => resolve(img);
    img.onerror = () => reject(src);
  });
}

async function buildGrid(){
  if (!grid) return;
  grid.innerHTML = "";

  // Fetch list
  let photos;
  try {
    const res = await fetch('assets/photos.json', { cache:'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    photos = await res.json();
    if (!Array.isArray(photos)) throw new Error('photos.json must be an array');
  } catch (err) {
    console.error('Failed to load photos.json:', err);
    return;
  }

  // Randomize; try not to repeat the exact previous set
  const all = shuffle(photos.slice());
  const last = (sessionStorage.getItem('lastPhotos') || '').split(',').filter(Boolean);
  if (last.length && photos.length > MAX_SHOW && all.slice(0, MAX_SHOW).every(p => last.includes(p.src))) {
    shuffle(all);
  }

  // Stream tiles in with limited concurrency, skipping any broken ones
  let appended = 0, i = 0, skipped = [];
  async function pump(){
    if (appended >= MAX_SHOW || i >= all.length) return;
    const { src, thumb } = all[i++];

    try {
      const img = await loadImage(src, thumb);
      // only append after a successful load
      const tile = document.createElement('div');
      tile.className = 'grid-item';
      tile.appendChild(img);
      grid.appendChild(tile);
      appended++;
    } catch (badSrc) {
      skipped.push(badSrc);
    } finally {
      if (appended < MAX_SHOW && i < all.length) pump();
    }
  }
  // Kick off a few parallel loaders
  const starters = Math.min(CONCURRENCY, all.length);
  for (let k = 0; k < starters; k++) pump();

  // Persist what we showed this time
  const observer = new MutationObserver(() => {
    const shown = Array.from(grid.querySelectorAll('img')).map(img => img.src);
    if (shown.length >= MAX_SHOW || (i >= all.length && shown.length)) {
      sessionStorage.setItem('lastPhotos', shown.map(u => u.replace(location.origin, '')).join(','));
      observer.disconnect();
      if (skipped.length) console.warn('Skipped missing images:', skipped.slice(0,10), skipped.length > 10 ? `(+${skipped.length-10} more)` : '');
    }
  });
  observer.observe(grid, { childList: true });

}

buildGrid();
