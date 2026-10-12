// Express proxy server — serves Yahoo Finance data on port 3001
// Vite dev server proxies /api/finance/* to http://localhost:3001/*
'use strict';

const express = require('express');

const app = express();
const PORT = 3001;

// Dynamically import yahoo-finance2 (ESM package)
async function getYF() {
  const mod = await import('yahoo-finance2');
  return mod.default;
}

// GET /quotes?symbols=IBM,AAPL,...
app.get('/quotes', async (req, res) => {
  try {
    const symbols = String(req.query.symbols || '').split(',').filter(Boolean);
    if (!symbols.length) return res.status(400).json({ error: 'symbols query param required' });

    const yf = await getYF();
    const results = await Promise.all(
      symbols.map((s) => yf.quoteSummary(s, { modules: ['price'] }))
    );

    const quotes = results.map((r) => {
      const p = r.price || {};
      return {
        symbol: p.symbol,
        shortName: p.shortName || p.longName || p.symbol,
        regularMarketPrice: p.regularMarketPrice ?? 0,
        regularMarketChange: p.regularMarketChange ?? 0,
        regularMarketChangePercent: p.regularMarketChangePercent ?? 0,
        currency: p.currency || 'USD',
        marketState: p.marketState || 'CLOSED',
        regularMarketTime: p.regularMarketTime,
      };
    });

    res.json(quotes);
  } catch (err) {
    console.error('[proxy] /quotes error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /history/:ticker?range=1mo
app.get('/history/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const yf = await getYF();
    const chart = await yf.chart(ticker, {
      period1: Math.floor(Date.now() / 1000) - 86400 * 90,
      period2: Math.floor(Date.now() / 1000),
      interval: '1d',
    });

    const timestamps = chart.timestamp || [];
    const closes = chart.indicators?.quote?.[0]?.close || [];
    const volumes = chart.indicators?.quote?.[0]?.volume || [];
    const history = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      close: closes[i] ?? 0,
      volume: volumes[i] ?? 0,
    }));

    res.json(history);
  } catch (err) {
    console.error('[proxy] /history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /profile/:ticker
app.get('/profile/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const yf = await getYF();
    const summary = await yf.quoteSummary(ticker, { modules: ['assetProfile', 'price'] });
    const p = summary.assetProfile || {};
    const price = summary.price || {};

    res.json({
      symbol: ticker,
      shortName: price.shortName || price.longName || ticker,
      longName: price.longName || price.shortName || ticker,
      sector: p.sector || 'N/A',
      industry: p.industry || 'N/A',
      website: p.website || '',
      currency: price.currency || 'USD',
      exchange: price.exchangeName || 'N/A',
    });
  } catch (err) {
    console.error('[proxy] /profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Finance proxy server running on http://localhost:${PORT}`);
});
