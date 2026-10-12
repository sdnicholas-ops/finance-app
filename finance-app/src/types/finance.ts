export interface Quote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  currency: string;
  marketState: 'REGULAR' | 'PRE' | 'POST' | 'CLOSED';
  regularMarketTime?: number;
  // Extended fields shown in the dashboard stats row
  regularMarketOpen?: number;
  regularMarketPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  targetMeanPrice?: number;
}

export interface HistoryPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  close: number;
  volume: number;
  high?: number;
  low?: number;
  open?: number;
}

export interface CompanyProfile {
  symbol: string;
  shortName: string;
  longName: string;
  sector: string;
  industry: string;
  website: string;
  logoUrl?: string;
  currency: string;
  exchange: string;
}

export interface CompanySnapshot {
  quote: Quote;
  history: HistoryPoint[];
  profile?: CompanyProfile;
}

export interface ChartSeries {
  name: string;
  symbol: string;
  color: string;
  data: Array<{ date: string; close: number }>;
}

export type TimeWindow = '1D' | '7D' | '1Q';

export interface TimeWindowConfig {
  id: TimeWindow;
  label: string;
  range: '1d' | '7d' | '3mo';
  interval: '5m' | '1d' | '1d';
}

export const TIME_WINDOWS: TimeWindowConfig[] = [
  { id: '1D', label: 'Current Day', range: '1d', interval: '5m' },
  { id: '7D', label: 'Last 7 Days', range: '7d', interval: '1d' },
  { id: '1Q', label: 'Last Quarter', range: '3mo', interval: '1d' },
];

export function getTimeWindowConfig(window: TimeWindow): TimeWindowConfig {
  return TIME_WINDOWS.find((w) => w.id === window) ?? TIME_WINDOWS[1];
}

export interface FinanceApi {
  getQuotes(tickers: string[]): Promise<Quote[]>;
  getHistory(ticker: string, range: TimeWindow): Promise<HistoryPoint[]>;
  getProfile(ticker: string): Promise<CompanyProfile>;
}