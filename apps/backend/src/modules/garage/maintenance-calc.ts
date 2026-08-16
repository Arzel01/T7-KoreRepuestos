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
  /** Kilometraje al que se registró el último servicio de la tarea, si existe. */
  lastCompletedMileage?: number | null;
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
  const {
    mileageInterval,
    monthInterval,
    currentMileage,
    averageDailyMileage,
    lastCompletedAt,
    lastCompletedMileage,
  } = input;

  // Objetivo de km del próximo ciclo. Con un último servicio registrado, el
  // objetivo es fijo (última vez + intervalo): si el vehículo ya lo pasó,
  // queda vencido (0 km) y se mantiene así hasta que se registre el próximo
  // servicio — no "se le escapa" al siguiente múltiplo solo por seguir
  // rodando. Sin historial no hay ancla: se asume el múltiplo más próximo
  // desde el kilometraje actual (no acusa vencidos retroactivos al agregar
  // un vehículo usado sin historial cargado).
  const interval = mileageInterval > 0 ? mileageInterval : 0;
  let kmRemaining = 0;
  let daysUntilKm = Number.POSITIVE_INFINITY;

  if (interval > 0) {
    let nextKmTarget: number;
    if (lastCompletedMileage != null) {
      nextKmTarget = lastCompletedMileage + interval;
    } else {
      const cycleKm = Math.floor(currentMileage / interval) * interval;
      nextKmTarget = cycleKm < currentMileage ? cycleKm + interval : cycleKm;
    }
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

/** Umbrales de kilometraje restante para escalar la urgencia del recordatorio. */
export const KM_REMINDER_THRESHOLDS = { proximo: 1000, urgente: 100 } as const;

export type ReminderUrgency = 'proximo' | 'urgente' | 'vencido';

/**
 * Clasifica la urgencia del recordatorio de una tarea, o `null` si todavía no
 * corresponde avisar. Dos disparadores independientes, el que aplique gana:
 * - Kilometraje restante: escalona en tramos (1000 km → "próximo",
 *   100 km → "urgente", 0 km → "vencido") en vez de un único aviso de último
 *   momento.
 * - Fecha: cubre tareas dominadas por el intervalo en meses, donde puede
 *   faltar mucho kilometraje todavía pero la fecha ya está dentro de la
 *   ventana `daysBefore` configurada por el usuario.
 */
export function classifyReminder(
  result: NextServiceResult,
  daysBefore: number,
): ReminderUrgency | null {
  if (result.kmRemaining === 0) return 'vencido';
  if (result.kmRemaining <= KM_REMINDER_THRESHOLDS.urgente) return 'urgente';
  if (result.kmRemaining <= KM_REMINDER_THRESHOLDS.proximo) return 'proximo';
  if (result.daysRemaining <= daysBefore) return 'proximo';
  return null;
}
