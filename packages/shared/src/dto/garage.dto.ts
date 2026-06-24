export interface CreateTaskPartPayload {
  productId: number;
  quantity?: number;
}

export interface CreateMaintenancePlanPayload {
  description: string;
  mileageInterval: number;
  monthInterval?: number;
  isCritical?: boolean;
  parts?: CreateTaskPartPayload[];
}

export interface CreateMaintenanceGuidePayload {
  modelId: number;
  description?: string;
  plans?: CreateMaintenancePlanPayload[];
}

export interface MaintenancePlanResponse {
  id: number;
  description: string;
  mileageInterval: number;
  monthInterval?: number;
  isCritical: boolean;
}

export interface MaintenanceGuideResponse {
  id: number;
  modeloId: number;
  descripcion?: string;
  modelo: { id: number; nombre: string; marca: { id: number; nombre: string } };
  plans: MaintenancePlanResponse[];
}

export interface CalendarProductDto {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface MaintenanceLogResponse {
  id: number;
  planId?: number;
  completedAt: string;
  completedMileage: number;
  notes?: string;
}

export interface CalendarItemDto {
  planId: number;
  description: string;
  mileageInterval: number;
  monthInterval?: number;
  isCritical: boolean;
  kmRemaining: number;
  nextServiceDate: string;
  lastLog?: MaintenanceLogResponse;
  products: CalendarProductDto[];
}
