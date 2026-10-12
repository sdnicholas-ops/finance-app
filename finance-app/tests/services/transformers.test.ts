import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeQuote,
  formatCurrency,
  formatChange,
  formatChangePercent,
  formatVolume,
  getChangeClass,
  calculatePeriodChange,
  alignHistoryToWindow,
  buildChartSeries,
} from '../../src/services/transformers';
import type { HistoryPoint, CompanySnapshot } from '../../src/types/finance';

// ─── normalizeQuote ─────────────────────────────────────────────────────────

describe('normalizeQuote', () => {
  it('maps flat numeric fields', () => {
    const raw = {
      symbol: 'IBM',
      shortName: 'IBM',
      regularMarketPrice: 185.42,
      regularMarketChange: 2.15,
      regularMarketChangePercent: 1.17,
      currency: 'USD',
      marketState: 'REGULAR',
      regularMarketTime: 1_700_000_000,
    };
    const quote = normalizeQuote(raw);
    expect(quote.symbol).toBe('IBM');
    expect(quote.regularMarketPrice).toBe(185.42);
    expect(quote.regularMarketChange).toBe(2.15);
    expect(quote.currency).toBe('USD');
    expect(quote.marketState).toBe('REGULAR');
    expect(quote.regularMarketTime).toBe(1_700_000_000);
  });

  it('unwraps Yahoo Finance {raw} wrapper objects', () => {
    const raw = {
      symbol: 'IBM',
      shortName: 'IBM',
      regularMarketPrice: { raw: 185.42, fmt: '$185.42' },
      regularMarketChange: { raw: 2.15 },
      regularMarketChangePercent: { raw: 1.17 },
      currency: 'USD',
      marketState: 'REGULAR',
    };
    const quote = normalizeQuote(raw);
    expect(quote.regularMarketPrice).toBe(185.42);
    expect(quote.regularMarketChange).toBe(2.15);
    expect(quote.regularMarketChangePercent).toBe(1.17);
  });

  it('falls back to longName when shortName is absent', () => {
    const raw = {
      symbol: 'IBM',
      longName: 'International Business Machines',
      regularMarketPrice: 100,
      regularMarketChange: 0,
      regularMarketChangePercent: 0,
      currency: 'USD',
      marketState: 'CLOSED',
    };
    expect(normalizeQuote(raw).shortName).toBe('International Business Machines');
  });

  it('falls back to symbol when both name fields are absent', () => {
    const raw = {
      symbol: 'IBM',
      regularMarketPrice: 100,
      regularMarketChange: 0,
      regularMarketChangePercent: 0,
    };
    expect(normalizeQuote(raw).shortName).toBe('IBM');
  });

  it('defaults currency to USD and marketState to CLOSED when absent', () => {
    const raw = { symbol: 'IBM', regularMarketPrice: 0, regularMarketChange: 0, regularMarketChangePercent: 0 };
    const quote = normalizeQuote(raw);
    expect(quote.currency).toBe('USD');
    expect(quote.marketState).toBe('CLOSED');
  });
});

// ─── formatCurrency ─────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats a typical USD value', () => {
    expect(formatCurrency(1_234.56)).toBe('$1,234.56');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats a negative value', () => {
    expect(formatCurrency(-100)).toBe('-$100.00');
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(99.999)).toBe('$100.00');
    expect(formatCurrency(99.994)).toBe('$99.99');
  });
});

// ─── formatChange ───────────────────────────────────────────────────────────

describe('formatChange', () => {
  it('prepends + for positive values', () => {
    expect(formatChange(5.25)).toBe('+5.25');
  });

  it('keeps the - sign for negative values', () => {
    expect(formatChange(-3.14)).toBe('-3.14');
  });

  it('prepends + for zero', () => {
    expect(formatChange(0)).toBe('+0.00');
  });

  it('always formats to two decimal places', () => {
    expect(formatChange(1)).toBe('+1.00');
    expect(formatChange(-1)).toBe('-1.00');
  });
});

// ─── formatChangePercent ────────────────────────────────────────────────────

describe('formatChangePercent', () => {
  it('formats a positive percent', () => {
    expect(formatChangePercent(2.5)).toBe('+2.50%');
  });

  it('formats a negative percent', () => {
    expect(formatChangePercent(-1.25)).toBe('-1.25%');
  });

  it('formats zero percent', () => {
    expect(formatChangePercent(0)).toBe('+0.00%');
  });
});

// ─── formatVolume ───────────────────────────────────────────────────────────

describe('formatVolume', () => {
  it('formats billions with B suffix', () => {
    expect(formatVolume(1_500_000_000)).toBe('1.5B');
    expect(formatVolume(86_700_000_000)).toBe('86.7B');
  });

  it('formats millions with M suffix', () => {
    expect(formatVolume(4_400_000)).toBe('4.4M');
    expect(formatVolume(1_000_000)).toBe('1.0M');
  });

  it('formats thousands with K suffix', () => {
    expect(formatVolume(3_500)).toBe('3.5K');
  });

  it('returns raw number as string for values under 1K', () => {
    expect(formatVolume(999)).toBe('999');
    expect(formatVolume(0)).toBe('0');
  });
});

// ─── getChangeClass ─────────────────────────────────────────────────────────

describe('getChangeClass', () => {
  it('returns "positive" for values above zero', () => {
    expect(getChangeClass(1)).toBe('positive');
    expect(getChangeClass(0.001)).toBe('positive');
  });

  it('returns "negative" for values below zero', () => {
    expect(getChangeClass(-1)).toBe('negative');
    expect(getChangeClass(-0.001)).toBe('negative');
  });

  it('returns "neutral" for zero', () => {
    expect(getChangeClass(0)).toBe('neutral');
  });
});

// ─── calculatePeriodChange ──────────────────────────────────────────────────

describe('calculatePeriodChange', () => {
  it('calculates change and percent from first to last point', () => {
    const history: HistoryPoint[] = [
      { date: '2024-01-01', close: 100, volume: 1_000 },
      { date: '2024-01-02', close: 110, volume: 1_000 },
      { date: '2024-01-03', close: 105, volume: 1_000 },
    ];
    const result = calculatePeriodChange(history);
    expect(result.change).toBe(5);
    expect(result.changePercent).toBeCloseTo(5, 1);
  });

  it('returns { change: 0, changePercent: 0 } for a single-point history', () => {
    const result = calculatePeriodChange([{ date: '2024-01-01', close: 100, volume: 1_000 }]);
    expect(result.change).toBe(0);
    expect(result.changePercent).toBe(0);
  });

  it('returns zeros for an empty array', () => {
    const result = calculatePeriodChange([]);
    expect(result.change).toBe(0);
    expect(result.changePercent).toBe(0);
  });

  it('handles a decline correctly', () => {
    const history: HistoryPoint[] = [
      { date: '2024-01-01', close: 200, volume: 1_000 },
      { date: '2024-01-02', close: 180, volume: 1_000 },
    ];
    const result = calculatePeriodChange(history);
    expect(result.change).toBe(-20);
    expect(result.changePercent).toBeCloseTo(-10, 1);
  });
});

// ─── alignHistoryToWindow ───────────────────────────────────────────────────

describe('alignHistoryToWindow', () => {
  const baseDate = new Date('2024-06-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Cutoffs relative to 2024-06-15T12:00:00Z:
  //   1D  → 2024-06-14T12:00:00Z
  //   7D  → 2024-06-08T12:00:00Z
  //   1Q  → 2024-03-17T12:00:00Z
  const history: HistoryPoint[] = [
    { date: '2024-01-01',              close: 100, volume: 1_000 }, // ~165 days ago — outside all windows
    { date: '2024-05-15',              close: 150, volume: 1_000 }, // ~31 days ago — inside 1Q only
    { date: '2024-06-05',              close: 180, volume: 1_000 }, // 10 days ago  — inside 7D and 1Q
    { date: '2024-06-14T13:00:00.000Z', close: 190, volume: 1_000 }, // 23h ago — inside 1D, 7D, 1Q
    { date: '2024-06-14T23:00:00.000Z', close: 195, volume: 1_000 }, // 13h ago — inside all windows
  ];

  it('returns only the last 24 hours for 1D', () => {
    const result = alignHistoryToWindow(history, '1D');
    expect(result).toHaveLength(2);
    expect(result[result.length - 1].close).toBe(195);
  });

  it('returns only the last 7 days for 7D', () => {
    const result = alignHistoryToWindow(history, '7D');
    // 2024-06-05 is 10 days ago — outside 7D; last two timestamps are within
    expect(result).toHaveLength(2);
  });

  it('returns the last 90 days for 1Q', () => {
    const result = alignHistoryToWindow(history, '1Q');
    // 2024-01-01 is excluded; remaining 4 entries are within 90 days
    expect(result).toHaveLength(4);
  });

  it('sorts results by date ascending', () => {
    const shuffled = [...history].reverse();
    const result = alignHistoryToWindow(shuffled, '1Q');
    for (let i = 1; i < result.length; i++) {
      expect(new Date(result[i].date).getTime()).toBeGreaterThanOrEqual(
        new Date(result[i - 1].date).getTime()
      );
    }
  });

  it('returns an empty array when no history falls within the window', () => {
    const old: HistoryPoint[] = [
      { date: '2020-01-01', close: 50, volume: 500 },
    ];
    expect(alignHistoryToWindow(old, '1D')).toHaveLength(0);
  });
});

// ─── buildChartSeries ───────────────────────────────────────────────────────

describe('buildChartSeries', () => {
  const baseDate = new Date('2024-06-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const makeSnapshot = (symbol: string, price: number, history: HistoryPoint[]): CompanySnapshot => ({
    quote: {
      symbol,
      shortName: symbol,
      regularMarketPrice: price,
      regularMarketChange: 0,
      regularMarketChangePercent: 0,
      currency: 'USD',
      marketState: 'REGULAR',
    },
    history,
  });

  // Recent history that falls inside the 7D window (after 2024-06-08T12:00:00Z)
  const recentHistory: HistoryPoint[] = [
    { date: '2024-06-10', close: 175, volume: 1_000 },
    { date: '2024-06-12', close: 180, volume: 1_000 },
  ];

  it('produces one series entry per snapshot', () => {
    const snapshots = new Map([
      ['IBM',  makeSnapshot('IBM',  180, recentHistory)],
      ['MSFT', makeSnapshot('MSFT', 420, recentHistory)],
    ]);
    const series = buildChartSeries(snapshots, '7D');
    expect(series).toHaveLength(2);
  });

  it('assigns the known IBM brand colour', () => {
    const snapshots = new Map([['IBM', makeSnapshot('IBM', 180, recentHistory)]]);
    const [s] = buildChartSeries(snapshots, '7D');
    expect(s.color).toBe('#0066cc');
  });

  it('maps history points to {date, close} data objects', () => {
    const snapshots = new Map([['IBM', makeSnapshot('IBM', 180, recentHistory)]]);
    const [s] = buildChartSeries(snapshots, '7D');
    expect(s.data).toHaveLength(2);
    expect(s.data[0]).toEqual({ date: '2024-06-10', close: 175 });
  });

  it('returns an empty array for an empty snapshots map', () => {
    expect(buildChartSeries(new Map(), '7D')).toHaveLength(0);
  });

  it('filters out history points outside the requested window', () => {
    const mixedHistory: HistoryPoint[] = [
      { date: '2024-01-01', close: 100, volume: 1_000 }, // very old — outside 7D
      ...recentHistory,
    ];
    const snapshots = new Map([['IBM', makeSnapshot('IBM', 180, mixedHistory)]]);
    const [s] = buildChartSeries(snapshots, '7D');
    // Only the 2 recent points should survive
    expect(s.data).toHaveLength(2);
  });
});
