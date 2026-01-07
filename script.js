const API_URL = 'https://api.frankfurter.app';
let countdown = 30;
let timerInterval;

const G20_RATES = [
    { country: "USA", code: "USD", rate: 5.50 },
    { country: "Eurozone", code: "EUR", rate: 4.50 },
    { country: "UK", code: "GBP", rate: 5.25 },
    { country: "Japan", code: "JPY", rate: 0.10 },
    { country: "Australia", code: "AUD", rate: 4.35 },
    { country: "Canada", code: "CAD", rate: 5.00 },
    { country: "Switzerland", code: "CHF", rate: 1.00 },
    { country: "Turkey", code: "TRY", rate: 50.00 }
];

const App = {
    async init() {
        this.cacheDOM();
        this.bindEvents();
        await this.loadCurrencies();
        this.renderG20();
        this.updateData();
        this.startClock();
        this.startAutoRefresh();
    },

    cacheDOM() {
        this.baseSelect = document.getElementById('base-currency');
        this.quoteSelect = document.getElementById('quote-currency');
        this.posSize = document.getElementById('pos-size');
        this.longRateInput = document.getElementById('long-rate-val');
        this.shortRateInput = document.getElementById('short-rate-val');
        this.timerText = document.getElementById('timer-display');
        this.liveRateText = document.getElementById('live-rate-display');
    },

    bindEvents() {
        document.getElementById('refresh-btn').onclick = () => this.updateData();
        
        // INTERCETTAZIONE F5: Impedisce il reload e aggiorna i dati
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                console.log("F5 Detected - Updating Terminal Data...");
                this.updateData();
            }
        });
    },

    async loadCurrencies() {
        try {
            const res = await fetch(`${API_URL}/currencies`);
            const data = await res.json();
            Object.keys(data).forEach(code => {
                this.baseSelect.add(new Option(code, code));
                this.quoteSelect.add(new Option(code, code));
            });
            this.baseSelect.value = 'USD';
            this.quoteSelect.value = 'JPY';
        } catch (err) { console.error("Currency Load Error", err); }
    },

    async updateData() {
        const base = this.baseSelect.value;
        const quote = this.quoteSelect.value;
        const size = parseFloat(this.posSize.value);
        const lRate = parseFloat(this.longRateInput.value) / 100;
        const sRate = parseFloat(this.shortRateInput.value) / 100;

        try {
            const res = await fetch(`${API_URL}/latest?from=${base}&to=${quote}`);
            const data = await res.json();
            const rate = data.rates[quote];

            // Aggiorna UI Prezzo
            this.liveRateText.innerText = rate.toFixed(4);
            document.getElementById('update-date').innerText = `Ref Date: ${data.date} (ECB)`;

            // Calcolo Carry (Risultato in Valuta Base)
            const annual = size * (lRate - sRate);
            const daily = annual / 365;

            document.getElementById('daily-profit').innerText = `${daily.toFixed(2)} ${base}`;
            document.getElementById('annual-profit').innerText = `${annual.toFixed(2)} ${base}`;

            // Aggiorna Grafico (definito in chart.js)
            updateProjectionChart(daily, base);
            
            // Reset Countdown
            countdown = 30;
        } catch (err) { console.error("Rate Fetch Error", err); }
    },

    renderG20() {
        const tbody = document.getElementById('g20-table-body');
        tbody.innerHTML = G20_RATES.map(item => `
            <tr><td>${item.country}</td><td>${item.code}</td><td style="color:var(--accent)">${item.rate.toFixed(2)}%</td></tr>
        `).join('');
    },

    startAutoRefresh() {
        setInterval(() => {
            countdown--;
            this.timerText.innerText = countdown;
            if (countdown <= 0) {
                this.updateData();
                countdown = 30;
            }
        }, 1000);
    },

    startClock() {
        setInterval(() => {
            document.getElementById('current-time').innerText = new Date().toLocaleTimeString();
        }, 1000);
    }
};

window.onload = () => App.init();
