import { MileageSource } from '../enums/mileage-source.enum';

export interface CreateVehicleDto {
  brandId: number;
  modelId: number;
  year: number;
  plate?: string;
  currentMileage: number;
  averageDailyMileage?: number;
  alias?: string;
}

export interface UpdateMileageDto {
  currentMileage: number;
  source?: MileageSource;
}

export interface CreateMaintenanceLogDto {
  planId?: number;
  completedMileage: number;
  notes?: string;
}

export interface MarcaResponse {
  id: number;
  nombre: string;
}

export interface ModeloResponse {
  id: number;
  nombre: string;
  anioInicio?: number;
  anioFin?: number;
  marca: MarcaResponse;
}

export interface VehicleResponse {
  id: number;
  alias?: string;
  year: number;
  plate?: string;
  currentMileage: number;
  aiEstimatedMileage?: number;
  lastMileageSource?: MileageSource;
  averageDailyMileage: number;
  createdAt: string;
  model: ModeloResponse;
}
