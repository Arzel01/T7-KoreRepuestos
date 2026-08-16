import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { CalendarItemDto } from '@kore/shared';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Props {
  items: CalendarItemDto[];
}

/**
 * Vista de calendario mensual (US#3): ubica cada servicio en el día de su
 * `nextServiceDate` sobre una cuadrícula mensual navegable. Complementa la
 * vista de línea de tiempo existente.
 */
export function CalendarMonthView({ items }: Props): JSX.Element {
  const initial = useMemo(() => {
    const first = [...items].sort((a, b) => a.nextServiceDate.localeCompare(b.nextServiceDate))[0];
    const base = first ? new Date(first.nextServiceDate) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [items]);

  const [viewMonth, setViewMonth] = useState<Date>(initial);

  // Agrupa servicios por fecha ISO (yyyy-mm-dd).
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItemDto[]>();
    for (const item of items) {
      const list = map.get(item.nextServiceDate) ?? [];
      list.push(item);
      map.set(item.nextServiceDate, list);
    }
    return map;
  }, [items]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=Dom … 6=Sáb → convertir a lunes-primero (0=Lun … 6=Dom).
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < leading; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, iso });
  }

  const monthItems = items
    .filter((i) => i.nextServiceDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .sort((a, b) => a.nextServiceDate.localeCompare(b.nextServiceDate));

  function shift(delta: number): void {
    setViewMonth(new Date(year, month + delta, 1));
  }

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => shift(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <h3 className="text-sm font-semibold">
          {MONTHS[month]} {year}
        </h3>
        <Button variant="ghost" size="icon" aria-label="Mes siguiente" onClick={() => shift(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="pb-1 text-xs font-medium text-muted-foreground">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const dayItems = byDate.get(cell.iso) ?? [];
          const hasCritical = dayItems.some((it) => it.isCritical);
          return (
            <div
              key={cell.iso}
              className={`flex min-h-12 flex-col items-center rounded-lg border p-1 text-xs ${
                dayItems.length > 0
                  ? hasCritical
                    ? 'border-warning-foreground/30 bg-warning'
                    : 'border-primary/30 bg-primary/5'
                  : 'border-transparent'
              }`}
            >
              <span className="text-muted-foreground">{cell.day}</span>
              {dayItems.length > 0 && (
                <Badge
                  className={`mt-0.5 h-4 min-w-4 justify-center px-1 text-[10px] ${
                    hasCritical ? 'bg-warning-foreground' : 'bg-primary'
                  } text-white`}
                >
                  {dayItems.length}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {monthItems.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Sin servicios programados este mes.
          </p>
        ) : (
          monthItems.map((it) => (
            <div
              key={it.planId}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{it.description}</span>
                {it.isCritical && (
                  <Badge className="bg-warning-foreground text-[10px] text-white">Crítico</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {it.nextServiceDate.split('-').reverse().join('/')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
