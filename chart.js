let chartInstance = null;

function updateChartProjections(dailyInterest) {
    const ctx = document.getElementById('carryChart').getContext('2d');
    
    // Generate data for 12 months (30 days each)
    const labels = [];
    const dataPoints = [];
    for (let i = 1; i <= 12; i++) {
        labels.push(`Month ${i}`);
        dataPoints.push((dailyInterest * 30 * i).toFixed(2));
    }

    if (chartInstance) {
        chartInstance.data.datasets[0].data = dataPoints;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cumulative Profit',
                    data: dataPoints,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    borderWidth: 3
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
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
}
