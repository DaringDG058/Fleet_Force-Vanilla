// Fleet Force — Reports Page (Chart.js)
window.render_reports = async function(container) {
    container.innerHTML = `
        <div class="grid grid-2" style="margin-bottom:20px;gap:16px">
            <div class="card" style="padding:20px">
                <div class="card-header" style="margin-bottom:16px"><div class="card-title">📊 Route Performance</div></div>
                <div style="height:320px;position:relative"><canvas id="chart-routes"></canvas></div>
            </div>
            <div class="card" style="padding:20px">
                <div class="card-header" style="margin-bottom:16px"><div class="card-title">🏆 Top Drivers</div></div>
                <div style="height:320px;position:relative"><canvas id="chart-drivers"></canvas></div>
            </div>
        </div>
        <div class="grid grid-2" style="gap:16px">
            <div class="card" style="padding:20px">
                <div class="card-header" style="margin-bottom:16px"><div class="card-title">💰 Revenue by Customer</div></div>
                <div style="height:320px;position:relative"><canvas id="chart-revenue"></canvas></div>
            </div>
            <div class="card" style="padding:20px">
                <div class="card-header" style="margin-bottom:16px"><div class="card-title">📈 Financial Overview</div></div>
                <div style="height:320px;position:relative"><canvas id="chart-financial"></canvas></div>
            </div>
        </div>
    `;

    // Load Chart.js if not already loaded
    if (!window.Chart) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    const isLight = document.documentElement.classList.contains('theme-light');
    const txtColor = isLight ? '#334155' : '#94a3b8';
    const gridColor = isLight ? 'rgba(100,116,139,0.12)' : 'rgba(148,163,184,0.08)';

    const defaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: txtColor, font: { family: "'IBM Plex Mono', monospace", size: 11 } } }
        },
        scales: {
            x: { ticks: { color: txtColor, font: { size: 10 } }, grid: { color: gridColor } },
            y: { ticks: { color: txtColor, font: { size: 10 } }, grid: { color: gridColor } }
        }
    };

    try {
        // Route performance
        const perfRes = await fetch(`${API}/reports/performance`);
        const perf = await perfRes.json();

        if (perf.routePerformance && perf.routePerformance.length) {
            new Chart(document.getElementById('chart-routes'), {
                type: 'bar',
                data: {
                    labels: perf.routePerformance.map(r => r.ROUTE_NAME ? r.ROUTE_NAME.substring(0, 20) : ''),
                    datasets: [{
                        label: 'Trips',
                        data: perf.routePerformance.map(r => r.TRIP_COUNT),
                        backgroundColor: 'rgba(20, 184, 166, 0.7)',
                        borderColor: '#14b8a6',
                        borderWidth: 1,
                        borderRadius: 4
                    }, {
                        label: 'Avg Distance (km)',
                        data: perf.routePerformance.map(r => r.AVG_DISTANCE),
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: { ...defaults, indexAxis: 'y' }
            });
        }

        // Top drivers
        if (perf.topDrivers && perf.topDrivers.length) {
            new Chart(document.getElementById('chart-drivers'), {
                type: 'bar',
                data: {
                    labels: perf.topDrivers.map(d => d.NAME),
                    datasets: [{
                        label: 'Rating',
                        data: perf.topDrivers.map(d => d.DRIVER_RATING),
                        backgroundColor: 'rgba(234, 179, 8, 0.7)',
                        borderColor: '#eab308',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'y'
                    }, {
                        label: 'Total KM (×100)',
                        data: perf.topDrivers.map(d => (d.TOTAL_KM || 0) / 100),
                        backgroundColor: 'rgba(139, 92, 246, 0.5)',
                        borderColor: '#8b5cf6',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    ...defaults,
                    scales: {
                        ...defaults.scales,
                        y: { ...defaults.scales.y, position: 'left', max: 5, title: { display: true, text: 'Rating', color: txtColor } },
                        y1: { ticks: { color: txtColor, font: { size: 10 } }, grid: { display: false }, position: 'right', title: { display: true, text: 'KM (×100)', color: txtColor } }
                    }
                }
            });
        }

        // Financial
        const finRes = await fetch(`${API}/reports/financial`);
        const financial = await finRes.json();

        if (financial && financial.length) {
            new Chart(document.getElementById('chart-revenue'), {
                type: 'doughnut',
                data: {
                    labels: financial.map(f => f.COMPANY_NAME),
                    datasets: [{
                        data: financial.map(f => f.TOTAL_BILLED),
                        backgroundColor: [
                            '#14b8a6', '#3b82f6', '#8b5cf6', '#eab308', '#ef4444',
                            '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#6366f1',
                            '#a855f7', '#f43f5e', '#84cc16'
                        ],
                        borderWidth: 2,
                        borderColor: isLight ? '#ffffff' : '#0a1120'
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { color: txtColor, font: { size: 10 }, padding: 8 } },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.label}: ₹${(ctx.raw / 100000).toFixed(1)}L`
                            }
                        }
                    }
                }
            });

            // Paid vs outstanding bar
            new Chart(document.getElementById('chart-financial'), {
                type: 'bar',
                data: {
                    labels: financial.map(f => f.COMPANY_NAME ? f.COMPANY_NAME.substring(0, 15) : ''),
                    datasets: [{
                        label: 'Paid',
                        data: financial.map(f => f.TOTAL_PAID || 0),
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 4
                    }, {
                        label: 'Outstanding',
                        data: financial.map(f => (f.TOTAL_BILLED || 0) - (f.TOTAL_PAID || 0)),
                        backgroundColor: 'rgba(239, 68, 68, 0.5)',
                        borderColor: '#ef4444',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    ...defaults,
                    plugins: {
                        ...defaults.plugins,
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.dataset.label}: ₹${(ctx.raw / 100000).toFixed(1)}L`
                            }
                        }
                    },
                    scales: {
                        ...defaults.scales,
                        x: { ...defaults.scales.x, stacked: true },
                        y: { ...defaults.scales.y, stacked: true, ticks: { callback: v => '₹' + (v/100000).toFixed(0) + 'L' } }
                    }
                }
            });
        }
    } catch (e) { showToast('Failed to load reports', 'error'); }
};
