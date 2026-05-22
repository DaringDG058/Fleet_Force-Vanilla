// Fleet Force — Warehouses Page
window.render_warehouses = async function(container) {
    container.innerHTML = `
        <div class="grid grid-4" id="wh-kpis" style="margin-bottom:20px">
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
        </div>
        <div id="wh-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px"></div>
    `;

    try {
        const res = await fetch(`${API}/warehouses`);
        const warehouses = await res.json();

        const total = warehouses.length;
        const totalCap = warehouses.reduce((s, w) => s + (w.AREA_SQFT || 0), 0);
        const totalUsed = warehouses.reduce((s, w) => s + (w.CURRENT_STOCK || 0), 0);
        const avgUtil = total ? (warehouses.reduce((s, w) => s + (w.CAPACITY_PCT || 0), 0) / total).toFixed(1) : 0;
        const activeDocks = warehouses.reduce((s, w) => s + (w.DOCK_COUNT || 0), 0);

        document.getElementById('wh-kpis').innerHTML = `
            ${whKPI('Total Warehouses', total, '🏭', 'var(--accent-blue)')}
            ${whKPI('Total Capacity', (totalCap / 1000).toFixed(0) + 'K sqft', '📐', 'var(--accent-teal)')}
            ${whKPI('Avg Utilization', avgUtil + '%', '📊', avgUtil > 80 ? 'var(--accent-red)' : 'var(--accent-green)')}
            ${whKPI('Loading Docks', activeDocks, '🚛', 'var(--accent-purple)')}
        `;

        const grid = document.getElementById('wh-grid');
        grid.innerHTML = warehouses.map(w => {
            const utilPct = (w.CAPACITY_PCT || 0).toFixed(1);
            const utilColor = utilPct > 85 ? 'var(--accent-red)' : utilPct > 60 ? 'var(--accent-yellow)' : 'var(--accent-green)';
            const statusCls = w.STATUS === 'Active' ? 'status-available' : 'status-spare';
            return `
            <div class="card" style="padding:20px">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
                    <div>
                        <div style="font-size:15px;font-weight:800">${w.WAREHOUSE_NAME}</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:3px">📍 ${w.CITY || ''}, ${w.STATE || ''}</div>
                    </div>
                    <span class="status-badge ${statusCls}" style="font-size:9px">${w.STATUS || 'Active'}</span>
                </div>
                <div style="margin-bottom:14px">
                    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:6px">
                        <span>Capacity Utilization</span><span style="color:${utilColor};font-weight:600">${utilPct}%</span>
                    </div>
                    <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                        <div style="height:100%;width:${utilPct}%;background:${utilColor};border-radius:4px;transition:width 0.5s"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:4px">
                        <span>${(w.CURRENT_STOCK || 0).toLocaleString()} units stocked</span>
                        <span>${(w.TOTAL_CAPACITY || 0).toLocaleString()} capacity</span>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
                    <div style="padding:8px;background:var(--bg-tertiary);border-radius:var(--radius-sm);text-align:center">
                        <div style="color:var(--text-muted);font-size:9px;margin-bottom:4px">LOADING DOCKS</div>
                        <div style="font-size:16px;font-weight:800">${w.DOCK_COUNT || 0}</div>
                    </div>
                    <div style="padding:8px;background:var(--bg-tertiary);border-radius:var(--radius-sm);text-align:center">
                        <div style="color:var(--text-muted);font-size:9px;margin-bottom:4px">COLD STORAGE</div>
                        <div style="font-size:16px;font-weight:800">${w.IS_TEMP_CTLD ? '✅' : '❌'}</div>
                    </div>
                </div>
                ${w.MANAGER_NAME ? `
                <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);display:flex;align-items:center;gap:8px">
                    <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-blue);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${(w.MANAGER_NAME || 'M').charAt(0)}</div>
                    <div>
                        <div style="font-size:11px;font-weight:600">${w.MANAGER_NAME}</div>
                        <div style="font-size:10px;color:var(--text-muted)">${w.CONTACT_PHONE || ''}</div>
                    </div>
                </div>` : ''}
            </div>`;
        }).join('');
    } catch (e) { container.innerHTML += '<p style="color:var(--text-muted)">Failed to load warehouses</p>'; }
};

function whKPI(label, value, icon, color) {
    return `<div class="card" style="position:relative;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div><div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">${label}</div>
            <div style="font-size:26px;font-weight:800">${value}</div></div>
            <div style="font-size:24px;opacity:0.5">${icon}</div>
        </div><div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${color};opacity:0.5"></div></div>`;
}
