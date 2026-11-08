// GitHub Remote Management Endpoint
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/nintendo-source/Glaxist-Data/main';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) lucide.createIcons();

  // Setup Navigation Tabs
  setupTabNavigation();

  // Fetch Remote Panel Configs on App Startup
  fetchRemoteGitHubData();

  // Hook Launch Button to Electron Main Engine Process
  setupPlayButton();
});

// 1. Tab Navigation Routing System
function setupTabNavigation() {
  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

  const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  const activeTab = document.getElementById(`tab-${tabId}`);

  if (activeBtn) activeBtn.classList.add('active');
  if (activeTab) activeTab.classList.add('active');

  // Trigger Lazy Data Loaders
  if (tabId === 'discover') loadDiscoverContent('mods');
}

// 2. Remote GitHub JSON Data Panel Sync
async function fetchRemoteGitHubData() {
  try {
    const serversRes = await fetch(`${GITHUB_RAW_BASE}/featured_servers.json`);
    if (serversRes.ok) {
      const serversData = await serversRes.json();
      renderFeaturedServers(serversData.featured_servers || []);
    }

    const newsRes = await fetch(`${GITHUB_RAW_BASE}/news.json`);
    if (newsRes.ok) {
      const newsData = await newsRes.json();
      renderNewsItems(newsData.news_items || []);
    }
  } catch (err) {
    console.warn('[Glaxist Panel] Offline or missing remote GitHub repo data. Using local cache.');
  }
}

function renderFeaturedServers(servers) {
  const container = document.getElementById('featured-servers-grid');
  if (!container) return;

  container.innerHTML = servers.map(server => `
    <div class="featured-card">
      <h4>${server.name}</h4>
      <p>IP: <code>${server.ip}</code></p>
      <span class="badge">${server.badge || 'FEATURED'}</span>
    </div>
  `).join('');
}

function renderNewsItems(items) {
  const container = document.getElementById('news-container');
  if (!container) return;

  container.innerHTML = items.map(item => `
    <div class="instance-card">
      <h4>${item.title}</h4>
      <p style="font-size:0.8rem; color:#9ca3af;">${item.summary}</p>
      <span class="badge">${item.date}</span>
    </div>
  `).join('');
}

// 3. Modrinth & Marketplace API Handler
async function loadDiscoverContent(category = 'mods') {
  const grid = document.getElementById('discover-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-state">Fetching live marketplace items...</div>';

  try {
    const res = await fetch(`https://api.modrinth.com/v2/search?query=&facets=[["project_type:${category === 'maps' ? 'mod' : 'mod'}"]]`);
    const data = await res.json();

    grid.innerHTML = data.hits.slice(0, 6).map(item => `
      <div class="market-card">
        <h4>${item.title}</h4>
        <p style="font-size:0.8rem; color:#9ca3af;">${item.description.substring(0, 80)}...</p>
        <button class="btn-primary" style="padding:6px 12px; font-size:0.75rem; margin-top:8px;">
          <i data-lucide="download"></i> 1-CLICK INSTALL
        </button>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    grid.innerHTML = '<p>Error loading marketplace data.</p>';
  }
}

// 4. Play Button Game Launcher Integration
function setupPlayButton() {
  const playBtn = document.getElementById('play-btn');
  if (!playBtn) return;

  playBtn.addEventListener('click', async () => {
    playBtn.disabled = true;
    playBtn.innerHTML = '<i data-lucide="loader"></i> LAUNCHING...';
    if (window.lucide) lucide.createIcons();

    // Trigger Electron IPC execution
    if (window.electron && window.electron.invoke) {
      const res = await window.electron.invoke('launch-game', {
        playerName: 'Shylush',
        version: '1.21.1'
      });
      console.log('Launch output:', res);
    } else {
      console.log('[Dev Mode] Launch IPC simulated.');
    }

    setTimeout(() => {
      playBtn.disabled = false;
      playBtn.innerHTML = '<i data-lucide="play"></i> PLAY';
      if (window.lucide) lucide.createIcons();
    }, 4000);
  });
}
