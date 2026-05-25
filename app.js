const STORAGE_KEY = 'lswtss_v1';
const CATS = ['all', 'Jedi', 'Hero', 'Scavenger', 'Scoundrel', 'Bounty Hunter', 'Villain', 'Dark Side', 'Astromech Droid', 'Protocol Droid', 'Extra'];
const CAT_COLORS = {
  'Jedi':            '#4a9eff',
  'Hero':            '#4caf50',
  'Scavenger':       '#ff9800',
  'Scoundrel':       '#ab47bc',
  'Bounty Hunter':   '#ff7043',
  'Villain':         '#ef5350',
  'Dark Side':       '#e53935',
  'Astromech Droid': '#26c6da',
  'Protocol Droid':  '#ffd54f',
  'Extra':           '#78909c'
};

let state = {};
try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch {}

let activeCat = 'all';
let query = '';
let searchTimer = null;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

window.imgFallback = function(el, name) {
  el.onerror = null;
  const init = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  el.src = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">' +
    '<rect width="200" height="300" fill="#0a0d14"/>' +
    '<text x="100" y="155" text-anchor="middle" dominant-baseline="middle" ' +
    'fill="#ffe81f" font-size="60" font-weight="bold" font-family="Arial,sans-serif">' + init + '</text>' +
    '</svg>'
  );
};

function getFiltered() {
  const q = query.toLowerCase();
  return CHARACTERS.filter(c =>
    (activeCat === 'all' || c.category === activeCat) &&
    (!q || c.name.toLowerCase().includes(q))
  );
}

function updateProgress() {
  const total = CHARACTERS.length;
  const got   = CHARACTERS.filter(c => state[c.id]).length;
  const pct   = total ? Math.round(got / total * 100) : 0;
  document.getElementById('prog-count').textContent = got + ' / ' + total + ' Characters Collected';
  document.getElementById('prog-pct').textContent   = pct + '%';
  document.getElementById('prog-fill').style.width  = pct + '%';
}

function renderFilters() {
  document.getElementById('filters').innerHTML = CATS.map(cat => {
    const pool  = cat === 'all' ? CHARACTERS : CHARACTERS.filter(c => c.category === cat);
    const got   = pool.filter(c => state[c.id]).length;
    const label = cat === 'all' ? 'All Characters' : cat;
    return '<button class="' + (cat === activeCat ? 'active' : '') + '" data-cat="' + cat + '">' +
      label + ' <span>' + got + '/' + pool.length + '</span></button>';
  }).join('');
}

// Single delegated listener on the filters nav (avoids inline onclick quote issues)
document.getElementById('filters').addEventListener('click', function(e) {
  const btn = e.target.closest('button[data-cat]');
  if (btn) { activeCat = btn.dataset.cat; renderGrid(); }
});

// Full grid render — only called when filter/search changes
function renderGrid() {
  const chars = getFiltered();
  const grid  = document.getElementById('grid');

  if (!chars.length) {
    grid.innerHTML = '<div class="empty">No characters found</div>';
    renderFilters();
    updateProgress();
    return;
  }

  grid.innerHTML = chars.map(c => {
    const got      = state[c.id];
    const col      = CAT_COLORS[c.category] || '#888';
    const safeName = c.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeImg  = c.img.replace(/"/g, '&quot;');

    return '<div class="card' + (got ? ' collected' : '') + '" data-id="' + c.id + '" onclick="toggle(\'' + c.id + '\')">' +
      (got ? '<div class="check">&#10003;</div>' : '') +
      (c.dlc ? '<div class="dlc-badge">DLC</div>' : '') +
      '<img loading="lazy" src="' + safeImg + '" alt="' + safeName + '" onerror="imgFallback(this,\'' + safeName + '\')">' +
      '<div class="card-overlay"></div>' +
      '<div class="card-info">' +
        '<div class="cat-bar" style="background:' + col + '"></div>' +
        '<span class="card-name" title="' + safeName + '">' + c.name + '</span>' +
      '</div>' +
    '</div>';
  }).join('');

  renderFilters();
  updateProgress();
}

// Toggle: direct DOM patch — no grid re-render
window.toggle = function(id) {
  state[id] = !state[id];
  if (!state[id]) delete state[id];
  save();

  const card = document.querySelector('.card[data-id="' + id + '"]');
  if (card) {
    const isNowCollected = !!state[id];
    card.classList.toggle('collected', isNowCollected);

    const existingCheck = card.querySelector('.check');
    if (isNowCollected && !existingCheck) {
      const check = document.createElement('div');
      check.className = 'check';
      check.innerHTML = '&#10003;';
      card.insertBefore(check, card.firstChild);
    } else if (!isNowCollected && existingCheck) {
      existingCheck.remove();
    }
  }

  updateProgress();
  renderFilters();
};

window.setCat = function(cat) {
  activeCat = cat;
  renderGrid();
};

window.resetAll = function() {
  if (confirm('Reset ALL character progress?\nThis cannot be undone.')) {
    state = {};
    save();
    renderGrid();
  }
};

// Starfield — throttled to ~20fps, 80 stars, pauses when tab hidden
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx    = canvas.getContext('2d');

  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  const stars = Array.from({ length: 80 }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * canvas.height,
    r:     Math.random() * 1.3 + 0.2,
    phase: Math.random() * Math.PI * 2,
    freq:  Math.random() * 0.02 + 0.005
  }));

  const INTERVAL = 50; // ~20fps
  let t = 0;
  let last = 0;

  function tick(now) {
    if (!document.hidden && now - last >= INTERVAL) {
      last = now;
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        const a = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(s.phase + t * s.freq));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
        ctx.fill();
      });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// Debounced search
document.getElementById('search').addEventListener('input', function(e) {
  clearTimeout(searchTimer);
  query = e.target.value;
  searchTimer = setTimeout(renderGrid, 180);
});

renderGrid();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
