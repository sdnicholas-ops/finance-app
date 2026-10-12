import type { Quote, HistoryPoint, CompanyProfile, TimeWindow } from '../types/finance';
import { getTimeWindowConfig } from '../types/finance';
import { CACHE_TTL, API_RETRY } from '../config/tickers';
import { cache } from './cache';

export interface FinanceApi {
  getQuotes(tickers: string[]): Promise<Quote[]>;
  getHistory(ticker: string, range: TimeWindow): Promise<HistoryPoint[]>;
  getProfile(ticker: string): Promise<CompanyProfile>;
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  attempts: number = API_RETRY.attempts,
  baseDelay: number = API_RETRY.baseDelay
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) throw error;
    await new Promise((r) => setTimeout(r, baseDelay));
    return fetchWithRetry(fn, attempts - 1, baseDelay * 2);
  }
}

function transformYahooQuote(raw: any): Quote {
  return {
    symbol: raw.symbol,
    shortName: raw.shortName || raw.longName || raw.symbol,
    regularMarketPrice: raw.regularMarketPrice?.raw ?? raw.regularMarketPrice ?? 0,
    regularMarketChange: raw.regularMarketChange?.raw ?? raw.regularMarketChange ?? 0,
    regularMarketChangePercent:
      raw.regularMarketChangePercent?.raw ?? raw.regularMarketChangePercent ?? 0,
    currency: raw.currency || 'USD',
    marketState: raw.marketState || 'CLOSED',
    regularMarketTime: raw.regularMarketTime,
  };
}

function transformYahooHistory(raw: any): HistoryPoint[] {
  const timestamps = raw.timestamp || [];
  const quotes = raw.indicators?.quote?.[0] || {};
  const closes = quotes.close || [];
  const volumes = quotes.volume || [];

  return timestamps.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    close: closes[i] ?? 0,
    volume: volumes[i] ?? 0,
  }));
}

function transformYahooProfile(raw: any): CompanyProfile {
  return {
    symbol: raw.symbol,
    shortName: raw.shortName || raw.longName || raw.symbol,
    longName: raw.longName || raw.shortName || raw.symbol,
    sector: raw.sector || 'N/A',
    industry: raw.industry || 'N/A',
    website: raw.website || '',
    logoUrl: raw.logo_url,
    currency: raw.currency || 'USD',
    exchange: raw.exchange || 'N/A',
  };
}

export const realFinanceApi: FinanceApi = {
  async getQuotes(tickers: string[]): Promise<Quote[]> {
    const cacheKey = `quotes:${tickers.sort().join(',')}`;
    const cached = cache.get<Quote[]>(cacheKey);
    if (cached) return cached;

    const yahooFinance = (await import('yahoo-finance2')).default;

    const result = await fetchWithRetry(async () => {
      const quotePromises = tickers.map((t) =>
        yahooFinance.quoteSummary(t, { modules: ['price'] })
      );
      const quotes = await Promise.all(quotePromises);
      return quotes.map(transformYahooQuote);
    });

    cache.set(cacheKey, result, CACHE_TTL.quote);
    return result;
  },

  async getHistory(ticker: string, window: TimeWindow): Promise<HistoryPoint[]> {
    const config = getTimeWindowConfig(window);
    const cacheKey = `history:${ticker}:${window}`;
    const cached = cache.get<HistoryPoint[]>(cacheKey);
    if (cached) return cached;

    const yahooFinance = (await import('yahoo-finance2')).default;

    const result = await fetchWithRetry(async () => {
      const chart = await yahooFinance.chart(ticker, {
        period1: Math.floor(Date.now() / 1000) - 86400 * 90,
        period2: Math.floor(Date.now() / 1000),
        interval: config.interval,
      });
      return transformYahooHistory(chart);
    });

    cache.set(cacheKey, result, CACHE_TTL.history);
    return result;
  },

  async getProfile(ticker: string): Promise<CompanyProfile> {
    const cacheKey = `profile:${ticker}`;
    const cached = cache.get<CompanyProfile>(cacheKey);
    if (cached) return cached;

    const yahooFinance = (await import('yahoo-finance2')).default;

    const result = await fetchWithRetry(async () => {
      const summary = await yahooFinance.quoteSummary(ticker, { modules: ['assetProfile'] });
      return transformYahooProfile(summary.assetProfile || {});
    });

    cache.set(cacheKey, result, CACHE_TTL.history);
    return result;
  },
};