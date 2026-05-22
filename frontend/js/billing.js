// Fleet Force — Billing & Invoices Page
window.render_billing = async function(container) {
    container.innerHTML = `
        <div class="grid grid-4" id="billing-kpis" style="margin-bottom:20px">
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
            <div class="card shimmer" style="height:90px"></div>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
            <div style="padding:16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)">
                <div style="display:flex;gap:6px" id="inv-filters">
                    <button class="btn btn-primary inv-filter active" data-if="all">All</button>
                    <button class="btn inv-filter" data-if="Pending">Pending</button>
                    <button class="btn inv-filter" data-if="Paid">Paid</button>
                    <button class="btn inv-filter" data-if="Overdue">Overdue</button>
                </div>
                <input type="text" id="inv-search" placeholder="Search invoices..." style="padding:9px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:13px;width:220px">
            </div>
            <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:collapse" id="inv-table">
                    <thead><tr style="background:var(--bg-tertiary)">
                        <th class="th">Invoice #</th>
                        <th class="th">Customer</th>
                        <th class="th">Date</th>
                        <th class="th">Amount</th>
                        <th class="th">Tax</th>
                        <th class="th">Net Total</th>
                        <th class="th">Status</th>
                        <th class="th">Due Date</th>
                    </tr></thead>
                    <tbody id="inv-tbody"></tbody>
                </table>
            </div>
        </div>
    `;

    try {
        const res = await fetch(`${API}/invoices`);
        const data = await res.json();
        const { invoices, totals } = data;

        // KPIs
        document.getElementById('billing-kpis').innerHTML = `
            ${billKPI('Total Billed', formatINR(totals.TOTAL), '💰', 'var(--accent-blue)')}
            ${billKPI('Pending', formatINR(totals.PENDING), '⏳', 'var(--accent-yellow)')}
            ${billKPI('Paid', formatINR(totals.PAID), '✅', 'var(--accent-green)')}
            ${billKPI('Overdue', formatINR(totals.OVERDUE), '🔴', 'var(--accent-red)')}
        `;

        renderInvoices(invoices);

        // Filters
        document.querySelectorAll('.inv-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.inv-filter').forEach(b => { b.classList.remove('active', 'btn-primary'); });
                btn.classList.add('active', 'btn-primary');
                const f = btn.dataset.if;
                renderInvoices(f === 'all' ? invoices : invoices.filter(i => i.STATUS === f));
            });
        });

        // Search
        document.getElementById('inv-search').addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            renderInvoices(invoices.filter(i =>
                (i.INVOICE_NO || '').toLowerCase().includes(q) ||
                (i.COMPANY_NAME || '').toLowerCase().includes(q)
            ));
        });
    } catch (e) { showToast('Failed to load billing data', 'error'); }
};

function renderInvoices(invoices) {
    const tbody = document.getElementById('inv-tbody');
    tbody.innerHTML = invoices.map(i => {
        const statusCls = i.STATUS === 'Paid' ? 'status-available' : i.STATUS === 'Overdue' ? 'status-critical' : 'status-assigned';
        const invDate = i.CREATED_AT ? new Date(i.CREATED_AT).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—';
        const dueDate = i.DUE_DATE ? new Date(i.DUE_DATE).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—';
        return `
        <tr class="trow" style="cursor:pointer" onclick="openInvoiceDetail('${i.INVOICE_NO}', '${(i.COMPANY_NAME || '').replace(/'/g,"\\'")}', ${i.TOTAL_AMOUNT || 0}, ${i.TAX_AMOUNT || 0}, ${i.NET_AMOUNT || 0}, '${i.STATUS}', '${i.CREATED_AT || ''}', '${i.DUE_DATE || ''}', '${i.CUSTOMER_EMAIL || ''}')">
            <td class="td"><span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--accent-teal)">${i.INVOICE_NO}</span></td>
            <td class="td"><span style="font-size:12px">${i.COMPANY_NAME || '—'}</span></td>
            <td class="td"><span style="font-size:12px">${invDate}</span></td>
            <td class="td"><span style="font-size:12px;font-family:var(--font-mono)">${formatINR(i.TOTAL_AMOUNT)}</span></td>
            <td class="td"><span style="font-size:12px;color:var(--text-muted)">${formatINR(i.TAX_AMOUNT)}</span></td>
            <td class="td"><span style="font-size:13px;font-weight:700;font-family:var(--font-mono)">${formatINR(i.NET_AMOUNT)}</span></td>
            <td class="td"><span class="status-badge ${statusCls}" style="font-size:9px">${i.STATUS}</span></td>
            <td class="td"><span style="font-size:11px;color:${isOverdue(i.DUE_DATE) ? 'var(--accent-red)' : 'var(--text-muted)'}">${dueDate}</span></td>
        </tr>`;
    }).join('');

    // Row hover
    document.querySelectorAll('.trow').forEach(r => {
        r.style.transition = 'background 0.15s';
        r.addEventListener('mouseenter', () => r.style.background = 'var(--bg-card-hover)');
        r.addEventListener('mouseleave', () => r.style.background = '');
    });
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
}

window.openInvoiceDetail = function(invNo, company, subtotal, tax, net, status, invDate, dueDate, email) {
    const panel = document.getElementById('load-detail-panel');
    panel.style.display = 'block';
    const statusCls = status === 'Paid' ? 'status-available' : status === 'Overdue' ? 'status-critical' : 'status-assigned';
    const fmtInvDate = invDate ? new Date(invDate).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—';
    const fmtDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—';
    panel.innerHTML = `
        <div class="detail-overlay" onclick="closeLoadDetail()"></div>
        <div class="detail-content">
            <div class="detail-header">
                <div><div style="font-size:18px;font-weight:800;color:var(--accent-teal)">${invNo}</div>
                <div style="font-size:12px;color:var(--text-muted)">Invoice for ${company}</div></div>
                <button class="btn" onclick="closeLoadDetail()">✕</button>
            </div>
            <div class="detail-body">
                <div class="detail-grid">
                    <div class="detail-field"><div class="df-label">Customer</div><div class="df-value">${company}</div></div>
                    <div class="detail-field"><div class="df-label">Status</div><div class="df-value"><span class="status-badge ${statusCls}">${status}</span></div></div>
                    <div class="detail-field"><div class="df-label">Invoice Date</div><div class="df-value">${fmtInvDate}</div></div>
                    <div class="detail-field"><div class="df-label">Due Date</div><div class="df-value" style="${isOverdue(dueDate) ? 'color:var(--accent-red)' : ''}">${fmtDueDate}</div></div>
                    ${email ? `<div class="detail-field"><div class="df-label">Email</div><div class="df-value" style="font-size:11px">${email}</div></div>` : ''}
                </div>
                <hr style="border:none;border-top:1px solid var(--border);margin:20px 0">
                <h4 style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">💰 Billing Summary</h4>
                <div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--border)">
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px"><span>Subtotal</span><span style="font-family:var(--font-mono)">${formatINR(subtotal)}</span></div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;color:var(--text-muted)"><span>Tax (GST)</span><span style="font-family:var(--font-mono)">${formatINR(tax)}</span></div>
                    <hr style="border:none;border-top:1px solid var(--border);margin:8px 0">
                    <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800"><span>Net Total</span><span style="font-family:var(--font-mono);color:var(--accent-teal)">${formatINR(net)}</span></div>
                </div>
            </div>
        </div>`;
};

function billKPI(label, value, icon, color) {
    return `<div class="card" style="position:relative;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div><div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">${label}</div>
            <div style="font-size:22px;font-weight:800">${value}</div></div>
            <div style="font-size:24px;opacity:0.5">${icon}</div>
        </div><div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${color};opacity:0.5"></div></div>`;
}
