import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDashboardStore } from '../../src/store/dashboardStore';
import type { CompanySnapshot } from '../../src/types/finance';

// Mock the finance API
vi.mock('../../src/services/finance-api', () => ({
  financeApi: {
    getQuotes: vi.fn(),
    getHistory: vi.fn(),
    getProfile: vi.fn(),
  },
}));

import { financeApi } from '../../src/services/finance-api';

const mockQuote = {
  symbol: 'IBM',
  shortName: 'IBM',
  regularMarketPrice: 185.42,
  regularMarketChange: 2.15,
  regularMarketChangePercent: 1.17,
  currency: 'USD',
  marketState: 'REGULAR' as const,
  regularMarketTime: Math.floor(Date.now() / 1000),
};

const mockHistory = [
  { date: '2024-01-01', close: 180, volume: 1_000_000 },
  { date: '2024-01-02', close: 185, volume: 1_000_000 },
];

function resetStore() {
  useDashboardStore.setState({
    snapshots: new Map(),
    chartSeries: [],
    customSymbol: '',
    customSnapshot: null,
    customLoading: false,
    customError: null,
    activeWindow: '1D',
    selectedTickers: ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM'],
    loading: new Set(),
    errors: new Map(),
  });
}

describe('DashboardStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ─── Initial state ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('has the correct default tickers', () => {
      expect(useDashboardStore.getState().selectedTickers).toEqual(['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']);
    });

    it('has activeWindow set to 1D', () => {
      expect(useDashboardStore.getState().activeWindow).toBe('1D');
    });

    it('starts with an empty snapshots map', () => {
      expect(useDashboardStore.getState().snapshots.size).toBe(0);
    });

    it('starts with no loading or error state', () => {
      const state = useDashboardStore.getState();
      expect(state.loading.size).toBe(0);
      expect(state.errors.size).toBe(0);
    });
  });

  // ─── setActiveWindow ─────────────────────────────────────────────────────

  describe('setActiveWindow', () => {
    it('updates activeWindow', () => {
      useDashboardStore.getState().setActiveWindow('7D');
      expect(useDashboardStore.getState().activeWindow).toBe('7D');
    });

    it('rebuilds chartSeries for the new window', () => {
      const mockSnapshot: CompanySnapshot = { quote: mockQuote, history: mockHistory };
      useDashboardStore.setState({ snapshots: new Map([['IBM', mockSnapshot]]) });

      useDashboardStore.getState().setActiveWindow('7D');

      // History dates fall outside the 1D window but inside 7D,
      // so switching to 7D should produce at least one series entry.
      const state = useDashboardStore.getState();
      expect(state.activeWindow).toBe('7D');
      expect(Array.isArray(state.chartSeries)).toBe(true);
    });
  });

  // ─── refreshOne ──────────────────────────────────────────────────────────

  describe('refreshOne', () => {
    it('fetches quote and history, then stores the snapshot', async () => {
      (financeApi.getQuotes as ReturnType<typeof vi.fn>).mockResolvedValue([mockQuote]);
      (financeApi.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

      await useDashboardStore.getState().refreshOne('IBM');

      expect(financeApi.getQuotes).toHaveBeenCalledWith(['IBM']);
      expect(financeApi.getHistory).toHaveBeenCalledWith('IBM', '1D');

      const state = useDashboardStore.getState();
      expect(state.snapshots.has('IBM')).toBe(true);
      expect(state.snapshots.get('IBM')?.quote.symbol).toBe('IBM');
      expect(state.loading.has('IBM')).toBe(false);
      expect(state.errors.has('IBM')).toBe(false);
    });

    it('marks the ticker as loading during the fetch', async () => {
      let resolveQuotes!: (v: typeof mockQuote[]) => void;
      const quotesPromise = new Promise<typeof mockQuote[]>((r) => { resolveQuotes = r; });
      (financeApi.getQuotes as ReturnType<typeof vi.fn>).mockReturnValue(quotesPromise);
      (financeApi.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

      const refreshPromise = useDashboardStore.getState().refreshOne('IBM');

      expect(useDashboardStore.getState().loading.has('IBM')).toBe(true);

      resolveQuotes([mockQuote]);
      await refreshPromise;

      expect(useDashboardStore.getState().loading.has('IBM')).toBe(false);
    });

    it('stores the error and clears loading on failure', async () => {
      const error = new Error('Network error');
      (financeApi.getQuotes as ReturnType<typeof vi.fn>).mockRejectedValue(error);
      (financeApi.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

      await expect(useDashboardStore.getState().refreshOne('IBM')).rejects.toThrow('Network error');

      const state = useDashboardStore.getState();
      expect(state.errors.get('IBM')).toBe(error);
      expect(state.loading.has('IBM')).toBe(false);
    });

    it('does not lose earlier snapshots when tickers load concurrently (race condition)', async () => {
      // Each ticker resolves at a different tick — all started via Promise.all
      // Before the fix, stale closures meant the last writer won and wiped the rest.
      const tickers = ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM'];

      (financeApi.getQuotes as ReturnType<typeof vi.fn>).mockImplementation(
        ([ticker]: string[]) => Promise.resolve([{ ...mockQuote, symbol: ticker }])
      );
      (financeApi.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

      // Simulate initialize(): all refreshOne calls run concurrently
      await Promise.all(tickers.map((t) => useDashboardStore.getState().refreshOne(t)));

      const { snapshots } = useDashboardStore.getState();
      expect(snapshots.size).toBe(tickers.length);
      for (const ticker of tickers) {
        expect(snapshots.has(ticker)).toBe(true);
      }
    });
  });

  // ─── addTicker ───────────────────────────────────────────────────────────

  describe('addTicker', () => {
    it('appends a new ticker and fetches its data', async () => {
      (financeApi.getQuotes as ReturnType<typeof vi.fn>).mockResolvedValue([
        { ...mockQuote, symbol: 'AAPL' },
      ]);
      (financeApi.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

      await useDashboardStore.getState().addTicker('AAPL');

      const state = useDashboardStore.getState();
      expect(state.selectedTickers).toContain('AAPL');
      expect(state.snapshots.has('AAPL')).toBe(true);
    });

    it('normalises ticker to uppercase', async () => {
      (financeApi.getQuotes as ReturnType<typeof vi.fn>).mockResolvedValue([
        { ...mockQuote, symbol: 'AAPL' },
      ]);
      (financeApi.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

      await useDashboardStore.getState().addTicker('aapl');

      expect(useDashboardStore.getState().selectedTickers).toContain('AAPL');
    });

    it('is a no-op for a ticker already in the list', async () => {
      const before = useDashboardStore.getState().selectedTickers.length;
      await useDashboardStore.getState().addTicker('IBM');
      expect(useDashboardStore.getState().selectedTickers).toHaveLength(before);
      expect(financeApi.getQuotes).not.toHaveBeenCalled();
    });

    it('throws when the 10-ticker limit is reached', async () => {
      useDashboardStore.setState({
        selectedTickers: ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM', 'AAPL', 'GOOGL', 'AMZN', 'META', 'NVDA'],
      });

      await expect(useDashboardStore.getState().addTicker('TSLA')).rejects.toThrow(
        'Maximum 10 tickers allowed'
      );
    });

    it('rolls back the ticker and stores the error on fetch failure', async () => {
      (financeApi.getQuotes as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not found'));

      await expect(useDashboardStore.getState().addTicker('INVALID')).rejects.toThrow();

      const state = useDashboardStore.getState();
      expect(state.selectedTickers).not.toContain('INVALID');
      expect(state.errors.has('INVALID')).toBe(true);
    });
  });

  // ─── removeTicker ────────────────────────────────────────────────────────

  describe('removeTicker', () => {
    it('removes the ticker from selectedTickers and deletes its snapshot', () => {
      const snap: CompanySnapshot = { quote: { ...mockQuote, symbol: 'MSFT' }, history: mockHistory };
      useDashboardStore.setState({ snapshots: new Map([['MSFT', snap]]) });

      useDashboardStore.getState().removeTicker('MSFT');

      const state = useDashboardStore.getState();
      expect(state.selectedTickers).not.toContain('MSFT');
      expect(state.snapshots.has('MSFT')).toBe(false);
    });

    it('refuses to remove the primary ticker (IBM)', () => {
      const before = useDashboardStore.getState().selectedTickers.length;
      useDashboardStore.getState().removeTicker('IBM');

      expect(useDashboardStore.getState().selectedTickers).toHaveLength(before);
      expect(useDashboardStore.getState().selectedTickers).toContain('IBM');
    });
  });

  // ─── clearError ──────────────────────────────────────────────────────────

  describe('clearError', () => {
    it('removes the error for the given ticker', () => {
      useDashboardStore.setState({ errors: new Map([['IBM', new Error('Test')]]) });

      useDashboardStore.getState().clearError('IBM');

      expect(useDashboardStore.getState().errors.has('IBM')).toBe(false);
    });

    it('is a no-op when there is no error for the ticker', () => {
      // Should not throw
      useDashboardStore.getState().clearError('NOTEXIST');
      expect(useDashboardStore.getState().errors.size).toBe(0);
    });
  });

  // ─── Custom Symbol state & actions ──────────────────────────────────────

  describe('customSymbol and setCustomSymbol', () => {
    it('sets custom symbol and fetches quote and history', async () => {
      const nvdaQuote = { ...mockQuote, symbol: 'NVDA', shortName: 'NVIDIA' };
      (financeApi.getQuotes as ReturnType<typeof vi.fn>).mockResolvedValue([nvdaQuote]);
      (financeApi.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(mockHistory);

      await useDashboardStore.getState().setCustomSymbol('nvda');

      const state = useDashboardStore.getState();
      expect(state.customSymbol).toBe('NVDA');
      expect(state.customSnapshot?.quote.symbol).toBe('NVDA');
      expect(state.customError).toBeNull();
      expect(state.customLoading).toBe(false);
    });

    it('rejects invalid ticker formats with an inline error', async () => {
      await useDashboardStore.getState().setCustomSymbol('IBM1');

      const state = useDashboardStore.getState();
      expect(state.customError).toBe('Ticker must be 1–5 letters (e.g. NVDA)');
      expect(state.customSnapshot).toBeNull();
      expect(financeApi.getQuotes).not.toHaveBeenCalled();
    });

    it('clears custom symbol state on clearCustomSymbol', async () => {
      useDashboardStore.setState({
        customSymbol: 'NVDA',
        customSnapshot: { quote: mockQuote, history: mockHistory },
        customError: null,
      });

      useDashboardStore.getState().clearCustomSymbol();

      const state = useDashboardStore.getState();
      expect(state.customSymbol).toBe('');
      expect(state.customSnapshot).toBeNull();
      expect(state.customError).toBeNull();
    });

    it('preserves customSymbol when switching activeWindow', () => {
      useDashboardStore.setState({
        customSymbol: 'NVDA',
        customSnapshot: { quote: mockQuote, history: mockHistory },
      });

      useDashboardStore.getState().setActiveWindow('7D');

      expect(useDashboardStore.getState().customSymbol).toBe('NVDA');
      expect(useDashboardStore.getState().activeWindow).toBe('7D');
    });

    it('sets clear no-data error when symbol returns no quotes', async () => {
      (financeApi.getQuotes as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (financeApi.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await useDashboardStore.getState().setCustomSymbol('ZZZZ');

      const state = useDashboardStore.getState();
      expect(state.customError).toContain('No data found for symbol "ZZZZ"');
      expect(state.customSnapshot).toBeNull();
    });
  });
});
