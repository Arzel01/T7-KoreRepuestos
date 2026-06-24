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

export interface MaintenanceTaskResponse {
  id: number;
  brandId: number;
  modelId: number;
  brandName: string;
  modelName: string;
  mileageInterval: number;
  monthInterval?: number;
  description: string;
  isCritical: boolean;
  parts: number;
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

export interface MaintenanceGuideResponse {
  id: number;
  modelId: number;
  modelName: string;
  brandId: number;
  brandName: string;
  description?: string;
  tasks: MaintenanceTaskResponse[];
}
