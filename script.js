const API_URL = 'https://api.frankfurter.dev/v1';
let timerSeconds = 30;

const G20_DATA = [
    { country: "USA", code: "USD", rate: 5.50 },
    { country: "Eurozone", code: "EUR", rate: 4.50 },
    { country: "Japan", code: "JPY", rate: 0.10 },
    { country: "UK", code: "GBP", rate: 5.25 },
    { country: "Australia", code: "AUD", rate: 4.35 },
    { country: "Canada", code: "CAD", rate: 5.00 },
    { country: "Switzerland", code: "CHF", rate: 1.75 }
];

const App = {
    async init() {
        this.setupListeners();
        this.renderG20();
        await this.loadCurrencies();
        this.updateData();
        this.startTimers();
    },

    setupListeners() {
        document.getElementById('update-btn').onclick = () => this.updateData();
        
        // INTERCETTA F5
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                console.log("F5 Intercepted: Updating data...");
                this.updateData();
            }
        });
    },

    async loadCurrencies() {
        const res = await fetch(`${API_URL}/currencies`);
        const data = await res.json();
        const bSelect = document.getElementById('base-curr');
        const qSelect = document.getElementById('quote-curr');
        
        Object.keys(data).forEach(code => {
            bSelect.add(new Option(code, code));
            qSelect.add(new Option(code, code));
        });
        bSelect.value = 'USD'; qSelect.value = 'JPY';
    },

    async updateData() {
        const base = document.getElementById('base-curr').value;
        const quote = document.getElementById('quote-curr').value;
        const size = parseFloat(document.getElementById('pos-size').value);
        const lRate = parseFloat(document.getElementById('l-rate').value) / 100;
        const sRate = parseFloat(document.getElementById('s-rate').value) / 100;

        try {
            const res = await fetch(`${API_URL}/latest?base=${base}&symbols=${quote}`);
            const data = await res.json();
            const rate = data.rates[quote];

            document.getElementById('live-price').innerText = rate.toFixed(4);
            
            // Calcolo Carry (Swap)
            const annualInterest = size * (lRate - sRate);
            const dailyInterest = annualInterest / 365;

            document.getElementById('daily-earn').innerText = `${dailyInterest.toFixed(2)} ${base}`;
            document.getElementById('annual-earn').innerText = `${annualInterest.toFixed(2)} ${base}`;

            // Update Chart
            updateProjectionChart(dailyInterest, base);
            
            // Reset Timer
            timerSeconds = 30;
        } catch (err) {
            console.error("API Error:", err);
        }
    },

    renderG20() {
        const tbody = document.getElementById('g20-body');
        tbody.innerHTML = G20_DATA.map(i => `
            <tr><td>${i.country}</td><td>${i.code}</td><td style="color:#00f2ff">${i.rate}%</td></tr>
        `).join('');
    },

    startTimers() {
        setInterval(() => {
            document.getElementById('clock').innerText = new Date().toLocaleTimeString('en-US', { hour12: false });
        }, 1000);

        setInterval(() => {
            timerSeconds--;
            document.getElementById('timer').innerText = timerSeconds;
            if (timerSeconds <= 0) {
                this.updateData();
                timerSeconds = 30;
            }
        }, 1000);
    }
};

window.onload = () => App.init();
