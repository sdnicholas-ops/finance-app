import { memo } from 'react';

interface LoadingSkeletonProps {
  variant?: 'card' | 'chart' | 'table';
  count?: number;
}

const LoadingSkeleton = memo(function LoadingSkeleton({ variant = 'card', count = 1 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const cardSkeleton = (
    <div className="cds-skeleton__card">
      <div className="cds-skeleton__row">
        <div className="cds-skeleton__bar cds-skeleton__title" />
        <div className="cds-skeleton__bar cds-skeleton__price" />
      </div>
      <div className="cds-skeleton__row">
        <div className="cds-skeleton__bar cds-skeleton__sparkline" />
      </div>
      <div className="cds-skeleton__row">
        <div className="cds-skeleton__bar cds-skeleton__meta" />
        <div className="cds-skeleton__bar cds-skeleton__meta" />
      </div>
    </div>
  );

  const chartSkeleton = (
    <div className="cds-skeleton__chart" style={{ height: 320 }}>
      <div className="cds-skeleton__bar cds-skeleton__chart" />
    </div>
  );

  const tableSkeleton = (
    <div className="cds-skeleton__table">
      {items.map((_, i) => (
        <div key={i} className="cds-skeleton__row">
          <div className="cds-skeleton__bar cds-skeleton__cell" />
          <div className="cds-skeleton__bar cds-skeleton__cell" />
          <div className="cds-skeleton__bar cds-skeleton__cell" />
          <div className="cds-skeleton__bar cds-skeleton__cell" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="cds-skeleton" role="status" aria-label="Loading content">
      {variant === 'card' && items.map((_, i) => <div key={i}>{cardSkeleton}</div>)}
      {variant === 'chart' && chartSkeleton}
      {variant === 'table' && tableSkeleton}
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

export { LoadingSkeleton };