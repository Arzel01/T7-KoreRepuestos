import { api } from '@/lib/api-client';

import type {
  CalendarItemDto,
  CreateMaintenanceLogDto,
  CreateVehicleDto,
  MaintenanceLogResponse,
  MarcaResponse,
  ModeloResponse,
  UpdateMileageDto,
  VehicleResponse,
} from '@kore/shared';

export const garageApi = {
  getBrands: (): Promise<MarcaResponse[]> => api.get('/vehicles/brands'),

  getModels: (brandId: number): Promise<ModeloResponse[]> =>
    api.get(`/vehicles/brands/${brandId}/models`),

  getVehicles: (): Promise<VehicleResponse[]> => api.get('/vehicles'),

  createVehicle: (payload: CreateVehicleDto): Promise<VehicleResponse> =>
    api.post('/vehicles', payload),

  deleteVehicle: (id: number): Promise<void> => api.delete(`/vehicles/${id}`),

  updateMileage: (id: number, payload: UpdateMileageDto): Promise<void> =>
    api.patch(`/vehicles/${id}/mileage`, payload),

  createLog: (
    vehicleId: number,
    payload: CreateMaintenanceLogDto,
  ): Promise<MaintenanceLogResponse> => api.post(`/vehicles/${vehicleId}/logs`, payload),

  getCalendar: (vehicleId: number): Promise<CalendarItemDto[]> =>
    api.get(`/vehicles/${vehicleId}/calendar`),
};
