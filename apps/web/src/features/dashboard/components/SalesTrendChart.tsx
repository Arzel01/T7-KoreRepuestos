import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrency } from '@/lib/utils';

import type { SalesTrendPoint } from '@kore/shared';

const BRAND_NAVY = '#0f3672';

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ payload: SalesTrendPoint }>;
}

function TrendTooltip({ active, payload }: TooltipPayload): JSX.Element | null {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{formatShortDate(point.date)}</p>
      <p className="mt-1 text-muted-foreground">
        {formatCurrency(point.total)} · {point.count}{' '}
        {point.count === 1 ? 'cotización' : 'cotizaciones'}
      </p>
    </div>
  );
}

/** Ventas (total cotizado) por día — últimos 30 días. Serie única: sin leyenda. */
export function SalesTrendChart({ data }: { data: SalesTrendPoint[] }): JSX.Element {
  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Sin cotizaciones en este periodo.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND_NAVY} stopOpacity={0.28} />
            <stop offset="100%" stopColor={BRAND_NAVY} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `$${v}`}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip content={<TrendTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke={BRAND_NAVY}
          strokeWidth={2}
          fill="url(#salesTrendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
