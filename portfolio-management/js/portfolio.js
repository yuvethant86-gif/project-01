(function (global) {
  function getStockBySymbol(symbol) {
    const data = global.PortfolioData ? global.PortfolioData.SAMPLE_STOCKS : [];
    return data.find((stock) => stock.symbol.toUpperCase() === String(symbol).toUpperCase()) || null;
  }

  function getCurrentMarketValue(holding) {
    const stock = getStockBySymbol(holding.symbol);
    const price = stock ? Number(stock.price) : 0;
    return Number((price * Number(holding.shares || 0)).toFixed(2));
  }

  function calculatePortfolioMetrics(state) {
    const holdings = Array.isArray(state.holdings) ? state.holdings : [];
    const currentMarketValue = holdings.reduce((total, holding) => total + getCurrentMarketValue(holding), 0);
    const investedAmount = holdings.reduce((total, holding) => total + Number(holding.costBasis || 0), 0);
    const portfolioValue = Number(state.cashBalance || 0) + currentMarketValue;
    const unrealizedProfitLoss = Number((currentMarketValue - investedAmount).toFixed(2));
    const realizedProfitLoss = Array.isArray(state.transactions)
      ? state.transactions.reduce((total, transaction) => {
          if (transaction.type === 'SELL') {
            return total + Number(transaction.realizedPnl || 0);
          }
          return total;
        }, 0)
      : 0;

    return {
      portfolioValue: Number(portfolioValue.toFixed(2)),
      investedAmount: Number(investedAmount.toFixed(2)),
      unrealizedProfitLoss: Number(unrealizedProfitLoss.toFixed(2)),
      realizedProfitLoss: Number(realizedProfitLoss.toFixed(2)),
      currentMarketValue: Number(currentMarketValue.toFixed(2))
    };
  }

  function formatCurrency(value) {
    const safeValue = Number(value || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(safeValue);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('en-IN').format(Number(value || 0));
  }

  function buyStock(state, symbol, quantity) {
    const stock = getStockBySymbol(symbol);
    const parsedQuantity = Number(quantity);

    if (!stock) {
      return { ok: false, message: 'Please select a valid stock.' };
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return { ok: false, message: 'Quantity must be a positive whole number.' };
    }

    const totalCost = Number((stock.price * parsedQuantity).toFixed(2));

    if (Number(state.cashBalance) < totalCost) {
      return { ok: false, message: 'Insufficient available balance for this purchase.' };
    }

    state.cashBalance = Number((Number(state.cashBalance) - totalCost).toFixed(2));
    state.totalSpent = Number((Number(state.totalSpent || 0) + totalCost).toFixed(2));

    const existingHolding = state.holdings.find((item) => item.symbol.toUpperCase() === stock.symbol.toUpperCase());

    if (existingHolding) {
      existingHolding.shares += parsedQuantity;
      existingHolding.costBasis = Number((Number(existingHolding.costBasis || 0) + totalCost).toFixed(2));
      existingHolding.avgCost = Number((existingHolding.costBasis / existingHolding.shares).toFixed(2));
    } else {
      state.holdings.push({
        symbol: stock.symbol,
        company: stock.company,
        shares: parsedQuantity,
        avgCost: Number(stock.price),
        costBasis: totalCost
      });
    }

    state.transactions.unshift({
      id: 'buy-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8),
      type: 'BUY',
      symbol: stock.symbol,
      company: stock.company,
      quantity: parsedQuantity,
      price: Number(stock.price),
      amount: totalCost,
      date: new Date().toISOString()
    });

    return { ok: true, message: `Purchased ${parsedQuantity} ${stock.symbol} shares successfully.` };
  }

  function sellStock(state, symbol, quantity) {
    const stock = getStockBySymbol(symbol);
    const parsedQuantity = Number(quantity);

    if (!stock) {
      return { ok: false, message: 'Please select a valid stock.' };
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return { ok: false, message: 'Quantity must be a positive whole number.' };
    }

    const holdingIndex = state.holdings.findIndex((item) => item.symbol.toUpperCase() === stock.symbol.toUpperCase());

    if (holdingIndex === -1) {
      return { ok: false, message: 'You do not currently hold this stock.' };
    }

    const holding = state.holdings[holdingIndex];

    if (parsedQuantity > Number(holding.shares || 0)) {
      return { ok: false, message: 'You cannot sell more shares than you own.' };
    }

    const saleValue = Number((stock.price * parsedQuantity).toFixed(2));
    const costBasisRemoved = Number((Number(holding.avgCost || 0) * parsedQuantity).toFixed(2));
    const realizedPnl = Number((saleValue - costBasisRemoved).toFixed(2));

    state.cashBalance = Number((Number(state.cashBalance || 0) + saleValue).toFixed(2));
    state.totalReceived = Number((Number(state.totalReceived || 0) + saleValue).toFixed(2));

    holding.shares = Number(holding.shares) - parsedQuantity;
    holding.costBasis = Number((Number(holding.costBasis || 0) - costBasisRemoved).toFixed(2));

    if (holding.shares > 0) {
      holding.avgCost = Number((holding.costBasis / holding.shares).toFixed(2));
    } else {
      state.holdings.splice(holdingIndex, 1);
    }

    state.transactions.unshift({
      id: 'sell-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8),
      type: 'SELL',
      symbol: stock.symbol,
      company: stock.company,
      quantity: parsedQuantity,
      price: Number(stock.price),
      amount: saleValue,
      realizedPnl,
      date: new Date().toISOString()
    });

    return { ok: true, message: `Sold ${parsedQuantity} ${stock.symbol} shares successfully.` };
  }

  function sortHoldings(holdings, sortOption) {
    const sorted = [...holdings];

    switch (sortOption) {
      case 'market-desc':
        return sorted.sort((a, b) => getCurrentMarketValue(b) - getCurrentMarketValue(a));
      case 'pnl-desc':
        return sorted.sort((a, b) => {
          const first = getCurrentMarketValue(a) - Number(a.costBasis || 0);
          const second = getCurrentMarketValue(b) - Number(b.costBasis || 0);
          return second - first;
        });
      case 'company-asc':
      default:
        return sorted.sort((a, b) => a.company.localeCompare(b.company));
    }
  }

  function getRecentTransactions(state, count = 5) {
    return Array.isArray(state.transactions) ? state.transactions.slice(0, count) : [];
  }

  const api = {
    getStockBySymbol,
    getCurrentMarketValue,
    calculatePortfolioMetrics,
    formatCurrency,
    formatNumber,
    buyStock,
    sellStock,
    sortHoldings,
    getRecentTransactions
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.PortfolioLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
