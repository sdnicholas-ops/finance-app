import { memo, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartSeries } from '../../types/finance';

interface QuarterTrendChartProps {
  series: ChartSeries[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  stacked?: boolean;
}

const QuarterTrendChart = memo(function QuarterTrendChart({
  series,
  height = 320,
  className = '',
  showLegend = true,
  stacked = false,
}: QuarterTrendChartProps) {
  const allDates = useMemo(() => {
    const dates = new Set<string>();
    series.forEach((s) => s.data.forEach((d) => dates.add(d.date)));
    return Array.from(dates).sort();
  }, [series]);

  const chartData = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    allDates.forEach((date) => {
      map.set(date, { date });
    });
    series.forEach((s) => {
      s.data.forEach((point) => {
        const entry = map.get(point.date);
        if (entry) entry[s.symbol] = point.close;
      });
    });
    return Array.from(map.values());
  }, [series, allDates]);

  const yDomain = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    series.forEach((s) => {
      s.data.forEach((d) => {
        min = Math.min(min, d.close);
        max = Math.max(max, d.close);
      });
    });
    const padding = (max - min) * 0.1 || 1;
    return [min - padding, max + padding] as [number, number];
  }, [series]);

  if (!series.length) {
    return (
      <div className={`chart-empty ${className}`} style={{ height }}>
        <p>No data available</p>
      </div>
    );
  }

  const formatXAxis = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipValue = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className={`quarter-trend-chart ${className}`} style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          stackOffset={stacked ? 'expand' : undefined}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 11, fill: '#57606a' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={yDomain}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            tick={{ fontSize: 11, fill: '#57606a' }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
            labelFormatter={formatXAxis}
            formatter={formatTooltipValue}
          />
          {showLegend && (
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="top"
              wrapperStyle={{ paddingTop: 10 }}
            />
          )}
          {series.map((s) => (
            <Area
              key={s.symbol}
              type="monotone"
              dataKey={s.symbol}
              name={s.name}
              stroke={s.color}
              fill={s.color}
              fillOpacity={stacked ? 0.6 : 0.15}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

QuarterTrendChart.displayName = 'QuarterTrendChart';

export { QuarterTrendChart };