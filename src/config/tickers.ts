import { TimeWindow } from '../types/finance';

export interface TickerConfig {
  symbol: string;
  name: string;
  color: string;
  isPrimary: boolean;
}

export const DEFAULT_TICKERS: TickerConfig[] = [
  { symbol: 'IBM', name: 'IBM', color: '#0066cc', isPrimary: true },
  { symbol: 'MSFT', name: 'Microsoft', color: '#0078d4', isPrimary: false },
  { symbol: 'ORCL', name: 'Oracle', color: '#c41e3a', isPrimary: false },
  { symbol: 'SAP', name: 'SAP', color: '#009de0', isPrimary: false },
  { symbol: 'CRM', name: 'Salesforce', color: '#ff4b2b', isPrimary: false },
];

export const PRIMARY_TICKER = 'IBM';

export function getTickerConfig(symbol: string): TickerConfig | undefined {
  return DEFAULT_TICKERS.find((t) => t.symbol === symbol.toUpperCase());
}

export function getDefaultSymbols(): string[] {
  return DEFAULT_TICKERS.map((t) => t.symbol);
}

export function getPrimaryColor(): string {
  return DEFAULT_TICKERS.find((t) => t.isPrimary)?.color ?? '#0066cc';
}

export const CHART_COLORS = [
  '#0066cc', // IBM
  '#0078d4', // MSFT
  '#c41e3a', // ORCL
  '#009de0', // SAP
  '#ff4b2b', // CRM
  '#7c5cd8', // extra
  '#2da44e', // extra
  '#e8a838', // extra
];

export function getColorForIndex(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export const MOCK_MODE = import.meta.env.VITE_MOCK_FINANCE === 'true';

export const CACHE_TTL = {
  quote: 30_000, // 30 seconds
  history: 300_000, // 5 minutes
};

export const API_RETRY = {
  attempts: 3,
  baseDelay: 1000,
};

export type { TimeWindow };