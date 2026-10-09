import { useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { TimeWindowTabs } from '../components/dashboard/TimeWindowTabs';
import { CompanyCard } from '../components/dashboard/CompanyCard';
import { ErrorBanner } from '../components/dashboard/ErrorBanner';
import { LoadingSkeleton } from '../components/dashboard/LoadingSkeleton';
import { ComparisonChart } from '../components/charts/ComparisonChart';
import { QuarterTrendChart } from '../components/charts/QuarterTrendChart';
import {
  useDashboardStore,
  selectSnapshots,
  selectChartSeries,
  selectActiveWindow,
  selectSelectedTickers,
  selectLoading,
  selectErrors,
} from '../store/dashboardStore';
import { getTimeWindowConfig } from '../types/finance';
import { PRIMARY_TICKER } from '../config/tickers';

/** Renders a single company card, error banner, or skeleton — purely from store state passed as props */
function TickerCard({ ticker, spotlight, snapshot, isLoading, error }: {
  ticker: string;
  spotlight: boolean;
  snapshot: ReturnType<ReturnType<typeof selectSnapshots>['get']>;
  isLoading: boolean;
  error: Error | undefined;
}) {
  if (isLoading && !snapshot) {
    return <LoadingSkeleton variant="card" count={1} />;
  }
  if (error && !snapshot) {
    return (
      <ErrorBanner
        message={`${ticker}: ${error.message}`}
        onRetry={() => useDashboardStore.getState().refreshOne(ticker)}
        onDismiss={() => useDashboardStore.getState().clearError(ticker)}
      />
    );
  }
  if (!snapshot) return null;
  return <CompanyCard snapshot={snapshot} spotlight={spotlight} />;
}

function DayView() {
  const snapshots = useDashboardStore(selectSnapshots);
  const selectedTickers = useDashboardStore(selectSelectedTickers);
  const loading = useDashboardStore(selectLoading);
  const errors = useDashboardStore(selectErrors);

  const { spotlightTicker, competitorTickers } = useMemo(() => {
    const primary = selectedTickers.includes(PRIMARY_TICKER) ? PRIMARY_TICKER : selectedTickers[0];
    return {
      spotlightTicker: primary,
      competitorTickers: selectedTickers.filter((t) => t !== primary),
    };
  }, [selectedTickers]);

  return (
    <div className="cds-day-view" role="tabpanel" aria-label="Current Day">
      <div className="cds-day-view__heading">
        <h2 className="cds-day-view__title">Current Day</h2>
        <p className="cds-day-view__subtitle">Live market summary — IBM and {competitorTickers.length} competitors</p>
      </div>

      <section className="cds-spotlight-section" aria-label="IBM Spotlight">
        <h3 className="cds-section-label">IBM SPOTLIGHT</h3>
        <TickerCard
          ticker={spotlightTicker}
          spotlight={true}
          snapshot={snapshots.get(spotlightTicker)}
          isLoading={loading.has(spotlightTicker)}
          error={errors.get(spotlightTicker)}
        />
      </section>

      {competitorTickers.length > 0 && (
        <section className="cds-competitors-section" aria-label="Competitors">
          <h3 className="cds-section-label">COMPETITORS</h3>
          <div className="cds-competitor-cards" role="list">
            {competitorTickers.map((t) => (
              <TickerCard
                key={t}
                ticker={t}
                spotlight={false}
                snapshot={snapshots.get(t)}
                isLoading={loading.has(t)}
                error={errors.get(t)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function WeekView() {
  const chartSeries = useDashboardStore(selectChartSeries);
  const selectedTickers = useDashboardStore(selectSelectedTickers);

  const anyLoading = selectedTickers.some((t) => useDashboardStore.getState().loading.has(t));
  const hasError = selectedTickers.some((t) => useDashboardStore.getState().errors.has(t));
  const firstError = selectedTickers.find((t) => useDashboardStore.getState().errors.has(t));

  if (anyLoading && !chartSeries.length) {
    return <LoadingSkeleton variant="chart" />;
  }

  return (
    <div className="cds-dashboard__content" role="tabpanel" aria-label="Last 7 Days">
      {hasError && firstError && (
        <ErrorBanner
          message={`${firstError}: ${useDashboardStore.getState().errors.get(firstError)?.message}`}
          onRetry={() => useDashboardStore.getState().refreshOne(firstError)}
          onDismiss={() => useDashboardStore.getState().clearError(firstError)}
        />
      )}
      <Card className="cds-chart-card">
        <CardHeader>
          <CardTitle>7-Day Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ComparisonChart series={chartSeries} height={350} />
        </CardContent>
      </Card>
    </div>
  );
}

function QuarterView() {
  const chartSeries = useDashboardStore(selectChartSeries);
  const selectedTickers = useDashboardStore(selectSelectedTickers);

  const anyLoading = selectedTickers.some((t) => useDashboardStore.getState().loading.has(t));
  const hasError = selectedTickers.some((t) => useDashboardStore.getState().errors.has(t));
  const firstError = selectedTickers.find((t) => useDashboardStore.getState().errors.has(t));

  if (anyLoading && !chartSeries.length) {
    return <LoadingSkeleton variant="chart" />;
  }

  return (
    <div className="cds-dashboard__content" role="tabpanel" aria-label="Last Quarter">
      {hasError && firstError && (
        <ErrorBanner
          message={`${firstError}: ${useDashboardStore.getState().errors.get(firstError)?.message}`}
          onRetry={() => useDashboardStore.getState().refreshOne(firstError)}
          onDismiss={() => useDashboardStore.getState().clearError(firstError)}
        />
      )}
      <Card className="cds-chart-card">
        <CardHeader>
          <CardTitle>Quarterly Trend Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <QuarterTrendChart series={chartSeries} height={350} />
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardView() {
  const activeWindow = useDashboardStore(selectActiveWindow);
  const setActiveWindow = useDashboardStore((s) => s.setActiveWindow);
  const initialize = useDashboardStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const config = getTimeWindowConfig(activeWindow);

  return (
    <div className="cds-dashboard">
      <TimeWindowTabs activeWindow={activeWindow} onChange={setActiveWindow} />
      <div className="cds-dashboard__panel" role="tabpanel" aria-label={config.label}>
        {activeWindow === '1D' && <DayView />}
        {activeWindow === '7D' && <WeekView />}
        {activeWindow === '1Q' && <QuarterView />}
      </div>
    </div>
  );
}
