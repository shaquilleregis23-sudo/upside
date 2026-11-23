# Upside

Mobile web app that ranks 24 stocks/ETFs and 10 coins by a trend gate plus 3/6/12-month momentum divided by volatility, then splits your budget into picks.

- `index.html`: the whole app. Scoring runs in the browser.
- `data.json`: daily closes, refreshed hourly by `.github/workflows/refresh-data.yml` using `scripts/build-data.mjs` (Yahoo Finance chart API).

Screener only, not financial advice.
