import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { MarkCompleteModal } from './MarkCompleteModal';

import type { CalendarItemDto } from '@kore/shared';

interface Props {
  item: CalendarItemDto;
  vehicleId: number;
  currentMileage: number;
  onMarkComplete: (planId: number, mileage: number, notes?: string) => Promise<void>;
}

export function CalendarItem({
  item,
  vehicleId: _vehicleId,
  currentMileage,
  onMarkComplete,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const isCompleted = !!item.lastLog;

  const borderClass = item.isCritical
    ? 'border-orange-300 bg-orange-50'
    : 'border-gray-200 bg-white';

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  return (
    <>
      <Card className={`rounded-2xl border shadow-sm ${borderClass}`}>
        <CardHeader className="px-5 pt-4 pb-2 flex flex-row items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-semibold text-gray-900 ${isCompleted ? 'line-through text-gray-400' : ''}`}
            >
              {item.description}
            </h3>
            {item.isCritical && <Badge className="bg-orange-500 text-white text-xs">Crítico</Badge>}
            {isCompleted && <Badge className="bg-green-500 text-white text-xs">Completado</Badge>}
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatDate(item.nextServiceDate)}
          </span>
        </CardHeader>

        <CardContent className="px-5 pb-5 space-y-3">
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Programado: {item.mileageInterval.toLocaleString()} km</span>
            {item.monthInterval && <span>/ {item.monthInterval} meses</span>}
          </div>
          <div className="text-sm font-medium text-gray-700">
            Faltan: <span className="text-blue-600">{item.kmRemaining.toLocaleString()} km</span>
          </div>

          {item.products.length > 0 && (
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Repuestos Necesarios
              </p>
              <ul className="space-y-1">
                {item.products.map((p) => (
                  <li key={p.id} className="flex justify-between text-sm text-gray-700">
                    <span>
                      {p.name} {p.quantity > 1 && `(x${p.quantity})`}
                    </span>
                    <span className="font-medium">${p.price.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isCompleted && item.lastLog && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
              <p className="font-medium text-green-800">
                Completado: {formatDate(item.lastLog.completedAt)}
              </p>
              <p className="text-green-700">
                Kilometraje: {item.lastLog.completedMileage.toLocaleString()} km
              </p>
              {item.lastLog.notes && (
                <p className="text-green-700 mt-1">Notas: {item.lastLog.notes}</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {!isCompleted && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowModal(true)}
              >
                ✔ Marcar Completado
              </Button>
            )}
            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200">
              Agregar Repuestos
            </Button>
          </div>
        </CardContent>
      </Card>

      <MarkCompleteModal
        open={showModal}
        planId={item.planId}
        currentMileage={currentMileage}
        onClose={() => setShowModal(false)}
        onConfirm={onMarkComplete}
      />
    </>
  );
}
