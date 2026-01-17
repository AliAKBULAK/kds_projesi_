
// Main App Logic

const API_URL = 'http://localhost:3000/api';

// Exchange Rates (Consistent with charts.js)
const YEARLY_RATES_APP = {
    '2020': 7.02,
    '2021': 8.89,
    '2022': 16.57,
    '2023': 23.76,
    '2024': 32.50
};

// State
let dashboardData = {};
let currentViewMode = 'trend'; // 'trend' or 'overlay'

document.addEventListener('DOMContentLoaded', () => {
    initCharts(); // Chart.js init
    setupNavigation();
    loadAllDashboardData(); // Load ALL data
    loadSavedScenarios(); // NEW: Load Sidebar List

    // Expose Toggle Function Globally
    // State for Independent Controls
    let financialMode = 'trend';
    let occupancyMode = 'trend';

    // Expose Independent Toggle Functions
    window.toggleFinancialMode = function (mode) {
        financialMode = mode;
        if (Object.keys(dashboardData).length > 0) {
            renderAllYearlyCharts(dashboardData, mode === 'overlay');
        }
    };

    window.toggleOccupancyMode = function (mode) {
        occupancyMode = mode;
        if (Object.keys(dashboardData).length > 0) {
            renderOccupancyTrendChart(dashboardData, mode === 'overlay');
        }
    };

    // Initial Render defaults are handled in loadAllDashboardData calling render functions with default 'false' (trend)


    // Set Current Date
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('current-date').innerText = now.toLocaleDateString('tr-TR', options);

    // History Year Filter Listener
    const historySelect = document.getElementById('history-year-select');
    if (historySelect) {
        historySelect.addEventListener('change', (e) => {
            loadHistoryData(e.target.value);
        });
        // Load initial history data (2024)
        loadHistoryData('2024');
    }
    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        if (confirm('Çıkış yapılsın mı?')) {
            localStorage.removeItem('kds_token');
            localStorage.removeItem('kds_user');
            window.location.href = 'login.html';
        }
    });
});

function setupNavigation() {
    const links = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.page-section');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            // Set Active Menu
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Set Active Section
            sections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            // Update Header Title
            document.getElementById('page-title').innerText = link.innerText.trim();

        });
    });
}


// UPDATED LOGIC: Master Year Selector controls Dashboard
async function loadAllDashboardData() {
    try {
        const res = await fetch(`${API_URL}/data/all`);
        const allData = await res.json();
        dashboardData = allData; // Store for toggle Logic
        const years = Object.keys(allData);
        if (years.length === 0) return;

        // --- NEW: Detailed Analysis Dropdown Logic ---
        const detailSelect = document.getElementById('detail-year-select');
        detailSelect.innerHTML = '';

        // Sort years descending (2024, 2023...)
        const sortedYears = years.sort().reverse();

        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.innerText = year;
            detailSelect.appendChild(option);
        });

        // --- NEW: History Analysis Dropdown Logic ---
        const historySelect = document.getElementById('history-year-select');
        if (historySelect) {
            historySelect.innerHTML = ''; // Clear hardcoded
            sortedYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.innerText = year;
                historySelect.appendChild(option);
            });
            // Initial render for history (use latest available year or 2024)
            // Select the first option (latest year) automatically if available
            if (historySelect.options.length > 0) {
                historySelect.value = historySelect.options[0].value;
            }
        }

        // Main Logic: Update Everything when Year Changes
        function updateDashboardForYear(year) {
            const yearData = allData[year];
            if (!yearData) return;

            const rate = YEARLY_RATES_APP[year] || 32.5;

            // 1. Update Detail Charts - DISABLED by user request (Charts Removed)
            // if (typeof renderDetailCharts === 'function') {
            //     renderDetailCharts(year, yearData);
            // }

            // 2. Update KPI Cards (USD)
            // Ensure values exist to prevent NaN - Handle Snake Case vs Camel Case
            const summary = yearData.summary || {};
            const income = parseFloat(summary.totalIncome || summary.total_income) || 0;
            const occ = parseFloat(summary.avgOccupancy || summary.avg_occupancy || summary.occupancy_rate) || 0;
            const cust = parseInt(summary.totalCustomers || summary.total_customers) || 0;
            const price = parseFloat(summary.avgPrice || summary.avg_price || summary.average_price) || 0;

            const kpi = {
                totalIncome: income / rate,
                avgOccupancy: occ,
                totalCustomers: cust,
                avgPrice: price / rate
            };

            updateKPIs(kpi);
        }

        // Event Listener
        detailSelect.addEventListener('change', (e) => {
            updateDashboardForYear(e.target.value);
        });

        // Initial Render (Latest Year, e.g. 2024)
        if (sortedYears.length > 0) {
            updateDashboardForYear(sortedYears[0]);
        }

        // Render Charts for ALL years (Ridgeline - Overview stays same)
        renderAllYearlyCharts(allData);
        renderOccupancyTrendChart(allData);

        // Init simulation with latest year data (2024)
        if (allData['2024']) {
            initSimulation(allData['2024']);
        }

    } catch (err) {
        console.error("Veri yüklenemedi:", err);
    }
}

function updateKPIs(summary) {
    document.getElementById('kpi-income').innerText = formatCurrency(summary.totalIncome);
    document.getElementById('kpi-occupancy').innerText = '%' + summary.avgOccupancy.toFixed(1);
    document.getElementById('kpi-customers').innerText = summary.totalCustomers.toLocaleString('en-US'); // US locale for commas
    document.getElementById('kpi-price').innerText = formatCurrency(summary.avgPrice);
}

// Reuse helper
function formatCurrency(val) {
    // UPDATED: Now formats as USD
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

async function loadHistoryData(year) {
    // Reuse existing API
    try {
        const res = await fetch(`${API_URL}/data/${year}`);
        const data = await res.json();
        // UPDATED: Charts.js render function will handle currency now if standardized
        renderHistoryCharts(data, year); // Pass Year for context if needed
    } catch (err) {
        console.error("Geçmiş veri yüklenemedi:", err);
    }
}

async function loadSavedScenarios() {
    const list = document.getElementById('saved-scenarios-list');
    try {
        const res = await fetch(`${API_URL}/simulation/list`);
        const scenarios = await res.json();

        if (scenarios.length === 0) {
            list.innerHTML = '<li style="color: #94a3b8; font-size: 13px;">Kayıtlı senaryo yok.</li>';
            return;
        }

        list.innerHTML = '';
        scenarios.forEach(s => {
            const li = document.createElement('li');
            li.style.marginBottom = '8px';
            li.innerHTML = `
                <a href="#" class="scenario-link" 
                   data-inflation="${s.enflasyon_orani}" 
                   data-raise="${s.zam_orani}" 
                   data-occupancy="${s.hedef_doluluk}" 
                   data-margin="${s.onerilen_fiyat}" 
                   style="color: #cbd5e1; text-decoration: none; font-size: 13px; display: flex; align-items: center;">
                   <!-- Custom Icon -->
                   <img src="img/scenario_icon.jpg" alt="Icon" style="width: 16px; height: 16px; margin-right: 8px; border-radius: 3px; opacity: 0.8;">
                   ${s.senaryo_adi}
                </a>
            `;

            // Click Handler to Load Scenario
            li.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                loadScenarioToSimulation(s);
            });

            list.appendChild(li);
        });

    } catch (err) {
        console.error('Senaryolar çekilemedi:', err);
        list.innerHTML = '<li style="color: #ef4444; font-size: 13px;">Liste hatası.</li>';
    }
}

function loadScenarioToSimulation(saved) {
    // 1. Switch to Simulation Tab
    document.querySelector('[data-target="simulation"]').click();

    // 2. Populate Inputs (Waiting for DOM update)
    setTimeout(() => {
        const inputs = {
            inflation: document.getElementById('sim-inflation'),
            raise: document.getElementById('sim-raise'),
            occupancy: document.getElementById('sim-occupancy'),
        };

        if (inputs.inflation) {
            inputs.inflation.value = saved.enflasyon_orani;
            document.getElementById('val-inflation').innerText = saved.enflasyon_orani + '%';
        }
        if (inputs.raise) {
            inputs.raise.value = saved.zam_orani;
            document.getElementById('val-raise').innerText = saved.zam_orani + '%';
        }
        if (inputs.occupancy) {
            inputs.occupancy.value = saved.hedef_doluluk;
            document.getElementById('val-occupancy').innerText = saved.hedef_doluluk + '%';
        }

        // Trigger Simulation Run if function exists
        if (typeof runSimulation === 'function') {
            // Trigger input events to update state
            if (inputs.inflation) inputs.inflation.dispatchEvent(new Event('input'));
            if (inputs.raise) inputs.raise.dispatchEvent(new Event('input'));
            if (inputs.occupancy) inputs.occupancy.dispatchEvent(new Event('input'));
        }

        console.log(`Loaded scenario: ${saved.senaryo_adi}`);

    }, 200);
}
