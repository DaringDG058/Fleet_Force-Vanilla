// Fleet Force — Loads Page Module
window.render_loads = async function(container) {
    container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <div style="display:flex;gap:8px;flex-wrap:wrap" id="load-filters">
                <button class="btn btn-primary load-filter active" data-filter="all">All</button>
                <button class="btn load-filter" data-filter="In Transit">In Transit</button>
                <button class="btn load-filter" data-filter="Unloading">Unloading</button>
                <button class="btn load-filter" data-filter="Delivered">Delivered</button>
                <button class="btn load-filter" data-filter="Loading">Loading</button>
                <button class="btn load-filter" data-filter="Assigned">Assigned</button>
                <button class="btn load-filter" data-filter="Unassigned">Unassigned</button>
            </div>
            <div style="display:flex;gap:10px;align-items:center">
                <input type="text" id="load-search" placeholder="Search loads..." style="padding:9px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:13px;width:220px">
                <button class="btn btn-primary" onclick="showCreateLoadModal()">+ New Load</button>
            </div>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
            <table id="loads-table" style="width:100%;border-collapse:collapse">
                <thead>
                    <tr style="background:var(--bg-tertiary)">
                        <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border)">Load</th>
                        <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border)">Customer</th>
                        <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border)">Route</th>
                        <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border)">Driver</th>
                        <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border)">Status</th>
                        <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border)">Priority</th>
                        <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--border)">Rate</th>
                    </tr>
                </thead>
                <tbody id="loads-tbody">
                    <tr><td colspan="7" style="padding:40px;text-align:center;color:var(--text-muted)">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    const allLoads = await fetchLoads();
    renderLoadsTable(allLoads);
    initLoadFilters(allLoads);
};

let _allLoads = [];

async function fetchLoads() {
    try {
        const res = await fetch(`${API}/loads`);
        _allLoads = await res.json();
        // Update sidebar badge count
        const badge = document.getElementById('loads-badge');
        if (badge) badge.textContent = _allLoads.length;
        return _allLoads;
    } catch (e) { return []; }
}

function renderLoadsTable(loads) {
    const tbody = document.getElementById('loads-tbody');
    if (!loads.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--text-muted)">No loads found</td></tr>';
        return;
    }
    tbody.innerHTML = loads.map(l => `
        <tr class="load-row" onclick="openLoadDetail(${l.LOAD_ID})" style="cursor:pointer;transition:background 0.15s">
            <td style="padding:12px 16px;border-bottom:1px solid var(--border)">
                <div style="font-size:13px;font-weight:700;color:var(--accent-teal)">${l.LOAD_CODE}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${l.CARGO_DESC || ''}</div>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid var(--border)">
                <div style="font-size:13px;font-weight:500">${l.COMPANY_NAME || '—'}</div>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid var(--border)">
                <div style="font-size:12px">${l.PICKUP_CITY || '?'} → ${l.DROPOFF_CITY || '?'}</div>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid var(--border)">
                <div style="display:flex;align-items:center;gap:8px">
                    <div style="font-size:12px">${l.DRIVER_NAME || '—'}</div>
                </div>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid var(--border)">
                <span class="status-badge ${statusClass(l.STATUS)}">${l.STATUS}</span>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid var(--border)">
                <span style="font-size:12px;font-weight:600;color:${priorityColor(l.PRIORITY)}">${l.PRIORITY || 'Medium'}</span>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid var(--border);text-align:right">
                <div style="font-size:13px;font-weight:600">${formatINR(l.RATE)}</div>
                <div style="font-size:10px;color:var(--text-muted)">${l.MARGIN_PCT ? l.MARGIN_PCT + '% margin' : ''}</div>
            </td>
        </tr>
    `).join('');

    // Hover effect
    document.querySelectorAll('.load-row').forEach(row => {
        row.addEventListener('mouseenter', () => row.style.background = 'var(--bg-card-hover)');
        row.addEventListener('mouseleave', () => row.style.background = '');
    });
}

function initLoadFilters(loads) {
    document.querySelectorAll('.load-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.load-filter').forEach(b => { b.classList.remove('active','btn-primary'); b.classList.add('btn'); });
            btn.classList.add('active','btn-primary');
            const f = btn.dataset.filter;
            renderLoadsTable(f === 'all' ? loads : loads.filter(l => l.STATUS === f));
        });
    });

    document.getElementById('load-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = loads.filter(l =>
            (l.LOAD_CODE || '').toLowerCase().includes(q) ||
            (l.COMPANY_NAME || '').toLowerCase().includes(q) ||
            (l.CARGO_DESC || '').toLowerCase().includes(q) ||
            (l.DRIVER_NAME || '').toLowerCase().includes(q) ||
            (l.PICKUP_CITY || '').toLowerCase().includes(q) ||
            (l.DROPOFF_CITY || '').toLowerCase().includes(q)
        );
        renderLoadsTable(filtered);
    });
}

async function openLoadDetail(loadId) {
    try {
        const res = await fetch(`${API}/loads/${loadId}`);
        const load = await res.json();
        const panel = document.getElementById('load-detail-panel');
        panel.style.display = 'block';

        // Build driver pair section
        let driverSection = '';
        if (load.DRIVER_NAME) {
            const driverPhoto = load.DRIVER_PHOTO || `/drivers/${load.DRIVER_ID}.jpg`;
            driverSection = `
                <hr style="border:none;border-top:1px solid var(--border);margin:16px 0">
                <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">👥 Driver Crew</h4>
                <div style="display:flex;gap:12px;flex-wrap:wrap">
                    <div style="flex:1;min-width:140px;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
                            <div class="driver-photo-thumb" style="background-image:url('${driverPhoto}');width:36px;height:36px"></div>
                            <div>
                                <div style="font-size:12px;font-weight:700">${load.DRIVER_NAME}</div>
                                <div style="font-size:10px;color:var(--text-muted)">${load.DRIVER_PHONE || ''}</div>
                            </div>
                        </div>
                        <span class="status-badge status-in-transit" style="font-size:9px">🟢 ${load.DRIVER_STATUS || 'Driving'}</span>
                    </div>
                    ${load.coDriver ? `
                    <div style="flex:1;min-width:140px;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
                            <div class="driver-photo-thumb" style="background-image:url('${load.coDriver.PHOTO_PATH || `/drivers/${load.coDriver.DRIVER_ID}.jpg`}');width:36px;height:36px"></div>
                            <div>
                                <div style="font-size:12px;font-weight:700">${load.coDriver.NAME}</div>
                                <div style="font-size:10px;color:var(--text-muted)">Co-Driver</div>
                            </div>
                        </div>
                        <span class="status-badge status-assigned" style="font-size:9px">😴 ${load.coDriver.STATUS || 'Resting'}</span>
                    </div>` : ''}
                </div>`;
        }

        // Build timeline
        let timelineHtml = '';
        if (load.timeline && load.timeline.length) {
            timelineHtml = `<div style="position:relative;padding-left:24px">
                <div style="position:absolute;left:7px;top:0;bottom:0;width:2px;background:var(--border)"></div>
                ${load.timeline.map((t, i) => {
                    const isFirst = i === 0;
                    const dotColor = isFirst ? 'var(--accent-teal)' : 'var(--border)';
                    return `
                    <div style="position:relative;padding:10px 0;${i < load.timeline.length - 1 ? 'border-bottom:none' : ''}">
                        <div style="position:absolute;left:-20px;top:14px;width:10px;height:10px;border-radius:50%;background:${dotColor};border:2px solid var(--bg-card);z-index:1"></div>
                        <div style="font-size:12px;font-weight:700">${t.EVENT_TYPE}</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${t.EVENT_DESC || ''}</div>
                        <div style="font-size:10px;color:var(--text-muted);margin-top:3px;font-family:var(--font-mono)">${timeAgo(t.EVENT_TIME)}</div>
                    </div>`;
                }).join('')}
            </div>`;
        } else {
            timelineHtml = '<p style="color:var(--text-muted);font-size:13px">No timeline events yet. Events will appear as the load progresses through its lifecycle.</p>';
        }

        panel.innerHTML = `
            <div class="detail-overlay" onclick="closeLoadDetail()"></div>
            <div class="detail-content">
                <div class="detail-header">
                    <div>
                        <div style="font-size:18px;font-weight:800;color:var(--accent-teal)">${load.LOAD_CODE}</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${load.CARGO_DESC || ''}</div>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center">
                        <button class="btn" style="color:var(--accent-red);font-size:13px" onclick="deleteLoad(${load.LOAD_ID})">🗑️ Delete</button>
                        <button class="btn" onclick="closeLoadDetail()">✕</button>
                    </div>
                </div>
                <div class="detail-tabs">
                    <button class="detail-tab active" data-dtab="overview">Overview</button>
                    <button class="detail-tab" data-dtab="timeline">Timeline</button>
                    <button class="detail-tab" data-dtab="billing">Billing</button>
                </div>
                <div class="detail-body">
                    <div id="dtab-overview" class="dtab-content active">
                        <div class="detail-grid">
                            <div class="detail-field"><div class="df-label">Customer</div><div class="df-value">${load.COMPANY_NAME || '—'}</div></div>
                            <div class="detail-field"><div class="df-label">Status</div><div class="df-value"><span class="status-badge ${statusClass(load.STATUS)}">${load.STATUS}</span></div></div>
                            <div class="detail-field"><div class="df-label">Priority</div><div class="df-value" style="color:${priorityColor(load.PRIORITY)};font-weight:600">${load.PRIORITY}</div></div>
                            <div class="detail-field"><div class="df-label">Weight</div><div class="df-value">${load.CARGO_WEIGHT_KG ? load.CARGO_WEIGHT_KG.toLocaleString() + ' kg' : '—'}</div></div>
                        </div>
                        <hr style="border:none;border-top:1px solid var(--border);margin:16px 0">
                        <div class="detail-grid">
                            <div class="detail-field"><div class="df-label">Pickup</div><div class="df-value">${load.PICKUP_CITY || '—'}<div style="font-size:10px;color:var(--text-muted)">${load.PICKUP_ADDR || ''}</div></div></div>
                            <div class="detail-field"><div class="df-label">Drop-off</div><div class="df-value">${load.DROPOFF_CITY || '—'}<div style="font-size:10px;color:var(--text-muted)">${load.DROPOFF_ADDR || ''}</div></div></div>
                            <div class="detail-field"><div class="df-label">Truck</div><div class="df-value">${load.REG_NO || '—'} ${load.TRUCK_NAME || ''}</div></div>
                            <div class="detail-field"><div class="df-label">Trailer</div><div class="df-value">${load.TRAILER_CODE || '—'} ${load.TRAILER_TYPE || ''}</div></div>
                            ${load.ROUTE_NAME ? `<div class="detail-field"><div class="df-label">Route</div><div class="df-value">${load.ROUTE_NAME}</div></div>` : ''}
                            ${load.DISTANCE_KM ? `<div class="detail-field"><div class="df-label">Distance</div><div class="df-value">${Number(load.DISTANCE_KM).toLocaleString()} km${load.EST_HOURS ? ` (~${load.EST_HOURS}h)` : ''}</div></div>` : ''}
                        </div>
                        ${load.PROGRESS_PCT != null ? `
                        <div style="margin-top:16px">
                            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:6px">
                                <span>Progress</span><span>${load.PROGRESS_PCT.toFixed(1)}%</span>
                            </div>
                            <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                                <div style="height:100%;width:${load.PROGRESS_PCT}%;background:var(--accent-teal);border-radius:3px;transition:width 0.5s"></div>
                            </div>
                        </div>` : ''}
                        ${driverSection}
                    </div>
                    <div id="dtab-timeline" class="dtab-content">
                        <h4 style="font-size:13px;font-weight:700;margin-bottom:16px">📜 Load Lifecycle Timeline</h4>
                        ${timelineHtml}
                    </div>
                    <div id="dtab-billing" class="dtab-content">
                        <div class="detail-grid">
                            <div class="detail-field"><div class="df-label">Rate</div><div class="df-value" style="font-size:18px;font-weight:800;color:var(--accent-teal)">${formatINR(load.RATE)}</div></div>
                            <div class="detail-field"><div class="df-label">Margin</div><div class="df-value">${load.MARGIN_PCT || 0}%</div></div>
                            ${load.PICKUP_DATE ? `<div class="detail-field"><div class="df-label">Pickup Date</div><div class="df-value">${new Date(load.PICKUP_DATE).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</div></div>` : ''}
                            ${load.DELIVERY_DATE ? `<div class="detail-field"><div class="df-label">Expected Delivery</div><div class="df-value">${new Date(load.DELIVERY_DATE).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</div></div>` : ''}
                            ${load.ACTUAL_DELIVERY ? `<div class="detail-field"><div class="df-label">Actual Delivery</div><div class="df-value">${new Date(load.ACTUAL_DELIVERY).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Tab switching
        panel.querySelectorAll('.detail-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                panel.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
                panel.querySelectorAll('.dtab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                panel.querySelector(`#dtab-${tab.dataset.dtab}`).classList.add('active');
            });
        });
    } catch (e) { showToast('Failed to load details', 'error'); }
}

function closeLoadDetail() {
    document.getElementById('load-detail-panel').style.display = 'none';
}

function statusClass(s) {
    const map = { 'In Transit': 'status-in-transit', 'Delivered': 'status-delivered', 'Assigned': 'status-assigned', 'Loading': 'status-assigned', 'Unloading': 'status-in-transit', 'Problem': 'status-problem', 'Critical': 'status-critical', 'Available': 'status-available', 'Unassigned': 'status-spare' };
    return map[s] || 'status-in-transit';
}

function priorityColor(p) {
    const map = { 'Critical': 'var(--accent-red)', 'High': 'var(--accent-orange)', 'Medium': 'var(--accent-yellow)', 'Low': 'var(--accent-green)' };
    return map[p] || 'var(--text-secondary)';
}

// Create Load Modal
window.showCreateLoadModal = async function() {
    // Fetch hubs, customers, and available resources
    let hubs = [], customers = [], tractors = [], trailers = [], drivers = [];
    try {
        const [h, c, tr, trl, dr] = await Promise.all([
            fetch(`${API}/hubs`), fetch(`${API}/customers`),
            fetch(`${API}/fleet/available-tractors`).catch(() => ({ json: () => [] })),
            fetch(`${API}/fleet/available-trailers`).catch(() => ({ json: () => [] })),
            fetch(`${API}/drivers/available`).catch(() => ({ json: () => [] }))
        ]);
        hubs = await h.json(); customers = await c.json();
        tractors = await tr.json(); trailers = await trl.json(); drivers = await dr.json();
    } catch(e) {}
    if (!Array.isArray(tractors)) tractors = [];
    if (!Array.isArray(trailers)) trailers = [];
    if (!Array.isArray(drivers)) drivers = [];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'create-load-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 style="font-size:16px;font-weight:700">📦 Create New Load</h3>
                <button class="btn" onclick="document.getElementById('create-load-modal').remove()">✕</button>
            </div>
            <form id="create-load-form" style="display:flex;flex-direction:column;gap:14px;padding:20px;max-height:70vh;overflow-y:auto">
                <div class="auth-field" style="margin:0"><label>Customer</label>
                    <select id="cl-customer" required>${customers.map(c => `<option value="${c.CUSTOMER_ID}">${c.COMPANY_NAME}</option>`).join('')}</select></div>
                <div style="display:flex;gap:12px">
                    <div class="auth-field" style="margin:0;flex:1"><label>Pickup Hub</label>
                        <select id="cl-pickup" required>${hubs.map(h => `<option value="${h.HUB_ID}">${h.CITY}</option>`).join('')}</select></div>
                    <div class="auth-field" style="margin:0;flex:1"><label>Drop-off Hub</label>
                        <select id="cl-dropoff" required>${hubs.map(h => `<option value="${h.HUB_ID}">${h.CITY}</option>`).join('')}</select></div>
                </div>
                <div style="display:flex;gap:12px">
                    <div class="auth-field" style="margin:0;flex:1"><label>Priority</label>
                        <select id="cl-priority"><option>Medium</option><option>High</option><option>Critical</option><option>Low</option></select></div>
                    <div class="auth-field" style="margin:0;flex:1"><label>Rate (₹)</label>
                        <input type="number" id="cl-rate" placeholder="150000" required></div>
                </div>
                <div class="auth-field" style="margin:0"><label>Cargo Description</label>
                    <input type="text" id="cl-cargo" placeholder="e.g. Electronics - 500 units" required></div>
                <div class="auth-field" style="margin:0"><label>Weight (kg)</label>
                    <input type="number" id="cl-weight" placeholder="15000" required></div>
                <hr style="border:none;border-top:1px solid var(--border);margin:4px 0">
                <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em">🚛 Assignment (Optional)</div>
                <div style="display:flex;gap:12px">
                    <div class="auth-field" style="margin:0;flex:1"><label>Truck</label>
                        <select id="cl-truck">
                            <option value="">— None —</option>
                            ${tractors.map(t => `<option value="${t.TRACTOR_ID}">${t.REG_NO} — ${t.MAKE} ${t.MODEL}</option>`).join('')}
                        </select></div>
                    <div class="auth-field" style="margin:0;flex:1"><label>Trailer</label>
                        <select id="cl-trailer">
                            <option value="">— None —</option>
                            ${trailers.map(t => `<option value="${t.TRAILER_ID}">${t.TRAILER_CODE} — ${t.TRAILER_TYPE}</option>`).join('')}
                        </select></div>
                </div>
                <div style="display:flex;gap:12px">
                    <div class="auth-field" style="margin:0;flex:1"><label>Primary Driver</label>
                        <select id="cl-driver">
                            <option value="">— None —</option>
                            ${drivers.map(d => `<option value="${d.DRIVER_ID}">${d.FIRST_NAME} ${d.LAST_NAME}</option>`).join('')}
                        </select></div>
                    <div class="auth-field" style="margin:0;flex:1"><label>Co-Driver (Optional)</label>
                        <select id="cl-codriver">
                            <option value="">— None —</option>
                            ${drivers.map(d => `<option value="${d.DRIVER_ID}">${d.FIRST_NAME} ${d.LAST_NAME}</option>`).join('')}
                        </select></div>
                </div>
                <button type="submit" class="auth-submit">Create Load →</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Update co-driver dropdown when primary driver changes
    const driverSelect = document.getElementById('cl-driver');
    const coDriverSelect = document.getElementById('cl-codriver');
    driverSelect.addEventListener('change', function() {
        const selectedId = this.value;
        coDriverSelect.innerHTML = '<option value="">— None —</option>' +
            drivers.filter(d => String(d.DRIVER_ID) !== selectedId)
                .map(d => `<option value="${d.DRIVER_ID}">${d.FIRST_NAME} ${d.LAST_NAME}</option>`).join('');
    });

    document.getElementById('create-load-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const body = {
                customerId: document.getElementById('cl-customer').value,
                pickupHubId: document.getElementById('cl-pickup').value,
                dropoffHubId: document.getElementById('cl-dropoff').value,
                priority: document.getElementById('cl-priority').value,
                rate: document.getElementById('cl-rate').value,
                cargoDesc: document.getElementById('cl-cargo').value,
                cargoWeight: document.getElementById('cl-weight').value
            };
            const truckVal = document.getElementById('cl-truck').value;
            const trailerVal = document.getElementById('cl-trailer').value;
            const driverVal = document.getElementById('cl-driver').value;
            const coDriverVal = document.getElementById('cl-codriver').value;
            if (truckVal) body.tractorId = truckVal;
            if (trailerVal) body.trailerId = trailerVal;
            if (driverVal) body.driverId = driverVal;
            if (coDriverVal) body.coDriverId = coDriverVal;

            const res = await fetch(`${API}/loads`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Load ${data.loadCode} created!`, 'success');
                modal.remove();
                navigateTo('loads');
            } else { showToast(data.error || 'Failed', 'error'); }
        } catch(err) { showToast('Error creating load', 'error'); }
    });
};

window.deleteLoad = async function(loadId) {
    if (!confirm('Are you sure you want to delete this load? The truck and driver will be freed.')) return;
    try {
        const res = await fetch(`${API}/loads/${loadId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success !== false) {
            closeLoadDetail();
            showToast('Load deleted successfully', 'success');
            navigateTo('loads');
        } else { showToast(data.error || 'Failed to delete load', 'error'); }
    } catch(e) { showToast('Error deleting load', 'error'); }
};
