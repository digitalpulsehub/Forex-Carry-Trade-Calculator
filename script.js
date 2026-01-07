const API_URL = 'https://api.frankfurter.dev/v1';
let timeLeft = 30;

const App = {
    async init() {
        this.bindEvents();
        await this.populateCurrencies();
        this.startClock();
        this.updateData();
        this.startTimer();
    },

    bindEvents() {
        document.getElementById('calc-trigger').onclick = () => this.updateData();
        
        // Intercetta F5
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                console.log("F5 Pressed: Updating data...");
                this.updateData();
            }
        });
    },

    async populateCurrencies() {
        const res = await fetch(`${API_URL}/currencies`);
        const data = await res.json();
        const baseSel = document.getElementById('base-curr');
        const quoteSel = document.getElementById('quote-curr');
        
        Object.keys(data).forEach(code => {
            baseSel.add(new Option(code, code));
            quoteSel.add(new Option(code, code));
        });
        
        baseSel.value = 'USD';
        quoteSel.value = 'JPY';
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

            // Aggiorna UI
            document.getElementById('live-price').innerText = rate.toFixed(4);
            document.getElementById('rate-date').innerText = `Source: ECB ${data.date}`;

            // Calcolo Carry (Base Currency)
            const annual = size * (lRate - sRate);
            const daily = annual / 365;

            document.getElementById('d-earn').innerText = `${daily.toFixed(2)} ${base}`;
            document.getElementById('y-earn').innerText = `${annual.toFixed(2)} ${base}`;

            // Aggiorna Grafico
            renderChart(daily, base);
            
            // Reset timer visivo
            timeLeft = 30;
        } catch (err) {
            console.error("API Error:", err);
        }
    },

    startTimer() {
        setInterval(() => {
            timeLeft--;
            document.getElementById('timer').innerText = timeLeft;
            if (timeLeft <= 0) {
                this.updateData();
                timeLeft = 30;
            }
        }, 1000);
    },

    startClock() {
        setInterval(() => {
            document.getElementById('clock').innerText = new Date().toLocaleTimeString();
        }, 1000);
    }
};

window.onload = () => App.init();
