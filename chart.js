let fxChart = null;

function renderChart(dailyProfit, currencySymbol) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Genera dati mensili proiettati
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const projection = months.map((_, i) => (dailyProfit * 30 * (i + 1)).toFixed(2));

    if (fxChart) {
        fxChart.destroy();
    }

    fxChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: `Projected Profit (${currencySymbol})`,
                data: projection,
                borderColor: '#00ff9d',
                backgroundColor: 'rgba(0, 255, 157, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00ff9d'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#64748b' } }
            },
            scales: {
                y: {
                    grid: { color: '#1e293b' },
                    ticks: { color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
}
