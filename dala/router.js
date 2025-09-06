(function() {
  const routes = {
    '/': 'home',
    '/home': 'home',
    '/credits': 'credits',
    '/changelogs': 'changelogs'
  };

  function navigate(path) {
    const route = routes[path];
    if (!route) return;

    if (route === 'home') {
      loadhomepage();
    } else if (route === 'credits') {
      loadcreditspage();
    } else if (route === 'changelogs') {
      loadchangelogspage();
    }

    window.history.pushState({ route }, '', path);
    document.title = `Spotynif — ${route}`;
  }

  function loadhomepage() {
    fetch('/index.html')
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('main');
        if (content) {
          document.querySelector('main').innerHTML = content.innerHTML;
        }
      })
      .catch(() => window.location.href = '/');
  }

  function loadcreditspage() {
    const content = `
      <header class="mainheader">
        <div class="headerlogo">
          <div class="logodot"></div>
          <h1>credits</h1>
        </div>
        <p class="headersubtitle">people behind spotynif project</p>
      </header>
      
      <section class="creditspage">
        <div class="creditsgrid" id="creditsgrid">
          <div class="loadingstate">loading credits information...</div>
        </div>
        
        <div class="backhome">
          <a href="/home" class="modernbtn btnprimary" onclick="navigate('/home'); return false;">
            <i class="fas fa-arrow-left"></i>
            back home
          </a>
        </div>
      </section>
    `;

    document.querySelector('main').innerHTML = content;
    loadcredits();
  }

  function loadchangelogspage() {
    const content = `
      <header class="mainheader">
        <div class="headerlogo">
          <div class="logodot"></div>
          <h1>changelogs</h1>
        </div>
        <p class="headersubtitle">version history and updates</p>
      </header>
      
      <section class="changelogpage">
        <div class="changelogcontainer">
          <article class="versioncard">
            <div class="versionheader">
              <img src="https://i.pinimg.com/1200x/aa/de/fd/aadefdf04b3bbe4d5517d2cb4e4ffde8.jpg" alt="Version 1 Update" class="versionimage">
              <div class="versioninfo">
                <h2 class="versionnumber">version 1</h2>
                <div class="versiondate">september 6, 2025</div>
              </div>
            </div>
            <div class="versioncontent">
              <h3 class="sectiontitle">improvements</h3>
              <ul class="changelist">
                <li>enhanced card visual effects and animations</li>
                <li>improved stability and performance</li>
                <li>better responsiveness across different screen sizes</li>
                <li>refined color customization system</li>
              </ul>
              
              <h3 class="sectiontitle">fixes</h3>
              <ul class="changelist">
                <li>temporarily removed typing effect due to multiple card bugs</li>
                <li>fixed progress bar animation issues</li>
                <li>resolved layout problems on mobile devices</li>
              </ul>
            </div>
          </article>
        </div>
        
        <div class="backhome">
          <a href="/home" class="modernbtn btnprimary" onclick="navigate('/home'); return false;">
            <i class="fas fa-arrow-left"></i>
            back home
          </a>
        </div>
      </section>
    `;

    document.querySelector('main').innerHTML = content;
  }

  async function loadcredits() {
    const userids = ['1170109139989561464', '1106121476932898946'];
    const creditsgrid = document.getElementById('creditsgrid');
    
    try {
      const promises = userids.map(id => 
        fetch(`https://api.lanyard.rest/v1/users/${id}`)
          .then(r => r.json())
          .then(d => d.success ? d.data : null)
      );
      
      const results = await Promise.all(promises);
      creditsgrid.innerHTML = '';
      
      results.forEach((data, index) => {
        const creditcard = document.createElement('div');
        creditcard.className = 'creditcard';
        
        if (data) {
          const user = data.discord_user;
          const spotify = data.spotify;
          
          creditcard.innerHTML = `
            <div class="creditheader">
              <img class="creditavatar" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" alt="${user.username}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
              <div class="credituserinfo">
                <h3>${user.global_name || user.username}</h3>
                <div class="creditrole">${index === 0 ? 'lead developer' : 'contributor'}</div>
                <div class="credituserid">${user.id}</div>
              </div>
            </div>
            <div class="creditstatus">
              <div class="statusindicator status${data.discord_status}"></div>
              <span class="statustext">${data.discord_status}</span>
            </div>
            <div class="creditspotify ${!spotify ? 'notlistening' : ''}">
              ${spotify ? `
                <div class="spotifytrack">${spotify.song}</div>
                <div class="spotifyartist">by ${spotify.artist}</div>
              ` : `
                <div class="spotifytrack">not listening to spotify</div>
              `}
            </div>
          `;
        } else {
          creditcard.innerHTML = `
            <div class="errorstate">
              <div>failed to load user data</div>
              <div class="credituserid">${userids[index]}</div>
            </div>
          `;
        }
        
        creditsgrid.appendChild(creditcard);
      });
    } catch (error) {
      creditsgrid.innerHTML = '<div class="errorstate">failed to load credits information</div>';
    }
  }

  // Handle initial page load
  window.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    const route = routes[path];
    
    if (route && route !== 'home') {
      if (route === 'credits') {
        loadcreditspage();
      } else if (route === 'changelogs') {
        loadchangelogspage();
      }
      document.title = `Spotynif — ${route}`;
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', function(event) {
    const path = window.location.pathname;
    const route = routes[path];
    
    if (route === 'home') {
      window.location.reload();
    } else if (route === 'credits') {
      loadcreditspage();
    } else if (route === 'changelogs') {
      loadchangelogspage();
    }
  });

  // Make navigate function global
  window.navigate = navigate;

  // Handle navigation clicks
  document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="/"]') && !e.target.hasAttribute('target')) {
      e.preventDefault();
      const path = e.target.getAttribute('href');
      navigate(path);
    }
  });

})();
