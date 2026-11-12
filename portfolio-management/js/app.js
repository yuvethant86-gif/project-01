(function () {
  const dataApi = window.PortfolioData;
  const storageApi = window.PortfolioStorage;
  const logicApi = window.PortfolioLogic;

  let portfolioState = storageApi.loadPortfolioState();
  let chartInstance = null;
  let performanceChartInstance = null;

  function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast-message ' + (type || 'success');
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2500);
  }

  function setSection(sectionName) {
    document.querySelectorAll('.nav-link').forEach((button) => {
      const isActive = button.dataset.section === sectionName;
      button.classList.toggle('active', isActive);
    });

    document.querySelectorAll('.page-section').forEach((section) => {
      section.classList.toggle('active', section.id === sectionName);
    });
  }

  function renderStats() {
    const metrics = logicApi.calculatePortfolioMetrics(portfolioState);
    const cards = [
      {
        title: 'Total portfolio value',
        value: logicApi.formatCurrency(metrics.portfolioValue),
        trend: 'Includes cash and holdings',
        type: 'positive'
      },
      {
        title: 'Available cash',
        value: logicApi.formatCurrency(portfolioState.cashBalance),
        trend: 'Ready for new buys',
        type: 'positive'
      },
      {
        title: 'Total invested',
        value: logicApi.formatCurrency(metrics.investedAmount),
        trend: 'Cost basis of holdings',
        type: 'muted'
      },
      {
        title: 'P/L',
        value: logicApi.formatCurrency(metrics.unrealizedProfitLoss),
        trend: 'Unrealized gain/loss',
        detail: `Realized ${logicApi.formatCurrency(metrics.realizedProfitLoss)}`,
        type: metrics.unrealizedProfitLoss >= 0 ? 'positive' : 'negative'
      }
    ];

    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = cards
      .map((card) => {
        const trendClass = card.type === 'positive' || card.type === 'negative' ? ' ' + card.type : '';
        return `
          <div class="kpi-card${card.type === 'muted' ? ' muted' : ''}">
            <div class="kpi-top">
              <span>${card.title}</span>
              <span class="icon-badge"><i class="bi bi-currency-rupee"></i></span>
            </div>
            <div class="kpi-value">${card.value}</div>
            <div class="kpi-trend${trendClass}">${card.trend}</div>
            ${card.detail ? `<div class="kpi-detail">${card.detail}</div>` : ''}
          </div>
        `;
      })
      .join('');
  }

  function renderPerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) {
      return;
    }

    if (performanceChartInstance) {
      performanceChartInstance.destroy();
      performanceChartInstance = null;
    }

    const holdings = portfolioState.holdings;
    if (!holdings.length) {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    performanceChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: holdings.map((holding) => holding.symbol),
        datasets: [
          {
            label: 'Remaining cost basis',
            data: holdings.map((holding) => Number(holding.costBasis || 0)),
            backgroundColor: 'rgba(104, 166, 255, 0.72)',
            borderRadius: 5,
            barPercentage: 0.62,
            categoryPercentage: 0.72
          },
          {
            label: 'Sample market value',
            data: holdings.map((holding) => logicApi.getCurrentMarketValue(holding)),
            backgroundColor: 'rgba(146, 114, 255, 0.82)',
            borderRadius: 5,
            barPercentage: 0.62,
            categoryPercentage: 0.72
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#aab6c9', usePointStyle: true, pointStyle: 'circle', boxWidth: 7, boxHeight: 7, padding: 18, font: { size: 10 } }
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.dataset.label}: ${logicApi.formatCurrency(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#8290a6', font: { size: 10 } },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(159, 177, 204, 0.09)' },
            ticks: {
              color: '#8290a6',
              font: { size: 9 },
              callback(value) { return logicApi.formatCurrency(value); }
            },
            border: { display: false }
          }
        }
      }
    });
  }

  function renderChart() {
    const holdings = portfolioState.holdings;
    const chartCanvas = document.getElementById('portfolioChart');
    const allocationList = document.getElementById('allocationList');

    if (!chartCanvas) {
      return;
    }

    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    if (!holdings.length) {
      allocationList.innerHTML = '<p class="empty-state">No holdings yet. Start with a stock purchase to see your portfolio allocation.</p>';
      const ctx = chartCanvas.getContext('2d');
      ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
      return;
    }

    const metrics = logicApi.calculatePortfolioMetrics(portfolioState);
    const total = metrics.currentMarketValue || 1;
    const palette = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#f59e0b', '#34d399'];

    const labels = holdings.map((holding) => holding.symbol);
    const values = holdings.map((holding) => Number((logicApi.getCurrentMarketValue(holding) || 0).toFixed(2)));
    const segments = holdings.map((holding, index) => {
      const marketValue = logicApi.getCurrentMarketValue(holding);
      const share = total ? ((marketValue / total) * 100) : 0;
      return `
        <div class="allocation-row">
          <span class="symbol-pill" style="background:${hexToRgba(palette[index % palette.length], 0.22)}; border-color:${hexToRgba(palette[index % palette.length], 0.5)}; color:${palette[index % palette.length]};">${holding.symbol}</span>
          <div class="allocation-bar-wrap">
            <div class="allocation-bar" style="width:${Math.max(share, 6)}%; background:${palette[index % palette.length]};"></div>
          </div>
          <strong>${share.toFixed(0)}%</strong>
        </div>
      `;
    }).join('');

    allocationList.innerHTML = segments;

    chartInstance = new Chart(chartCanvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: palette,
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.label}: ${logicApi.formatCurrency(context.parsed)}`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  function hexToRgba(hex, alpha) {
    const normalizedHex = hex.replace('#', '');
    const bigint = parseInt(normalizedHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function renderRecentTransactions() {
    const recent = logicApi.getRecentTransactions(portfolioState, 5);
    const list = document.getElementById('recentTransactions');

    if (!recent.length) {
      list.innerHTML = '<p class="empty-state">No transactions yet. Your recent activity will appear here.</p>';
      return;
    }

    list.innerHTML = recent.map((transaction) => `
      <div class="recent-item">
        <div>
          <strong>${transaction.company}</strong>
          <small>${formatDate(transaction.date)}</small>
        </div>
        <span class="badge ${transaction.type.toLowerCase()}">${transaction.type}</span>
      </div>
    `).join('');
  }

  function renderBalance() {
    document.getElementById('initialBalanceValue').textContent = logicApi.formatCurrency(portfolioState.initialBalance);
    document.getElementById('cashBalanceValue').textContent = logicApi.formatCurrency(portfolioState.cashBalance);
    document.getElementById('totalSpentValue').textContent = logicApi.formatCurrency(portfolioState.totalSpent || 0);
    document.getElementById('totalReceivedValue').textContent = logicApi.formatCurrency(portfolioState.totalReceived || 0);
  }

  function renderRecommendations() {
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    const cards = dataApi.SAMPLE_STOCKS.map((stock) => `
      <article class="recommendation-card">
        <div class="rec-header">
          <div>
            <div class="rec-company">${stock.company}</div>
          </div>
          <span class="rec-symbol">${stock.symbol}</span>
        </div>

        <div class="rec-price">${logicApi.formatCurrency(stock.price)}</div>

        <div class="rec-meta">
          <span>Sample price</span>
          <span class="recommendation-tag ${stock.recommendation.toLowerCase()}">${stock.recommendation}</span>
        </div>

        <p class="rec-description">${stock.explanation}</p>

        <div class="rec-actions">
          <button class="btn btn-secondary" type="button" data-details-symbol="${stock.symbol}">View details</button>
          <button class="btn btn-primary" type="button" data-buy-symbol="${stock.symbol}">Simulate buy</button>
        </div>
      </article>
    `).join('');

    recommendationsGrid.innerHTML = cards;

    recommendationsGrid.querySelectorAll('[data-buy-symbol]').forEach((button) => {
      button.addEventListener('click', () => {
        setSection('trades');
        setTradeMode('buy');
        const buySelect = document.getElementById('buyStockSelect');
        buySelect.value = button.dataset.buySymbol;
        updateBuyPreview();
      });
    });

    recommendationsGrid.querySelectorAll('[data-details-symbol]').forEach((button) => {
      button.addEventListener('click', () => showRecommendationDetails(button.dataset.detailsSymbol));
    });
  }

  function showRecommendationDetails(symbol) {
    const stock = logicApi.getStockBySymbol(symbol);
    if (!stock) {
      return;
    }

    document.getElementById('recommendationModalTitle').textContent = `${stock.company} (${stock.symbol})`;
    document.getElementById('recommendationModalBody').innerHTML = `
      <div class="modal-stock-price">${logicApi.formatCurrency(stock.price)} <span>Illustrative sample price</span></div>
      <p>${stock.explanation}</p>
      <p class="modal-disclaimer">Predefined educational example only. This is not financial advice, and the sample price is not a live quote.</p>
    `;
    document.getElementById('modalBuyButton').dataset.buySymbol = stock.symbol;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('recommendationModal')).show();
  }

  function renderHoldingsTable() {
    const tableBody = document.getElementById('holdingsTableBody');
    const searchInput = document.getElementById('holdingsSearch');
    const sortSelect = document.getElementById('holdingsSort');
    const filteredHoldings = logicApi.sortHoldings(
      portfolioState.holdings.filter((holding) => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
          return true;
        }
        return holding.company.toLowerCase().includes(query) || holding.symbol.toLowerCase().includes(query);
      }),
      sortSelect.value
    );

    if (!filteredHoldings.length) {
      tableBody.innerHTML = '<tr><td colspan="10"><p class="empty-state">No holdings found. Purchase a stock to begin your simulated portfolio.</p></td></tr>';
      return;
    }

    tableBody.innerHTML = filteredHoldings.map((holding) => {
      const stock = logicApi.getStockBySymbol(holding.symbol);
      const currentPrice = stock ? stock.price : 0;
      const marketValue = logicApi.getCurrentMarketValue(holding);
      const pnl = marketValue - Number(holding.costBasis || 0);
      const pnlPercent = Number(holding.costBasis || 0) ? (pnl / Number(holding.costBasis || 0)) * 100 : 0;

      return `
        <tr>
          <td>
            <div class="stock-name">
              <strong>${holding.company}</strong>
            </div>
          </td>
          <td>${holding.symbol}</td>
          <td>${logicApi.formatNumber(holding.shares)}</td>
          <td>${logicApi.formatCurrency(holding.avgCost)}</td>
          <td>${logicApi.formatCurrency(currentPrice)}</td>
          <td>${logicApi.formatCurrency(holding.costBasis)}</td>
          <td>${logicApi.formatCurrency(marketValue)}</td>
          <td class="${pnl >= 0 ? 'positive' : 'negative'}">${logicApi.formatCurrency(pnl)}</td>
          <td class="${pnlPercent >= 0 ? 'positive' : 'negative'}">${pnlPercent.toFixed(2)}%</td>
          <td><button class="sell-action" type="button" data-sell-symbol="${holding.symbol}">Sell</button></td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('[data-sell-symbol]').forEach((button) => {
      button.addEventListener('click', () => {
        setSection('trades');
        setTradeMode('sell');
        document.getElementById('sellStockSelect').value = button.dataset.sellSymbol;
        updateSellPreview();
      });
    });
  }

  function renderTransactions() {
    const tableBody = document.getElementById('transactionTableBody');
    const query = document.getElementById('transactionSearch').value.trim().toLowerCase();
    const typeFilter = document.getElementById('transactionTypeFilter').value;
    const filteredTransactions = portfolioState.transactions.filter((transaction) => {
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      const matchesQuery = !query ||
        transaction.company.toLowerCase().includes(query) ||
        transaction.symbol.toLowerCase().includes(query);
      return matchesType && matchesQuery;
    });

    if (!filteredTransactions.length) {
      tableBody.innerHTML = '<tr><td colspan="7"><p class="empty-state">No transactions found.</p></td></tr>';
      return;
    }

    tableBody.innerHTML = filteredTransactions.map((transaction) => `
      <tr>
        <td>${formatDate(transaction.date)}</td>
        <td>${transaction.company}</td>
        <td>${transaction.symbol}</td>
        <td><span class="badge ${transaction.type.toLowerCase()}">${transaction.type}</span></td>
        <td>${logicApi.formatNumber(transaction.quantity)}</td>
        <td>${logicApi.formatCurrency(transaction.price)}</td>
        <td>${logicApi.formatCurrency(transaction.amount)}</td>
      </tr>
    `).join('');
  }

  function renderTradeForms() {
    const buySelect = document.getElementById('buyStockSelect');
    const sellSelect = document.getElementById('sellStockSelect');
    const buyQuantityInput = document.getElementById('buyQuantity');
    const sellQuantityInput = document.getElementById('sellQuantity');

    buyQuantityInput.value = '';
    sellQuantityInput.value = '';

    buySelect.innerHTML = dataApi.SAMPLE_STOCKS.map((stock) => `
      <option value="${stock.symbol}">${stock.company} (${stock.symbol})</option>
    `).join('');

    const sellOptions = portfolioState.holdings.map((holding) => `
      <option value="${holding.symbol}">${holding.company} (${holding.symbol})</option>
    `).join('');

    sellSelect.innerHTML = sellOptions || '<option value="">No holdings available</option>';

    if (!portfolioState.holdings.length) {
      document.getElementById('sellPriceValue').textContent = logicApi.formatCurrency(0);
      document.getElementById('sellTotalValue').textContent = logicApi.formatCurrency(0);
    }

    if (buySelect.options.length) {
      buySelect.value = 'TCS';
    }

    if (sellSelect.options.length) {
      sellSelect.value = sellSelect.options[0].value;
    }

    document.getElementById('buyCashValue').textContent = logicApi.formatCurrency(portfolioState.cashBalance);
    document.getElementById('sellCashValue').textContent = logicApi.formatCurrency(portfolioState.cashBalance);
    updateBuyPreview();
    updateSellPreview();
  }

  function setTradeMode(mode) {
    const isBuy = mode === 'buy';
    document.querySelectorAll('[data-trade-tab]').forEach((tab) => {
      const active = tab.dataset.tradeTab === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    document.querySelector('.trade-buy').classList.toggle('trade-active', isBuy);
    document.querySelector('.trade-sell').classList.toggle('trade-active', !isBuy);
  }

  function closeMobileSidebar() {
    document.getElementById('appSidebar').classList.remove('mobile-open');
    document.getElementById('drawerBackdrop').classList.remove('visible');
    document.getElementById('mobileSidebarToggle').setAttribute('aria-expanded', 'false');
  }

  function updateBuyPreview() {
    const buySelect = document.getElementById('buyStockSelect');
    const quantityInput = document.getElementById('buyQuantity');
    const stock = logicApi.getStockBySymbol(buySelect.value);
    const quantity = Number(quantityInput.value || 0);

    document.getElementById('buyPriceValue').textContent = stock ? logicApi.formatCurrency(stock.price) : logicApi.formatCurrency(0);
    document.getElementById('buyTotalValue').textContent = stock && quantity > 0
      ? logicApi.formatCurrency(stock.price * quantity)
      : logicApi.formatCurrency(0);
  }

  function updateSellPreview() {
    const sellSelect = document.getElementById('sellStockSelect');
    const quantityInput = document.getElementById('sellQuantity');
    const stock = logicApi.getStockBySymbol(sellSelect.value);
    const holding = portfolioState.holdings.find((item) => item.symbol === sellSelect.value);
    const quantity = Number(quantityInput.value || 0);

    document.getElementById('sellPriceValue').textContent = stock ? logicApi.formatCurrency(stock.price) : logicApi.formatCurrency(0);
    document.getElementById('sellTotalValue').textContent = stock && quantity > 0
      ? logicApi.formatCurrency(stock.price * quantity)
      : logicApi.formatCurrency(0);

    if (!holding) {
      document.getElementById('sellPriceValue').textContent = logicApi.formatCurrency(0);
      document.getElementById('sellTotalValue').textContent = logicApi.formatCurrency(0);
    }
  }

  function setFormMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) {
      return;
    }
    element.textContent = message || '';
    element.className = 'form-message ' + (type || '');
  }

  function handleBuySubmit(event) {
    event.preventDefault();

    const buySelect = document.getElementById('buyStockSelect');
    const quantityInput = document.getElementById('buyQuantity');
    const quantity = Number(quantityInput.value);
    const result = logicApi.buyStock(portfolioState, buySelect.value, quantity);

    if (!result.ok) {
      setFormMessage('buyMessage', result.message, 'error');
      showToast(result.message, 'error');
      return;
    }

    storageApi.savePortfolioState(portfolioState);
    renderApp();
    setFormMessage('buyMessage', result.message, 'success');
    quantityInput.value = '';
    showToast(result.message, 'success');
  }

  function handleSellSubmit(event) {
    event.preventDefault();

    const sellSelect = document.getElementById('sellStockSelect');
    const quantityInput = document.getElementById('sellQuantity');
    const quantity = Number(quantityInput.value);
    const result = logicApi.sellStock(portfolioState, sellSelect.value, quantity);

    if (!result.ok) {
      setFormMessage('sellMessage', result.message, 'error');
      showToast(result.message, 'error');
      return;
    }

    storageApi.savePortfolioState(portfolioState);
    renderApp();
    setFormMessage('sellMessage', result.message, 'success');
    quantityInput.value = '';
    showToast(result.message, 'success');
  }

  function formatDate(value) {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function handleResetDemo() {
    const confirmed = window.confirm('Reset the demo portfolio to the original sample data?');
    if (!confirmed) {
      return;
    }

    portfolioState = storageApi.resetPortfolioState();
    renderApp();
    showToast('Demo data restored successfully.', 'success');
  }

  function attachBindings() {
    document.querySelectorAll('.nav-link').forEach((button) => {
      button.addEventListener('click', () => {
        setSection(button.dataset.section);
        closeMobileSidebar();
      });
    });

    document.getElementById('buyStockSelect').addEventListener('change', updateBuyPreview);
    document.getElementById('buyQuantity').addEventListener('input', updateBuyPreview);
    document.getElementById('buyForm').addEventListener('submit', handleBuySubmit);

    document.getElementById('sellStockSelect').addEventListener('change', updateSellPreview);
    document.getElementById('sellQuantity').addEventListener('input', updateSellPreview);
    document.getElementById('sellForm').addEventListener('submit', handleSellSubmit);

    document.getElementById('quickBuyBtn').addEventListener('click', () => {
      setSection('trades');
      setTradeMode('buy');
      document.getElementById('buyStockSelect').focus();
    });

    document.getElementById('quickSellBtn').addEventListener('click', () => {
      setSection('trades');
      setTradeMode('sell');
      document.getElementById('sellStockSelect').focus();
    });

    document.getElementById('holdingsSearch').addEventListener('input', renderHoldingsTable);
    document.getElementById('holdingsSort').addEventListener('change', renderHoldingsTable);
    document.getElementById('transactionSearch').addEventListener('input', renderTransactions);
    document.getElementById('transactionTypeFilter').addEventListener('change', renderTransactions);
    document.getElementById('resetDemoBtn').addEventListener('click', handleResetDemo);

    document.querySelectorAll('[data-trade-tab]').forEach((tab) => {
      tab.addEventListener('click', () => setTradeMode(tab.dataset.tradeTab));
    });

    document.getElementById('modalBuyButton').addEventListener('click', (event) => {
      const symbol = event.currentTarget.dataset.buySymbol;
      bootstrap.Modal.getOrCreateInstance(document.getElementById('recommendationModal')).hide();
      setSection('trades');
      setTradeMode('buy');
      document.getElementById('buyStockSelect').value = symbol;
      updateBuyPreview();
    });

    document.getElementById('desktopSidebarToggle').addEventListener('click', () => {
      const collapsed = document.body.classList.toggle('sidebar-collapsed');
      document.getElementById('desktopSidebarToggle').setAttribute('aria-expanded', String(!collapsed));
    });

    document.getElementById('mobileSidebarToggle').addEventListener('click', () => {
      const sidebar = document.getElementById('appSidebar');
      const isOpen = sidebar.classList.toggle('mobile-open');
      document.getElementById('drawerBackdrop').classList.toggle('visible', isOpen);
      document.getElementById('mobileSidebarToggle').setAttribute('aria-expanded', String(isOpen));
    });
    document.getElementById('drawerBackdrop').addEventListener('click', closeMobileSidebar);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMobileSidebar();
      }
    });
  }

  function renderApp() {
    renderStats();
    renderPerformanceChart();
    renderChart();
    renderBalance();
    renderRecentTransactions();
    renderRecommendations();
    renderHoldingsTable();
    renderTransactions();
    renderTradeForms();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentDate').textContent = new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());
    attachBindings();
    renderApp();
    setSection('dashboard');
  });
})();
