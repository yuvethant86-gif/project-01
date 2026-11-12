# Portfolio Management Web Application

A responsive stock portfolio management prototype built with HTML5, CSS3, Bootstrap 5, and vanilla JavaScript.

## Project structure

```text
portfolio-management/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── data.js
│   ├── portfolio.js
│   └── storage.js
└── README.md
```

## Run locally in VS Code

1. Open this folder in VS Code.
2. Install the Live Server extension if it is not already installed.
3. Right-click `index.html` and choose "Open with Live Server".
4. The portfolio dashboard will open in the browser.

## Features included

- Dashboard with KPI cards, holdings-versus-cost comparison, allocation chart, and recent activity
- Collapsible desktop sidebar and mobile slide-out navigation
- Available balance section with spend and sales totals
- Holdings table with search and sort controls
- Buy and sell stock forms with validation and transaction tabs
- Top recommendation cards with sample stock data, details, and simulated buy action
- Searchable and filterable transaction history
- Local Storage persistence and reset demo data flow
- Responsive sidebar layout for desktop and mobile views

## Main calculations

- Total portfolio value = available cash + current market value of holdings
- Total invested amount = remaining cost basis of active positions
- Unrealized P/L = current market value - remaining cost basis
- Realized P/L = cumulative profit or loss from completed simulated sales
- Weighted average purchase price is used when buying the same stock multiple times

## Validation performed

The following scenarios were checked during implementation:

- Initial balance is ₹50,000 with the expected sample holdings.
- Purchase flow deducts the correct amount from cash and updates holdings.
- Insufficient balance validation blocks invalid purchases.
- Selling shares updates remaining quantity and cash balance correctly.
- Selling more than owned is rejected.
- Portfolio state persists across refreshes using Local Storage.
- Reset demo data restores the original sample portfolio.

## Limitations

- This is a simulated educational front-end prototype only.
- No real-time market data or brokerage connection is included.
- All stock prices and recommendations are illustrative sample values.
