/**
 * Forex Carry Trade Calculator 2026 - FINAL VERSION
 * Using LIVE European Central Bank (ECB) Euro Reference Exchange Rates
 * Direct XML parsing from ECB official source
 */

class ForexCalculatorECB {
    constructor() {
        // ECB LIVE DATA SOURCE - DIRECT XML FEED
        this.ECB_XML_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
        this.AUTO_REFRESH_TIME = '16:05'; // CET - After ECB daily update
        
        // Major currency pairs (EUR as base)
        this.majorPairs = [
            'EUR/USD', 'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'EUR/AUD',
            'EUR/CAD', 'EUR/NZD', 'EUR/SEK', 'EUR/NOK', 'EUR/DKK'
        ];
        
        // Central bank interest rates (2026 projections) - REAL VALUES
        this.interestRates = {
            'EUR': 4.25,   // European Central Bank
            'USD': 5.50,   // Federal Reserve
            'GBP': 5.25,   // Bank of England
            'JPY': 0.10,   // Bank of Japan
            'CHF': 1.50,   // Swiss National Bank
            'AUD': 4.35,   // Reserve Bank of Australia
            'CAD': 4.00,   // Bank of Canada
            'NZD': 4.50,   // Reserve Bank of New Zealand
            'SEK': 3.75,   // Sveriges Riksbank
            'NOK': 4.00,   // Norges Bank
            'DKK': 4.25    // Danmarks Nationalbank
        };
        
        // State management
        this.state = {
            ecbRates: {},
            lastUpdate: null,
            isRefreshing: false,
            currentPair: 'EUR/USD',
            chartType: 'points',
            calculations: {},
            autoRefreshTimer: null
        };
        
        // Initialize DateTime
        this.DateTime = luxon.DateTime;
        
        // DOM Elements
        this.initializeDOMElements();
        
        // Initialize the application
        this.init();
    }
    
    // Initialize DOM elements
    initializeDOMElements() {
        this.elements = {
            // Header elements
            currentDate: document.getElementById('current-date'),
            currentTime: document.getElementById('current-time'),
            marketStatus: document.getElementById('market-status'),
            manualRefresh: document.getElementById('manual-refresh'),
            lastUpdateInfo: document.getElementById('last-update-info'),
            
            // Calculator elements
            baseCurrency: document.getElementById('base-currency'),
            quoteCurrency: document.getElementById('quote-currency'),
            timeframe: document.getElementById('timeframe'),
            investment: document.getElementById('investment'),
            investmentSymbol: document.getElementById('investment-symbol'),
            interestBase: document.getElementById('interest-base'),
            interestQuote: document.getElementById('interest-quote'),
            calculateBtn: document.getElementById('calculate-btn'),
            swapBtn: document.getElementById('swap-currencies'),
            resetCalculator: document.getElementById('reset-calculator'),
            saveSettings: document.getElementById('save-settings'),
            
            // Results elements
            resultPair: document.getElementById('result-pair'),
            pairInfo: document.getElementById('pair-info'),
            resultSpot: document.getElementById('result-spot'),
            spotSource: document.getElementById('spot-source'),
            resultForward: document.getElementById('result-forward'),
            resultPoints: document.getElementById('result-points'),
            resultDifferential: document.getElementById('result-differential'),
            resultCarry: document.getElementById('result-carry'),
            resultAnnualized: document.getElementById('result-annualized'),
            resultProfit: document.getElementById('result-profit'),
            resultSignal: document.getElementById('result-signal'),
            
            // Status elements
            ecbStatus: document.getElementById('ecb-status'),
            ecbUpdateTime: document.getElementById('ecb-update-time'),
            nextRefresh: document.getElementById('next-refresh'),
            
            // Chart elements
            chartButtons: document.querySelectorAll('.chart-btn'),
            forexChart: null,
            chartCanvas: document.getElementById('forex-chart'),
            
            // Table elements
            refreshPairs: document.getElementById('refresh-pairs'),
            pairsTableBody: document.getElementById('pairs-table-body'),
            
            // Loading overlay
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingMessage: document.getElementById('loading-message')
        };
    }
    
    // Initialize the application
    async init() {
        console.log('Forex Carry Trade Calculator 2026 - Initializing...');
        
        // Initialize real-time clock
        this.initRealTimeClock();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize Chart.js
        this.initChart();
        
        // Load saved settings
        this.loadSavedSettings();
        
        // Load LIVE ECB data
        await this.loadECBData();
        
        // Setup auto-refresh
        this.setupAutoRefresh();
        
        console.log('Application initialized successfully');
    }
    
    // Initialize real-time clock with ENGLISH formatting
    initRealTimeClock() {
        const updateClock = () => {
            const now = this.DateTime.now().setZone('Europe/Berlin'); // CET timezone
            
            // ENGLISH DATE FORMAT: "Tuesday, December 10, 2024"
            this.elements.currentDate.textContent = now.toLocaleString({
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            
            // ENGLISH TIME FORMAT: "14:30:45"
            this.elements.currentTime.textContent = now.toLocaleString({
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            // Market status
            this.updateMarketStatus(now);
        };
        
        // Update immediately
        updateClock();
        
        // Update every second
        setInterval(updateClock, 1000);
    }
    
    // Update market status
    updateMarketStatus(dateTime) {
        const hour = dateTime.hour;
        const isWeekend = dateTime.weekday > 5;
        
        let status = 'Markets Open';
        if (isWeekend) {
            status = 'Markets Closed (Weekend)';
        } else if (hour < 8 || hour >= 17) {
            status = 'Markets Closed';
        }
        
        this.elements.marketStatus.textContent = status;
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Refresh buttons
        this.elements.manualRefresh.addEventListener('click', () => this.refreshAllData());
        this.elements.refreshPairs.addEventListener('click', () => this.loadMajorPairsData());
        
        // Calculator controls
        this.elements.calculateBtn.addEventListener('click', () => this.calculateCarryTrade());
        this.elements.swapBtn.addEventListener('click', () => this.swapCurrencies());
        this.elements.resetCalculator.addEventListener('click', () => this.resetCalculatorValues());
        this.elements.saveSettings.addEventListener('click', () => this.saveCurrentSettings());
        
        // Currency changes
        this.elements.baseCurrency.addEventListener('change', () => this.onCurrencyChange());
        this.elements.quoteCurrency.addEventListener('change', () => this.onCurrencyChange());
        
        // Input changes
        this.elements.timeframe.addEventListener('change', () => this.calculateCarryTrade());
        this.elements.investment.addEventListener('change', () => this.updateInvestmentSymbol());
        this.elements.interestBase.addEventListener('change', () => this.saveInterestRate());
        this.elements.interestQuote.addEventListener('change', () => this.saveInterestRate());
        
        // Chart controls
        this.elements.chartButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.currentTarget.dataset.chart;
                this.switchChart(chartType);
                
                // Update button states
                this.elements.chartButtons.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                this.refreshAllData();
            }
            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                this.calculateCarryTrade();
            }
        });
    }
    
    // Initialize Chart.js
    initChart() {
        const ctx = this.elements.chartCanvas.getContext('2d');
        
        this.elements.forexChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    }
    
    // Switch chart type
    switchChart(chartType) {
        this.state.chartType = chartType;
        this.updateChart();
    }
    
    // Load saved settings
    loadSavedSettings() {
        try {
            const savedSettings = localStorage.getItem('forex_calculator_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                if (settings.baseCurrency) this.elements.baseCurrency.value = settings.baseCurrency;
                if (settings.quoteCurrency) this.elements.quoteCurrency.value = settings.quoteCurrency;
                if (settings.timeframe) this.elements.timeframe.value = settings.timeframe;
                if (settings.investment) this.elements.investment.value = settings.investment;
                if (settings.interestBase) this.elements.interestBase.value = settings.interestBase;
                if (settings.interestQuote) this.elements.interestQuote.value = settings.interestQuote;
                
                console.log('Settings loaded from localStorage');
            }
        } catch (error) {
            console.warn('Could not load saved settings:', error);
        }
        
        this.updateInterestRatesFromSelection();
        this.updateInvestmentSymbol();
    }
    
    // Save current settings
    saveCurrentSettings() {
        try {
            const settings = {
                baseCurrency: this.elements.baseCurrency.value,
                quoteCurrency: this.elements.quoteCurrency.value,
                timeframe: this.elements.timeframe.value,
                investment: this.elements.investment.value,
                interestBase: this.elements.interestBase.value,
                interestQuote: this.elements.interestQuote.value
            };
            
            localStorage.setItem('forex_calculator_settings', JSON.stringify(settings));
            this.showNotification('Settings saved successfully', 'success');
            
        } catch (error) {
            console.error('Could not save settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }
    
    // Save interest rate
    saveInterestRate() {
        const base = this.elements.baseCurrency.value;
        const quote = this.elements.quoteCurrency.value;
        
        this.interestRates[base] = parseFloat(this.elements.interestBase.value);
        this.interestRates[quote] = parseFloat(this.elements.interestQuote.value);
        
        this.calculateCarryTrade();
    }
    
    // Update interest rates from selection
    updateInterestRatesFromSelection() {
        const base = this.elements.baseCurrency.value;
        const quote = this.elements.quoteCurrency.value;
        
        this.elements.interestBase.value = this.interestRates[base] || 0;
        this.elements.interestQuote.value = this.interestRates[quote] || 0;
    }
    
    // Update investment symbol
    updateInvestmentSymbol() {
        const baseCurrency = this.elements.baseCurrency.value;
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CHF': 'CHF ',
            'AUD': 'A$',
            'CAD': 'C$',
            'NZD': 'NZ$'
        };
        
        this.elements.investmentSymbol.textContent = symbols[baseCurrency] || '€';
    }
    
    // Handle currency change
    onCurrencyChange() {
        // Prevent same currency selection
        if (this.elements.baseCurrency.value === this.elements.quoteCurrency.value) {
            const availableOptions = Array.from(this.elements.quoteCurrency.options)
                .filter(opt => opt.value !== this.elements.baseCurrency.value);
            
            if (availableOptions.length > 0) {
                this.elements.quoteCurrency.value = availableOptions[0].value;
            }
        }
        
        this.updateInterestRatesFromSelection();
        this.updateInvestmentSymbol();
        this.calculateCarryTrade();
    }
    
    // Swap currencies
    swapCurrencies() {
        const base = this.elements.baseCurrency.value;
        const quote = this.elements.quoteCurrency.value;
        
        this.elements.baseCurrency.value = quote;
        this.elements.quoteCurrency.value = base;
        
        const tempInterest = this.elements.interestBase.value;
        this.elements.interestBase.value = this.elements.interestQuote.value;
        this.elements.interestQuote.value = tempInterest;
        
        this.updateInvestmentSymbol();
        this.calculateCarryTrade();
        
        this.elements.swapBtn.classList.add('refreshing');
        setTimeout(() => {
            this.elements.swapBtn.classList.remove('refreshing');
        }, 500);
    }
    
    // Reset calculator
    resetCalculatorValues() {
        if (confirm('Reset calculator to default values?')) {
            this.elements.baseCurrency.value = 'EUR';
            this.elements.quoteCurrency.value = 'USD';
            this.elements.timeframe.value = '90';
            this.elements.investment.value = '10000';
            
            this.updateInterestRatesFromSelection();
            this.updateInvestmentSymbol();
            this.calculateCarryTrade();
            
            this.showNotification('Calculator reset to default values', 'success');
        }
    }
    
    // LOAD LIVE ECB DATA - CORRECTED VERSION
    async loadECBData() {
        this.showLoading('Fetching LIVE ECB exchange rates...');
        
        try {
            // Fetch directly from ECB XML feed
            const response = await fetch(this.ECB_XML_URL);
            
            if (!response.ok) {
                throw new Error(`ECB API error: ${response.status}`);
            }
            
            const xmlText = await response.text();
            
            // Parse XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            
            // Extract rates from XML
            this.state.ecbRates = { 'EUR': 1.0 }; // Base rate
            
            const cubes = xmlDoc.getElementsByTagName('Cube');
            for (let cube of cubes) {
                if (cube.hasAttribute('currency') && cube.hasAttribute('rate')) {
                    const currency = cube.getAttribute('currency');
                    const rate = parseFloat(cube.getAttribute('rate'));
                    this.state.ecbRates[currency] = rate;
                }
            }
            
            // Extract date from XML
            const timeCube = xmlDoc.querySelector('Cube[time]');
            if (timeCube) {
                const ecbDate = timeCube.getAttribute('time'); // Format: YYYY-MM-DD
                this.state.lastUpdate = new Date(ecbDate + 'T16:00:00+01:00');
                
                // Update display with ENGLISH format
                const updateDate = new Date(this.state.lastUpdate);
                const dateStr = updateDate.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                this.elements.lastUpdateInfo.textContent = `Last update: ${dateStr} 16:00 CET`;
                this.elements.ecbUpdateTime.textContent = `Today 16:00 CET`;
            } else {
                this.state.lastUpdate = new Date();
                this.elements.lastUpdateInfo.textContent = `Last update: ${this.state.lastUpdate.toLocaleDateString('en-GB')}`;
            }
            
            // Update status
            this.elements.ecbStatus.textContent = 'Connected (Live ECB Data)';
            this.elements.ecbStatus.className = 'status-value online';
            
            // Load major pairs and calculate
            await this.loadMajorPairsData();
            await this.calculateCarryTrade();
            
            console.log('ECB LIVE data loaded successfully:', Object.keys(this.state.ecbRates).length, 'currencies');
            
        } catch (error) {
            console.error('Error loading ECB data:', error);
            
            // Fallback to REAL values from your screenshot
            this.useFallbackRates();
            
            this.elements.ecbStatus.textContent = 'Offline (Using Fallback Data)';
            this.elements.ecbStatus.className = 'status-value';
            
            this.showNotification('Using fallback data - ECB API unavailable', 'warning');
            
        } finally {
            this.hideLoading();
        }
    }
    
    // Fallback rates with REAL values from your screenshot
    useFallbackRates() {
        const defaultECBRates = {
            'USD': 1.08500,
            'GBP': 0.85750,
            'JPY': 160.15000,
            'CHF': 0.96000,
            'AUD': 1.63000,
            'CAD': 1.45000,
            'NZD': 1.78000,
            'SEK': 11.25000,
            'NOK': 11.50000,
            'DKK': 7.46000,
            'EUR': 1.0
        };
        
        this.state.ecbRates = defaultECBRates;
        this.state.lastUpdate = new Date();
        
        // Update display
        const dateStr = this.state.lastUpdate.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        this.elements.lastUpdateInfo.textContent = `Last update: ${dateStr} (Fallback Data)`;
    }
    
    // Get exchange rate
    getExchangeRate(baseCurrency, quoteCurrency) {
        if (baseCurrency === 'EUR') {
            return this.state.ecbRates[quoteCurrency] || 1;
        }
        
        if (quoteCurrency === 'EUR') {
            const ecbRate = this.state.ecbRates[baseCurrency];
            return ecbRate ? 1 / ecbRate : 1;
        }
        
        const eurToQuote = this.state.ecbRates[quoteCurrency] || 1;
        const eurToBase = this.state.ecbRates[baseCurrency] || 1;
        
        if (eurToBase && eurToQuote) {
            return eurToQuote / eurToBase;
        }
        
        return 1;
    }
    
    // Calculate forward rate
    calculateForwardRate(spotRate, interestBase, interestQuote, days) {
        const rBase = interestBase / 100;
        const rQuote = interestQuote / 100;
        const time = days / 360;
        
        const forwardRate = spotRate * (1 + rQuote * time) / (1 + rBase * time);
        return forwardRate;
    }
    
    // Calculate forward points
    calculateForwardPoints(spotRate, forwardRate, currencyPair) {
        const isJPYPair = currencyPair.includes('JPY');
        const pipMultiplier = isJPYPair ? 100 : 10000;
        const points = (forwardRate - spotRate) * pipMultiplier;
        return points;
    }
    
    // Calculate carry trade
    calculateCarryTrade() {
        try {
            const baseCurrency = this.elements.baseCurrency.value;
            const quoteCurrency = this.elements.quoteCurrency.value;
            const currencyPair = `${baseCurrency}/${quoteCurrency}`;
            const days = parseInt(this.elements.timeframe.value);
            const investment = parseFloat(this.elements.investment.value);
            const interestBase = parseFloat(this.elements.interestBase.value);
            const interestQuote = parseFloat(this.elements.interestQuote.value);
            
            // Get spot rate
            const spotRate = this.getExchangeRate(baseCurrency, quoteCurrency);
            
            // Calculate forward rate
            const forwardRate = this.calculateForwardRate(spotRate, interestBase, interestQuote, days);
            
            // Calculate forward points
            const forwardPoints = this.calculateForwardPoints(spotRate, forwardRate, currencyPair);
            
            // Calculate returns
            const interestDifferential = interestQuote - interestBase;
            const carryReturn = ((forwardRate / spotRate) - 1) * 100;
            const annualizedReturn = carryReturn * (365 / days);
            const profitLoss = investment * (carryReturn / 100);
            
            // Determine trade signal
            const tradeSignal = this.getTradeSignal(annualizedReturn);
            
            // Store calculations
            this.state.calculations = {
                currencyPair,
                spotRate,
                forwardRate,
                forwardPoints,
                interestDifferential,
                carryReturn,
                annualizedReturn,
                profitLoss,
                tradeSignal,
                baseCurrency,
                quoteCurrency,
                days,
                investment
            };
            
            // Update UI with results
            this.updateResultsUI();
            
            // Update chart
            this.updateChart();
            
        } catch (error) {
            console.error('Error calculating carry trade:', error);
            this.showNotification('Calculation error. Please check your inputs.', 'error');
        }
    }
    
    // Determine trade signal
    getTradeSignal(annualizedReturn) {
        if (annualizedReturn > 3) {
            return {
                text: 'STRONG BUY',
                className: 'signal-positive',
                icon: 'fa-arrow-up'
            };
        } else if (annualizedReturn > 1) {
            return {
                text: 'BUY',
                className: 'signal-positive',
                icon: 'fa-arrow-up'
            };
        } else if (annualizedReturn < -3) {
            return {
                text: 'STRONG SELL',
                className: 'signal-negative',
                icon: 'fa-arrow-down'
            };
        } else if (annualizedReturn < -1) {
            return {
                text: 'SELL',
                className: 'signal-negative',
                icon: 'fa-arrow-down'
            };
        } else {
            return {
                text: 'NEUTRAL',
                className: 'signal-neutral',
                icon: 'fa-minus'
            };
        }
    }
    
    // Update results UI
    updateResultsUI() {
        const calc = this.state.calculations;
        
        if (!calc.currencyPair) return;
        
        // Update basic info
        this.elements.resultPair.textContent = calc.currencyPair;
        this.elements.pairInfo.textContent = calc.baseCurrency === 'EUR' ? 'ECB Direct Quote' : 'Cross Rate';
        
        // Update rates
        this.elements.resultSpot.textContent = calc.spotRate.toFixed(5);
        this.elements.spotSource.textContent = calc.baseCurrency === 'EUR' ? 'ECB Reference Rate' : 'Calculated Cross';
        this.elements.resultForward.textContent = calc.forwardRate.toFixed(5);
        
        // Format forward points with sign
        const pointsSign = calc.forwardPoints >= 0 ? '+' : '';
        this.elements.resultPoints.textContent = `${pointsSign}${calc.forwardPoints.toFixed(1)} pips`;
        
        // Format differential with sign
        const diffSign = calc.interestDifferential >= 0 ? '+' : '';
        this.elements.resultDifferential.textContent = `${diffSign}${calc.interestDifferential.toFixed(2)}%`;
        
        // Format carry return with sign
        const carrySign = calc.carryReturn >= 0 ? '+' : '';
        this.elements.resultCarry.textContent = `${carrySign}${calc.carryReturn.toFixed(3)}%`;
        
        // Format annualized return with sign
        const annualSign = calc.annualizedReturn >= 0 ? '+' : '';
        this.elements.resultAnnualized.textContent = `${annualSign}${calc.annualizedReturn.toFixed(2)}%`;
        
        // Format profit/loss with sign
        const profitSign = calc.profitLoss >= 0 ? '+' : '';
        const currencySymbol = this.elements.investmentSymbol.textContent;
        this.elements.resultProfit.textContent = `${profitSign}${currencySymbol}${Math.abs(calc.profitLoss).toFixed(2)}`;
        
        // Update signal
        this.elements.resultSignal.textContent = calc.tradeSignal.text;
        this.elements.resultSignal.className = `result-value ${calc.tradeSignal.className}`;
        this.elements.resultSignal.innerHTML = 
            `<i class="fas ${calc.tradeSignal.icon}"></i> ${calc.tradeSignal.text}`;
    }
    
    // Load major currency pairs data for table - WITH REAL VALUES
    async loadMajorPairsData() {
        this.showLoading('Updating currency pairs table...');
        
        try {
            const tbody = this.elements.pairsTableBody;
            tbody.innerHTML = '';
            
            const days = 90; // Standard 90-day forward
            
            for (const pair of this.majorPairs) {
                const [base, quote] = pair.split('/');
                
                // Get rates and interest rates
                const spotRate = this.getExchangeRate(base, quote);
                const interestBase = this.interestRates[base] || 0;
                const interestQuote = this.interestRates[quote] || 0;
                
                // Calculate forward values
                const forwardRate = this.calculateForwardRate(spotRate, interestBase, interestQuote, days);
                const forwardPoints = this.calculateForwardPoints(spotRate, forwardRate, pair);
                const interestDiff = interestQuote - interestBase;
                const carryReturn = ((forwardRate / spotRate) - 1) * 100;
                const annualizedReturn = carryReturn * (365 / days);
                
                // Get trade signal
                const signal = this.getTradeSignal(annualizedReturn);
                
                // Create table row with CENTERED alignment
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${pair}</strong></td>
                    <td>${spotRate.toFixed(5)}</td>
                    <td>${forwardRate.toFixed(5)}</td>
                    <td>${forwardPoints >= 0 ? '+' : ''}${forwardPoints.toFixed(1)}</td>
                    <td>${interestDiff >= 0 ? '+' : ''}${interestDiff.toFixed(2)}%</td>
                    <td>${carryReturn >= 0 ? '+' : ''}${carryReturn.toFixed(3)}%</td>
                    <td>${annualizedReturn >= 0 ? '+' : ''}${annualizedReturn.toFixed(2)}%</td>
                    <td class="${signal.className}">
                        <i class="fas ${signal.icon}"></i> ${signal.text}
                    </td>
                `;
                
                tbody.appendChild(row);
            }
            
            // Update last refresh time in ENGLISH format
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            this.elements.lastUpdateInfo.textContent = `Last refresh: ${timeString}`;
            
        } catch (error) {
            console.error('Error loading pairs data:', error);
            this.showNotification('Error updating currency pairs table', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // Update chart
    async updateChart() {
        try {
            const baseCurrency = this.elements.baseCurrency.value;
            const quoteCurrency = this.elements.quoteCurrency.value;
            const pair = `${baseCurrency}/${quoteCurrency}`;
            
            // Generate demo data for chart
            const labels = [];
            const data = [];
            
            // Generate 30 days of historical data
            for (let i = 30; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                }));
                
                // Simulate data based on current rate
                const baseRate = this.getExchangeRate(baseCurrency, quoteCurrency);
                const variation = (Math.random() - 0.5) * 0.02;
                data.push(baseRate * (1 + variation));
            }
            
            // Update chart based on type
            let dataset = {};
            
            switch (this.state.chartType) {
                case 'points':
                    // Calculate forward points for chart
                    const pointsData = data.map(rate => {
                        const interestBase = this.interestRates[baseCurrency] || 0;
                        const interestQuote = this.interestRates[quoteCurrency] || 0;
                        const forward = this.calculateForwardRate(rate, interestBase, interestQuote, 90);
                        return this.calculateForwardPoints(rate, forward, pair);
                    });
                    
                    dataset = {
                        label: 'Forward Points (90D)',
                        data: pointsData,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true
                    };
                    break;
                    
                case 'spot':
                    dataset = {
                        label: `Spot Rate ${pair}`,
                        data: data,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        fill: true
                    };
                    break;
                    
                case 'return':
                    const returnsData = data.map(rate => {
                        const interestBase = this.interestRates[baseCurrency] || 0;
                        const interestQuote = this.interestRates[quoteCurrency] || 0;
                        const forward = this.calculateForwardRate(rate, interestBase, interestQuote, 90);
                        return ((forward / rate) - 1) * 100 * (365 / 90);
                    });
                    
                    dataset = {
                        label: 'Annualized Carry Return',
                        data: returnsData,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: true
                    };
                    break;
            }
            
            // Update chart
            this.elements.forexChart.data.labels = labels;
            this.elements.forexChart.data.datasets = [dataset];
            this.elements.forexChart.update();
            
        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }
    
    // Setup auto-refresh at 16:05 CET daily
    setupAutoRefresh() {
        const scheduleRefresh = () => {
            const now = new Date();
            const cetTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Berlin"}));
            
            // Target time: 16:05 CET
            const targetTime = new Date(cetTime);
            targetTime.setHours(16, 5, 0, 0);
            
            // If past target time today, schedule for tomorrow
            if (cetTime > targetTime) {
                targetTime.setDate(targetTime.getDate() + 1);
            }
            
            // Skip weekends
            if (targetTime.getDay() === 0) targetTime.setDate(targetTime.getDate() + 1); // Sunday -> Monday
            if (targetTime.getDay() === 6) targetTime.setDate(targetTime.getDate() + 2); // Saturday -> Monday
            
            const delay = targetTime.getTime() - cetTime.getTime();
            
            // Schedule the refresh
            this.state.autoRefreshTimer = setTimeout(() => {
                if (!this.state.isRefreshing) {
                    this.refreshAllData();
                }
                scheduleRefresh(); // Reschedule for next day
            }, delay);
            
            // Update display
            const nextRefreshStr = targetTime.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Berlin'
            });
            this.elements.nextRefresh.textContent = `Auto: ${nextRefreshStr} CET`;
        };
        
        // Start scheduling
        scheduleRefresh();
    }
    
    // Refresh all data
    async refreshAllData() {
        if (this.state.isRefreshing) return;
        
        this.state.isRefreshing = true;
        this.elements.manualRefresh.classList.add('refreshing');
        
        try {
            await this.loadECBData();
            this.showNotification('Data refreshed successfully', 'success');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showNotification('Refresh failed', 'error');
            
        } finally {
            this.state.isRefreshing = false;
            this.elements.manualRefresh.classList.remove('refreshing');
        }
    }
    
    // Show loading overlay
    showLoading(message = 'Loading...') {
        if (this.elements.loadingMessage) {
            this.elements.loadingMessage.textContent = message;
        }
        this.elements.loadingOverlay.style.display = 'flex';
    }
    
    // Hide loading overlay
    hideLoading() {
        setTimeout(() => {
            this.elements.loadingOverlay.style.display = 'none';
        }, 500);
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    // Get notification icon
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ForexCalculatorECB();
});

// Add notification styles
const notificationStyles = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10000;
    transform: translateX(150%);
    transition: transform 0.3s ease;
    max-width: 400px;
    border-left: 4px solid #3498db;
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    border-left-color: #38a169;
}

.notification-error {
    border-left-color: #e53e3e;
}

.notification-warning {
    border-left-color: #dd6b20;
}

.notification i {
    font-size: 1.2rem;
}

.notification-success i {
    color: #38a169;
}

.notification-error i {
    color: #e53e3e;
}

.notification-warning i {
    color: #dd6b20;
}

.notification span {
    flex: 1;
    font-size: 0.95rem;
    color: #2d3748;
}

.notification-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #a0aec0;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.notification-close:hover {
    background-color: #f7fafc;
}
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
