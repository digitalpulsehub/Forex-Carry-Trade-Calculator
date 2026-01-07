let chartInstance = null;

function updateProjectionChart(dailyProfit, currencyCode) {
    const ctx = document.getElementById('carryChart').getContext('2d');
    
    // Proiezione su 12 mesi (30 giorni l'uno)
    const labels = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"];
    const data = labels.map((_, i) => (dailyProfit * 30 * (i + 1)).toFixed(2));

    if (chartInstance) {
        chartInstance.destroy(); // Distrugge il vecchio grafico prima di crearne uno nuovo
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Cumulative Profit (${currencyCode})`,
                data: data,
                borderColor: '#00f2ff',
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: '#30363d' },
                    ticks: { color: '#7d8590', font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#7d8590' }
                }
            }
        }
    });
}
