(function (global) {
  const SAMPLE_STOCKS = [
    {
      symbol: 'TCS',
      company: 'Tata Consultancy Services',
      price: 3600,
      recommendation: 'Buy',
      explanation: 'Strong digital services demand and stable operational performance make this a resilient long-term holding.'
    },
    {
      symbol: 'INFY',
      company: 'Infosys',
      price: 1550,
      recommendation: 'Hold',
      explanation: 'A well-established IT services company with healthy deal momentum and predictable execution.'
    },
    {
      symbol: 'RELIANCE',
      company: 'Reliance Industries',
      price: 2450,
      recommendation: 'Buy',
      explanation: 'Diversified play across energy, telecom, and retail with a broad growth footprint.'
    },
    {
      symbol: 'HDFCBANK',
      company: 'HDFC Bank',
      price: 1700,
      recommendation: 'Watch',
      explanation: 'A quality lender with a strong retail franchise and solid long-term banking profile.'
    },
    {
      symbol: 'WIPRO',
      company: 'Wipro',
      price: 550,
      recommendation: 'Hold',
      explanation: 'A diversified technology company with moderate risk and steady service revenues.'
    },
    {
      symbol: 'ITC',
      company: 'ITC',
      price: 450,
      recommendation: 'Watch',
      explanation: 'A defensive consumer and tobacco business with stable cash flow and dividend potential.'
    }
  ];

  const INITIAL_BALANCE = 50000;

  const DEFAULT_PORTFOLIO_STATE = {
    initialBalance: INITIAL_BALANCE,
    cashBalance: 25000,
    totalSpent: 25000,
    totalReceived: 0,
    holdings: [
      {
        symbol: 'TCS',
        company: 'Tata Consultancy Services',
        shares: 5,
        avgCost: 3500,
        costBasis: 17500
      },
      {
        symbol: 'INFY',
        company: 'Infosys',
        shares: 5,
        avgCost: 1500,
        costBasis: 7500
      }
    ],
    transactions: [
      {
        id: 'seed-buy-tcs',
        type: 'BUY',
        symbol: 'TCS',
        company: 'Tata Consultancy Services',
        quantity: 5,
        price: 3500,
        amount: 17500,
        date: '2025-06-01T09:00:00.000Z'
      },
      {
        id: 'seed-buy-infy',
        type: 'BUY',
        symbol: 'INFY',
        company: 'Infosys',
        quantity: 5,
        price: 1500,
        amount: 7500,
        date: '2025-06-02T09:30:00.000Z'
      }
    ]
  };

  const api = {
    SAMPLE_STOCKS,
    INITIAL_BALANCE,
    DEFAULT_PORTFOLIO_STATE
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.PortfolioData = api;
})(typeof window !== 'undefined' ? window : globalThis);
