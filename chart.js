let myChart;

function initChart() {
    const ctx = document.getElementById('carryChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'],
            datasets: [{
                label: 'Cumulative Interest Earned',
                data: [],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function updateChartData(dailyInterest) {
    if (!myChart) initChart();
    
    const monthlyData = [];
    for (let i = 1; i <= 12; i++) {
        monthlyData.push((dailyInterest * 30 * i).toFixed(2));
    }
    
    myChart.data.datasets[0].data = monthlyData;
    myChart.update();
}

// Inizializza il grafico al caricamento
window.onload = initChart;
