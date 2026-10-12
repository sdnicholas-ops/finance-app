import { memo } from 'react';
import { formatCurrency, formatChange, formatChangePercent, formatVolume, getChangeClass } from '../../services/transformers';
import type { CompanySnapshot } from '../../types/finance';
import { getTickerConfig } from '../../config/tickers';

interface CompanyCardProps {
  snapshot: CompanySnapshot;
  /** When true, renders the full-width IBM Spotlight layout */
  spotlight?: boolean;
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="cds-stat-cell">
      <span className="cds-stat-cell__label">{label}</span>
      <span className="cds-stat-cell__value">{value}</span>
    </div>
  );
}

const CompanyCard = memo(function CompanyCard({ snapshot, spotlight = false }: CompanyCardProps) {
  const { quote } = snapshot;
  const changeClass = getChangeClass(quote.regularMarketChange);
  const config = getTickerConfig(quote.symbol);
  const accentColor = config?.color ?? '#0066cc';

  const timeLabel = quote.regularMarketTime
    ? new Date(quote.regularMarketTime * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  const hasStats = quote.regularMarketOpen != null;

  return (
    <div
      className={`cds-company-card ${spotlight ? 'cds-company-card--spotlight' : 'cds-company-card--competitor'}`}
      style={{ '--card-accent': accentColor } as React.CSSProperties}
      role="listitem"
    >
      {/* Left accent border */}
      <div className="cds-company-card__accent-bar" />

      {/* Header row: symbol + name on left, time on right */}
      <div className="cds-company-card__header">
        <div className="cds-company-card__id">
          <span className="cds-company-card__symbol" style={{ color: accentColor }}>{quote.symbol}</span>
          <span className="cds-company-card__name">{quote.shortName}</span>
        </div>
        {timeLabel && <span className="cds-company-card__time">{timeLabel}</span>}
      </div>

      {/* Price row */}
      <div className="cds-company-card__price-row">
        <span className="cds-company-card__price">{formatCurrency(quote.regularMarketPrice, quote.currency)}</span>
        <span className={`cds-company-card__change cds-company-card__change--${changeClass}`}>
          {formatChange(quote.regularMarketChange)} ({formatChangePercent(quote.regularMarketChangePercent)})
        </span>
      </div>

      {/* Volume */}
      {quote.regularMarketVolume != null && (
        <div className="cds-company-card__volume">
          Vol {formatVolume(quote.regularMarketVolume)}
        </div>
      )}

      {/* Stats row */}
      {hasStats && (
        <div className="cds-company-card__stats">
          <StatCell label="OPEN"       value={formatCurrency(quote.regularMarketOpen!, quote.currency)} />
          <StatCell label="PREV CLOSE" value={formatCurrency(quote.regularMarketPreviousClose!, quote.currency)} />
          <StatCell
            label="DAY RANGE"
            value={`${formatCurrency(quote.regularMarketDayLow!, quote.currency)} – ${formatCurrency(quote.regularMarketDayHigh!, quote.currency)}`}
          />
          <StatCell
            label="52WK RANGE"
            value={`${formatCurrency(quote.fiftyTwoWeekLow!, quote.currency)} – ${formatCurrency(quote.fiftyTwoWeekHigh!, quote.currency)}`}
          />
          {quote.marketCap != null && (
            <StatCell label="MKT CAP" value={`$${formatVolume(quote.marketCap)}`} />
          )}
          {quote.targetMeanPrice != null && (
            <StatCell label="TARGET" value={formatCurrency(quote.targetMeanPrice, quote.currency)} />
          )}
        </div>
      )}
    </div>
  );
});

CompanyCard.displayName = 'CompanyCard';

export { CompanyCard };
