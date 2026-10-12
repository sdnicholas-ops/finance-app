import type { Quote, HistoryPoint, CompanyProfile, TimeWindow, FinanceApi } from '../types/finance';
import { MOCK_MODE, CACHE_TTL } from '../config/tickers';
import { cache } from './cache';
import { mockQuotes, mockHistory, mockProfiles } from './mock-data';

// Mock implementation - used by default for workshop
const mockFinanceApi: FinanceApi = {
  async getQuotes(tickers: string[]): Promise<Quote[]> {
    const cacheKey = `quotes:${tickers.sort().join(',')}`;
    const cached = cache.get<Quote[]>(cacheKey);
    if (cached) return cached;

    const result = tickers.map((t) => mockQuotes[t]).filter(Boolean);
    cache.set(cacheKey, result, CACHE_TTL.quote);
    return result;
  },

  async getHistory(ticker: string, window: TimeWindow): Promise<HistoryPoint[]> {
    const cacheKey = `history:${ticker}:${window}`;
    const cached = cache.get<HistoryPoint[]>(cacheKey);
    if (cached) return cached;

    const result = mockHistory[ticker]?.[window] || [];
    cache.set(cacheKey, result, CACHE_TTL.history);
    return result;
  },

  async getProfile(ticker: string): Promise<CompanyProfile> {
    const cacheKey = `profile:${ticker}`;
    const cached = cache.get<CompanyProfile>(cacheKey);
    if (cached) return cached;

    const result = mockProfiles[ticker] || {
      symbol: ticker,
      shortName: ticker,
      longName: ticker,
      sector: 'N/A',
      industry: 'N/A',
      website: '',
      currency: 'USD',
      exchange: 'N/A',
    };
    cache.set(cacheKey, result, CACHE_TTL.history);
    return result;
  },
};

// Lazy-load real implementation only when needed
let realApiPromise: Promise<FinanceApi> | null = null;

async function getRealApi(): Promise<FinanceApi> {
  if (!realApiPromise) {
    realApiPromise = import('./finance-api.real').then((m) => m.realFinanceApi);
  }
  return realApiPromise;
}

export const financeApi: FinanceApi = {
  async getQuotes(tickers: string[]) {
    if (MOCK_MODE) return mockFinanceApi.getQuotes(tickers);
    const api = await getRealApi();
    return api.getQuotes(tickers);
  },

  async getHistory(ticker: string, window: TimeWindow) {
    if (MOCK_MODE) return mockFinanceApi.getHistory(ticker, window);
    const api = await getRealApi();
    return api.getHistory(ticker, window);
  },

  async getProfile(ticker: string) {
    if (MOCK_MODE) return mockFinanceApi.getProfile(ticker);
    const api = await getRealApi();
    return api.getProfile(ticker);
  },
};