import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomSymbolPanel } from '../../src/components/dashboard/CustomSymbolPanel';
import type { CompanySnapshot } from '../../src/types/finance';

const mockSnapshot: CompanySnapshot = {
  quote: {
    symbol: 'NVDA',
    shortName: 'NVIDIA',
    regularMarketPrice: 120.50,
    regularMarketChange: 4.25,
    regularMarketChangePercent: 3.59,
    currency: 'USD',
    marketState: 'REGULAR',
    regularMarketTime: Math.floor(Date.now() / 1000),
    regularMarketOpen: 120.50,
    regularMarketPreviousClose: 118.25,
    regularMarketDayHigh: 122.80,
    regularMarketDayLow: 119.10,
    regularMarketVolume: 45_000_000,
    fiftyTwoWeekHigh: 140.76,
    fiftyTwoWeekLow: 40.50,
    marketCap: 2_950_000_000_000,
    targetMeanPrice: 150.00,
  },
  history: [
    { date: '2024-01-01', close: 115, volume: 10_000_000 },
    { date: '2024-01-02', close: 120.5, volume: 12_000_000 },
  ],
};

describe('CustomSymbolPanel', () => {
  it('returns null when symbol is empty', () => {
    const { container } = render(
      <CustomSymbolPanel
        symbol=""
        snapshot={null}
        isLoading={false}
        error={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders loading state when isLoading is true', () => {
    render(
      <CustomSymbolPanel
        symbol="NVDA"
        snapshot={null}
        isLoading={true}
        error={null}
      />
    );

    expect(screen.getByText('Fetching market data for NVDA...')).toBeInTheDocument();
  });

  it('renders warning notice when error is present', () => {
    render(
      <CustomSymbolPanel
        symbol="ZZZZ"
        snapshot={null}
        isLoading={false}
        error='No data found for symbol "ZZZZ"'
      />
    );

    expect(screen.getByText('Market Data Notice')).toBeInTheDocument();
    expect(screen.getByText('No data found for symbol "ZZZZ"')).toBeInTheDocument();
  });

  it('renders company card and chart when snapshot is present', () => {
    render(
      <CustomSymbolPanel
        symbol="NVDA"
        snapshot={mockSnapshot}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText(/Currently showing:/)).toBeInTheDocument();
    expect(screen.getAllByText('NVDA').length).toBeGreaterThan(0);
    expect(screen.getByText('NVDA Historical Trend')).toBeInTheDocument();
  });
});
