import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CompanySnapshot, ChartSeries, TimeWindow } from '../types/finance';
import { getDefaultSymbols, PRIMARY_TICKER } from '../config/tickers';
import { financeApi } from '../services/finance-api';
import { buildChartSeries } from '../services/transformers';

interface DashboardState {
  // Data
  snapshots: Map<string, CompanySnapshot>;
  chartSeries: ChartSeries[];
  // UI State
  activeWindow: TimeWindow;
  selectedTickers: string[];
  loading: Set<string>;
  errors: Map<string, Error>;
  // Actions
  setActiveWindow: (window: TimeWindow) => void;
  addTicker: (ticker: string) => Promise<void>;
  removeTicker: (ticker: string) => void;
  refreshAll: () => Promise<void>;
  refreshOne: (ticker: string) => Promise<void>;
  initialize: () => Promise<void>;
  clearError: (ticker: string) => void;
}

const initialTickers = getDefaultSymbols();

export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    snapshots: new Map(),
    chartSeries: [],
    activeWindow: '1D',
    selectedTickers: initialTickers,
    loading: new Set(),
    errors: new Map(),

    // Actions
    setActiveWindow: (window: TimeWindow) => {
      set({ activeWindow: window });
      // Rebuild chart series for new window
      const { snapshots } = get();
      const chartSeries = buildChartSeries(snapshots, window);
      set({ chartSeries });
    },

    addTicker: async (ticker: string) => {
      const upper = ticker.toUpperCase();
      const { selectedTickers } = get();

      if (selectedTickers.includes(upper)) return;
      if (selectedTickers.length >= 10) {
        throw new Error('Maximum 10 tickers allowed');
      }

      set((state) => ({
        selectedTickers: [...state.selectedTickers, upper],
        loading: new Set(state.loading).add(upper),
      }));

      try {
        await get().refreshOne(upper);
      } catch (error) {
        // Remove ticker if refresh fails
        set((state) => {
          const newSelected = state.selectedTickers.filter((t) => t !== upper);
          const newLoading = new Set(state.loading);
          newLoading.delete(upper);
          const newErrors = new Map(state.errors);
          newErrors.set(upper, error as Error);
          return { selectedTickers: newSelected, loading: newLoading, errors: newErrors };
        });
        throw error;
      }
    },

    removeTicker: (ticker: string) => {
      const upper = ticker.toUpperCase();
      const { selectedTickers, snapshots } = get();

      if (upper === PRIMARY_TICKER) return; // Cannot remove primary

      const newSelected = selectedTickers.filter((t) => t !== upper);
      const newSnapshots = new Map(snapshots);
      newSnapshots.delete(upper);

      const { activeWindow } = get();
      const chartSeries = buildChartSeries(newSnapshots, activeWindow);

      set({
        selectedTickers: newSelected,
        snapshots: newSnapshots,
        chartSeries,
      });
    },

    refreshAll: async () => {
      const { selectedTickers } = get();
      await Promise.all(selectedTickers.map((t) => get().refreshOne(t)));
    },

    refreshOne: async (ticker: string) => {
      const upper = ticker.toUpperCase();

      set((state) => {
        const newLoading = new Set(state.loading);
        newLoading.add(upper);
        return { loading: newLoading };
      });

      try {
        const [quote, history] = await Promise.all([
          financeApi.getQuotes([upper]),
          financeApi.getHistory(upper, get().activeWindow),
        ]);

        const quoteData = quote[0];
        if (!quoteData) throw new Error(`No quote data for ${upper}`);

        const snapshot: CompanySnapshot = {
          quote: quoteData,
          history,
        };

        // Use functional updater to read latest state — avoids stale-closure
        // race when multiple tickers are fetched concurrently via Promise.all
        set((state) => {
          const newSnapshots = new Map(state.snapshots);
          newSnapshots.set(upper, snapshot);

          const newErrors = new Map(state.errors);
          newErrors.delete(upper);

          const newLoading = new Set(state.loading);
          newLoading.delete(upper);

          const chartSeries = buildChartSeries(newSnapshots, state.activeWindow);

          return {
            snapshots: newSnapshots,
            chartSeries,
            loading: newLoading,
            errors: newErrors,
          };
        });
      } catch (error) {
        set((state) => {
          const newLoading = new Set(state.loading);
          newLoading.delete(upper);
          const newErrors = new Map(state.errors);
          newErrors.set(upper, error as Error);
          return { loading: newLoading, errors: newErrors };
        });
        throw error;
      }
    },

    initialize: async () => {
      const { selectedTickers } = get();
      await Promise.all(selectedTickers.map((t) => get().refreshOne(t)));
    },

    clearError: (ticker: string) => {
      const upper = ticker.toUpperCase();
      set((state) => {
        const newErrors = new Map(state.errors);
        newErrors.delete(upper);
        return { errors: newErrors };
      });
    },
  }))
);

// Selectors for common use cases
export const selectSnapshots = (state: DashboardState) => state.snapshots;
export const selectChartSeries = (state: DashboardState) => state.chartSeries;
export const selectActiveWindow = (state: DashboardState) => state.activeWindow;
export const selectSelectedTickers = (state: DashboardState) => state.selectedTickers;
export const selectLoading = (state: DashboardState) => state.loading;
export const selectErrors = (state: DashboardState) => state.errors;
export const selectSnapshot = (ticker: string) => (state: DashboardState) =>
  state.snapshots.get(ticker.toUpperCase());
export const selectIsLoading = (ticker: string) => (state: DashboardState) =>
  state.loading.has(ticker.toUpperCase());
export const selectError = (ticker: string) => (state: DashboardState) =>
  state.errors.get(ticker.toUpperCase());