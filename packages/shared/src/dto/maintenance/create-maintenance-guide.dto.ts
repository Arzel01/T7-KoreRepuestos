export interface CreateTaskProductDto {
  productId: number;
  quantity: number;
}

export interface CreateMaintenanceTaskDto {
  taskDescription: string;
  mileageInterval: number;
  products: CreateTaskProductDto[];
}

export interface CreateMaintenanceGuideDto {
  modelId: number;
  description: string;
  tasks: CreateMaintenanceTaskDto[];
}
