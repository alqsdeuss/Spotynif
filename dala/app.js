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
  progressbgcolorpicker.value
