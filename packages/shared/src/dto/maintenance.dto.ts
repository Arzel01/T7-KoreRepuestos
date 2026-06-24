export interface CreateMaintenanceGuideDto {
  modelId: number;
  description?: string;
}

export interface CreateMaintenanceTaskDto {
  description: string;
  mileageInterval: number;
  monthInterval?: number;
  isCritical?: boolean;
}
