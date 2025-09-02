// dala/app.js
// main JS: Lanyard REST + WebSocket handling, UI controls, embed link generation
const qs = (s) => document.querySelector(s);
const byId = (id) => document.getElementById(id);

const inputId = byId('inputId');
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

let currentUserId = null;
let ws = null;
let heartbeatIntervalId = null;
let latestPresence = null;
let rafId = null;

// utility: build embed url
function buildEmbed(userId){
  const params = new URLSearchParams({
    showArtist: String(optArtist.checked),
    showProgress: String(optProgress.checked),
    showAlbum: String(optAlbum.checked),
    showUsername: String(optUsername.checked),
    theme: document.body.classList.contains('light') ? 'light' : 'dark'
  });
  const base = `${location.origin}/dala/embed.html`;
  return `${base}?id=${encodeURIComponent(userId)}&${params.toString()}`;
}

// fetch REST snapshot
async function fetchSnapshot(uid){
  try{
    const res = await fetch(`https://api.lanyard.rest/v1/users/${uid}`);
    const j = await res.json();
    if (j && j.success && j.data) return j.data;
  }catch(e){}
  return null;
}

// open WS and subscribe
function openLanyardSocket(uid){
  if (!uid) return;
  closeSocket();

  ws = new WebSocket('wss://api.lanyard.rest/socket');

  ws.addEventListener('open', () => {
    console.log('ws open');
  });

  ws.addEventListener('message', (ev) => {
    try{
      const msg = JSON.parse(ev.data);
      const { op, d, t } = msg;
      if (op === 1 && d?.heartbeat_interval){
        // send initialize subscribe
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: uid } }));
        // heartbeat
        const ms = d.heartbeat_interval;
        if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
        heartbeatIntervalId = setInterval(()=> {
          if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }));
        }, ms);
      } else if (op === 0){
        if (t === 'INIT_STATE'){
          // sometimes payload shape is { [id]: {...} }
          const payload = d[uid] ?? d;
          latestPresence = payload;
          renderPlayer();
        } else if (t === 'PRESENCE_UPDATE'){
          latestPresence = d;
          renderPlayer();
        }
      }
    }catch(err){
      console.error('ws parse', err);
    }
  });

  ws.addEventListener('close', ()=> {
    if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
    ws = null;
  });
  ws.addEventListener('error', ()=>{/* ignore */});
}

function closeSocket(){
  if (heartbeatIntervalId) { clearInterval(heartbeatIntervalId); heartbeatIntervalId = null; }
  if (ws) { try{ ws.close(); }catch(e){} ws = null; }
}

// format ms to m:ss
function fmt(ms){
  if (!ms) return '0:00';
  const s = Math.floor(ms/1000);
  const m = Math.floor(s/60);
  const ss = String(s%60).padStart(2,'0');
  return `${m}:${ss}`;
}

// compute progress fill fraction
function computeProgress(spotify){
  if (!spotify || !spotify.timestamps) return null;
  const start = spotify.timestamps.start;
  const end = spotify.timestamps.end;
  if (!start || !end) return null;
  const dur = end - start;
  const now = Date.now();
  const elapsed = now - start;
  const pct = Math.max(0, Math.min(1, elapsed / dur));
  return { elapsed, dur, pct };
}

// render player card into container
function renderPlayer(){
  cancelAnimationFrame(rafId);
  playerContainer.innerHTML = '';

  const presence = latestPresence;
  if (!presence){
    playerContainer.innerHTML = `<div class="player"><div class="meta"><div class="song">No data</div><div class="artist muted">Enter a valid Discord ID</div></div></div>`;
    updateIframe();
    return;
  }

  const spotify = presence.spotify ?? null;
  const username = (presence.discord_user && presence.discord_user.username) ? presence.discord_user.username : null;

  const card = document.createElement('div');
  card.className = 'player';

  if (optAlbum.checked && spotify?.album_art_url){
    const img = document.createElement('img');
    img.className = 'art';
    img.src = spotify.album_art_url;
    img.alt = 'album art';
    card.appendChild(img);
  }

  const meta = document.createElement('div');
  meta.className = 'meta';

  const title = document.createElement('div');
  title.className = 'song';
  title.textContent = spotify?.song ?? '— Not listening';
  meta.appendChild(title);

  if (optArtist.checked){
    const artist = document.createElement('div');
    artist.className = 'artist';
    artist.textContent = spotify?.artist ?? '';
    meta.appendChild(artist);
  }

  if (optUsername.checked && username){
    const userEl = document.createElement('div');
    userEl.className = 'username muted';
    userEl.textContent = `@${username}`;
    meta.appendChild(userEl);
  }

  // progress area
  const progressArea = document.createElement('div');
  const timeRow = document.createElement('div');
  timeRow.className = 'time-row';

  const left = document.createElement('span');
  left.textContent = '--:--';
  const right = document.createElement('span');
  right.textContent = '--:--';
  timeRow.appendChild(left);
  timeRow.appendChild(right);

  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  const fill = document.createElement('div');
  fill.className = 'progress-fill';
  fill.style.background = document.body.classList.contains('light') ? 'linear-gradient(90deg,#111,#444)' : 'linear-gradient(90deg,#fff,#ddd)';
  bar.appendChild(fill);

  progressArea.appendChild(timeRow);
  progressArea.appendChild(bar);

  // append progress depending on option
  if (optProgress.checked){
    meta.appendChild(progressArea);
  }

  card.appendChild(meta);
  playerContainer.appendChild(card);

  // animation loop for progress
  function tick(){
    const progress = computeProgress(spotify);
    if (progress){
      left.textContent = fmt(progress.elapsed);
      right.textContent = fmt(progress.dur);
      fill.style.transform = `scaleX(${progress.pct})`;
    } else {
      left.textContent = '--:--';
      right.textContent = '--:--';
      fill.style.transform = `scaleX(0)`;
    }
    rafId = requestAnimationFrame(tick);
  }
  tick();

  updateIframe();
}

// UI actions
btnLoad.addEventListener('click', async () => {
  const uid = inputId.value.trim();
  if (!uid) { alert('Introdu un Discord ID valid'); return; }
  currentUserId = uid;
  // first REST snapshot
  latestPresence = await fetchSnapshot(uid);
  renderPlayer();
  // open socket subscribe
  openLanyardSocket(uid);
});

btnClear.addEventListener('click', () => {
  inputId.value = '';
  currentUserId = null;
  latestPresence = null;
  renderPlayer();
  closeSocket();
});

btnCopyEmbed.addEventListener('click', () => {
  if (!currentUserId) { alert('Mai întâi încarcă un ID'); return; }
  const url = buildEmbed(currentUserId);
  navigator.clipboard.writeText(url).then(()=> {
    btnCopyEmbed.textContent = 'Copied!';
    setTimeout(()=> btnCopyEmbed.textContent = 'Copy embed URL', 1500);
  }).catch(()=> alert('Clipboard error'));
});

// toggle listeners -> re-render
[optArtist, optProgress, optAlbum, optUsername].forEach(el => {
  el.addEventListener('change', () => renderPlayer());
});

// theme toggles
themeDark.addEventListener('click', () => {
  document.body.classList.remove('light');
  themeDark.classList.add('active');
  themeLight.classList.remove('active');
  renderPlayer();
});
themeLight.addEventListener('click', () => {
  document.body.classList.add('light');
  themeLight.classList.add('active');
  themeDark.classList.remove('active');
  renderPlayer();
});

// update iframe preview
function updateIframe(){
  if (!currentUserId){ iframePreview.src = ''; return; }
  iframePreview.src = buildEmbed(currentUserId);
}

// initial empty render
renderPlayer();
