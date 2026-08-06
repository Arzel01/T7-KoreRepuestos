/**
 * Registros de mantenimiento (Módulo 3 · US#4).
 *
 * Un "registro" es un mantenimiento marcado como completado por el usuario;
 * persiste en `historial_mantenimiento` (misma tabla que los logs del garaje).
 * Expone un API dedicado `/maintenance/records` centrado en el historial y el
 * campo de observaciones (`comentarios` → `notes`).
 */

export interface CreateMaintenanceRecordPayload {
  vehicleId: number;
  /** Tarea del plan que se completó (opcional: puede ser un servicio libre). */
  planId?: number;
  completedMileage: number;
  /** Fecha del servicio (YYYY-MM-DD). Por defecto hoy si se omite. */
  completedAt?: string;
  /** Observaciones / notas del servicio. */
  notes?: string;
}

export interface MaintenanceRecordResponse {
  id: number;
  vehicleId: number;
  planId?: number;
  /** Descripción de la tarea del plan, si el registro está ligado a una. */
  planDescription?: string;
  completedAt: string;
  completedMileage: number;
  notes?: string;
}
