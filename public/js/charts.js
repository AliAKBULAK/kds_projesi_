
// Chart.js Configuration & Theme
const CHART_COLORS = {
    primary: '#003366',
    primaryLight: '#335c85',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    grey: '#cbd5e1'
};

// Year Themes (Distinct pairs for each year)
// Users asked for 2020: Blue (Income) / Orange (Expense)
const YEAR_THEMES = {
    '2024': { income: '#2563eb', expense: '#dc2626' }, // Blue / Red (High Contrast)
    '2023': { income: '#16a34a', expense: '#9333ea' }, // Green / Purple (Distinct)
    '2022': { income: '#7c3aed', expense: '#db2777' }, // Violet / Pink
    '2021': { income: '#0891b2', expense: '#475569' }, // Cyan / Slate (Distinct Grey)
    '2020': { income: '#3b82f6', expense: '#ea580c' }, // Blue / Orange (Requested)
    'default': { income: '#64748b', expense: '#94a3b8' }
};

// Exchange Rates (Average for each year)
const YEARLY_RATES = {
    '2020': 7.02,
    '2021': 8.89,
    '2022': 16.57,
    '2023': 23.76,
    '2024': 32.50
};

let chartInstances = {};

function initCharts() {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';
}

// NEW: Render Stacked/Offset "Ridgeline" Style Chart (USD Converted)
// Added isOverlay parameter for comparison mode
function renderAllYearlyCharts(allData, isOverlay = false) {
    let container = document.getElementById('dynamic-charts-container');

    // Check if card already exists to prevent re-creation flicker, OR just clear and rebuild.
    // For independent rendering, we need to know WHERE to render.

    let card = document.getElementById('card-financial-chart');
    if (!card) {
        card = document.createElement('div');
        card.id = 'card-financial-chart';
        card.className = 'chart-card wide';
        card.style.height = '600px';
        container.appendChild(card);
    }

    // Header HTML with Controls
    const btnStyleActive = "background:white; color:#0f172a; box-shadow:0 1px 2px rgba(0,0,0,0.1); border-radius:6px; padding:6px 12px; border:none; cursor:pointer; font-weight:600; font-size:12px;";
    const btnStyleInactive = "background:transparent; color:#64748b; border:none; cursor:pointer; font-weight:600; font-size:12px; padding:6px 12px;";

    const trendStyle = isOverlay ? btnStyleInactive : btnStyleActive;
    const overlayStyle = isOverlay ? btnStyleActive : btnStyleInactive;

    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Yıllık Performans (USD)</h3>
            <div style="background:#f1f5f9; padding:4px; border-radius:8px; display:inline-flex;">
                <button onclick="toggleFinancialMode('trend')" style="${trendStyle}">📉 Trend</button>
                <button onclick="toggleFinancialMode('overlay')" style="${overlayStyle}">⚔️ Karşılaştırma</button>
            </div>
        </div>
        <div class="chart-container" style="height: 500px;">
            <canvas id="chart-offset-trend"></canvas>
        </div>
    `;

    // 2. Prepare Data
    const datasets = [];
    const sortedYears = Object.keys(allData).sort();

    // Config: Spacing between years
    // If Overlay, offset is 0.
    const Y_OFFSET_STEP = isOverlay ? 0 : 120;

    // We need common labels (Months)
    const monthLabels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    sortedYears.forEach((year, index) => {
        const yearData = allData[year];
        const baseOffset = index * Y_OFFSET_STEP;
        const rate = YEARLY_RATES[year] || 32.0;
        const theme = YEAR_THEMES[year] || YEAR_THEMES['default'];

        // Calculate USD Values first
        const rawIncomeUSD = yearData.monthlyData.map(d => parseFloat(d.total_income) / rate);
        const rawExpenseUSD = yearData.monthlyData.map(d => (parseFloat(d.total_expense) || 0) / rate);

        // Find MAX USD value for this year to normalize visual IF stacked
        // If Overlay, we want Absolute comparisons, so NO normalization?
        // Actually, Ridgeline usually normalizes to ensure shapes are visible.
        // But for "Financial Comparison" (Overlay), users want to see who made MORE money.
        // So: If Overlay -> Absolute values. If Stacked -> Normalized + Offset?
        // Current implementation was: (val / max * 100) + baseOffset. This normalizes every year to 100 max.
        // This destroys absolute comparison between 2024 and 2020.
        // User likely wants ABSOLUTE comparison.
        // Let's remove normalization for Overlay, or maybe remove it entirely if values are strictly USD now?
        // USD values range: $20k - $100k. 
        // If we stack them with offset 120, and max val is 100k, we need to scale 100k -> 100?
        // Let's stick to a scaling factor. Say $1000 = 1 unit? 
        // Or just keep the normalization for visual "shape" comparison in Ridgeline, 
        // BUT for Overlay, we MUST use absolute values to be useful.

        let visibleIncomeData, visibleExpenseData;
        const maxValUSD = Math.max(...rawIncomeUSD) || 1;

        if (isOverlay) {
            // Absolute values for direct comparison
            visibleIncomeData = rawIncomeUSD;
            visibleExpenseData = rawExpenseUSD;
        } else {
            // Normalized for Ridgeline shape
            visibleIncomeData = rawIncomeUSD.map(val => (val / maxValUSD * 100) + baseOffset);
            visibleExpenseData = rawExpenseUSD.map(val => (val / maxValUSD * 100) + baseOffset);
        }

        // Add Income Line
        datasets.push({
            label: `${year} Gelir`,
            data: visibleIncomeData,
            rawValues: rawIncomeUSD,
            borderColor: theme.income,
            backgroundColor: theme.income + '1A', // 10% opacity
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false
        });

        // Add Expense Line
        datasets.push({
            label: `${year} Gider`,
            data: visibleExpenseData,
            rawValues: rawExpenseUSD,
            borderColor: theme.expense,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false
        });

        // Add a "Baseline" line (ONLY IF NOT OVERLAY)
        if (!isOverlay) {
            datasets.push({
                label: `${year} Base`,
                data: new Array(12).fill(baseOffset),
                borderColor: '#e2e8f0',
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                excludeFromTooltip: true
            });
        }
    });

    // 3. Render Chart
    const ctx = document.getElementById('chart-offset-trend').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true, // SHOW LEGEND
                    position: 'bottom',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        font: { size: 11 },
                        filter: function (item, chart) {
                            // Hide "Base" lines
                            if (item.text.includes('Base')) return false;
                            return true;
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    callbacks: {
                        title: function (context) {
                            return context[0].label;
                        },
                        label: function (context) {
                            const dataset = context.dataset;
                            if (dataset.excludeFromTooltip) return null;
                            const rawVal = dataset.rawValues[context.dataIndex];
                            return `${dataset.label}: ` + new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0
                            }).format(rawVal);
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    ticks: {
                        font: { size: 12 },
                        color: '#64748b'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: { display: false },
                    border: { display: false }
                },
                y2: {
                    position: 'right',
                    beginAtZero: true,
                    grid: { display: false },
                    border: { display: false },
                    suggestedMax: (Object.keys(allData).length * Y_OFFSET_STEP) + 50,
                    ticks: {
                        autoSkip: false,
                        stepSize: Y_OFFSET_STEP,
                        callback: function (value) {
                            if (value % Y_OFFSET_STEP === 0) {
                                const yearIndex = value / Y_OFFSET_STEP;
                                return sortedYears[yearIndex] || '';
                            }
                            return '';
                        },
                        font: {
                            weight: 'bold',
                            size: 14
                        },
                        color: '#64748b',
                        padding: 0,
                        labelOffset: -40,
                        crossAlign: 'center'
                    }
                }
            }
        }
    });
}

// NEW: Occupancy Trend Ridgeline Chart
function renderOccupancyTrendChart(allData, isOverlay = false) {
    const container = document.getElementById('dynamic-charts-container');
    // Do NOT clear container here, we append to it.

    // 1. Create Layout Elements
    // Check/Create Card for Occupancy
    let card = document.getElementById('card-occupancy-chart');
    if (!card) {
        card = document.createElement('div');
        card.id = 'card-occupancy-chart';
        card.className = 'chart-card wide';
        card.style.height = '600px';
        container.appendChild(card);
    }

    // Header HTML with Controls
    const btnStyleActive = "background:white; color:#0f172a; box-shadow:0 1px 2px rgba(0,0,0,0.1); border-radius:6px; padding:6px 12px; border:none; cursor:pointer; font-weight:600; font-size:12px;";
    const btnStyleInactive = "background:transparent; color:#64748b; border:none; cursor:pointer; font-weight:600; font-size:12px; padding:6px 12px;";

    const trendStyle = isOverlay ? btnStyleInactive : btnStyleActive;
    const overlayStyle = isOverlay ? btnStyleActive : btnStyleInactive;

    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Yıllık Doluluk Trendi (Hedef vs Gerçekleşen)</h3>
            <div style="background:#f1f5f9; padding:4px; border-radius:8px; display:inline-flex;">
                <button onclick="toggleOccupancyMode('trend')" style="${trendStyle}">📉 Trend</button>
                <button onclick="toggleOccupancyMode('overlay')" style="${overlayStyle}">⚔️ Karşılaştırma</button>
            </div>
        </div>
        <div class="chart-container" style="height: 500px;">
            <canvas id="chart-occupancy-ridgeline"></canvas>
        </div>
    `;

    // 2. Prepare Data
    const datasets = [];
    const sortedYears = Object.keys(allData).sort();

    // Config: Spacing between years
    const Y_OFFSET_STEP = isOverlay ? 0 : 50;
    const monthLabels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    sortedYears.forEach((year, index) => {
        const yearData = allData[year];
        const baseOffset = index * Y_OFFSET_STEP;
        const theme = YEAR_THEMES[year] || YEAR_THEMES['default'];

        // Raw Occupancy %
        const rawOcc = yearData.monthlyData.map(d => parseFloat(d.occupancy_rate));

        // Target (e.g. 70%)
        // Future: Could be seasonal. For now fixed 70.
        const targetOcc = new Array(12).fill(70);

        // Normalize scaling? 
        // No, keep 0-100 scale but shifted by offset.
        // If offset is 50, then 0% = 50, 100% = 150.

        const visibleOcc = rawOcc.map(val => val + baseOffset);
        const visibleTarget = targetOcc.map(val => val + baseOffset);
        const visibleBase = new Array(12).fill(baseOffset);

        // Actual Line (Solid - Theme Income Color -> Primary Color)
        datasets.push({
            label: `${year} Doluluk`,
            data: visibleOcc,
            rawValues: rawOcc,
            borderColor: theme.income, // Use Theme "Income" color as Primary
            backgroundColor: theme.income + '1A',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            fill: false
        });

        // Target Line (Dashed - Theme Expense Color -> Secondary/Target Color)
        datasets.push({
            label: `${year} Hedef (%70)`,
            data: visibleTarget,
            rawValues: targetOcc,
            borderColor: theme.expense, // Use Theme "Expense" color as Secondary
            borderWidth: 1.5,
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 0,
            fill: false
        });

        // Baseline (Grey Flat) - ONLY IF NOT OVERLAY
        if (!isOverlay) {
            datasets.push({
                label: `${year} Base`,
                data: visibleBase,
                borderColor: '#e2e8f0',
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                excludeFromTooltip: true
            });
        }
    });

    // 3. Render Chart
    const ctx = document.getElementById('chart-occupancy-ridgeline').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true, // SHOW LEGEND
                    position: 'bottom',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        font: { size: 11 },
                        filter: function (item, chart) {
                            if (item.text.includes('Base')) return false;
                            return true;
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    callbacks: {
                        title: function (context) {
                            return context[0].label;
                        },
                        label: function (context) {
                            const dataset = context.dataset;
                            if (dataset.excludeFromTooltip) return null;
                            const rawVal = dataset.rawValues[context.dataIndex];
                            return `${dataset.label}: %${rawVal.toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    ticks: {
                        font: { size: 12 },
                        color: '#64748b'
                    }
                },
                y: {
                    display: false,
                    beginAtZero: true
                },
                y2: {
                    position: 'right',
                    beginAtZero: true,
                    grid: { display: false },
                    border: { display: false },
                    suggestedMax: isOverlay ? null : (Object.keys(allData).length * Y_OFFSET_STEP) + 100,
                    ticks: {
                        display: !isOverlay,
                        autoSkip: false,
                        stepSize: Y_OFFSET_STEP,
                        callback: function (value) {
                            if (!isOverlay && value % Y_OFFSET_STEP === 0) {
                                const yearIndex = value / Y_OFFSET_STEP;
                                return sortedYears[yearIndex] || '';
                            }
                            return '';
                        },
                        font: { weight: 'bold', size: 14 },
                        color: '#64748b',
                        padding: 0,
                        crossAlign: 'center'
                    }
                }
            }
        }
    });
}

// NEW: Detailed Charts for Selected Year (Pie & Bar)
function renderDetailCharts(year, yearData) {
    const rate = YEARLY_RATES[year] || 32.0;

    // --- Data Preparation (USD) ---
    const incomeDataUSD = yearData.monthlyData.map(d => parseFloat(d.total_income) / rate);
    const expenseDataUSD = yearData.monthlyData.map(d => (parseFloat(d.total_expense) || 0) / rate);

    // Calculate Totals
    const totalIncomeUSD = incomeDataUSD.reduce((a, b) => a + b, 0);
    const totalExpenseUSD = expenseDataUSD.reduce((a, b) => a + b, 0);

    const labels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    // 1. PIE CHART: Income vs Expense
    const pieCtx = document.getElementById('chart-detail-pie').getContext('2d');

    if (chartInstances.detailPie) {
        chartInstances.detailPie.destroy();
    }

    chartInstances.detailPie = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            // Expense (Left), Income (Right)
            labels: ['Toplam Gider', 'Toplam Gelir'],
            datasets: [{
                data: [totalExpenseUSD, totalIncomeUSD],
                // Orange (Expense), Blue (Income)
                backgroundColor: ['#f59e0b', '#3b82f6'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.label + ': ' + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(context.raw);
                        }
                    }
                }
            }
        }
    });

    // 2. BAR CHART: Monthly Performance
    const barCtx = document.getElementById('chart-detail-bar').getContext('2d');

    if (chartInstances.detailBar) {
        chartInstances.detailBar.destroy();
    }

    chartInstances.detailBar = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    // Left Bar = Expense (Orange)
                    label: 'Gider',
                    data: expenseDataUSD,
                    backgroundColor: '#f59e0b', // Orange (Warning color in theme)
                    borderRadius: 4
                },
                {
                    // Right Bar = Income (Blue)
                    label: 'Gelir',
                    data: incomeDataUSD,
                    backgroundColor: '#3b82f6', // Blue (Primary chart color)
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            // Shorten: $1M or $500k
                            if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'k';
                            return '$' + value;
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(context.raw);
                        }
                    }
                }
            }
        }
    });

}

function renderSimulationCharts(simData) {
    const breakdownCtx = document.getElementById('chart-sim-breakdown').getContext('2d');

    if (chartInstances.breakdown) {
        chartInstances.breakdown.data.datasets[0].data = [
            simData.breakdown.personnel,
            simData.breakdown.kitchen,
            simData.breakdown.fixed,
            simData.breakdown.other
        ];
        chartInstances.breakdown.update();
    } else {
        chartInstances.breakdown = new Chart(breakdownCtx, {
            type: 'pie',
            data: {
                labels: ['Personel', 'Mutfak', 'Sabit', 'Diğer'],
                datasets: [{
                    data: [
                        simData.breakdown.personnel,
                        simData.breakdown.kitchen,
                        simData.breakdown.fixed,
                        simData.breakdown.other
                    ],
                    backgroundColor: ['#003366', '#336699', '#6699cc', '#99ccff'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
    }

    const profitCtx = document.getElementById('chart-sim-profit').getContext('2d');
    const monthlyTotalProfits = Array.from({ length: 12 }, (_, i) => {
        let factor = (i > 4 && i < 9) ? 1.5 : 0.8;
        return (simData.pricing.suggestedPrice * 30 * 100 * (simData.occupancy / 100) * factor) - (simData.unitCost * 30 * 100 * (simData.occupancy / 100));
    });

    // Split for Double Legend (Profit vs Loss)
    const profitData = monthlyTotalProfits.map(val => val >= 0 ? val : null);
    const lossData = monthlyTotalProfits.map(val => val < 0 ? val : null);

    if (chartInstances.profit) {
        chartInstances.profit.destroy(); // Force re-render to update datasets/legend
    }

    chartInstances.profit = new Chart(profitCtx, {
        type: 'bar',
        data: {
            labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
            datasets: [
                {
                    label: 'Tahmini Kar',
                    data: profitData,
                    backgroundColor: CHART_COLORS.success,
                    borderRadius: 4
                },
                {
                    label: 'Tahmini Zarar',
                    data: lossData,
                    backgroundColor: CHART_COLORS.danger,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
                        }
                    }
                }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    const sensitivityCtx = document.getElementById('chart-sensitivity').getContext('2d');

    if (chartInstances.sensitivity) {
        chartInstances.sensitivity.data.datasets[0].data = [
            simData.sensitivity.inflationImpact,
            simData.sensitivity.raiseImpact,
            simData.sensitivity.occupancyImpact
        ];
        chartInstances.sensitivity.update();
    } else {
        chartInstances.sensitivity = new Chart(sensitivityCtx, {
            type: 'bar',
            data: {
                labels: ['Enflasyon (+%10)', 'Personel Zammı (+%10)', 'Doluluk (-%10)'],
                datasets: [{
                    label: 'Kâr Kaybı (TL)',
                    data: [
                        simData.sensitivity.inflationImpact,
                        simData.sensitivity.raiseImpact,
                        simData.sensitivity.occupancyImpact
                    ],
                    backgroundColor: [CHART_COLORS.danger, CHART_COLORS.warning, CHART_COLORS.primaryLight],
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { title: { display: true, text: 'Kâr Düşüşü (TL)' } } },
                plugins: { legend: { display: false } }
            }
        });
    }
}


function renderExpenseTrendChart(labels, fixedData, variableData) {
    const ctx = document.getElementById('chart-sim-expense-trend').getContext('2d');

    if (chartInstances.expenseTrend) {
        chartInstances.expenseTrend.data.datasets[0].data = fixedData;
        chartInstances.expenseTrend.data.datasets[1].data = variableData;
        chartInstances.expenseTrend.update();
    } else {
        chartInstances.expenseTrend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Sabit Gider (Personel+Sabit)',
                        data: fixedData,
                        backgroundColor: '#334155', // Dark Grey
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Değişken Gider (Mutfak+Diğer)',
                        data: variableData,
                        backgroundColor: '#f59e0b', // Orange
                        stack: 'Stack 0'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            }
        });
    }
}


function renderHistoryCharts(data, year = '2024') {
    const rate = YEARLY_RATES[year] || 32.5;

    // Occupancy (No currency conversion needed, but good to check)
    const occCtx = document.getElementById('chart-history-occupancy').getContext('2d');
    const labels = data.monthlyData.map(d => d.month);
    const occupancyData = data.monthlyData.map(d => parseFloat(d.occupancy_rate));
    const targetData = new Array(12).fill(70);

    if (chartInstances.historyOcc) {
        chartInstances.historyOcc.data.labels = labels;
        chartInstances.historyOcc.data.datasets[0].data = occupancyData;
        chartInstances.historyOcc.update();
    } else {
        chartInstances.historyOcc = new Chart(occCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gerçekleşen Doluluk (%)',
                        data: occupancyData,
                        borderColor: CHART_COLORS.primary,
                        backgroundColor: CHART_COLORS.primary,
                        tension: 0.3
                    },
                    {
                        label: 'Genel Hedef (%70)',
                        data: targetData,
                        borderColor: CHART_COLORS.danger,
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    }

    // Finance Chart (Convert to USD)
    const finCtx = document.getElementById('chart-history-finance').getContext('2d');
    const incomeData = data.monthlyData.map(d => parseFloat(d.total_income) / rate);
    const expenseData = data.monthlyData.map(d =>
        (parseFloat(d.personnel_expense) + parseFloat(d.kitchen_expense) +
            parseFloat(d.fixed_expense) + parseFloat(d.other_expense)) / rate
    );

    if (chartInstances.historyFin) {
        chartInstances.historyFin.data.labels = labels;
        chartInstances.historyFin.data.datasets[0].data = incomeData;
        chartInstances.historyFin.data.datasets[1].data = expenseData;
        chartInstances.historyFin.update();
    } else {
        chartInstances.historyFin = new Chart(finCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Toplam Gelir ($)',
                        data: incomeData,
                        borderColor: CHART_COLORS.success,
                        backgroundColor: CHART_COLORS.success,
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: 'Toplam Gider ($)',
                        data: expenseData,
                        borderColor: CHART_COLORS.danger,
                        backgroundColor: CHART_COLORS.danger,
                        tension: 0.3,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }
}

