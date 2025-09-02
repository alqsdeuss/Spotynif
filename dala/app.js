const getid = (id) => document.getElementById(id);
const findel = (sel) => document.querySelector(sel);

// Main elements
const useridbox = getid('userid');
const customtxtbox = getid('customtxt');
const loadbtn = getid('loadbtn');
const clearbtn = getid('clearbtn');
const copyembedurl = getid('copyembed');
const embedframe = getid('embedpreview');
const notifcontainer = getid('notificationarea');
const creditscontainer = getid('creditsinfo');

// Display toggles
const showartistbox = getid('showartist');
const showprogressbox = getid('showprogress');
const showalbumbox = getid('showalbum');
const showuserbox = getid('showuser');
const showdurationbox = getid('showduration');
const showstatusbox = getid('showstatus');

// Theme buttons
const darkmodebutton = getid('darkmode');
const lightmodebutton = getid('lightmode');

// Color pickers
const songcolorpicker = getid('songcolor');
const artistcolorpicker = getid('artistcolor');
const usercolorpicker = getid('usercolor');
const customtextcolorpicker = getid('customtextcolor');
const progressbgcolorpicker = getid('progressbg');
const progressfillcolorpicker = getid('progressfill');
const progressendcolorpicker = getid('progressend');

// Reset buttons
const resetsongbtn = getid('resetsong');
const resetartistbtn = getid('resetartist');
const resetuserbtn = getid('resetuser');
const resetcustomtextbtn = getid('resetcustomtext');
const resetprogressbgbtn = getid('resetprogressbg');
const resetprogressfillbtn = getid('resetprogressfill');
const resetprogressendbtn = getid('resetprogressend');

// Effect selectors
const songtitleeffectsel = getid('songtitleeffect');
const artisteffectsel = getid('artisteffect');
const usernameeffectsel = getid('usernameeffect');
const customtexteffectsel = getid('customtexteffect');
const cardentrancesel = getid('cardentrance');
const cardhoversel = getid('cardhover');
const albumarteffectsel = getid('albumarteffect');
const progressstylesel = getid('progressstyle');
const progressheightslider = getid('progressheight');
const progressradiusslider = getid('progressradius');

// App state
let currentuser = null;
let userdata = null;
let refreshinterval = null;
let islighttheme = false;

// Default colors
const defaultdarkcolors = {
  song: '#ffffff',
  artist: '#b3b3b3',
  username: '#888888',
  customtext: '#888888',
  progressbg: '#2a2a2a',
  progressfill: '#00d9ff',
  progressend: '#0ea5e9'
};

const defaultlightcolors = {
  song: '#0b0b0b',
  artist: '#4a4a4a',
  username: '#666666',
  customtext: '#666666',
  progressbg: '#e0e0e0',
  progressfill: '#00d9ff',
  progressend: '#0ea5e9'
};

// Utility functions
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
    }, 300);
  }, 3500);
}

function buildembed(userid) {
  const params = new URLSearchParams({
    showArtist: String(showartistbox.checked),
    showProgress: String(showprogressbox.checked),
    showAlbum: String(showalbumbox.checked),
    showUsername: String(showuserbox.checked),
    showDuration: String(showdurationbox.checked),
    showStatus: String(showstatusbox.checked),
    theme: islighttheme ? 'light' : 'dark',
    custom: customtxtbox.value || '',
    
    // Colors
    songColor: songcolorpicker.value !== getdefaultcolor('song') ? songcolorpicker.value : '',
    artistColor: artistcolorpicker.value !== getdefaultcolor('artist') ? artistcolorpicker.value : '',
    usernameColor: usercolorpicker.value !== getdefaultcolor('username') ? usercolorpicker.value : '',
    customTextColor: customtextcolorpicker.value !== getdefaultcolor('customtext') ? customtextcolorpicker.value : '',
    progressBgColor: progressbgcolorpicker.value !== getdefaultcolor('progressbg') ? progressbgcolorpicker.value : '',
    progressFillColor: progressfillcolorpicker.value !== getdefaultcolor('progressfill') ? progressfillcolorpicker.value : '',
    progressEndColor: progressendcolorpicker.value !== getdefaultcolor('progressend') ? progressendcolorpicker.value : '',
    
    // Effects
    songEffect: songtitleeffectsel.value,
    artistEffect: artisteffectsel.value,
    usernameEffect: usernameeffectsel.value,
    customTextEffect: customtexteffectsel.value,
    cardEntrance: cardentrancesel.value,
    cardHover: cardhoversel.value,
    albumArtEffect: albumarteffectsel.value,
    progressStyle: progressstylesel.value,
    progressHeight: progressheightslider.value,
    progressRadius: progressradiusslider.value
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
  rootstyle.style.setProperty('--customtext-color', customtextcolorpicker.value);
  rootstyle.style.setProperty('--progress-bg-color', progressbgcolorpicker.value);
  rootstyle.style.setProperty('--progress-fill-color', progressfillcolorpicker.value);
  rootstyle.style.setProperty('--progress-fill-end-color', progressendcolorpicker.value);
  rootstyle.style.setProperty('--progress-height', progressheightslider.value + 'px');
  rootstyle.style.setProperty('--progress-radius', progressradiusslider.value + 'px');
}

function resetallcolors() {
  songcolorpicker.value = getdefaultcolor('song');
  artistcolorpicker.value = getdefaultcolor('artist');
  usercolorpicker.value = getdefaultcolor('username');
  customtextcolorpicker.value = getdefaultcolor('customtext');
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

function startrefreshloop(userid) {
  stoprefreshloop();
  refreshinterval = setInterval(async () => {
    try {
      const newdata = await fetchuserdata(userid);
      if (newdata) {
        userdata = newdata;
        updateembedframe();
      }
    } catch (error) {
      console.error('refresh error:', error);
    }
  }, 10000);
}

function stoprefreshloop() {
  if (refreshinterval) {
    clearInterval(refreshinterval);
    refreshinterval = null;
  }
}

function updateembedframe() {
  const currenturl = embedframe.src;
  const newurl = currentuser ? buildembed(currentuser) : '';
  if (currenturl !== newurl) {
    embedframe.src = newurl;
  }
}

function switchtheme(lightmode) {
  islighttheme = lightmode;
  if (lightmode) {
    lightmodebutton.classList.add('btnactive');
    darkmodebutton.classList.remove('btnactive');
  } else {
    darkmodebutton.classList.add('btnactive');
    lightmodebutton.classList.remove('btnactive');
  }
  
  resetallcolors();
  updateembedframe();
}

// Event listeners
loadbtn.addEventListener('click', async () => {
  const userid = useridbox.value.trim();
  if (!userid) {
    shownotif('please enter a valid discord id', 'error');
    return;
  }
  
  loadbtn.textContent = 'loading...';
  loadbtn.disabled = true;
  
  try {
    currentuser = userid;
    userdata = await fetchuserdata(userid);
    updateembedframe();
    startrefreshloop(userid);
    shownotif('discord data loaded successfully! updates every 10 seconds', 'success');
  } catch (error) {
    console.error('loading error:', error);
    shownotif('failed to load discord data. check the id and try again.', 'error');
  } finally {
    loadbtn.textContent = 'load';
    loadbtn.disabled = false;
  }
});

clearbtn.addEventListener('click', () => {
  useridbox.value = '';
  customtxtbox.value = '';
  currentuser = null;
  userdata = null;
  updateembedframe();
  stoprefreshloop();
  shownotif('cleared all data', 'success');
});

copyembedurl.addEventListener('click', async () => {
  if (!currentuser) {
    shownotif('load a discord id first', 'error');
    return;
  }
  
  const embedurl = buildembed(currentuser);
  
  try {
    await navigator.clipboard.writeText(embedurl);
    shownotif('embed url copied to clipboard!', 'success');
  } catch (error) {
    console.error('clipboard error:', error);
    shownotif('failed to copy to clipboard', 'error');
  }
});

// Add event listeners for all controls
[customtxtbox, showartistbox, showprogressbox, showalbumbox, showuserbox, 
 showdurationbox, showstatusbox].forEach((element) => {
  element.addEventListener('input', updateembedframe);
});

[songcolorpicker, artistcolorpicker, usercolorpicker, customtextcolorpicker,
 progressbgcolorpicker, progressfillcolorpicker, progressendcolorpicker].forEach(colorinput => {
  colorinput.addEventListener('input', () => {
    updatecolors();
    updateembedframe();
  });
});

[songtitleeffectsel, artisteffectsel, usernameeffectsel, customtexteffectsel,
 cardentrancesel, cardhoversel, albumarteffectsel, progressstylesel].forEach(effectsel => {
  effectsel.addEventListener('change', updateembedframe);
});

[progressheightslider, progressradiusslider].forEach(slider => {
  slider.addEventListener('input', () => {
    updatecolors();
    updateembedframe();
  });
});

// Reset button event listeners
resetsongbtn.addEventListener('click', () => {
  songcolorpicker.value = getdefaultcolor('song');
  updatecolors();
  updateembedframe();
});

resetartistbtn.addEventListener('click', () => {
  artistcolorpicker.value = getdefaultcolor('artist');
  updatecolors();
  updateembedframe();
});

resetuserbtn.addEventListener('click', () => {
  usercolorpicker.value = getdefaultcolor('username');
  updatecolors();
  updateembedframe();
});

resetcustomtextbtn.addEventListener('click', () => {
  customtextcolorpicker.value = getdefaultcolor('customtext');
  updatecolors();
  updateembedframe();
});

resetprogressbgbtn.addEventListener('click', () => {
  progressbgcolorpicker.value = getdefaultcolor('progressbg');
  updatecolors();
  updateembedframe();
});

resetprogressfillbtn.addEventListener('click', () => {
  progressfillcolorpicker.value = getdefaultcolor('progressfill');
  updatecolors();
  updateembedframe();
});

resetprogressendbtn.addEventListener('click', () => {
  progressendcolorpicker.value = getdefaultcolor('progressend');
  updatecolors();
  updateembedframe();
});

// Theme switchers
darkmodebutton.addEventListener('click', () => switchtheme(false));
lightmodebutton.addEventListener('click', () => switchtheme(true));

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stoprefreshloop();
});

// Credits section
async function loadcreditsinfo() {
  const userids = ['1170109139989561464', '1106121476932898946'];
  
  try {
    const promises = userids.map(id => fetchuserdata(id));
    const results = await Promise.all(promises);
    creditscontainer.innerHTML = '';
    
    results.forEach((data, index) => {
      const apicard = document.createElement('div');
      apicard.className = 'apicard';
      
      if (data) {
        const user = data.discord_user;
        const spotify = data.spotify;
        
        apicard.innerHTML = `
          <div class="apiheader">
            <img class="apiavatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" alt="${user.username}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
            <div class="apiuserinfo">
              <h4>${user.global_name || user.username}</h4>
              <div class="userid">${user.id}</div>
            </div>
          </div>
          <div class="apistatus">
            <div class="statusindicator status${data.discord_status}"></div>
            <span class="statustext">${data.discord_status}</span>
          </div>
          <div class="spotifyinfo ${!spotify ? 'notlistening' : ''}">
            ${spotify ? `
              <div class="spotifytrack">${spotify.song}</div>
              <div class="spotifyartist">by ${spotify.artist}</div>
            ` : `
              <div class="spotifytrack">not listening to spotify</div>
            `}
          </div>
        `;
      } else {
        apicard.innerHTML = `
          <div class="errorstate">
            <div>failed to load user data</div>
            <div class="userid">${userids[index]}</div>
          </div>
        `;
      }
      
      creditscontainer.appendChild(apicard);
    });
  } catch (error) {
    creditscontainer.innerHTML = '<div class="errorstate">failed to load api information</div>';
  }
}

// Initialize app
function initapp() {
  resetallcolors();
  updateembedframe();
  loadcreditsinfo();
  
  // Set initial slider values
  progressheightslider.value = 6;
  progressradiusslider.value = 3;
  updatecolors();
}

// Start the app
initapp();
