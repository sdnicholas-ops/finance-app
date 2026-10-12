import { memo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

const Sparkline = memo(function Sparkline({
  data,
  width = 120,
  height = 32,
  className = '',
}: SparklineProps) {
  if (!data.length) return <div className={`sparkline ${className}`} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = isPositive ? '#2da44e' : '#d1242f';

  return (
    <svg
      className={`sparkline-svg ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      data-testid="sparkline"
    >
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        className="sparkline-area"
        points={`${width},${height} ${points} ${width},${height}`}
        fill="url(#sparkline-gradient)"
      />
      <polyline
        className="sparkline-line"
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

Sparkline.displayName = 'Sparkline';

export { Sparkline };