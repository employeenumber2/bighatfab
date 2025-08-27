// assets/js/main.js

// Elements
const grid = document.getElementById('photo-grid');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCap = document.getElementById('lightboxCap');
const lightboxClose = document.getElementById('lightboxClose');

// Build grid from JSON
async function buildGrid() {
  if (!grid) return;
  try {
    const res = await fetch('assets/photos.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const photos = await res.json();
    if (!Array.isArray(photos)) throw new Error('photos.json must be an array');

    photos.forEach(({ thumb, src, caption }) => {
      if (!src) return;
      const a = document.createElement('a');
      a.href = src;
      a.className = 'grid-item';
      a.dataset.caption = caption || '';

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = thumb || src;
      img.alt = caption || 'Portfolio image';

      a.appendChild(img);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openLightbox(src, caption);
      });

      grid.appendChild(a);
    });
  } catch (err) {
    console.error('Failed to load photos.json:', err);
    const note = document.createElement('p');
    note.textContent = 'Could not load portfolio images.';
    note.style.color = '#a00';
    grid.appendChild(note);
  }
}

function openLightbox(src, caption = '') {
  if (!lightbox) return;
  lightboxImg.src = src;
  lightboxImg.alt = caption || 'Portfolio image';
  lightboxCap.textContent = caption || '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImg.src = '';
}

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

buildGrid();
