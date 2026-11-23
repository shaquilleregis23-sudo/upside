// Fetches daily price history for the Upside universe from Yahoo Finance
// and writes a compact data.json next to index.html. Runs in GitHub Actions hourly.
import { writeFileSync } from "node:fs";

const STOCKS = [
  ["SPY", "S&P 500 ETF"], ["QQQ", "Nasdaq-100 ETF"], ["IWM", "Russell 2000 ETF"], ["GLD", "Gold ETF"],
  ["AAPL", "Apple"], ["MSFT", "Microsoft"], ["NVDA", "NVIDIA"], ["AMZN", "Amazon"],
  ["GOOGL", "Alphabet"], ["META", "Meta Platforms"], ["TSLA", "Tesla"], ["AVGO", "Broadcom"],
  ["AMD", "AMD"], ["NFLX", "Netflix"], ["COST", "Costco"], ["LLY", "Eli Lilly"],
  ["JPM", "JPMorgan Chase"], ["V", "Visa"], ["PLTR", "Palantir"], ["UBER", "Uber"],
  ["COIN", "Coinbase"], ["SHOP", "Shopify"], ["CRWD", "CrowdStrike"], ["XOM", "ExxonMobil"],
];
const CRYPTO = [
  ["BTC-USD", "Bitcoin"], ["ETH-USD", "Ethereum"], ["SOL-USD", "Solana"], ["XRP-USD", "XRP"],
  ["BNB-USD", "BNB"], ["DOGE-USD", "Dogecoin"], ["ADA-USD", "Cardano"], ["AVAX-USD", "Avalanche"],
  ["LINK-USD", "Chainlink"], ["LTC-USD", "Litecoin"],
];
// Bars kept: 1 year for volatility/chart + the trend window, with a little slack.
const KEEP = { stock: 460, crypto: 420 };

const round = (x) => Number(x.toPrecision(6));

async function history(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (res.ok) {
      const j = await res.json();
      const r = j.chart?.result?.[0];
      const raw = r?.indicators?.adjclose?.[0]?.adjclose ?? r?.indicators?.quote?.[0]?.close ?? [];
      const closes = raw.filter((x) => x != null && x > 0);
      if (!closes.length) throw new Error("no data");
      const price = r.meta?.regularMarketPrice ?? closes.at(-1);
      closes[closes.length - 1] = price;
      return closes;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  throw new Error("fetch failed");
}

const universe = [
  ...STOCKS.map(([s, n]) => ({ s, n, k: "stock" })),
  ...CRYPTO.map(([s, n]) => ({ s, n, k: "crypto" })),
];
const assets = [];
const failed = [];
await Promise.all(universe.map(async (a) => {
  try {
    const c = await history(a.s);
    assets.push({ ...a, c: c.slice(-KEEP[a.k]).map(round) });
  } catch (e) {
    failed.push(a.s);
  }
}));
assets.sort((a, b) => universe.findIndex((u) => u.s === a.s) - universe.findIndex((u) => u.s === b.s));
if (assets.length < universe.length / 2) {
  console.error("Too many failures, keeping old data:", failed);
  process.exit(1);
}
writeFileSync(new URL("../data.json", import.meta.url), JSON.stringify({ updated: new Date().toISOString(), failed, assets }));
console.log(`wrote ${assets.length} assets, failed: ${failed.join(", ") || "none"}`);
