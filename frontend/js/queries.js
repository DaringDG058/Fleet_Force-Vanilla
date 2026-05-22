// Fleet Force — SQL Terminal Page
let queryLogInterval = null;

window.render_queries = async function(container) {
    if (queryLogInterval) { clearInterval(queryLogInterval); queryLogInterval = null; }

    container.innerHTML = `
        <div style="display:flex;gap:16px;height:calc(100vh - var(--header-height) - 48px)">
            <div style="flex:1;display:flex;flex-direction:column;gap:16px">
                <div class="card" style="flex:1;padding:0;display:flex;flex-direction:column;overflow:hidden">
                    <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                        <div style="font-size:13px;font-weight:700">⚡ Interactive SQL Terminal</div>
                        <div style="font-size:10px;color:var(--text-muted)">SELECT / INSERT / UPDATE / DELETE</div>
                    </div>
                    <div style="padding:16px;border-bottom:1px solid var(--border)">
                        <div style="position:relative">
                            <textarea id="sql-input" placeholder="SELECT * FROM driver WHERE status = 'On Trip'..." style="width:100%;height:100px;background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--accent-teal);font-family:var(--font-mono);font-size:13px;padding:14px;resize:vertical;line-height:1.6"></textarea>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
                            <button class="btn btn-primary" id="run-query-btn" style="font-size:12px">▶ Run Query</button>
                            <button class="btn" onclick="document.getElementById('sql-input').value=''" style="font-size:12px">🗑️ Clear</button>
                            <div style="flex:1"></div>
                            <div id="query-status" style="font-size:11px;color:var(--text-muted)"></div>
                        </div>
                        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
                            ${[
                                "SELECT * FROM driver WHERE status = 'On Trip'",
                                "SELECT * FROM tractor ORDER BY odometer_km DESC",
                                "SELECT route_name, distance_km FROM route WHERE is_active=1",
                                "SELECT * FROM load WHERE status = 'In Transit'",
                                "SELECT company_name, email FROM customer",
                                "SELECT * FROM hub ORDER BY hub_id",
                                "SELECT * FROM invoice WHERE status = 'Overdue'",
                                "SELECT warehouse_name, area_sqft, capacity_pct FROM warehouse"
                            ].map(q => `<button class="btn" onclick="document.getElementById('sql-input').value=\`${q}\`" style="font-size:9px;padding:3px 8px;font-family:var(--font-mono)">${q.substring(0, 35)}...</button>`).join('')}
                        </div>
                    </div>
                    <div style="flex:1;overflow:auto;padding:0" id="query-results">
                        <div style="padding:40px;text-align:center;color:var(--text-muted)">
                            <div style="font-size:40px;margin-bottom:12px">⚡</div>
                            <div style="font-size:14px;font-weight:600">Run a SQL query to see results</div>
                            <div style="font-size:12px;margin-top:6px">Try clicking one of the preset queries above</div>
                        </div>
                    </div>
                </div>
            </div>
            <div style="width:380px;display:flex;flex-direction:column">
                <div class="card" style="flex:1;padding:0;display:flex;flex-direction:column;overflow:hidden">
                    <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                        <div style="font-size:13px;font-weight:700">📜 Live SQL Log</div>
                        <div style="font-size:10px;color:var(--text-muted)" id="log-count">0 queries</div>
                    </div>
                    <div style="flex:1;overflow-y:auto;background:var(--bg-primary);font-family:var(--font-mono);font-size:11px" id="sql-log"></div>
                </div>
            </div>
        </div>
    `;

    // Run query
    document.getElementById('run-query-btn').addEventListener('click', runQuery);
    document.getElementById('sql-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runQuery(); }
    });

    // Load log
    refreshQueryLog();
    queryLogInterval = setInterval(refreshQueryLog, 5000);
};

async function runQuery() {
    const sql = document.getElementById('sql-input').value.trim();
    if (!sql) return;

    const statusEl = document.getElementById('query-status');
    const resultsEl = document.getElementById('query-results');
    statusEl.textContent = '⏳ Executing...';
    statusEl.style.color = 'var(--accent-yellow)';

    const startTime = performance.now();
    try {
        const res = await fetch(`${API}/queries/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql })
        });
        const data = await res.json();
        const elapsed = (performance.now() - startTime).toFixed(0);

        if (data.error) {
            statusEl.textContent = `❌ Error (${elapsed}ms)`;
            statusEl.style.color = 'var(--accent-red)';
            resultsEl.innerHTML = `<div style="padding:20px;color:var(--accent-red);font-family:var(--font-mono);font-size:12px"><strong>Error:</strong><br>${data.error}</div>`;
            return;
        }

        const rows = data.rows || [];

        // Handle write operations (INSERT/UPDATE/DELETE)
        if (data.message) {
            statusEl.textContent = `✅ ${data.message} (${elapsed}ms)`;
            statusEl.style.color = 'var(--accent-green)';
            resultsEl.innerHTML = `
                <div style="padding:40px;text-align:center">
                    <div style="font-size:48px;margin-bottom:12px">✅</div>
                    <div style="font-size:16px;font-weight:700;color:var(--accent-green);margin-bottom:8px">${data.message}</div>
                    <div style="font-size:12px;color:var(--text-muted)">Run a SELECT query to verify the changes</div>
                </div>`;
            refreshQueryLog();
            return;
        }

        statusEl.textContent = `✅ ${rows.length} rows (${elapsed}ms)`;
        statusEl.style.color = 'var(--accent-green)';

        if (!rows.length) {
            resultsEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Query returned no results</div>';
            return;
        }

        const cols = Object.keys(rows[0]);
        resultsEl.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:11px;font-family:var(--font-mono)">
                <thead><tr style="background:var(--bg-tertiary);position:sticky;top:0">
                    ${cols.map(c => `<th style="padding:8px 10px;text-align:left;font-weight:700;color:var(--accent-teal);white-space:nowrap;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase">${c}</th>`).join('')}
                </tr></thead>
                <tbody>
                    ${rows.map((r, i) => `<tr style="border-bottom:1px solid var(--border);${i % 2 ? 'background:var(--bg-tertiary)' : ''}">
                        ${cols.map(c => {
                            let val = r[c];
                            if (val === null || val === undefined) val = '<span style="color:var(--text-muted);font-style:italic">NULL</span>';
                            else if (typeof val === 'number') val = `<span style="color:var(--accent-teal)">${val.toLocaleString()}</span>`;
                            else if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) val = `<span style="color:var(--accent-purple)">${new Date(val).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>`;
                            return `<td style="padding:6px 10px;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis">${val}</td>`;
                        }).join('')}
                    </tr>`).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        statusEl.textContent = `❌ Connection error`;
        statusEl.style.color = 'var(--accent-red)';
        resultsEl.innerHTML = `<div style="padding:20px;color:var(--accent-red)">Failed to execute query: ${e.message}</div>`;
    }
}

async function refreshQueryLog() {
    try {
        const res = await fetch(`${API}/queries/log`);
        const logs = await res.json();
        const logEl = document.getElementById('sql-log');
        const countEl = document.getElementById('log-count');
        if (!logEl) return;
        countEl.textContent = `${logs.length} queries`;
        logEl.innerHTML = logs.slice(0, 50).map(l => `
            <div style="padding:8px 12px;border-bottom:1px solid var(--border);line-height:1.4">
                <div style="color:var(--accent-teal);font-size:10px;word-break:break-all">${(l.SQL_TEXT || '').substring(0, 120)}${(l.SQL_TEXT || '').length > 120 ? '...' : ''}</div>
                <div style="display:flex;gap:10px;margin-top:3px;font-size:9px;color:var(--text-muted)">
                    <span>⏱️ ${l.EXECUTION_MS || 0}ms</span>
                    <span>📊 ${l.ROW_COUNT || 0} rows</span>
                    <span>${timeAgo(l.EXECUTED_AT)}</span>
                </div>
            </div>
        `).join('');
    } catch (e) {}
}
