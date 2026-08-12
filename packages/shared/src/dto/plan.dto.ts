import type { CalendarItemDto } from './garage.dto';

/**
 * Respuesta del plan de mantenimiento de un vehículo (US#3).
 * Reúne los servicios próximos (misma forma que el calendario) más la
 * agregación de costos y contadores para la vista de plan/dashboard.
 */
export interface VehiclePlanResponse {
  vehicleId: number;
  alias?: string;
  year: number;
  currentMileage: number;
  averageDailyMileage: number;
  model: { id: number; nombre: string; marca: { id: number; nombre: string } };
  /** Servicios ordenados por `nextServiceDate` ascendente. */
  services: CalendarItemDto[];
  /** Σ de `estimatedCost` de todos los servicios del plan. */
  estimatedTotalCost: number;
  /** Fecha del próximo servicio (el más cercano), o `undefined` si no hay tareas. */
  nextServiceDate?: string;
  /** Nº de servicios marcados como críticos. */
  criticalCount: number;
  /** Nº de servicios ya vencidos (`kmRemaining === 0`). */
  overdueCount: number;
}

/** Un ítem del plan es exactamente un ítem de calendario (alias semántico). */
export type PlanServiceItem = CalendarItemDto;
