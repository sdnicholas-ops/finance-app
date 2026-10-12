import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { CompanyCard } from './CompanyCard';
import { ComparisonChart } from '../charts/ComparisonChart';
import type { CompanySnapshot, ChartSeries } from '../../types/finance';

interface CustomSymbolPanelProps {
  symbol: string;
  snapshot: CompanySnapshot | null;
  isLoading: boolean;
  error: string | null;
}

export function CustomSymbolPanel({
  symbol,
  snapshot,
  isLoading,
  error,
}: CustomSymbolPanelProps) {
  if (!symbol) return null;

  return (
    <div className="cds-custom-symbol-panel" data-testid="custom-symbol-panel">
      <div className="cds-custom-symbol-panel__status">
        <span className="cds-active-badge">Currently showing: <strong>{symbol}</strong></span>
      </div>

      {isLoading && (
        <Card className="cds-custom-card--loading">
          <CardContent>
            <div className="cds-loading-box" data-testid="custom-loading">
              <Spinner size="lg" />
              <p>Fetching market data for {symbol}...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && !isLoading && (
        <Alert
          type="warning"
          title="Market Data Notice"
          className="cds-custom-alert"
          data-testid="custom-error"
        >
          {error}
        </Alert>
      )}

      {!isLoading && !error && snapshot && (
        <div className="cds-custom-symbol-results">
          <div className="cds-custom-symbol-card-wrap">
            <CompanyCard snapshot={snapshot} spotlight={true} />
          </div>

          {snapshot.history && snapshot.history.length > 0 && (
            <Card className="cds-custom-chart-card">
              <CardHeader>
                <CardTitle>{symbol} Historical Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonChart
                  series={[
                    {
                      symbol: snapshot.quote.symbol,
                      name: snapshot.quote.shortName,
                      color: '#0062FF',
                      data: snapshot.history,
                    } as ChartSeries,
                  ]}
                  height={280}
                  showLegend={false}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
