import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { UpdateMileageModal } from './UpdateMileageModal';

import type { CalendarItemDto, VehicleResponse } from '@kore/shared';

interface Props {
  vehicle: VehicleResponse;
  nextService?: CalendarItemDto;
  onUpdateMileage: (mileage: number) => Promise<void>;
  onDelete: () => void;
}

export function VehicleCard({ vehicle, nextService, onUpdateMileage, onDelete }: Props) {
  const navigate = useNavigate();
  const [showMileage, setShowMileage] = useState(false);

  const vehicleName =
    `${vehicle.model?.marca?.nombre ?? ''} ${vehicle.model?.nombre ?? ''} ${vehicle.year}`.trim();

  return (
    <>
      <Card className="w-full bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
        <CardHeader className="px-6 pt-5 pb-3 flex flex-row items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{vehicleName}</h3>
            {vehicle.alias && (
              <Badge variant="secondary" className="mt-1">
                {vehicle.alias}
              </Badge>
            )}
          </div>
          <button
            type="button"
            aria-label="Eliminar vehículo"
            onClick={onDelete}
            className="text-gray-400 hover:text-red-500 transition-colors mt-0.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        </CardHeader>

        <CardContent className="px-6 pb-5 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Kilometraje Actual</p>
              <p className="text-2xl font-bold text-gray-900">
                {vehicle.currentMileage.toLocaleString()} km
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMileage(true)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
            >
              Actualizar
            </button>
          </div>

          {nextService && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-700 uppercase tracking-wide font-medium mb-1">
                Próximo Mantenimiento
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {nextService.description} — {nextService.mileageInterval.toLocaleString()} km
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                En {nextService.kmRemaining.toLocaleString()} km
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={() => navigate(`/garage/${vehicle.id}/calendar`)}>
              Ver Calendario
            </Button>
          </div>
        </CardContent>
      </Card>

      <UpdateMileageModal
        open={showMileage}
        currentMileage={vehicle.currentMileage}
        onClose={() => setShowMileage(false)}
        onSave={onUpdateMileage}
      />
    </>
  );
}
