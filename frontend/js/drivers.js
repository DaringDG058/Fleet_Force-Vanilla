// Fleet Force — Drivers Page Module
window.render_drivers = async function(container) {
    container.innerHTML = `
        <div class="grid grid-4" id="driver-kpis" style="margin-bottom:20px">
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px">
            <div style="display:flex;gap:6px" id="driver-filters">
                <button class="btn btn-primary drv-filter active" data-df="all">All</button>
                <button class="btn drv-filter" data-df="On Trip">On Trip</button>
                <button class="btn drv-filter" data-df="Available">Available</button>
                <button class="btn drv-filter" data-df="On Rest">On Rest</button>
            </div>
            <input type="text" id="driver-search" placeholder="Search drivers..." style="margin-left:auto;padding:9px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:13px;width:220px">
            <button class="btn btn-primary" onclick="showAddDriverModal()">+ Add Driver</button>
        </div>
        <div id="drivers-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px"></div>
    `;

    const drivers = await fetchDrivers();
    renderDriverCards(drivers);
    initDriverFilters(drivers);
};

async function fetchDrivers() {
    try {
        const res = await fetch(`${API}/drivers`);
        return await res.json();
    } catch(e) { return []; }
}

function renderDriverCards(drivers) {
    const grid = document.getElementById('drivers-grid');
    const all = drivers.length;
    const onTrip = drivers.filter(d => d.STATUS === 'On Trip').length;
    const avail = drivers.filter(d => d.STATUS === 'Available').length;
    const onRest = drivers.filter(d => d.STATUS === 'On Rest').length;
    document.getElementById('driver-kpis').innerHTML = `
        ${drvKPI('Total Drivers', all, '👥', 'var(--accent-blue)')}
        ${drvKPI('On Trip', onTrip, '🚛', 'var(--accent-teal)')}
        ${drvKPI('Available', avail, '✅', 'var(--accent-green)')}
        ${drvKPI('On Rest', onRest, '😴', 'var(--accent-yellow)')}
    `;

    if (!drivers.length) { grid.innerHTML = '<p style="color:var(--text-muted)">No drivers</p>'; return; }
    grid.innerHTML = drivers.map(d => {
        const statusCls = d.STATUS === 'On Trip' ? 'status-in-transit' : d.STATUS === 'Available' ? 'status-available' : d.STATUS === 'On Rest' ? 'status-assigned' : 'status-spare';
        const stars = d.DRIVER_RATING ? '⭐'.repeat(Math.round(d.DRIVER_RATING)) : '';
        const photoPath = d.PHOTO_PATH || `/drivers/${d.DRIVER_ID}.jpg`;
        return `
        <div class="card driver-card" onclick="openDriverDetail(${d.DRIVER_ID})" style="cursor:pointer;padding:16px;position:relative">
            ${(d.STATUS === 'Available' || d.STATUS === 'Off Duty') ? `<button class="btn" style="position:absolute;top:8px;right:8px;padding:2px 6px;font-size:12px;z-index:1" onclick="event.stopPropagation();deleteDriver(${d.DRIVER_ID},'${d.FIRST_NAME} ${d.LAST_NAME}')">🗑️</button>` : ''}
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                <div class="driver-photo-thumb" style="background-image:url('${photoPath}')"></div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:14px;font-weight:700">${d.FIRST_NAME} ${d.LAST_NAME}</div>
                    <div style="font-size:11px;color:var(--text-muted)">${d.LICENSE_NO || ''}</div>
                </div>
                <span class="status-badge ${statusCls}" style="font-size:9px">${d.STATUS}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
                <div><span style="color:var(--text-muted)">Hub:</span> ${d.HUB_CITY || '—'}</div>
                <div><span style="color:var(--text-muted)">Rating:</span> ${d.DRIVER_RATING ? d.DRIVER_RATING.toFixed(1) : '—'} ${stars}</div>
                <div><span style="color:var(--text-muted)">Trips:</span> ${d.TOTAL_TRIPS || 0}</div>
                <div><span style="color:var(--text-muted)">KMs:</span> ${d.TOTAL_KM ? Number(d.TOTAL_KM).toLocaleString() : 0}</div>
            </div>
            ${d.ROUTE_NAME ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);font-size:11px;color:var(--accent-teal)">📍 ${d.FROM_CITY} → ${d.TO_CITY}</div>` : ''}
        </div>`;
    }).join('');
}

function initDriverFilters(drivers) {
    document.querySelectorAll('.drv-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.drv-filter').forEach(b => { b.classList.remove('active','btn-primary'); });
            btn.classList.add('active','btn-primary');
            const f = btn.dataset.df;
            renderDriverCards(f === 'all' ? drivers : drivers.filter(d => d.STATUS === f));
        });
    });
    document.getElementById('driver-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        renderDriverCards(drivers.filter(d =>
            `${d.FIRST_NAME} ${d.LAST_NAME}`.toLowerCase().includes(q) ||
            (d.LICENSE_NO || '').toLowerCase().includes(q) ||
            (d.HUB_CITY || '').toLowerCase().includes(q) ||
            (d.PHONE || '').includes(q)
        ));
    });
}

function drvKPI(label, value, icon, color) {
    return `<div class="card" style="position:relative;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div><div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">${label}</div>
            <div style="font-size:26px;font-weight:800">${value}</div></div>
            <div style="font-size:24px;opacity:0.5">${icon}</div>
        </div><div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${color};opacity:0.5"></div></div>`;
}

window.openDriverDetail = async function(id) {
    try {
        const res = await fetch(`${API}/drivers/${id}`);
        const d = await res.json();
        const photoPath = d.PHOTO_PATH || `/drivers/${d.DRIVER_ID}.jpg`;
        const panel = document.getElementById('load-detail-panel');
        panel.style.display = 'block';

        // Current trip section
        let tripSection = '';
        if (d.TRIP_ID && d.FROM_CITY) {
            tripSection = `
                <hr style="border:none;border-top:1px solid var(--border);margin:20px 0">
                <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">🚛 Current Trip</h4>
                <div class="detail-grid">
                    <div class="detail-field"><div class="df-label">Route</div><div class="df-value">${d.ROUTE_NAME || `${d.FROM_CITY} → ${d.TO_CITY}`}</div></div>
                    <div class="detail-field"><div class="df-label">Distance</div><div class="df-value">${d.DISTANCE_KM ? Number(d.DISTANCE_KM).toLocaleString() + ' km' : '—'}</div></div>
                    <div class="detail-field"><div class="df-label">Truck</div><div class="df-value">${d.TRUCK_REG || '—'} ${d.TRUCK_NAME || ''}</div></div>
                    <div class="detail-field"><div class="df-label">Progress</div><div class="df-value">${d.PROGRESS_PCT != null ? d.PROGRESS_PCT.toFixed(1) + '%' : '—'}</div></div>
                </div>
                ${d.PROGRESS_PCT != null ? `
                <div style="margin-top:10px">
                    <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                        <div style="height:100%;width:${d.PROGRESS_PCT}%;background:var(--accent-teal);border-radius:3px;transition:width 0.5s"></div>
                    </div>
                </div>` : ''}`;
        }

        panel.innerHTML = `
            <div class="detail-overlay" onclick="closeLoadDetail()"></div>
            <div class="detail-content">
                <div class="detail-header">
                    <div style="display:flex;align-items:center;gap:14px">
                        <div class="driver-photo-lg" style="background-image:url('${photoPath}')"></div>
                        <div><div style="font-size:18px;font-weight:800">${d.FIRST_NAME} ${d.LAST_NAME}</div>
                        <div style="font-size:12px;color:var(--text-muted)">${d.LICENSE_NO || ''} • ${d.LICENSE_TYPE || 'HMV'}</div></div>
                    </div>
                    <button class="btn" onclick="closeLoadDetail()">✕</button>
                </div>
                <div class="detail-body">
                    <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">📋 Personal Information</h4>
                    <div class="detail-grid">
                        <div class="detail-field"><div class="df-label">Status</div><div class="df-value"><span class="status-badge ${d.STATUS === 'On Trip' ? 'status-in-transit' : d.STATUS === 'Available' ? 'status-available' : 'status-assigned'}">${d.STATUS}</span></div></div>
                        <div class="detail-field"><div class="df-label">Home Hub</div><div class="df-value">${d.HUB_CITY || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Date of Birth</div><div class="df-value">${d.DATE_OF_BIRTH ? new Date(d.DATE_OF_BIRTH).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Blood Group</div><div class="df-value">${d.BLOOD_GROUP || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Phone</div><div class="df-value">${d.PHONE || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Email</div><div class="df-value" style="font-size:11px">${d.EMAIL || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Emergency Contact</div><div class="df-value">${d.EMERGENCY_CONTACT || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Joined</div><div class="df-value">${d.CREATED_AT ? new Date(d.CREATED_AT).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}</div></div>
                    </div>
                    <hr style="border:none;border-top:1px solid var(--border);margin:20px 0">
                    <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">🪪 License & Performance</h4>
                    <div class="detail-grid">
                        <div class="detail-field"><div class="df-label">License No</div><div class="df-value" style="font-family:var(--font-mono);font-size:12px">${d.LICENSE_NO || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">License Type</div><div class="df-value">${d.LICENSE_TYPE || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">License Expiry</div><div class="df-value">${d.LICENSE_EXPIRY ? new Date(d.LICENSE_EXPIRY).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Experience</div><div class="df-value">${d.EXPERIENCE_YRS ? d.EXPERIENCE_YRS + ' years' : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Rating</div><div class="df-value">${d.DRIVER_RATING ? d.DRIVER_RATING.toFixed(1) + ' ⭐' : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Total Trips</div><div class="df-value">${d.TOTAL_TRIPS || 0}</div></div>
                        <div class="detail-field"><div class="df-label">Total Distance</div><div class="df-value">${d.TOTAL_KM ? Number(d.TOTAL_KM).toLocaleString() + ' km' : '0 km'}</div></div>
                    </div>
                    ${tripSection}
                </div>
            </div>`;
    } catch(e) { showToast('Failed to load driver details', 'error'); }
};

// ---- CRUD Functions ----

window.showAddDriverModal = async function() {
    let hubs = [];
    try { hubs = await fetch(`${API}/hubs`).then(r => r.json()); } catch(e) {}

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'add-driver-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 style="font-size:16px;font-weight:700">👤 Add New Driver</h3>
                <button class="btn" onclick="document.getElementById('add-driver-modal').remove()">✕</button>
            </div>
            <form id="add-driver-form" style="display:flex;flex-direction:column;gap:14px;padding:20px;max-height:70vh;overflow-y:auto">
                <div style="display:flex;gap:12px">
                    <div class="auth-field" style="margin:0;flex:1"><label>First Name</label>
                        <input type="text" id="ad-fname" placeholder="Rajesh" required></div>
                    <div class="auth-field" style="margin:0;flex:1"><label>Last Name</label>
                        <input type="text" id="ad-lname" placeholder="Kumar" required></div>
                </div>
                <div style="display:flex;gap:12px">
                    <div class="auth-field" style="margin:0;flex:1"><label>Date of Birth</label>
                        <input type="date" id="ad-dob" required></div>
                    <div class="auth-field" style="margin:0;flex:1"><label>Blood Group</label>
                        <select id="ad-blood" required>
                            <option value="" disabled selected>Select</option>
                            <option>A+</option><option>A-</option>
                            <option>B+</option><option>B-</option>
                            <option>O+</option><option>O-</option>
                            <option>AB+</option><option>AB-</option>
                        </select>
                    </div>
                </div>
                <div class="auth-field" style="margin:0"><label>License No</label>
                    <input type="text" id="ad-license" placeholder="KA0420170056789" required></div>
                <div style="display:flex;gap:12px">
                    <div class="auth-field" style="margin:0;flex:1"><label>License Expiry</label>
                        <input type="date" id="ad-licexp" required></div>
                    <div class="auth-field" style="margin:0;flex:1"><label>Experience (Years)</label>
                        <input type="number" id="ad-exp" placeholder="5" min="0" required></div>
                </div>
                <div style="display:flex;gap:12px">
                    <div class="auth-field" style="margin:0;flex:1"><label>Phone</label>
                        <input type="text" id="ad-phone" placeholder="+91 98765 43210" required></div>
                    <div class="auth-field" style="margin:0;flex:1"><label>Email</label>
                        <input type="text" id="ad-email" placeholder="driver@fleet.com"></div>
                </div>
                <div style="display:flex;gap:12px">
                    <div class="auth-field" style="margin:0;flex:1"><label>Emergency Contact</label>
                        <input type="text" id="ad-emergency" placeholder="+91 98765 43211"></div>
                    <div class="auth-field" style="margin:0;flex:1"><label>Home Hub</label>
                        <select id="ad-hub" required>
                            ${hubs.map(h => `<option value="${h.HUB_ID}">${h.CITY}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="auth-field" style="margin:0"><label>Photo Path</label>
                    <input type="text" id="ad-photo" placeholder="drivers/45.jpg"></div>
                <button type="submit" class="auth-submit">Add Driver →</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('add-driver-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/drivers`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    firstName: document.getElementById('ad-fname').value,
                    lastName: document.getElementById('ad-lname').value,
                    dateOfBirth: document.getElementById('ad-dob').value,
                    licenseNo: document.getElementById('ad-license').value,
                    licenseExpiry: document.getElementById('ad-licexp').value,
                    phone: document.getElementById('ad-phone').value,
                    email: document.getElementById('ad-email').value,
                    emergencyContact: document.getElementById('ad-emergency').value,
                    bloodGroup: document.getElementById('ad-blood').value,
                    experienceYrs: document.getElementById('ad-exp').value,
                    homeHubId: document.getElementById('ad-hub').value,
                    photoPath: document.getElementById('ad-photo').value
                })
            });
            const data = await res.json();
            if (data.success !== false) {
                showToast('Driver added successfully!', 'success');
                modal.remove(); navigateTo('drivers');
            } else { showToast(data.error || 'Failed to add driver', 'error'); }
        } catch(err) { showToast('Error adding driver', 'error'); }
    });
};

window.deleteDriver = async function(id, name) {
    if (!confirm('Are you sure you want to delete driver ' + name + '?')) return;
    try {
        const res = await fetch(`${API}/drivers/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success !== false) {
            showToast('Driver ' + name + ' deleted', 'success');
            navigateTo('drivers');
        } else { showToast(data.error || 'Failed to delete', 'error'); }
    } catch(e) { showToast('Error deleting driver', 'error'); }
};
