import { useState, useCallback } from 'react';
import { DashboardView } from './views/DashboardView';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useDashboardStore } from './store/dashboardStore';

function Header() {
  const refreshAll = useDashboardStore((s) => s.refreshAll);
  const snapshots = useDashboardStore((s) => s.snapshots);
  const [refreshing, setRefreshing] = useState(false);

  // Derive "last updated" from the most recent regularMarketTime across all snapshots
  const lastUpdated = (() => {
    let latest = 0;
    snapshots.forEach((snap) => {
      const t = snap.quote.regularMarketTime ?? 0;
      if (t > latest) latest = t;
    });
    if (!latest) return null;
    return new Date(latest * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  })();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  return (
    <header className="cds-header">
      <div className="cds-header__content">
        <div className="cds-header__brand">
          <span className="cds-header__logo" aria-hidden="true">📈</span>
          <h1 className="cds-header__title">Market Dashboard</h1>
        </div>
        <div className="cds-header__actions">
          {lastUpdated && (
            <span className="cds-header__updated">Updated {lastUpdated}</span>
          )}
          <button
            className="cds-header__refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh market data"
          >
            <span className={`cds-header__refresh-icon ${refreshing ? 'cds-header__refresh-icon--spinning' : ''}`}>↺</span>
            {' '}Refresh
          </button>
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="cds-error-page">
          <h2>Something went wrong</h2>
          <p>Please refresh the page.</p>
          <button className="cds-error-page__button" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      }
    >
      <div className="cds-app">
        <Header />
        <main className="cds-main">
          <DashboardView />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
