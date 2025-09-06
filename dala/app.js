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
const showdurationbox = getid('showduration');
const showstatusbox = getid('showstatus');
const darkmodebutton = getid('darkmode');
const lightmodebutton = getid('lightmode');
const songcolorpicker = getid('songcolor');
const artistcolorpicker = getid('artistcolor');
const usercolorpicker = getid('usercolor');
const customtextcolorpicker = getid('customtextcolor');
const progressbgcolorpicker = getid('progressbg');
const progressfillcolorpicker = getid('progressfill');
const resetsongbtn = getid('resetsong');
const resetartistbtn = getid('resetartist');
const resetuserbtn = getid('resetuser');
const resetcustomtextbtn = getid('resetcustomtext');
const resetprogressbgbtn = getid('resetprogressbg');
const resetprogressfillbtn = getid('resetprogressfill');
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
const songtitlefontsel = getid('songtitlefont');
const artistfontsel = getid('artistfont');
const usernamefontsel = getid('usernamefont');
const customtextfontsel = getid('customtextfont');
const songtitlefontfile = getid('songtitlefontfile');
const artistfontfile = getid('artistfontfile');
const usernamefontfile = getid('usernamefontfile');
const customtextfontfile = getid('customtextfontfile');
const songtitlefontupload = getid('songtitlefontupload');
const artistfontupload = getid('artistfontupload');
const usernamefontupload = getid('usernamefontupload');
const customtextfontupload = getid('customtextfontupload');

let currentuser = null;
let userdata = null;
let websocket = null;
let reconnecttimeout = null;
let islighttheme = false;
let loadedfonts = {};
let fontloadingqueue = [];

const defaultdarkcolors = {
  song: '#ffffff',
  artist: '#cccccc',
  username: '#999999',
  customtext: '#999999',
  progressbg: '#333333',
  progressfill: '#ffffff'
};

const defaultlightcolors = {
  song: '#000000',
  artist: '#333333',
  username: '#666666',
  customtext: '#666666',
  progressbg: '#e0e0e0',
  progressfill: '#000000'
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
    }, 300);
  }, 3500);
}

function showfontloading() {
  if (embedframe && embedframe.contentWindow) {
    embedframe.contentWindow.postMessage({ action: 'showFontLoading' }, '*');
  }
}

function hidefontloading() {
  if (embedframe && embedframe.contentWindow) {
    embedframe.contentWindow.postMessage({ action: 'hideFontLoading' }, '*');
  }
}

function loadwebfont(fontname) {
  return new Promise((resolve, reject) => {
    if (fontname === 'default') {
      resolve();
      return;
    }
    
    const fontmap = {
      roboto: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap',
      opensans: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap',
      lato: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
      montserrat: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap'
    };
    
    if (fontmap[fontname] && !loadedfonts[fontname]) {
      const link = document.createElement('link');
      link.href = fontmap[fontname];
      link.rel = 'stylesheet';
      link.onload = () => {
        loadedfonts[fontname] = true;
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    } else {
      resolve();
    }
  });
}

async function loadfontfile(file, elementtype) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const fontname = `custom-${elementtype}-${Date.now()}`;
      const fontface = new FontFace(fontname, e.target.result);
      
      fontface.load().then(function(loaded) {
        document.fonts.add(loaded);
        loadedfonts[fontname] = true;
        resolve(fontname);
      }).catch(reject);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function setfont(elementtype, fontvalue) {
  const rootstyle = document.documentElement;
  let fontfamily = 'inherit';
  
  switch(fontvalue) {
    case 'default':
      fontfamily = 'inherit';
      break;
    case 'arial':
      fontfamily = 'Arial, sans-serif';
      break;
    case 'helvetica':
      fontfamily = 'Helvetica, Arial, sans-serif';
      break;
    case 'times':
      fontfamily = '"Times New Roman", Times, serif';
      break;
    case 'georgia':
      fontfamily = 'Georgia, serif';
      break;
    case 'courier':
      fontfamily = '"Courier New", Courier, monospace';
      break;
    case 'verdana':
      fontfamily = 'Verdana, sans-serif';
      break;
    case 'roboto':
      fontfamily = '"Roboto", sans-serif';
      break;
    case 'opensans':
      fontfamily = '"Open Sans", sans-serif';
      break;
    case 'lato':
      fontfamily = '"Lato", sans-serif';
      break;
    case 'montserrat':
      fontfamily = '"Montserrat", sans-serif';
      break;
    default:
      if (fontvalue.startsWith('custom-')) {
        fontfamily = `"${fontvalue}", sans-serif`;
      }
  }
  
  rootstyle.style.setProperty(`--${elementtype}-font`, fontfamily);
}

async function applyfont(selectelement, elementtype) {
  const fontvalue = selectelement.value;
  
  if (fontvalue === 'custom') {
    return;
  }
  
  try {
    showfontloading();
    
    if (['roboto', 'opensans', 'lato', 'montserrat'].includes(fontvalue)) {
      await loadwebfont(fontvalue);
    }
    
    setfont(elementtype, fontvalue);
    updateembedframe();
    
    setTimeout(() => {
      hidefontloading();
    }, 800);
    
  } catch (error) {
    console.error('font loading error:', error);
    hidefontloading();
    shownotif('failed to load font', 'error');
  }
}

function handlefontupload(fileinput, selectelement, uploadelement, elementtype) {
  const file = fileinput.files[0];
  if (!file) return;
  
  const validtypes = ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/font-woff', 'application/x-font-ttf'];
  const validexts = ['.ttf', '.otf', '.woff', '.woff2'];
  const isvalidtype = validtypes.includes(file.type) || validexts.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!isvalidtype) {
    shownotif('invalid font file format', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    shownotif('font file too large (max 5mb)', 'error');
    return;
  }
  
  showfontloading();
  
  loadfontfile(file, elementtype)
    .then(fontname => {
      setfont(elementtype, fontname);
      updateembedframe();
      
      uploadelement.classList.add('fontupload-success');
      setTimeout(() => {
        uploadelement.classList.remove('fontupload-success');
        hidefontloading();
      }, 800);
      
      shownotif('custom font loaded successfully', 'success');
    })
    .catch(error => {
      console.error('font upload error:', error);
      hidefontloading();
      shownotif('failed to load custom font', 'error');
    });
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
    songColor: songcolorpicker.value !== getdefaultcolor('song') ? songcolorpicker.value : '',
    artistColor: artistcolorpicker.value !== getdefaultcolor('artist') ? artistcolorpicker.value : '',
    usernameColor: usercolorpicker.value !== getdefaultcolor('username') ? usercolorpicker.value : '',
    customTextColor: customtextcolorpicker.value !== getdefaultcolor('customtext') ? customtextcolorpicker.value : '',
    progressBgColor: progressbgcolorpicker.value !== getdefaultcolor('progressbg') ? progressbgcolorpicker.value : '',
    progressFillColor: progressfillcolorpicker.value !== getdefaultcolor('progressfill') ? progressfillcolorpicker.value : '',
    songEffect: songtitleeffectsel.value,
    artistEffect: artisteffectsel.value,
    usernameEffect: usernameeffectsel.value,
    customTextEffect: customtexteffectsel.value,
    cardEntrance: cardentrancesel.value,
    cardHover: cardhoversel.value,
    albumArtEffect: albumarteffectsel.value,
    progressStyle: progressstylesel.value,
    progressHeight: progressheightslider.value,
    progressRadius: progressradiusslider.value,
    songFont: songtitlefontsel.value,
    artistFont: artistfontsel.value,
    usernameFont: usernamefontsel.value,
    customTextFont: customtextfontsel.value
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
  updatecolors();
}

function connectwebsocket(userid) {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.close();
  }
  
  websocket = new WebSocket('wss://api.lanyard.rest/socket');
  websocket.onopen = () => {
    const initpayload = {
      op: 2,
      d: {
        subscribe_to_id: userid
      }
    };
    websocket.send(JSON.stringify(initpayload));
  };
  
  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handlewebsocketmessage(data);
    } catch (error) {
      console.error('websocket message error:', error);
    }
  };
  
  websocket.onclose = () => {
    if (currentuser) {
      schedulewebsocketreconnect(userid);
    }
  };
  
  websocket.onerror = (error) => {
    console.error('websocket error:', error);
  };
}

function handlewebsocketmessage(data) {
  switch (data.op) {
    case 0:
      if (data.d) {
        userdata = data.d;
        updateembedframe();
      }
      break;
    case 1:
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ op: 3 }));
      }
      break;
  }
}

function schedulewebsocketreconnect(userid) {
  if (reconnecttimeout) {
    clearTimeout(reconnecttimeout);
  }
  reconnecttimeout = setTimeout(() => {
    if (currentuser === userid) {
      connectwebsocket(userid);
    }
  }, 3000);
}

function closewebsocket() {
  if (websocket) {
    websocket.close();
    websocket = null;
  }
  if (reconnecttimeout) {
    clearTimeout(reconnecttimeout);
    reconnecttimeout = null;
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
    connectwebsocket(userid);
    updateembedframe();
    shownotif('connected to real-time updates!', 'success');
  } catch (error) {
    console.error('loading error:', error);
    shownotif('failed to connect. check the id and try again.', 'error');
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
  closewebsocket();
  updateembedframe();
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

[customtxtbox, showartistbox, showprogressbox, showalbumbox, showuserbox, 
 showdurationbox, showstatusbox].forEach((element) => {
  element.addEventListener('input', updateembedframe);
});

[songcolorpicker, artistcolorpicker, usercolorpicker, customtextcolorpicker,
 progressbgcolorpicker, progressfillcolorpicker].forEach(colorinput => {
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

darkmodebutton.addEventListener('click', () => switchtheme(false));
lightmodebutton.addEventListener('click', () => switchtheme(true));

songtitlefontsel.addEventListener('change', function() {
  if (this.value === 'custom') {
    songtitlefontfile.style.display = 'block';
    songtitlefontupload.style.display = 'flex';
    songtitlefontfile.click();
  } else {
    songtitlefontfile.style.display = 'none';
    songtitlefontupload.style.display = 'none';
    applyfont(this, 'song');
  }
});

artistfontsel.addEventListener('change', function() {
  if (this.value === 'custom') {
    artistfontfile.style.display = 'block';
    artistfontupload.style.display = 'flex';
    artistfontfile.click();
  } else {
    artistfontfile.style.display = 'none';
    artistfontupload.style.display = 'none';
    applyfont(this, 'artist');
  }
});

usernamefontsel.addEventListener('change', function() {
  if (this.value === 'custom') {
    usernamefontfile.style.display = 'block';
    usernamefontupload.style.display = 'flex';
    usernamefontfile.click();
  } else {
    usernamefontfile.style.display = 'none';
    usernamefontupload.style.display = 'none';
    applyfont(this, 'username');
  }
});

customtextfontsel.addEventListener('change', function() {
  if (this.value === 'custom') {
    customtextfontfile.style.display = 'block';
    customtextfontupload.style.display = 'flex';
    customtextfontfile.click();
  } else {
    customtextfontfile.style.display = 'none';
    customtextfontupload.style.display = 'none';
    applyfont(this, 'customtext');
  }
});

songtitlefontfile.addEventListener('change', function() {
  handlefontupload(this, songtitlefontsel, songtitlefontupload, 'song');
});

artistfontfile.addEventListener('change', function() {
  handlefontupload(this, artistfontsel, artistfontupload, 'artist');
});

usernamefontfile.addEventListener('change', function() {
  handlefontupload(this, usernamefontsel, usernamefontupload, 'username');
});

customtextfontfile.addEventListener('change', function() {
  handlefontupload(this, customtextfontsel, customtextfontupload, 'customtext');
});

songtitlefontupload.addEventListener('click', function() {
  songtitlefontfile.click();
});

artistfontupload.addEventListener('click', function() {
  artistfontfile.click();
});

usernamefontupload.addEventListener('click', function() {
  usernamefontfile.click();
});

customtextfontupload.addEventListener('click', function() {
  customtextfontfile.click();
});

window.addEventListener('beforeunload', () => {
  closewebsocket();
  if (typeof closecreditswebsockets === 'function') {
    closecreditswebsockets();
  }
});

async function loadcreditsinfo() {
  const userids = ['1170109139989561464', '1106121476932898946'];
  
  if (!creditscontainer) return;
  
  try {
    const promises = userids.map(id => fetch(`https://api.lanyard.rest/v1/users/${id}`).then(r => r.json()).then(d => d.success ? d.data : null));
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
    if (creditscontainer) {
      creditscontainer.innerHTML = '<div class="errorstate">failed to load api information</div>';
    }
  }
}

function initapp() {
  resetallcolors();
  updateembedframe();
  if (creditscontainer) {
    loadcreditsinfo();
  }
  progressheightslider.value = 6;
  progressradiusslider.value = 3;
  updatecolors();
}

initapp();
