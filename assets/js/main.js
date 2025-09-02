// assets/js/main.js

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
const grid = document.getElementById('photo-grid');

function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr }

function loadTile(photo){
  return new Promise((resolve, reject) => {
    const { thumb, src, caption } = photo;
    if (!src) return reject('missing src');

    const img = new Image();
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = thumb || src;
    img.alt = caption || 'Portfolio image';

    img.onload = () => {
      const tile = document.createElement('div');
      tile.className = 'grid-item';
      tile.appendChild(img);
      resolve(tile);
    };
    img.onerror = () => reject(src);
  });
}

async function buildGrid(){
  if (!grid) return;
  try {
    const res = await fetch('assets/photos.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const photos = await res.json();
    if (!Array.isArray(photos)) throw new Error('photos.json must be an array');

    // Shuffle and pick
    const shuffled = shuffle(photos.slice());
    let pick = shuffled.slice(0, Math.min(MAX_SHOW, shuffled.length));

    // Try not to repeat exact set back-to-back
    const last = (sessionStorage.getItem('lastPhotos') || '').split(',').filter(Boolean);
    const sameSet = last.length && pick.every(p => last.includes(p.src));
    if (sameSet && photos.length > MAX_SHOW){
      pick = shuffle(photos.slice()).slice(0, MAX_SHOW);
    }
    sessionStorage.setItem('lastPhotos', pick.map(p => p.src).join(','));

    // Load images; only append successful ones
    const results = await Promise.allSettled(pick.map(loadTile));
    const good = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const skipped = results.filter(r => r.status === 'rejected').map(r => r.reason);

    good.forEach(tile => grid.appendChild(tile));

    // If too many failed and we have room, try to backfill with more randoms
    let i = MAX_SHOW;
    while (good.length < MAX_SHOW && i < photos.length){
      const extra = photos[i++];
      try {
        const tile = await loadTile(extra);
        grid.appendChild(tile);
        good.push(tile);
      } catch(_) {}
    }

    if (skipped.length) {
      // Helpful in DevTools → Console to find typos
      console.warn('Skipped missing images:', skipped.slice(0,10), skipped.length > 10 ? `(+${skipped.length-10} more)` : '');
    }
  } catch (err) {
    console.error('Failed to load photos.json:', err);
    const note = document.createElement('p');
    note.textContent = 'Could not load portfolio images.';
    note.style.color = '#a00';
    grid.appendChild(note);
  }
}

buildGrid();
