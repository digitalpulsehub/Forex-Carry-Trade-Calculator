const API_URL = 'https://api.frankfurter.app';

// Update Time
function updateTime() {
    const now = new Date();
    document.getElementById('datetime').innerText = now.toLocaleString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
}
setInterval(updateTime, 1000);
updateTime();

// Fetch available currencies
async function initCurrencies() {
    try {
        const response = await fetch(`${API_URL}/currencies`);
        const data = await response.json();
        const baseSelect = document.getElementById('base-currency');
        const quoteSelect = document.getElementById('quote-currency');

        Object.keys(data).forEach(code => {
            let opt1 = new Option(`${code} - ${data[code]}`, code);
            let opt2 = new Option(`${code} - ${data[code]}`, code);
            baseSelect.add(opt1);
            quoteSelect.add(opt2);
        });

        // Defaults
        baseSelect.value = 'USD';
        quoteSelect.value = 'JPY';
    } catch (error) {
        console.error("Error fetching currencies:", error);
    }
}

async function calculateCarry() {
    const base = document.getElementById('base-currency').value;
    const quote = document.getElementById('quote-currency').value;
    const size = parseFloat(document.getElementById('position-size').value);
    const longRate = parseFloat(document.getElementById('long-rate').value) / 100;
    const shortRate = parseFloat(document.getElementById('short-rate').value) / 100;

    if (base === quote) {
        alert("Please select two different currencies.");
        return;
    }

    try {
        // Fetch exchange rate
        const response = await fetch(`${API_URL}/latest?from=${base}&to=${quote}`);
        const data = await response.json();
        const rate = data.rates[quote];

        // Carry Trade Formula: (Long Rate - Short Rate) * Position Size / 365
        const annualInterest = size * (longRate - shortRate);
        const dailyInterest = annualInterest / 365;
        const monthlyInterest = annualInterest / 12;

        // Display results
        document.getElementById('daily-res').innerText = `${dailyInterest.toFixed(2)} ${base}`;
        document.getElementById('monthly-res').innerText = `${monthlyInterest.toFixed(2)} ${base}`;
        document.getElementById('annual-res').innerText = `${annualInterest.toFixed(2)} ${base}`;

        // Update Chart
        updateChartData(dailyInterest);

    } catch (error) {
        console.error("Calculation error:", error);
    }
}

document.getElementById('calculate-btn').addEventListener('click', calculateCarry);
initCurrencies();
