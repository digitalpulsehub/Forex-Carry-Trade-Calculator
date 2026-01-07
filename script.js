// Aggiungi questo oggetto all'inizio del file script.js
const g20Rates = [
    { country: "United States", code: "USD", rate: 5.50 },
    { country: "Euro Area", code: "EUR", rate: 4.50 },
    { country: "Japan", code: "JPY", rate: 0.10 },
    { country: "United Kingdom", code: "GBP", rate: 5.25 },
    { country: "Australia", code: "AUD", rate: 4.35 },
    { country: "Canada", code: "CAD", rate: 5.00 },
    { country: "Switzerland", code: "CHF", rate: 1.75 },
    { country: "Brazil", code: "BRL", rate: 11.25 },
    { country: "Turkey", code: "TRY", rate: 45.00 },
    { country: "India", code: "INR", rate: 6.50 },
    { country: "China", code: "CNY", rate: 3.45 },
    { country: "South Africa", code: "ZAR", rate: 8.25 }
];

// Modifica la funzione App.init per includere il rendering della tabella
const App = {
    async init() {
        this.bindEvents();
        this.renderG20Table(); // Nuova funzione
        await this.populateCurrencies();
        this.startClock();
        this.updateData();
        this.startTimer();
    },

    renderG20Table() {
        const tbody = document.getElementById('g20-body');
        g20Rates.forEach(item => {
            const row = `<tr>
                <td>${item.country}</td>
                <td><strong>${item.code}</strong></td>
                <td style="color: #00ff9d">${item.rate.toFixed(2)}%</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    },
    
    // ... restanti funzioni (updateData, startTimer, etc.) rimangono le stesse
};
