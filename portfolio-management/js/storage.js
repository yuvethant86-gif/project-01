(function (global) {
  const STORAGE_KEY = 'portfolioDemoStateV1';

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function ensureStorageAvailable() {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  function validateState(rawState) {
    if (!rawState || typeof rawState !== 'object') {
      return false;
    }

    if (!Array.isArray(rawState.holdings) || !Array.isArray(rawState.transactions)) {
      return false;
    }

    return Number.isFinite(Number(rawState.initialBalance)) && Number.isFinite(Number(rawState.cashBalance));
  }

  function loadPortfolioState() {
    if (!ensureStorageAvailable()) {
      return deepClone(global.PortfolioData.DEFAULT_PORTFOLIO_STATE);
    }

    try {
      const savedState = window.localStorage.getItem(STORAGE_KEY);
      if (!savedState) {
        return deepClone(global.PortfolioData.DEFAULT_PORTFOLIO_STATE);
      }

      const parsed = JSON.parse(savedState);
      return validateState(parsed) ? parsed : deepClone(global.PortfolioData.DEFAULT_PORTFOLIO_STATE);
    } catch (error) {
      return deepClone(global.PortfolioData.DEFAULT_PORTFOLIO_STATE);
    }
  }

  function savePortfolioState(state) {
    if (!ensureStorageAvailable()) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetPortfolioState() {
    const resetState = deepClone(global.PortfolioData.DEFAULT_PORTFOLIO_STATE);
    savePortfolioState(resetState);
    return resetState;
  }

  const api = {
    STORAGE_KEY,
    loadPortfolioState,
    savePortfolioState,
    resetPortfolioState
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.PortfolioStorage = api;
})(typeof window !== 'undefined' ? window : globalThis);
