const getid = (id) => document.getElementById(id);
const findel = (sel) => document.querySelector(sel);
const useridbox = getid('userid');
const customtxtbox = getid('customtxt');
const loadbtn = getid('loadbtn');
const clearbtn = getid('clearbtn');
const copyembedurl = getid('copyembed');
const embedframe = getid('embedpreview');
const notifcontainer = getid('notificationarea');
const creditscontainer = getid('creditsinfo');
const showartistbox = getid('showartist');
const showprogressbox = getid('showprogress');
const showalbumbox = getid('showalbum');
const showuserbox = getid('showuser');
const darkmodebutton = getid('darkmode');
const lightmodebutton = getid('lightmode');
const songcolorpicker = getid('songcolor');
const artistcolorpicker = getid('artistcolor');
const usercolorpicker = getid('usercolor');
const progressbgcolorpicker = getid('progressbg');
const progressfillcolorpicker = getid('progressfill');
const progressendcolorpicker = getid('progressend');
const resetsongbtn = getid('resetsong');
const resetartistbtn = getid('resetartist');
const resetuserbtn = getid('resetuser');
const resetprogressbgbtn = getid('resetprogressbg');
const resetprogressfillbtn = getid('resetprogressfill');
const resetprogressendbtn = getid('resetprogressend');

let currentuser = null;
let pollingInterval = null;
let userdata = null;
let animframe = null;
let islighttheme = false;

const defaultdarkcolors = {
  song: '#ffffff',
  artist: '#b3b3b3',
  username: '#666666',
  progressbg: '#2a2a2a',
  progressfill: '#1DB954',
  progressend: '#1ed760'
};

const defaultlightcolors = {
  song: '#0b0b0b',
  artist: '#4a4a4a',
  username: '#888888',
  progressbg: '#e0e0e0',
  progressfill: '#1DB954',
  progressend: '#1ed760'
};

function shownotif(message, type = 'info') {
  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  
  const icon = document.createElement('i');
  if (type === 'success') {
    icon.className = 'fas fa-check-circle';
  } else if (type === 'error') {
    icon.className = 'fas fa-exclamation-circle';
  } else {
    icon.className = 'fas fa-info-circle';
  }
  
  const text = document.createElement('span');
  text.textContent = message;
  notif.appendChild(icon);
  notif.appendChild(text);
  notifcontainer.appendChild(notif);
  setTimeout(() => notif.classList.add('show'), 100);
  
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => {
      if (notif.parentNode) {
        notif.parentNode.removeChild(notif);
      }
    }, 400);
  }, 4000);
}

function buildembed(userid) {
  const params = new URLSearchParams({
    showArtist: String(showartistbox.checked),
    showProgress: String(showprogressbox.checked),
    showAlbum: String(showalbumbox.checked),
    showUsername: String(showuserbox.checked),
    theme: islighttheme ? 'light' : 'dark',
    custom: customtxtbox.value || '',
    songColor: songcolorpicker.value !== getdefaultcolor('song') ? songcolorpicker.value : '',
    artistColor: artistcolorpicker.value !== getdefaultcolor('artist') ? artistcolorpicker.value : '',
    usernameColor: usercolorpicker.value !== getdefaultcolor('username') ? usercolorpicker.value : '',
    progressBgColor: progressbgcolorpicker.value !== getdefaultcolor('progressbg') ? progressbgcolorpicker.value : '',
    progressFillColor: progressfillcolorpicker.value !== getdefaultcolor('progressfill') ? progressfillcolorpicker.value : '',
    progressEndColor: progressendcolorpicker.value !== getdefaultcolor('progressend') ? progressendcolorpicker.value : ''
  });
  return `${location.origin}/dala/embed.html?id=${encodeURIComponent(userid)}&${params.toString()}`;
}

function getdefaultcolor(colortype) {
  return islighttheme ? defaultlightcolors[colortype] : defaultdarkcolors[colortype];
}

function updatecolors() {
  const rootstyle = document.documentElement;
  rootstyle.style.setProperty('--song-color', songcolorpicker.value);
  rootstyle.style.setProperty('--artist-color', artistcolorpicker.value);
  rootstyle.style.setProperty('--username-color', usercolorpicker.value);
  rootstyle.style.setProperty('--progress-bg-color', progressbgcolorpicker.value);
  rootstyle.style.setProperty('--progress-fill-color', progressfillcolorpicker.value);
  rootstyle.style.setProperty('--progress-fill-end-color', progressendcolorpicker.value);
}

function resetallcolors() {
  songcolorpicker.value = getdefaultcolor('song');
  artistcolorpicker.value = getdefaultcolor('artist');
  usercolorpicker.value = getdefaultcolor('username');
  progressbgcolorpicker.value = getdefaultcolor('progressbg');
  progressfillcolorpicker.value = getdefaultcolor('progressfill');
  progressendcolorpicker.value = getdefaultcolor('progressend');
  updatecolors();
}

async function fetchuserdata(userid) {
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${userid}`);
    const data = await response.json();
    if (data?.success && data.data) return data.data;
  } catch (error) {
    console.error('fetch error:', error);
  }
  return null;
}

function startwebsocket(userid) {
  closesocket();
  startpolling(userid);
}

function startpolling(userid) {
  // Use HTTP polling instead of WebSocket since Lanyard doesn't support direct user WebSocket connections
  if (heartbeatloop) {
    clearInterval(heartbeatloop);
  }
  
  // Initial fetch
  fetchuserdata(userid).then(data => {
    if (data) {
      userdata = data;
      renderplayer();
    }
  });
  
  // Poll every 15 seconds for updates
  heartbeatloop = setInterval(async () => {
    try {
      const data = await fetchuserdata(userid);
      if (data) {
        userdata = data;
        renderplayer();
      }
    } catch (error) {
      console.warn('Polling update failed:', error);
    }
  }, 15000);
}

function closesocket() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

function formattime(milliseconds) {
  if (!milliseconds) return '0:00';
  const totalseconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalseconds / 60);
  const seconds = String(totalseconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function calculateprogress(spotifydata) {
  if (!spotifydata?.timestamps) return null;
  const starttime = spotifydata.timestamps.start;
  const endtime = spotifydata.timestamps.end;
  if (!starttime || !endtime) return null;
  
  const totalduration = endtime - starttime;
  const currentelapsed = Date.now() - starttime;
  const progresspercent = Math.min(1, Math.max(0, currentelapsed / totalduration));
  
  return { 
    elapsed: currentelapsed, 
    duration: totalduration, 
    percent: progresspercent 
  };
}

function renderplayer() {
  updateembedframe();
}

function switchtheme(lightmode) {
  islighttheme = lightmode;
  if (lightmode) {
    lightmodebutton.classList.add('btn-active');
    darkmodebutton.classList.remove('btn-active');
  } else {
    darkmodebutton.classList.add('btn-active');
    lightmodebutton.classList.remove('btn-active');
  }
  
  resetallcolors();
  renderplayer();
}

function updateembedframe() {
  embedframe.src = currentuser ? buildembed(currentuser) : '';
}

loadbtn.addEventListener('click', async () => {
  const userid = useridbox.value.trim();
  if (!userid) {
    shownotif('Please enter a valid Discord ID', 'error');
    return;
  }
  
  loadbtn.textContent = 'Loading...';
  loadbtn.disabled = true;
  
  try {
    currentuser = userid;
    userdata = await fetchuserdata(userid);
    renderplayer();
    startwebsocket(userid);
    shownotif('Discord data loaded successfully! Updates every 15 seconds.', 'success');
  } catch (error) {
    console.error('loading error:', error);
    shownotif('Failed to load Discord data. Please check the ID and try again.', 'error');
  } finally {
    loadbtn.textContent = 'Load';
    loadbtn.disabled = false;
  }
});

clearbtn.addEventListener('click', () => {
  useridbox.value = '';
  customtxtbox.value = '';
  currentuser = null;
  userdata = null;
  renderplayer();
  closesocket();
});

copyembedurl.addEventListener('click', async () => {
  if (!currentuser) {
    shownotif('Load a Discord ID first', 'error');
    return;
  }
  
  const embedurl = buildembed(currentuser);
  
  try {
    await navigator.clipboard.writeText(embedurl);
    shownotif('Embed URL copied to clipboard!', 'success');
  } catch (error) {
    console.error('clipboard error:', error);
    shownotif('Failed to copy to clipboard', 'error');
  }
});

[customtxtbox, showartistbox, showprogressbox, showalbumbox, showuserbox].forEach((element) => {
  element.addEventListener('input', renderplayer);
});

[songcolorpicker, artistcolorpicker, usercolorpicker, progressbgcolorpicker, progressfillcolorpicker, progressendcolorpicker].forEach(colorinput => {
  colorinput.addEventListener('input', () => {
    updatecolors();
    renderplayer();
  });
});

resetsongbtn.addEventListener('click', () => {
  songcolorpicker.value = getdefaultcolor('song');
  updatecolors();
  renderplayer();
});

resetartistbtn.addEventListener('click', () => {
  artistcolorpicker.value = getdefaultcolor('artist');
  updatecolors();
  renderplayer();
});

resetuserbtn.addEventListener('click', () => {
  usercolorpicker.value = getdefaultcolor('username');
  updatecolors();
  renderplayer();
});

resetprogressbgbtn.addEventListener('click', () => {
  progressbgcolorpicker.value = getdefaultcolor('progressbg');
  updatecolors();
  renderplayer();
});

resetprogressfillbtn.addEventListener('click', () => {
  progressfillcolorpicker.value = getdefaultcolor('progressfill');
  updatecolors();
  renderplayer();
});

resetprogressendbtn.addEventListener('click', () => {
  progressendcolorpicker.value = getdefaultcolor('progressend');
  updatecolors();
  renderplayer();
});

darkmodebutton.addEventListener('click', () => switchtheme(false));
lightmodebutton.addEventListener('click', () => switchtheme(true));

window.addEventListener('beforeunload', () => {
  closesocket();
  if (animframe) {
    cancelAnimationFrame(animframe);
  }
});

async function loadcreditsinfo() {
  const userids = ['1170109139989561464', '1106121476932898946'];
  
  try {
    const promises = userids.map(id => fetchuserdata(id));
    const results = await Promise.all(promises);
    creditscontainer.innerHTML = '';
    results.forEach((data, index) => {
      const apicard = document.createElement('div');
      apicard.className = 'api-card';
      
      if (data) {
        const user = data.discord_user;
        const spotify = data.spotify;
        const activities = data.activities || [];
        
        apicard.innerHTML = `
          <div class="api-header">
            <img class="api-avatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" alt="${user.username}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
            <div class="api-user-info">
              <h4>${user.global_name || user.username}</h4>
              <div class="user-id">${user.id}</div>
            </div>
          </div>
          <div class="api-status">
            <div class="status-indicator status-${data.discord_status}"></div>
            <span class="status-text">${data.discord_status.charAt(0).toUpperCase() + data.discord_status.slice(1)}</span>
          </div>
          <div class="spotify-info ${!spotify ? 'not-listening' : ''}">
            ${spotify ? `
              <div class="spotify-track">${spotify.song}</div>
              <div class="spotify-artist">by ${spotify.artist}</div>
            ` : `
              <div class="spotify-track">Not listening to Spotify</div>
            `}
          </div>
        `;
      } else {
        apicard.innerHTML = `
          <div class="error-state">
            <div>Failed to load user data</div>
            <div class="user-id">${userids[index]}</div>
          </div>
        `;
      }
      
      creditscontainer.appendChild(apicard);
    });
  } catch (error) {
    creditscontainer.innerHTML = '<div class="error-state">Failed to load API information</div>';
  }
}

resetallcolors();
renderplayer();
loadcreditsinfo();
