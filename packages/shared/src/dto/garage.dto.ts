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
