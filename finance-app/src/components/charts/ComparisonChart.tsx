import { memo, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartSeries } from '../../types/finance';

interface ComparisonChartProps {
  series: ChartSeries[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

const ComparisonChart = memo(function ComparisonChart({
  series,
  height = 320,
  className = '',
  showLegend = true,
  showGrid = true,
}: ComparisonChartProps) {
  if (!series.length) {
    return (
      <div className={`chart-empty ${className}`} style={{ height }}>
        <p>No data available</p>
      </div>
    );
  }

  // Flatten all data points for X axis domain
  const allDates = useMemo(() => {
    const dates = new Set<string>();
    series.forEach((s) => s.data.forEach((d) => dates.add(d.date)));
    return Array.from(dates).sort();
  }, [series]);

  // Create data array for Recharts (one object per date with all series values)
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

  const formatXAxis = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipValue = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className={`comparison-chart ${className}`} style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />}
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
              iconType="line"
              wrapperStyle={{ paddingTop: 10 }}
            />
          )}
          {series.map((s) => (
            <Line
              key={s.symbol}
              type="monotone"
              dataKey={s.symbol}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

ComparisonChart.displayName = 'ComparisonChart';

export { ComparisonChart };