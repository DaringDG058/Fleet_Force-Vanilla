// Fleet Force — Main SPA Application
const API = 'http://localhost:3000/api';
let currentUser = null;
let currentPage = 'dashboard';

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    // Splash → Auth after 2s
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
            showAuth();
        }, 600);
    }, 2000);

    initTheme();
    initAuth();
    initNav();
});

// ==================== THEME ====================
function initTheme() {
    const saved = localStorage.getItem('ff-theme');
    if (saved === 'light') document.documentElement.classList.add('theme-light');
    updateThemeIcon();

    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.documentElement.classList.toggle('theme-light');
        const isLight = document.documentElement.classList.contains('theme-light');
        localStorage.setItem('ff-theme', isLight ? 'light' : 'dark');
        updateThemeIcon();
    });
}

function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle');
    btn.textContent = document.documentElement.classList.contains('theme-light') ? '☀️' : '🌙';
}

// ==================== AUTH ====================
function initAuth() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const isLogin = tab.dataset.tab === 'login';
            document.getElementById('login-form').style.display = isLogin ? 'block' : 'none';
            document.getElementById('signup-form').style.display = isLogin ? 'none' : 'block';
            document.querySelector('.auth-brand p').textContent = isLogin ? 'Sign in to your account' : 'Create a new account';
        });
    });

    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('login-error');
        errEl.textContent = '';
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        if (!username || !password) { errEl.textContent = 'Please fill all fields'; return; }
        try {
            const res = await fetch(`${API}/auth/login`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) { errEl.textContent = data.error || 'Login failed'; return; }
            currentUser = data.user;
            localStorage.setItem('ff-user', JSON.stringify(currentUser));
            enterApp();
        } catch (err) { errEl.textContent = 'Connection error. Is the server running?'; }
    });

    // Signup
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('signup-error');
        errEl.textContent = '';
        const displayName = document.getElementById('signup-displayname').value.trim();
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value;
        const roleName = document.getElementById('signup-role').value;
        if (!displayName || !username || !password || !roleName) { errEl.textContent = 'Please fill all fields'; return; }
        try {
            const res = await fetch(`${API}/auth/signup`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ username, password, displayName, roleName })
            });
            const data = await res.json();
            if (!res.ok) { errEl.textContent = data.error || 'Signup failed'; return; }
            showToast('Account created! Please sign in.', 'success');
            document.querySelector('.auth-tab[data-tab="login"]').click();
        } catch (err) { errEl.textContent = 'Connection error'; }
    });

    // Load roles for signup
    loadRoles();
}

async function loadRoles() {
    try {
        const res = await fetch(`${API}/auth/roles`);
        const roles = await res.json();
        const sel = document.getElementById('signup-role');
        roles.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.ROLE_NAME;
            opt.textContent = `${r.ROLE_NAME} (Level ${r.ACCESS_LEVEL})`;
            sel.appendChild(opt);
        });
    } catch (e) {}
}

function showAuth() {
    // Check saved session
    const saved = localStorage.getItem('ff-user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            enterApp();
            return;
        } catch (e) {}
    }
    document.getElementById('auth-screen').classList.add('active');
}

// ==================== APP ENTRY ====================
function enterApp() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-shell').classList.add('active');

    // Set user info in sidebar
    const initials = (currentUser.DISPLAY_NAME || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('user-avatar').textContent = initials;
    document.getElementById('user-display-name').textContent = currentUser.DISPLAY_NAME || currentUser.USERNAME;
    document.getElementById('user-role-name').textContent = currentUser.ROLE_NAME || 'User';

    // Start dynamic badge refresh
    refreshNotifBadge();
    setInterval(refreshNotifBadge, 5000);

    navigateTo('dashboard');
    showToast(`Welcome back, ${(currentUser.DISPLAY_NAME || currentUser.USERNAME).split(' ')[0]}!`, 'success');
}

// ==================== NAVIGATION ====================
function initNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.page));
    });

    document.getElementById('sidebar-collapse-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });

    // Bell icon notification dropdown
    document.getElementById('notif-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotifDropdown();
    });
    document.addEventListener('click', () => {
        const dd = document.getElementById('notif-dropdown');
        if (dd) dd.remove();
    });

    // Logout on user click
    document.getElementById('sidebar-user').addEventListener('click', () => {
        if (confirm('Sign out?')) {
            currentUser = null;
            localStorage.removeItem('ff-user');
            document.getElementById('app-shell').classList.remove('active');
            document.getElementById('auth-screen').classList.add('active');
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
        }
    });
}

async function refreshNotifBadge() {
    try {
        const res = await fetch(`${API}/notifications/unread-count`);
        const data = await res.json();
        const badge = document.getElementById('notif-badge');
        badge.textContent = data.count;
        badge.style.display = data.count > 0 ? '' : 'none';
    } catch(e) {}
}

async function toggleNotifDropdown() {
    let dd = document.getElementById('notif-dropdown');
    if (dd) { dd.remove(); return; }
    try {
        const res = await fetch(`${API}/dashboard/alerts`);
        const alerts = await res.json();
        const iconMap = { critical: '🔴', warning: '⚠️', delivery: '✅', info: 'ℹ️' };
        dd = document.createElement('div');
        dd.id = 'notif-dropdown';
        dd.className = 'notif-dropdown';
        dd.onclick = e => e.stopPropagation();
        dd.innerHTML = `
            <div style="padding:12px 16px;font-weight:700;font-size:13px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                <span>🔔 Notifications</span><span style="font-size:11px;color:var(--text-muted)">${alerts.length} unread</span>
            </div>
            <div style="max-height:360px;overflow-y:auto">
                ${alerts.length ? alerts.map(a => `
                    <div style="padding:10px 16px;border-bottom:1px solid var(--border);font-size:12px;display:flex;gap:8px;align-items:flex-start">
                        <span style="font-size:14px">${iconMap[a.NOTIF_TYPE] || 'ℹ️'}</span>
                        <div style="flex:1;min-width:0"><div style="font-weight:600;margin-bottom:2px">${a.TITLE}</div>
                        <div style="color:var(--text-muted);font-size:11px">${a.MESSAGE}</div>
                        <div style="color:var(--text-muted);font-size:10px;margin-top:3px">${timeAgo(a.CREATED_AT)}</div></div>
                    </div>
                `).join('') : '<div style="padding:20px;text-align:center;color:var(--text-muted)">No notifications</div>'}
            </div>
            ${alerts.length ? `<div style="padding:10px 16px;border-top:1px solid var(--border);text-align:center">
                <button onclick="clearAllNotifications()" style="background:none;border:1px solid var(--border);color:var(--accent-red);font-size:12px;font-weight:600;cursor:pointer;padding:6px 16px;border-radius:var(--radius-sm);transition:all 0.2s">🗑️ Clear All</button>
            </div>` : ''}`;
        document.getElementById('notif-btn').parentElement.appendChild(dd);
    } catch(e) {}
}

window.clearAllNotifications = async function() {
    try {
        await fetch(`${API}/notifications/clear`, { method: 'POST' });
        const dd = document.getElementById('notif-dropdown');
        if (dd) dd.remove();
        refreshNotifBadge();
        showToast('All notifications cleared', 'success');
        // Refresh KPIs if on dashboard
        if (currentPage === 'dashboard') loadKPIs();
    } catch(e) { showToast('Failed to clear', 'error'); }
};

const PAGE_CONFIG = {
    dashboard:  { icon: '📊', title: 'Dashboard' },
    loads:      { icon: '📦', title: 'Loads' },
    dispatch:   { icon: '🗂️', title: 'Dispatch Board' },
    fleet:      { icon: '🚛', title: 'Fleet' },
    drivers:    { icon: '👤', title: 'Drivers' },
    tracking:   { icon: '📍', title: 'Routes & Tracking' },
    warehouses: { icon: '🏭', title: 'Warehouses' },
    billing:    { icon: '💰', title: 'Billing & Invoices' },
    reports:    { icon: '📈', title: 'Reports' },
    queries:    { icon: '⚡', title: 'SQL Terminal' },
    settings:   { icon: '⚙️', title: 'Settings' }
};

function navigateTo(page) {
    currentPage = page;
    const cfg = PAGE_CONFIG[page] || { icon: '📄', title: page };

    // Update header
    document.getElementById('page-icon').textContent = cfg.icon;
    document.getElementById('page-title-text').textContent = cfg.title;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');

    // Render page
    const content = document.getElementById('page-content');
    content.innerHTML = '';
    content.scrollTop = 0;

    if (typeof window[`render_${page}`] === 'function') {
        window[`render_${page}`](content);
    } else {
        content.innerHTML = `
            <div class="page-placeholder">
                <div class="placeholder-icon">${cfg.icon}</div>
                <h2>${cfg.title}</h2>
                <p>This module is coming soon in the next phase.</p>
            </div>
        `;
    }
}

// ==================== DASHBOARD PAGE ====================
let dashMap = null;
let truckMarkers = {};
let routeLines = {};
let dashRefreshInterval = null;

window.render_dashboard = async function(container) {
    // Cleanup previous
    if (dashRefreshInterval) { clearInterval(dashRefreshInterval); dashRefreshInterval = null; }
    if (dashMap) { dashMap.remove(); dashMap = null; }
    truckMarkers = {};

    container.innerHTML = `
        <div class="grid grid-4" id="kpi-cards" style="margin-bottom:20px">
            <div class="card shimmer" style="height:110px"></div>
            <div class="card shimmer" style="height:110px"></div>
            <div class="card shimmer" style="height:110px"></div>
            <div class="card shimmer" style="height:110px"></div>
        </div>
        <div style="display:flex;gap:20px;margin-bottom:20px">
            <div style="flex:2">
                <div class="card" style="height:420px;padding:0;overflow:hidden;position:relative">
                    <div style="position:absolute;top:12px;left:12px;z-index:10;background:var(--bg-overlay);padding:6px 14px;border-radius:var(--radius-sm);font-size:11px;font-weight:600;color:var(--text-secondary);backdrop-filter:blur(8px);border:1px solid var(--border)">
                        🟢 LIVE TRACKING — <span id="truck-count">0</span> vehicles
                    </div>
                    <div id="dashboard-map" style="height:100%"></div>
                </div>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;gap:20px">
                <div class="card" style="flex:1;overflow-y:auto">
                    <div class="card-header"><div class="card-title">📦 Today's Dispatch</div></div>
                    <div id="dispatch-list" style="display:flex;flex-direction:column;gap:6px"></div>
                </div>
            </div>
        </div>
        <div style="display:flex;gap:20px">
            <div style="flex:1">
                <div class="card">
                    <div class="card-header"><div class="card-title">🔔 Alerts</div></div>
                    <div id="alerts-list" style="display:flex;flex-direction:column;gap:8px"></div>
                </div>
            </div>
            <div style="flex:1">
                <div class="card">
                    <div class="card-header"><div class="card-title">⚡ Quick Actions</div></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" id="quick-actions">
                        <div class="quick-action" onclick="navigateTo('loads')"><div class="qa-icon" style="background:rgba(59,130,246,0.12)">📦</div><div><div class="qa-label">New Load</div><div class="qa-desc">Create a new shipment</div></div></div>
                        <div class="quick-action" onclick="navigateTo('dispatch')"><div class="qa-icon" style="background:rgba(234,179,8,0.12)">🗂️</div><div><div class="qa-label">Dispatch Board</div><div class="qa-desc">Manage assignments</div></div></div>
                        <div class="quick-action" onclick="navigateTo('fleet')"><div class="qa-icon" style="background:rgba(16,185,129,0.12)">🚛</div><div><div class="qa-label">Fleet Status</div><div class="qa-desc">21 trucks, 25 trailers</div></div></div>
                        <div class="quick-action" onclick="navigateTo('queries')"><div class="qa-icon" style="background:rgba(139,92,246,0.12)">⚡</div><div><div class="qa-label">SQL Terminal</div><div class="qa-desc">Run live queries</div></div></div>
                        <div class="quick-action" onclick="navigateTo('billing')"><div class="qa-icon" style="background:rgba(236,72,153,0.12)">💰</div><div><div class="qa-label">Invoices</div><div class="qa-desc">Billing & payments</div></div></div>
                        <div class="quick-action" onclick="navigateTo('drivers')"><div class="qa-icon" style="background:rgba(249,115,22,0.12)">👤</div><div><div class="qa-label">Drivers</div><div class="qa-desc">44 registered drivers</div></div></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize map
    initDashboardMap();
    loadKPIs();
    loadDispatch();
    loadAlerts();
    loadMapVehicles();

    // Auto-refresh positions every 3 seconds
    dashRefreshInterval = setInterval(loadMapVehicles, 3000);
};

function initDashboardMap() {
    dashMap = L.map('dashboard-map', {
        center: [20.5, 78.9], zoom: 5,
        zoomControl: false, attributionControl: false
    });
    L.control.zoom({ position: 'bottomright' }).addTo(dashMap);

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
    }).addTo(dashMap);
    tileLayer.getContainer().classList.add('dark-tiles');

    // Add hub markers
    const hubs = [
        { name: 'Mangaluru', lat: 12.9141, lng: 74.8560, code: 'M' },
        { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, code: 'B' },
        { name: 'Mumbai', lat: 19.0760, lng: 72.8777, code: 'Mu' },
        { name: 'Chennai', lat: 13.0827, lng: 80.2707, code: 'C' },
        { name: 'Delhi', lat: 28.7041, lng: 77.1025, code: 'D' },
        { name: 'Kolkata', lat: 22.5726, lng: 88.3639, code: 'K' }
    ];
    hubs.forEach(h => {
        const icon = L.divIcon({
            className: 'truck-marker',
            html: `<div class="hub-marker">${h.code}</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14]
        });
        L.marker([h.lat, h.lng], { icon }).addTo(dashMap)
            .bindPopup(`<strong>${h.name} Hub</strong><br>Fleet Force Logistics`);
    });
}

async function loadMapVehicles() {
    try {
        const res = await fetch(`${API}/tracking/positions`);
        const vehicles = await res.json();
        const truckCountEl = document.getElementById('truck-count');
        if (truckCountEl) truckCountEl.textContent = vehicles.length;

        const colors = ['blue', 'teal', 'orange', 'pink'];
        vehicles.forEach((v, i) => {
            const color = colors[i % colors.length];
            const lat = parseFloat(v.CURRENT_LAT), lng = parseFloat(v.CURRENT_LNG);
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

            if (truckMarkers[v.TRIP_ID]) {
                // Smooth move existing marker
                truckMarkers[v.TRIP_ID].setLatLng([lat, lng]);
                // Update popup with fresh progress
                truckMarkers[v.TRIP_ID].setPopupContent(`
                    <strong>🚛 ${v.REG_NO}</strong><br>
                    ${v.TRUCK_NAME || ''}<br>
                    👤 ${v.DRIVER_NAME}<br>
                    📦 ${v.LOAD_CODE || 'N/A'} — ${v.CARGO_DESC || ''}<br>
                    📍 ${v.FROM_CITY} → ${v.TO_CITY}<br>
                    <span style="color:#14b8a6">${(v.PROGRESS_PCT || 0).toFixed(1)}% complete</span>
                `);
            } else {
                const icon = L.divIcon({
                    className: 'truck-marker',
                    html: `<div class="truck-dot ${color}"></div>`,
                    iconSize: [14, 14], iconAnchor: [7, 7]
                });
                truckMarkers[v.TRIP_ID] = L.marker([lat, lng], { icon }).addTo(dashMap);
                truckMarkers[v.TRIP_ID].bindPopup(`
                    <strong>🚛 ${v.REG_NO}</strong><br>
                    ${v.TRUCK_NAME || ''}<br>
                    👤 ${v.DRIVER_NAME}<br>
                    📦 ${v.LOAD_CODE || 'N/A'} — ${v.CARGO_DESC || ''}<br>
                    📍 ${v.FROM_CITY} → ${v.TO_CITY}<br>
                    <span style="color:#14b8a6">${(v.PROGRESS_PCT || 0).toFixed(1)}% complete</span>
                `);
            }
        });

        // Load route polylines (only once)
        if (Object.keys(routeLines).length === 0) {
            loadRoutePolylines(vehicles);
        }
    } catch (e) { console.error('Map vehicles error:', e); }
}

async function loadRoutePolylines(vehicles) {
    const routeIds = [...new Set(vehicles.map(v => v.ROUTE_ID).filter(Boolean))];
    for (const routeId of routeIds) {
        try {
            const res = await fetch(`${API}/routes/${routeId}/waypoints`);
            const wps = await res.json();
            if (wps.length < 2) continue;
            const latlngs = wps.map(w => [w.LATITUDE, w.LONGITUDE]);
            routeLines[routeId] = L.polyline(latlngs, {
                color: '#14b8a6', weight: 2, opacity: 0.35, dashArray: '6,8'
            }).addTo(dashMap);
        } catch (e) {}
    }
}

async function loadKPIs() {
    try {
        const res = await fetch(`${API}/dashboard/kpis`);
        const k = await res.json();
        document.getElementById('kpi-cards').innerHTML = `
            ${kpiCard('Active Loads', k.activeLoads, '📦', 'var(--accent-blue)', '+3 today')}
            ${kpiCard('On-Time %', k.onTimePct + '%', '✅', 'var(--accent-green)', '↑ 2.1% this week')}
            ${kpiCard('Trucks Available', k.trucksAvailable + '/21', '🚛', 'var(--accent-yellow)', '19 in transit, 2 spare')}
            ${kpiCard('Exceptions', k.exceptions, '⚠️', 'var(--accent-red)', 'Requires attention', 'onclick="showExceptionsPanel()" style="cursor:pointer"')}
        `;
    } catch (e) {
        document.getElementById('kpi-cards').innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:30px">Failed to load KPIs</div>';
    }
}

async function loadDispatch() {
    try {
        const res = await fetch(`${API}/dashboard/dispatch-today`);
        const loads = await res.json();
        const list = document.getElementById('dispatch-list');
        if (!loads.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No loads</p>'; return; }
        list.innerHTML = loads.slice(0, 8).map(l => `
            <div class="dispatch-item" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);cursor:pointer" onclick="navigateTo('loads')">
                <div style="font-size:16px">${l.PRIORITY === 'Critical' ? '🔴' : l.PRIORITY === 'High' ? '🟠' : '🟢'}</div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:700">${l.LOAD_CODE}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${l.PICKUP_CITY || '?'} → ${l.DROPOFF_CITY || '?'}</div>
                </div>
                <span class="status-badge status-in-transit" style="font-size:9px">${l.STATUS}</span>
            </div>
        `).join('');
    } catch (e) {}
}

async function loadAlerts() {
    try {
        const res = await fetch(`${API}/dashboard/alerts`);
        const alerts = await res.json();
        const list = document.getElementById('alerts-list');
        if (!alerts.length) { list.innerHTML = '<p style="color:var(--text-muted)">No alerts</p>'; return; }
        const iconMap = { critical: '🔴', warning: '⚠️', delivery: '✅', info: 'ℹ️' };
        list.innerHTML = alerts.map(a => `
            <div class="alert-item">
                <div class="alert-icon ${a.NOTIF_TYPE}">${iconMap[a.NOTIF_TYPE] || 'ℹ️'}</div>
                <div style="flex:1;min-width:0">
                    <div class="alert-title">${a.TITLE}</div>
                    <div class="alert-msg">${a.MESSAGE}</div>
                    <div class="alert-time">${timeAgo(a.CREATED_AT)}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {}
}

function kpiCard(label, value, icon, color, sub, extra = '') {
    return `
        <div class="card" ${extra} style="position:relative;overflow:hidden;${extra.includes('cursor') ? 'cursor:pointer' : ''}">
            <div style="display:flex;align-items:flex-start;justify-content:space-between">
                <div>
                    <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${label}</div>
                    <div style="font-size:30px;font-weight:800">${value}</div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:6px">${sub}</div>
                </div>
                <div style="font-size:28px;opacity:0.6">${icon}</div>
            </div>
            <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${color};opacity:0.6"></div>
        </div>
    `;
}

window.showExceptionsPanel = async function() {
    try {
        const res = await fetch(`${API}/dashboard/alerts`);
        const alerts = await res.json();
        const iconMap = { critical: '🔴', warning: '⚠️', delivery: '✅', info: 'ℹ️' };
        const panel = document.getElementById('load-detail-panel');
        panel.style.display = 'block';
        panel.innerHTML = `
            <div class="detail-overlay" onclick="closeLoadDetail()"></div>
            <div class="detail-content">
                <div class="detail-header">
                    <div style="font-size:18px;font-weight:800">⚠️ Exceptions & Alerts (${alerts.length})</div>
                    <div style="display:flex;gap:8px">
                        <button class="btn" onclick="clearAllExceptions()" style="font-size:11px;color:var(--accent-red);border:1px solid var(--accent-red)">🗑️ Clear All</button>
                        <button class="btn" onclick="closeLoadDetail()">✕</button>
                    </div>
                </div>
                <div class="detail-body" id="exceptions-body" style="max-height:70vh;overflow-y:auto">
                    ${alerts.length ? alerts.map(a => `
                        <div style="padding:12px 0;border-bottom:1px solid var(--border);display:flex;gap:10px">
                            <span style="font-size:18px">${iconMap[a.NOTIF_TYPE] || 'ℹ️'}</span>
                            <div style="flex:1"><div style="font-weight:600;font-size:13px">${a.TITLE}</div>
                            <div style="color:var(--text-muted);font-size:12px;margin-top:2px">${a.MESSAGE}</div>
                            <div style="color:var(--text-muted);font-size:10px;margin-top:4px">${timeAgo(a.CREATED_AT)}</div></div>
                        </div>
                    `).join('') : '<div style="padding:30px;text-align:center;color:var(--text-muted)">No exceptions 🎉</div>'}
                </div>
            </div>`;
    } catch(e) { showToast('Failed to load exceptions', 'error'); }
};

window.clearAllExceptions = async function() {
    try {
        await fetch(`${API}/notifications/clear`, { method: 'POST' });
        document.getElementById('exceptions-body').innerHTML = '<div style="padding:30px;text-align:center;color:var(--text-muted)">All cleared 🎉</div>';
        refreshNotifBadge();
        loadKPIs();
        showToast('All exceptions cleared', 'success');
    } catch(e) { showToast('Failed to clear', 'error'); }
};

window.closeLoadDetail = function() {
    const panel = document.getElementById('load-detail-panel');
    if (panel) panel.style.display = 'none';
};

// ==================== TOAST ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ==================== UTILITY ====================
function formatINR(amount) {
    if (!amount) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}
