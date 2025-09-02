const qs = (s) => document.querySelector(s);
const byId = (id) => document.getElementById(id);

const inputId = byId('inputId');
const inputCustom = byId('inputCustom');
const btnLoad = byId('btnLoad');
const btnClear = byId('btnClear');
const btnCopyEmbed = byId('btnCopyEmbed');
const playerContainer = byId('playerContainer');
const iframePreview = byId('iframePreview');

const optArtist = byId('optArtist');
const optProgress = byId('optProgress');
const optAlbum = byId('optAlbum');
const optUsername = byId('optUsername');
const themeDark = byId('themeDark');
const themeLight = byId('themeLight');

// Color controls
const colorSong = byId('colorSong');
const colorArtist = byId('colorArtist');
const colorUsername = byId('colorUsername');
const resetSong = byId('resetSong');
const resetArtist = byId('resetArtist');
const resetUsername = byId('resetUsername');

let currentUserId = null;
let ws = null;
let heartbeatIntervalId = null;
let latestPresence = null;
let rafId = null;
let isCardLightTheme = false;

// Default colors
const defaultColors = {
  song: '#ffffff',
  artist: '#a6a6a6',
  username: '#a6a6a6'
};

const defaultColorsLight = {
  song: '#0b0b0b',
  artist: '#666666',
  username: '#666666'
};

function buildEmbed(userId) {
  const params = new URLSearchParams({
    showArtist: String(optArtist.checked),
    showProgress: String(optProgress.checked),
    showAlbum: String(optAlbum.checked),
    showUsername: String(optUsername.checked),
    theme: isCardLightTheme ? 'light' : 'dark',
    custom: inputCustom.value || '',
    songColor: colorSong.value !== getDefaultColor('song') ? colorSong.value : '',
    artistColor: colorArtist.value !== getDefaultColor('artist') ? colorArtist.value : '',
    usernameColor: colorUsername.value !== getDefaultColor('username') ? colorUsername.value : ''
  });
  return `${location.origin}/dala/embed.html?id=${encodeURIComponent(userId)}&${params.toString()}`;
}

function getDefaultColor(type) {
  return isCardLightTheme ? defaultColorsLight[type] : defaultColors[type];
}

function updateColors() {
  const root = document.documentElement;
  root.style.setProperty('--song-color', colorSong.value);
  root.style.setProperty('--artist-color', colorArtist.value);
  root.style.setProperty('--username-color', colorUsername.value);
}

function resetColorInputs() {
  colorSong.value = getDefaultColor('song');
  colorArtist.value = getDefaultColor('artist');
  colorUsername.value = getDefaultColor('username');
  updateColors();
}

async function fetchSnapshot(uid) {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${uid}`);
    const j = await res.json();
    if (j?.success && j.data) return j.data;
  } catch {}
  return null;
}

function openLanyardSocket(uid) {
  closeSocket();
  ws = new WebSocket('wss://api.lanyard.rest/socket');
  ws.addEventListener('message', (ev) => {
    try {
      const { op, d, t } = JSON.parse(ev.data);
      if (op === 1 && d?.heartbeat_interval) {
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: uid } }));
        heartbeatIntervalId = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }));
        }, d.heartbeat_interval);
      } else if (op === 0) {
        latestPresence = t === 'INIT_STATE' ? d[uid] ?? d : d;
        renderPlayer();
      }
    } catch {}
  });
}

function closeSocket() {
  if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
  if (ws) ws.close();
  heartbeatIntervalId = null;
  ws = null;
}

function fmt(ms) {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function computeProgress(spotify) {
  if (!spotify?.timestamps) return null;
  const { start, end } = spotify.timestamps;
  const dur = end - start;
  const elapsed = Date.now() - start;
  return { elapsed, dur, pct: Math.min(1, Math.max(0, elapsed / dur)) };
}

function renderPlayer() {
  cancelAnimationFrame(rafId);
  playerContainer.innerHTML = '';

  // Update player container theme class
  playerContainer.className = isCardLightTheme ? 'card-light' : '';

  if (!latestPresence) {
    playerContainer.innerHTML = `<div class="player"><div class="meta"><div class="song">No data</div><div class="artist muted">Enter a valid Discord ID</div></div></div>`;
    updateIframe();
    return;
  }

  const { spotify, discord_user } = latestPresence;
  const username = discord_user?.username;
  const customText = inputCustom.value.trim();

  const card = document.createElement('div');
  card.className = 'player';

  if (optAlbum.checked && spotify?.album_art_url) {
    const img = document.createElement('img');
    img.className = 'art';
    img.src = spotify.album_art_url;
    card.appendChild(img);
  }

  const meta = document.createElement('div');
  meta.className = 'meta';

  const title = document.createElement('div');
  title.className = 'song';
  title.textContent = spotify?.song ?? '— Not listening';
  meta.appendChild(title);

  if (optArtist.checked) {
    const artist = document.createElement('div');
    artist.className = 'artist';
    artist.textContent = spotify?.artist ?? '';
    meta.appendChild(artist);
  }

  if (optUsername.checked && username) {
    const userEl = document.createElement('div');
    userEl.className = 'username';
    userEl.textContent = `@${username}`;
    meta.appendChild(userEl);
  }

  if (customText) {
    const customEl = document.createElement('div');
    customEl.className = 'custom-text';
    customEl.textContent = customText;
    meta.appendChild(customEl);
  }

  if (optProgress.checked) {
    const timeRow = document.createElement('div');
    timeRow.className = 'time-row';
    const left = document.createElement('span');
    const right = document.createElement('span');
    timeRow.append(left, right);

    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    bar.appendChild(fill);

    meta.append(timeRow, bar);

    function tick() {
      const progress = computeProgress(spotify);
      if (progress) {
        left.textContent = fmt(progress.elapsed);
        right.textContent = fmt(progress.dur);
        fill.style.transform = `scaleX(${progress.pct})`;
      } else {
        left.textContent = right.textContent = '--:--';
        fill.style.transform = 'scaleX(0)';
      }
      rafId = requestAnimationFrame(tick);
    }
    tick();
  }

  card.appendChild(meta);
  playerContainer.appendChild(card);
  updateIframe();
}

function switchTheme(isLight) {
  isCardLightTheme = isLight;
  
  if (isLight) {
    themeLight.classList.add('active');
    themeDark.classList.remove('active');
  } else {
    themeDark.classList.add('active');
    themeLight.classList.remove('active');
  }
  
  // Reset color inputs to new theme defaults
  resetColorInputs();
  renderPlayer();
}

// Event listeners
btnLoad.addEventListener('click', async () => {
  const uid = inputId.value.trim();
  if (!uid) return alert('Enter a valid Discord ID');
  
  btnLoad.textContent = 'Loading...';
  btnLoad.disabled = true;
  
  try {
    currentUserId = uid;
    latestPresence = await fetchSnapshot(uid);
    renderPlayer();
    openLanyardSocket(uid);
  } catch (error) {
    console.error('Error loading:', error);
    alert('Failed to load Discord data. Please check the ID and try again.');
  } finally {
    btnLoad.textContent = 'Load';
    btnLoad.disabled = false;
  }
});

btnClear.addEventListener('click', () => {
  inputId.value = inputCustom.value = '';
  currentUserId = latestPresence = null;
  renderPlayer();
  closeSocket();
});

btnCopyEmbed.addEventListener('click', async () => {
  if (!currentUserId) return alert('Load a Discord ID first');
  const url = buildEmbed(currentUserId);
  
  try {
    await navigator.clipboard.writeText(url);
    const originalText = btnCopyEmbed.textContent;
    btnCopyEmbed.textContent = 'Copied! ✓';
    btnCopyEmbed.style.background = 'var(--accent)';
    btnCopyEmbed.style.color = '#000';
    
    setTimeout(() => {
      btnCopyEmbed.textContent = originalText;
      btnCopyEmbed.style.background = '';
      btnCopyEmbed.style.color = '';
    }, 2000);
  } catch (error) {
    alert('Failed to copy to clipboard');
  }
});

// Toggle and input event listeners
[inputCustom, optArtist, optProgress, optAlbum, optUsername].forEach((el) =>
  el.addEventListener('input', renderPlayer)
);

// Color input listeners
[colorSong, colorArtist, colorUsername].forEach(input => {
  input.addEventListener('input', () => {
    updateColors();
    renderPlayer();
  });
});

// Color reset listeners
resetSong.addEventListener('click', () => {
  colorSong.value = getDefaultColor('song');
  updateColors();
  renderPlayer();
});

resetArtist.addEventListener('click', () => {
  colorArtist.value = getDefaultColor('artist');
  updateColors();
  renderPlayer();
});

resetUsername.addEventListener('click', () => {
  colorUsername.value = getDefaultColor('username');
  updateColors();
  renderPlayer();
});

// Theme listeners
themeDark.addEventListener('click', () => switchTheme(false));
themeLight.addEventListener('click', () => switchTheme(true));

function updateIframe() {
  iframePreview.src = currentUserId ? buildEmbed(currentUserId) : '';
}

// Initialize
resetColorInputs();
renderPlayer();
