import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatCurrency } from '@/lib/utils';

import type { TopProductStat } from '@kore/shared';

const BRAND_CYAN = '#00b5e2';

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ payload: TopProductStat }>;
}

function TopProductsTooltip({ active, payload }: TooltipPayload): JSX.Element | null {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{p.name}</p>
      <p className="mt-1 text-muted-foreground">
        {p.quantitySold} unid. · {formatCurrency(p.revenue)}
      </p>
    </div>
  );
}

/** Productos más vendidos por cantidad (líneas de cotización). Serie única: sin leyenda. */
export function TopProductsChart({ data }: { data: TopProductStat[] }): JSX.Element {
  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Aún no hay ventas registradas.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 20, bottom: 0, left: 0 }}
        barCategoryGap={12}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="sku"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<TopProductsTooltip />} cursor={{ fill: 'var(--muted)' }} />
        <Bar dataKey="quantitySold" fill={BRAND_CYAN} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
