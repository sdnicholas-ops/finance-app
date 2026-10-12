import type { Quote, HistoryPoint, CompanySnapshot, ChartSeries, TimeWindow } from '../types/finance';
import { getTickerConfig, getColorForIndex } from '../config/tickers';

export function normalizeQuote(raw: any): Quote {
  return {
    symbol: raw.symbol,
    shortName: raw.shortName || raw.longName || raw.symbol,
    regularMarketPrice: Number(raw.regularMarketPrice?.raw ?? raw.regularMarketPrice ?? 0),
    regularMarketChange: Number(raw.regularMarketChange?.raw ?? raw.regularMarketChange ?? 0),
    regularMarketChangePercent:
      Number(raw.regularMarketChangePercent?.raw ?? raw.regularMarketChangePercent ?? 0),
    currency: raw.currency || 'USD',
    marketState: raw.marketState || 'CLOSED',
    regularMarketTime: raw.regularMarketTime,
  };
}

export function alignHistoryToWindow(
  history: HistoryPoint[],
  window: TimeWindow
): HistoryPoint[] {
  const now = new Date();
  let cutoff: Date;

  switch (window) {
    case '1D':
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7D':
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '1Q':
      cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
  }

  return history
    .filter((point) => new Date(point.date) >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function buildChartSeries(
  snapshots: Map<string, CompanySnapshot>,
  window: TimeWindow
): ChartSeries[] {
  const series: ChartSeries[] = [];
  let index = 0;

  for (const [symbol, snapshot] of snapshots.entries()) {
    const config = getTickerConfig(symbol);
    const alignedHistory = alignHistoryToWindow(snapshot.history, window);

    series.push({
      name: config?.name || symbol,
      symbol,
      color: config?.color || getColorForIndex(index),
      data: alignedHistory.map((point) => ({
        date: point.date,
        close: point.close,
      })),
    });
    index++;
  }

  return series;
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

export function formatChangePercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
  return volume.toString();
}

export function getChangeClass(change: number): string {
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
}

export function calculatePeriodChange(history: HistoryPoint[]): { change: number; changePercent: number } {
  if (history.length < 2) return { change: 0, changePercent: 0 };
  const first = history[0].close;
  const last = history[history.length - 1].close;
  const change = last - first;
  const changePercent = first !== 0 ? (change / first) * 100 : 0;
  return { change, changePercent };
}