// Fleet Force — Fleet Page Module
window.render_fleet = async function(container) {
    container.innerHTML = `
        <div class="grid grid-4" id="fleet-kpis" style="margin-bottom:20px">
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:16px;align-items:center">
            <button class="btn btn-primary fleet-tab active" data-ftab="tractors">🚛 Tractors</button>
            <button class="btn fleet-tab" data-ftab="trailers">📦 Trailers</button>
            <div style="flex:1"></div>
            <button class="btn btn-primary" id="add-truck-btn" onclick="showAddTruckModal()">+ Add Truck</button>
            <button class="btn btn-primary" id="add-trailer-btn" onclick="showAddTrailerModal()" style="display:none">+ Add Trailer</button>
        </div>
        <div id="fleet-tab-tractors" class="fleet-panel"></div>
        <div id="fleet-tab-trailers" class="fleet-panel" style="display:none"></div>
    `;

    document.querySelectorAll('.fleet-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fleet-tab').forEach(b => { b.classList.remove('active','btn-primary'); });
            btn.classList.add('active','btn-primary');
            document.querySelectorAll('.fleet-panel').forEach(p => p.style.display = 'none');
            document.getElementById(`fleet-tab-${btn.dataset.ftab}`).style.display = 'block';
            // Toggle add buttons
            const truckBtn = document.getElementById('add-truck-btn');
            const trailerBtn = document.getElementById('add-trailer-btn');
            if (btn.dataset.ftab === 'tractors') {
                truckBtn.style.display = ''; trailerBtn.style.display = 'none';
            } else {
                truckBtn.style.display = 'none'; trailerBtn.style.display = '';
            }
        });
    });

    loadTractors();
    loadTrailers();
    loadFleetKPIs();
};

async function loadFleetKPIs() {
    try {
        const [t, tr] = await Promise.all([
            fetch(`${API}/fleet/tractors`).then(r => r.json()),
            fetch(`${API}/fleet/trailers`).then(r => r.json())
        ]);
        const onTrip = t.filter(x => x.STATUS === 'In Use' || x.STATUS === 'In Transit' || x.STATUS === 'On Trip').length;
        const spare = t.filter(x => x.STATUS === 'Spare').length;
        document.getElementById('fleet-kpis').innerHTML = `
            ${fleetKPI('Total Tractors', t.length, '🚛', 'var(--accent-blue)')}
            ${fleetKPI('On Trip', onTrip, '🛣️', 'var(--accent-teal)')}
            ${fleetKPI('Spare', spare, '✅', 'var(--accent-green)')}
            ${fleetKPI('Total Trailers', tr.length, '📦', 'var(--accent-purple)')}
        `;
    } catch(e) {}
}

function fleetKPI(label, value, icon, color) {
    return `<div class="card" style="position:relative;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div><div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">${label}</div>
            <div style="font-size:26px;font-weight:800">${value}</div></div>
            <div style="font-size:24px;opacity:0.5">${icon}</div>
        </div><div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${color};opacity:0.5"></div></div>`;
}

function truckImg(make) {
    const map = { 'Volvo': '/trucks/volvo.jpg', 'Scania': '/trucks/scania.jpg', 'DAF': '/trucks/daf.jpg', 'Mercedes-Benz': '/trucks/merc_actross.jpg' };
    return map[make] || '/trucks/volvo.jpg';
}

async function loadTractors() {
    try {
        const trucks = await fetch(`${API}/fleet/tractors`).then(r => r.json());
        const panel = document.getElementById('fleet-tab-tractors');
        panel.innerHTML = `<div class="card" style="padding:0;overflow:hidden"><table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:var(--bg-tertiary)">
                <th class="th">Truck</th><th class="th">Reg No</th><th class="th">Hub</th>
                <th class="th">Status</th><th class="th">Driver</th><th class="th">Mileage</th>
            </tr></thead>
            <tbody>${trucks.map(t => `
                <tr class="trow" onclick="openTruckDetail(${t.TRACTOR_ID})">
                    <td class="td"><div style="display:flex;align-items:center;gap:10px">
                        <img src="${truckImg(t.MAKE)}" alt="${t.MAKE}" style="width:48px;height:32px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">
                        <div><div style="font-size:13px;font-weight:600">${t.MAKE} ${t.MODEL}</div>
                        <div style="font-size:10px;color:var(--text-muted)">${t.YEAR_OF_MFG || ''} • ${t.FUEL_TYPE || 'Diesel'}</div></div>
                    </div></td>
                    <td class="td"><span style="font-family:var(--font-mono);font-size:12px;font-weight:600">${t.REG_NO}</span></td>
                    <td class="td"><span style="font-size:12px">${t.HUB_CITY || '—'}</span></td>
                    <td class="td"><span class="status-badge ${truckStatusClass(t.STATUS)}">${t.STATUS}</span></td>
                    <td class="td"><span style="font-size:12px">${t.DRIVER_NAME || '—'}</span></td>
                    <td class="td"><span style="font-size:12px;font-family:var(--font-mono)">${t.ODOMETER_KM ? Number(t.ODOMETER_KM).toLocaleString() + ' km' : '—'}</span>${(t.STATUS === 'Available' || t.STATUS === 'Spare') ? `<button class="btn" style="margin-left:8px;padding:2px 6px;font-size:12px" onclick="event.stopPropagation();deleteTractor(${t.TRACTOR_ID},'${t.REG_NO}')">🗑️</button>` : ''}</td>
                </tr>
            `).join('')}</tbody></table></div>`;
        addRowHover();
    } catch(e) { document.getElementById('fleet-tab-tractors').innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>'; }
}

async function loadTrailers() {
    try {
        const trailers = await fetch(`${API}/fleet/trailers`).then(r => r.json());
        const panel = document.getElementById('fleet-tab-trailers');
        panel.innerHTML = `<div class="card" style="padding:0;overflow:hidden"><table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:var(--bg-tertiary)">
                <th class="th">Trailer</th><th class="th">Code</th><th class="th">Make</th>
                <th class="th">Hub</th><th class="th">Status</th><th class="th">Capacity</th>
            </tr></thead>
            <tbody>${trailers.map(t => `
                <tr class="trow" onclick="openTrailerDetail(${t.TRAILER_ID})">
                    <td class="td"><div style="display:flex;align-items:center;gap:10px">
                        <img src="${t.IMAGE_PATH || '/trailers/dry.jpg'}" alt="${t.TRAILER_TYPE}" style="width:48px;height:32px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">
                        <div style="font-size:13px;font-weight:600">${t.TRAILER_TYPE || 'Standard'}</div>
                    </div></td>
                    <td class="td"><span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--accent-teal)">${t.TRAILER_CODE}</span></td>
                    <td class="td"><span style="font-size:12px">${t.MAKE || '—'}</span></td>
                    <td class="td"><span style="font-size:12px">${t.HUB_CITY || '—'}</span></td>
                    <td class="td"><span class="status-badge ${truckStatusClass(t.STATUS)}">${t.STATUS}</span></td>
                    <td class="td"><span style="font-size:12px">${t.CAPACITY_KG ? (t.CAPACITY_KG/1000).toFixed(0) + ' tons' : '—'}</span>${(t.STATUS === 'Available' || t.STATUS === 'Spare') ? `<button class="btn" style="margin-left:8px;padding:2px 6px;font-size:12px" onclick="event.stopPropagation();deleteTrailer(${t.TRAILER_ID},'${t.TRAILER_CODE}')">🗑️</button>` : ''}</td>
                </tr>
            `).join('')}</tbody></table></div>`;
        addRowHover();
    } catch(e) {}
}

function truckStatusClass(s) {
    const map = { 'In Transit': 'status-in-transit', 'On Trip': 'status-in-transit', 'In Use': 'status-in-transit', 'Available': 'status-available', 'Spare': 'status-spare', 'Maintenance': 'status-problem' };
    return map[s] || 'status-spare';
}

function addRowHover() {
    document.querySelectorAll('.trow').forEach(r => {
        r.style.cursor = 'pointer'; r.style.transition = 'background 0.15s';
        r.addEventListener('mouseenter', () => r.style.background = 'var(--bg-card-hover)');
        r.addEventListener('mouseleave', () => r.style.background = '');
    });
}

window.openTruckDetail = async function(id) {
    try {
        const res = await fetch(`${API}/fleet/tractors/${id}`);
        const t = await res.json();
        const panel = document.getElementById('load-detail-panel');
        panel.style.display = 'block';
        panel.innerHTML = `
            <div class="detail-overlay" onclick="closeLoadDetail()"></div>
            <div class="detail-content">
                <div class="detail-header">
                    <div style="display:flex;align-items:center;gap:14px">
                        <img src="${truckImg(t.MAKE)}" alt="${t.MAKE}" style="width:64px;height:44px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">
                        <div><div style="font-size:18px;font-weight:800">${t.MAKE} ${t.MODEL}</div>
                        <div style="font-size:12px;color:var(--text-muted);font-family:var(--font-mono)">${t.REG_NO}</div></div>
                    </div>
                    <button class="btn" onclick="closeLoadDetail()">✕</button>
                </div>
                <div class="detail-body">
                    <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">📋 Vehicle Information</h4>
                    <div class="detail-grid">
                        <div class="detail-field"><div class="df-label">Status</div><div class="df-value"><span class="status-badge ${truckStatusClass(t.STATUS)}">${t.STATUS}</span></div></div>
                        <div class="detail-field"><div class="df-label">Home Hub</div><div class="df-value">${t.HUB_CITY || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Year of Mfg</div><div class="df-value">${t.YEAR_OF_MFG || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Fuel Type</div><div class="df-value">${t.FUEL_TYPE || 'Diesel'}</div></div>
                        <div class="detail-field"><div class="df-label">Odometer</div><div class="df-value">${t.ODOMETER_KM ? Number(t.ODOMETER_KM).toLocaleString() + ' km' : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Health Score</div><div class="df-value">${t.HEALTH_SCORE != null ? t.HEALTH_SCORE + '%' : '—'}</div></div>
                    </div>
                    <hr style="border:none;border-top:1px solid var(--border);margin:20px 0">
                    <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">⚙️ Specifications</h4>
                    <div class="detail-grid">
                        <div class="detail-field"><div class="df-label">Horsepower</div><div class="df-value">${t.HORSEPOWER_HP ? t.HORSEPOWER_HP + ' HP' : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Peak Torque</div><div class="df-value">${t.PEAK_TORQUE_NM ? t.PEAK_TORQUE_NM + ' Nm' : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">GVW</div><div class="df-value">${t.GVW_KG ? (t.GVW_KG/1000).toFixed(1) + ' tons' : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Fuel Tank</div><div class="df-value">${t.FUEL_TANK_L ? t.FUEL_TANK_L + ' L' : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Axles</div><div class="df-value">${t.NUM_AXLES || '—'}</div></div>
                    </div>
                    <hr style="border:none;border-top:1px solid var(--border);margin:20px 0">
                    <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">📄 Compliance</h4>
                    <div class="detail-grid">
                        <div class="detail-field"><div class="df-label">Insurance Expiry</div><div class="df-value">${t.INSURANCE_EXPIRY ? new Date(t.INSURANCE_EXPIRY).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Pollution Cert Expiry</div><div class="df-value">${t.POLLUTION_CERT_EXP ? new Date(t.POLLUTION_CERT_EXP).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Registered On</div><div class="df-value">${t.CREATED_AT ? new Date(t.CREATED_AT).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}</div></div>
                    </div>
                    ${t.maintenance && t.maintenance.length ? `
                    <hr style="border:none;border-top:1px solid var(--border);margin:20px 0">
                    <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">🔧 Maintenance History</h4>
                    ${t.maintenance.map(m => `
                        <div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:12px">
                            <div style="display:flex;justify-content:space-between;align-items:flex-start">
                                <div style="font-weight:700">${m.MAINT_TYPE}</div>
                                <div style="font-size:11px;color:var(--accent-teal);font-weight:600">${formatINR(m.COST)}</div>
                            </div>
                            <div style="color:var(--text-muted);font-size:11px;margin-top:3px">${m.NOTES || ''}</div>
                            <div style="display:flex;gap:16px;font-size:10px;color:var(--text-muted);margin-top:4px;font-family:var(--font-mono)">
                                <span>📅 ${m.MAINT_DATE ? new Date(m.MAINT_DATE).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}</span>
                                <span>🏪 ${m.SERVICE_CENTER || '—'}</span>
                                ${m.ODOMETER_READING ? `<span>🛣️ ${Number(m.ODOMETER_READING).toLocaleString()} km</span>` : ''}
                                ${m.NEXT_DUE_DATE ? `<span>⏳ Next: ${new Date(m.NEXT_DUE_DATE).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}` : ''}
                </div>
            </div>`;
    } catch(e) { showToast('Failed to load truck details', 'error'); }
};

window.openTrailerDetail = async function(id) {
    try {
        const res = await fetch(`${API}/fleet/trailers`);
        const all = await res.json();
        const t = all.find(x => x.TRAILER_ID === id);
        if (!t) return;
        const panel = document.getElementById('load-detail-panel');
        panel.style.display = 'block';
        panel.innerHTML = `
            <div class="detail-overlay" onclick="closeLoadDetail()"></div>
            <div class="detail-content">
                <div class="detail-header">
                    <div style="display:flex;align-items:center;gap:14px">
                        <img src="${t.IMAGE_PATH || '/trailers/dry.jpg'}" alt="${t.TRAILER_TYPE}" style="width:64px;height:44px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">
                        <div><div style="font-size:18px;font-weight:800">${t.TRAILER_TYPE}</div>
                        <div style="font-size:12px;color:var(--text-muted);font-family:var(--font-mono)">${t.TRAILER_CODE}</div></div>
                    </div>
                    <button class="btn" onclick="closeLoadDetail()">✕</button>
                </div>
                <div class="detail-body">
                    <img src="${t.IMAGE_PATH || '/trailers/dry.jpg'}" alt="${t.TRAILER_TYPE}" style="width:100%;height:200px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:16px;border:1px solid var(--border)">
                    <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">📋 Trailer Information</h4>
                    <div class="detail-grid">
                        <div class="detail-field"><div class="df-label">Status</div><div class="df-value"><span class="status-badge ${truckStatusClass(t.STATUS)}">${t.STATUS}</span></div></div>
                        <div class="detail-field"><div class="df-label">Home Hub</div><div class="df-value">${t.HUB_CITY || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Make</div><div class="df-value">${t.MAKE || '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Year</div><div class="df-value">${t.MANUFACTURE_YEAR || '—'}</div></div>
                    </div>
                    <hr style="border:none;border-top:1px solid var(--border);margin:20px 0">
                    <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">📐 Specifications</h4>
                    <div class="detail-grid">
                        <div class="detail-field"><div class="df-label">Capacity (Weight)</div><div class="df-value">${t.CAPACITY_KG ? (t.CAPACITY_KG/1000).toFixed(0) + ' tons (' + t.CAPACITY_KG.toLocaleString() + ' kg)' : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Volume</div><div class="df-value">${t.CAPACITY_M3 ? t.CAPACITY_M3 + ' m³' : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Length</div><div class="df-value">${t.LENGTH_M ? t.LENGTH_M + ' m' : '—'}</div></div>
                        <div class="detail-field"><div class="df-label">Registered On</div><div class="df-value">${t.CREATED_AT ? new Date(t.CREATED_AT).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}</div></div>
                    </div>
                </div>
            </div>`;
    } catch(e) { showToast('Failed to load trailer details', 'error'); }
};

// ---- CRUD Functions ----

const TRUCK_TYPES = [
    { make: 'Volvo', model: 'FH16', hp: 750, torque: 3550, gvw: 44000, tank: 500 },
    { make: 'Scania', model: 'R770', hp: 770, torque: 3700, gvw: 44000, tank: 490 },
    { make: 'Mercedes-Benz', model: 'Actros 4165 SLT', hp: 625, torque: 3000, gvw: 41000, tank: 480 },
    { make: 'DAF', model: 'XG+ 660', hp: 660, torque: 2950, gvw: 40000, tank: 470 }
];

const TRAILER_TYPES = {
    'Flatbed': ['Ashok Leyland', 'TATA'],
    'DRY Van': ['Mahindra', 'SML Isuzu'],
    'Refrigerated': ['Carrier Transicold', 'Thermo King'],
    'Tank': ['Feldbinder'],
    'Low Boy': ['Goldhofer'],
    'Car Hauler': ['Lohr'],
    'Double': ['Krone']
};

window.showAddTruckModal = async function() {
    let hubs = [];
    try { hubs = await fetch(`${API}/hubs`).then(r => r.json()); } catch(e) {}

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'add-truck-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 style="font-size:16px;font-weight:700">🚛 Add New Truck</h3>
                <button class="btn" onclick="document.getElementById('add-truck-modal').remove()">✕</button>
            </div>
            <form id="add-truck-form" style="display:flex;flex-direction:column;gap:14px;padding:20px">
                <div class="auth-field" style="margin:0"><label>Truck Type</label>
                    <select id="at-type" required>
                        <option value="" disabled selected>Select truck type</option>
                        ${TRUCK_TYPES.map((t, i) => `<option value="${i}">${t.make} ${t.model} — ${t.hp}HP</option>`).join('')}
                    </select>
                </div>
                <div id="at-specs" style="display:none;padding:10px;background:var(--bg-tertiary);border-radius:var(--radius-sm);font-size:12px;border:1px solid var(--border)"></div>
                <div class="auth-field" style="margin:0"><label>Registration Number</label>
                    <input type="text" id="at-reg" placeholder="KA-01-AB-1234" required></div>
                <div style="display:flex;gap:12px">
                    <div class="auth-field" style="margin:0;flex:1"><label>Year of Manufacture</label>
                        <input type="number" id="at-year" value="2024" min="2000" max="2030" required></div>
                    <div class="auth-field" style="margin:0;flex:1"><label>Home Hub</label>
                        <select id="at-hub" required>
                            ${hubs.map(h => `<option value="${h.HUB_ID}">${h.CITY}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button type="submit" class="auth-submit">Add Truck →</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('at-type').addEventListener('change', function() {
        const t = TRUCK_TYPES[this.value];
        const specDiv = document.getElementById('at-specs');
        if (t) {
            specDiv.style.display = 'block';
            specDiv.innerHTML = `<strong>${t.make} ${t.model}</strong><br>🐎 ${t.hp} HP &nbsp;|&nbsp; 💪 ${t.torque} Nm &nbsp;|&nbsp; ⚖️ ${(t.gvw/1000).toFixed(0)}t GVW &nbsp;|&nbsp; ⛽ ${t.tank}L`;
        } else { specDiv.style.display = 'none'; }
    });

    document.getElementById('add-truck-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const idx = document.getElementById('at-type').value;
        const t = TRUCK_TYPES[idx];
        try {
            const res = await fetch(`${API}/fleet/tractors`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    make: t.make, model: t.model,
                    regNo: document.getElementById('at-reg').value,
                    yearOfMfg: document.getElementById('at-year').value,
                    homeHubId: document.getElementById('at-hub').value
                })
            });
            const data = await res.json();
            if (data.success !== false) {
                showToast('Truck added successfully!', 'success');
                modal.remove(); navigateTo('fleet');
            } else { showToast(data.error || 'Failed to add truck', 'error'); }
        } catch(err) { showToast('Error adding truck', 'error'); }
    });
};

window.showAddTrailerModal = async function() {
    let hubs = [];
    try { hubs = await fetch(`${API}/hubs`).then(r => r.json()); } catch(e) {}

    const typeKeys = Object.keys(TRAILER_TYPES);
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'add-trailer-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 style="font-size:16px;font-weight:700">📦 Add New Trailer</h3>
                <button class="btn" onclick="document.getElementById('add-trailer-modal').remove()">✕</button>
            </div>
            <form id="add-trailer-form" style="display:flex;flex-direction:column;gap:14px;padding:20px">
                <div class="auth-field" style="margin:0"><label>Trailer Type</label>
                    <select id="atr-type" required>
                        <option value="" disabled selected>Select trailer type</option>
                        ${typeKeys.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                <div class="auth-field" style="margin:0"><label>Make</label>
                    <select id="atr-make" required>
                        <option value="" disabled selected>Select type first</option>
                    </select>
                </div>
                <div class="auth-field" style="margin:0"><label>Home Hub</label>
                    <select id="atr-hub" required>
                        ${hubs.map(h => `<option value="${h.HUB_ID}">${h.CITY}</option>`).join('')}
                    </select>
                </div>
                <button type="submit" class="auth-submit">Add Trailer →</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('atr-type').addEventListener('change', function() {
        const makes = TRAILER_TYPES[this.value] || [];
        document.getElementById('atr-make').innerHTML = makes.map(m => `<option value="${m}">${m}</option>`).join('');
    });

    document.getElementById('add-trailer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/fleet/trailers`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    trailerType: document.getElementById('atr-type').value,
                    make: document.getElementById('atr-make').value,
                    homeHubId: document.getElementById('atr-hub').value
                })
            });
            const data = await res.json();
            if (data.success !== false) {
                showToast('Trailer added successfully!', 'success');
                modal.remove(); navigateTo('fleet');
            } else { showToast(data.error || 'Failed to add trailer', 'error'); }
        } catch(err) { showToast('Error adding trailer', 'error'); }
    });
};

window.deleteTractor = async function(id, regNo) {
    if (!confirm('Are you sure you want to delete truck ' + regNo + '?')) return;
    try {
        const res = await fetch(`${API}/fleet/tractors/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success !== false) {
            showToast('Truck ' + regNo + ' deleted', 'success');
            navigateTo('fleet');
        } else { showToast(data.error || 'Failed to delete', 'error'); }
    } catch(e) { showToast('Error deleting truck', 'error'); }
};

window.deleteTrailer = async function(id, code) {
    if (!confirm('Are you sure you want to delete trailer ' + code + '?')) return;
    try {
        const res = await fetch(`${API}/fleet/trailers/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success !== false) {
            showToast('Trailer ' + code + ' deleted', 'success');
            navigateTo('fleet');
        } else { showToast(data.error || 'Failed to delete', 'error'); }
    } catch(e) { showToast('Error deleting trailer', 'error'); }
};
