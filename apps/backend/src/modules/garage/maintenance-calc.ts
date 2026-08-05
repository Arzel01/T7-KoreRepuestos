import type { CalendarItemDto } from '@kore/shared';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Horizonte lejano cuando no hay datos suficientes para estimar (km/día = 0 y sin intervalo por meses). */
const FAR_FUTURE_DAYS = 3650;

export interface NextServiceInput {
  /** Intervalo de kilometraje de la tarea (> 0). */
  mileageInterval: number;
  /** Intervalo en meses, si la tarea también es por tiempo. */
  monthInterval?: number | null;
  /** Kilometraje actual del vehículo. */
  currentMileage: number;
  /** Promedio de km/día del vehículo (para estimar la fecha). */
  averageDailyMileage: number;
  /** Fecha (ISO `yyyy-mm-dd`) del último servicio registrado para la tarea, si existe. */
  lastCompletedAt?: string | null;
}

export interface NextServiceResult {
  /** Kilómetros restantes hasta el próximo servicio (0 si está vencido). */
  kmRemaining: number;
  /** Fecha estimada del próximo servicio (`yyyy-mm-dd`). */
  nextServiceDate: string;
  /** Días restantes hasta `nextServiceDate` (>= 0). */
  daysRemaining: number;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Núcleo puro del algoritmo de mantenimiento (US#3). Determina el próximo
 * servicio tomando **el más cercano** entre el disparador por kilometraje y el
 * disparador por tiempo (meses). Sin dependencias de BD para poder testearlo.
 *
 * `now` se inyecta para tests deterministas (por defecto, el momento actual).
 */
export function computeNextService(
  input: NextServiceInput,
  now: Date = new Date(),
): NextServiceResult {
  const { mileageInterval, monthInterval, currentMileage, averageDailyMileage, lastCompletedAt } =
    input;

  // Objetivo de km del próximo ciclo (múltiplo del intervalo por encima del actual).
  const interval = mileageInterval > 0 ? mileageInterval : 0;
  let kmRemaining = 0;
  let daysUntilKm = Number.POSITIVE_INFINITY;

  if (interval > 0) {
    const cycleKm = Math.floor(currentMileage / interval) * interval;
    const nextKmTarget = cycleKm < currentMileage ? cycleKm + interval : cycleKm;
    kmRemaining = Math.max(0, nextKmTarget - currentMileage);
    daysUntilKm =
      averageDailyMileage > 0 ? kmRemaining / averageDailyMileage : Number.POSITIVE_INFINITY;
  }

  // Fecha por kilometraje (si es estimable).
  let nextServiceDate: Date | null = Number.isFinite(daysUntilKm)
    ? addDays(now, Math.ceil(daysUntilKm))
    : null;

  // Fecha por tiempo (meses): se toma la más temprana entre ambas.
  if (monthInterval) {
    const base = lastCompletedAt ? new Date(lastCompletedAt) : now;
    const byMonths = addMonths(base, monthInterval);
    if (!nextServiceDate || byMonths < nextServiceDate) {
      nextServiceDate = byMonths;
    }
  }

  // Sin km/día ni intervalo por meses: no hay forma de estimar → horizonte lejano.
  if (!nextServiceDate) {
    nextServiceDate = addDays(now, FAR_FUTURE_DAYS);
  }

  const daysRemaining = Math.max(
    0,
    Math.round((nextServiceDate.getTime() - now.getTime()) / MS_PER_DAY),
  );

  return { kmRemaining, nextServiceDate: toIsoDate(nextServiceDate), daysRemaining };
}

/** Costo estimado de una tarea: Σ `price × quantity` de sus repuestos. */
export function estimateCost(products: ReadonlyArray<{ price: number; quantity: number }>): number {
  return products.reduce((sum, p) => sum + p.price * p.quantity, 0);
}

export interface PlanSummary {
  estimatedTotalCost: number;
  nextServiceDate?: string;
  criticalCount: number;
  overdueCount: number;
}

/** Agrega los servicios de un plan en totales para la vista de plan/dashboard. */
export function summarizePlan(services: ReadonlyArray<CalendarItemDto>): PlanSummary {
  const estimatedTotalCost = services.reduce((sum, s) => sum + s.estimatedCost, 0);
  const criticalCount = services.filter((s) => s.isCritical).length;
  const overdueCount = services.filter((s) => s.kmRemaining === 0).length;
  const nextServiceDate = services
    .map((s) => s.nextServiceDate)
    .sort((a, b) => a.localeCompare(b))[0];

  return { estimatedTotalCost, nextServiceDate, criticalCount, overdueCount };
}

/** ¿Está la tarea dentro de la ventana de anticipación configurada por el usuario? */
export function isDueWithin(result: NextServiceResult, daysBefore: number): boolean {
  return result.kmRemaining === 0 || result.daysRemaining <= daysBefore;
}
