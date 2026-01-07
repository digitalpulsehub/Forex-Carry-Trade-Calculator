let myChart = null;

function updateProjectionChart(dailyInterest, currencySymbol) {
    const ctx = document.getElementById('carryChart').getContext('2d');
    
    // Proiezione su 12 mesi (approssimazione 30gg/mese)
    const labels = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"];
    const projections = labels.map((_, i) => (dailyInterest * 30 * (i + 1)).toFixed(2));

    // Se il grafico esiste già, lo distruggiamo per resettarlo
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Cumulative Earnings (${currencySymbol})`,
                data: projections,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#00d4ff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#848d97', font: { size: 12 } }
                }
            },
            scales: {
                y: {
                    grid: { color: '#2d333b' },
                    ticks: { color: '#848d97' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#848d97' }
                }
            }
        }
    });
}
