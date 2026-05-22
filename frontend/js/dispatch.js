// Fleet Force — Dispatch Board (Kanban-style)
window.render_dispatch = async function(container) {
    container.innerHTML = `
        <div style="display:flex;gap:16px;height:calc(100vh - var(--header-height) - 48px);overflow-x:auto;padding-bottom:8px">
            <div class="kanban-col" id="col-unassigned">
                <div class="kanban-header" style="border-top:3px solid var(--accent-purple)">
                    <span>📋 Unassigned</span><span class="kanban-count" id="cnt-unassigned">0</span>
                </div>
                <div class="kanban-cards" id="cards-unassigned"></div>
            </div>
            <div class="kanban-col" id="col-assigned">
                <div class="kanban-header" style="border-top:3px solid var(--accent-yellow)">
                    <span>✋ Assigned</span><span class="kanban-count" id="cnt-assigned">0</span>
                </div>
                <div class="kanban-cards" id="cards-assigned"></div>
            </div>
            <div class="kanban-col" id="col-loading">
                <div class="kanban-header" style="border-top:3px solid var(--accent-orange)">
                    <span>📥 Loading</span><span class="kanban-count" id="cnt-loading">0</span>
                </div>
                <div class="kanban-cards" id="cards-loading"></div>
            </div>
            <div class="kanban-col" id="col-transit">
                <div class="kanban-header" style="border-top:3px solid var(--accent-blue)">
                    <span>🚛 In Transit</span><span class="kanban-count" id="cnt-transit">0</span>
                </div>
                <div class="kanban-cards" id="cards-transit"></div>
            </div>
            <div class="kanban-col" id="col-unloading">
                <div class="kanban-header" style="border-top:3px solid #e879a0">
                    <span>📤 Unloading</span><span class="kanban-count" id="cnt-unloading">0</span>
                </div>
                <div class="kanban-cards" id="cards-unloading"></div>
            </div>
            <div class="kanban-col" id="col-delivered">
                <div class="kanban-header" style="border-top:3px solid var(--accent-green)">
                    <span>✅ Delivered</span><span class="kanban-count" id="cnt-delivered">0</span>
                </div>
                <div class="kanban-cards" id="cards-delivered"></div>
            </div>
        </div>
    `;

    try {
        const res = await fetch(`${API}/dispatch`);
        const loads = await res.json();

        const cols = { 'Unassigned': [], 'Assigned': [], 'Loading': [], 'In Transit': [], 'Unloading': [], 'Delivered': [] };
        loads.forEach(l => {
            const col = cols[l.STATUS] || cols['In Transit'];
            col.push(l);
        });

        renderKanbanCol('unassigned', cols['Unassigned']);
        renderKanbanCol('assigned', cols['Assigned']);
        renderKanbanCol('loading', cols['Loading']);
        renderKanbanCol('transit', cols['In Transit']);
        renderKanbanCol('unloading', cols['Unloading']);
        renderKanbanCol('delivered', cols['Delivered']);
    } catch (e) { showToast('Failed to load dispatch data', 'error'); }
};

function renderKanbanCol(colId, loads) {
    document.getElementById(`cnt-${colId}`).textContent = loads.length;
    const container = document.getElementById(`cards-${colId}`);
    if (!loads.length) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px">No loads</div>';
        return;
    }
    container.innerHTML = loads.map(l => `
        <div class="kanban-card" onclick="openLoadDetail(${l.LOAD_ID})">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <div style="font-size:13px;font-weight:700;color:var(--accent-teal)">${l.LOAD_CODE}</div>
                <span style="font-size:10px;font-weight:600;color:${priorityColor(l.PRIORITY)}">${l.PRIORITY}</span>
            </div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px">${l.CARGO_DESC || ''}</div>
            <div style="font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:4px;margin-bottom:4px">
                📍 ${l.PICKUP_CITY || '?'} → ${l.DROPOFF_CITY || '?'}
            </div>
            ${l.COMPANY_NAME ? `<div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">🏢 ${l.COMPANY_NAME}</div>` : ''}
            ${l.DRIVER_NAME ? `<div style="font-size:10px;color:var(--text-muted)">👤 ${l.DRIVER_NAME}</div>` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
                <div style="font-size:12px;font-weight:700">${formatINR(l.RATE)}</div>
                <div style="font-size:10px;color:var(--text-muted)">${l.MARGIN_PCT ? l.MARGIN_PCT + '% margin' : ''}</div>
            </div>
        </div>
    `).join('');
}
