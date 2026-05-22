// Fleet Force — Settings Page
window.render_settings = async function(container) {
    container.innerHTML = `
        <div class="grid grid-2" style="gap:16px">
            <div class="card" style="padding:20px">
                <div class="card-header" style="margin-bottom:16px"><div class="card-title">👤 User Profile</div></div>
                <div id="settings-profile"></div>
            </div>
            <div class="card" style="padding:20px">
                <div class="card-header" style="margin-bottom:16px"><div class="card-title">🎨 Appearance</div></div>
                <div style="display:flex;flex-direction:column;gap:16px">
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)">
                        <div>
                            <div style="font-size:13px;font-weight:600">Theme</div>
                            <div style="font-size:11px;color:var(--text-muted)">Toggle between dark and light mode</div>
                        </div>
                        <button class="btn btn-primary" onclick="document.getElementById('theme-toggle').click()" style="font-size:12px" id="settings-theme-btn">${document.documentElement.classList.contains('theme-light') ? '☀️ Light' : '🌙 Dark'}</button>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)">
                        <div>
                            <div style="font-size:13px;font-weight:600">Simulation Speed</div>
                            <div style="font-size:11px;color:var(--text-muted)">1 real minute = 20 simulation minutes</div>
                        </div>
                        <span style="font-size:14px;font-weight:800;color:var(--accent-teal)">1:20</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)">
                        <div>
                            <div style="font-size:13px;font-weight:600">Map Refresh</div>
                            <div style="font-size:11px;color:var(--text-muted)">Vehicle positions update interval</div>
                        </div>
                        <span style="font-size:14px;font-weight:800;color:var(--accent-teal)">3s</span>
                    </div>
                </div>
            </div>
            <div class="card" style="padding:20px;grid-column:1/-1">
                <div class="card-header" style="margin-bottom:16px"><div class="card-title">👥 User Management</div></div>
                <div style="overflow-x:auto">
                    <table style="width:100%;border-collapse:collapse" id="users-table">
                        <thead><tr style="background:var(--bg-tertiary)">
                            <th class="th">ID</th>
                            <th class="th">Username</th>
                            <th class="th">Display Name</th>
                            <th class="th">Role</th>
                            <th class="th">Access Level</th>
                            <th class="th">Last Login</th>
                        </tr></thead>
                        <tbody id="users-tbody"></tbody>
                    </table>
                </div>
            </div>
            <div class="card" style="padding:20px">
                <div class="card-header" style="margin-bottom:16px"><div class="card-title">🗄️ Database Info</div></div>
                <div style="display:flex;flex-direction:column;gap:10px;font-size:12px">
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                        <span style="color:var(--text-muted)">Database</span><span style="font-family:var(--font-mono)">Oracle 26ai</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                        <span style="color:var(--text-muted)">Service</span><span style="font-family:var(--font-mono)">FREEPDB1</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                        <span style="color:var(--text-muted)">Schema</span><span style="font-family:var(--font-mono)">FLEET_FORCE</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                        <span style="color:var(--text-muted)">Host</span><span style="font-family:var(--font-mono)">localhost:1521</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                        <span style="color:var(--text-muted)">Connection</span><span style="font-family:var(--font-mono);color:var(--accent-green)">Thin Mode</span>
                    </div>
                </div>
            </div>
            <div class="card" style="padding:20px">
                <div class="card-header" style="margin-bottom:16px"><div class="card-title">ℹ️ System Info</div></div>
                <div style="display:flex;flex-direction:column;gap:10px;font-size:12px">
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                        <span style="color:var(--text-muted)">App</span><span style="font-weight:700">Fleet Force v1.0</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                        <span style="color:var(--text-muted)">Backend</span><span style="font-family:var(--font-mono)">Node.js + Express</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                        <span style="color:var(--text-muted)">Frontend</span><span style="font-family:var(--font-mono)">Vanilla JS SPA</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                        <span style="color:var(--text-muted)">Map</span><span style="font-family:var(--font-mono)">Leaflet.js + OSM</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                        <span style="color:var(--text-muted)">Fleet</span><span style="font-family:var(--font-mono)">21 trucks, 25 trailers, 44 drivers</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Current user profile
    if (currentUser) {
        document.getElementById('settings-profile').innerHTML = `
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
                <div style="width:56px;height:56px;border-radius:50%;background:var(--accent-teal);color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800">
                    ${(currentUser.DISPLAY_NAME || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <div style="font-size:16px;font-weight:800">${currentUser.DISPLAY_NAME || currentUser.USERNAME}</div>
                    <div style="font-size:12px;color:var(--text-muted)">${currentUser.ROLE_NAME || 'User'}</div>
                    <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">@${currentUser.USERNAME}</div>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:12px">
                <div style="padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);display:flex;justify-content:space-between">
                    <span style="color:var(--text-muted)">Access Level</span><span style="font-weight:700">${currentUser.ACCESS_LEVEL || '5'}</span>
                </div>
                <div style="padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);display:flex;justify-content:space-between">
                    <span style="color:var(--text-muted)">Last Login</span><span>${currentUser.LAST_LOGIN ? new Date(currentUser.LAST_LOGIN).toLocaleString('en-IN') : 'Now'}</span>
                </div>
            </div>`;
    }

    // Load users
    try {
        const res = await fetch(`${API}/settings/users`);
        const users = await res.json();
        const roleBadgeMap = {
            'Super Admin': 'status-critical',
            'Fleet Manager': 'status-in-transit',
            'Warehouse Manager': 'status-assigned',
            'Dispatcher': 'status-available',
            'Driver': 'status-spare'
        };
        document.getElementById('users-tbody').innerHTML = users.map(u => `
            <tr style="border-bottom:1px solid var(--border)">
                <td class="td" style="font-family:var(--font-mono);font-size:12px">${u.USER_ID}</td>
                <td class="td" style="font-family:var(--font-mono);font-size:12px;color:var(--accent-teal)">${u.USERNAME}</td>
                <td class="td" style="font-size:12px;font-weight:600">${u.DISPLAY_NAME || '—'}</td>
                <td class="td"><span class="status-badge ${roleBadgeMap[u.ROLE_NAME] || 'status-spare'}" style="font-size:9px">${u.ROLE_NAME}</span></td>
                <td class="td" style="font-size:12px;text-align:center;font-weight:700">${u.ACCESS_LEVEL}</td>
                <td class="td" style="font-size:11px;color:var(--text-muted)">${u.LAST_LOGIN ? new Date(u.LAST_LOGIN).toLocaleString('en-IN') : '—'}</td>
            </tr>
        `).join('');
    } catch (e) {}
};
