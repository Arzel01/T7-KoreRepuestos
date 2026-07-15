import { AlertCircle, Search, Wrench } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { maintenanceApi } from '@/features/products/server/products.api';
import { extractApiErrorMessage } from '@/lib/api-client';

import type { MileagePartResponse } from '@kore/shared';

export function MileageSearch(): JSX.Element {
  const [mileage, setMileage] = useState('');
  const [parts, setParts] = useState<MileagePartResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (): Promise<void> => {
    const km = parseInt(mileage, 10);
    if (isNaN(km) || km <= 0) {
      setError('Ingresa un kilometraje válido');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await maintenanceApi.findPartsByMileage(km);
      setParts(result);
      setSearched(true);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-neutral-200">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg text-neutral-900">
          <Wrench className="w-5 h-5 text-navy-600" />
          Búsqueda por kilometraje
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <p className="text-sm text-neutral-600">
          Ingresa el kilometraje actual de tu vehículo para ver las piezas de mantenimiento
          recomendadas.
        </p>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Ej: 50000"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            min={1}
            className="flex-1"
          />
          <Button onClick={() => void handleSearch()} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Buscando...' : 'Buscar piezas'}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {searched && parts.length === 0 && !loading && (
          <p className="text-sm text-neutral-500 italic">
            No se encontraron piezas de mantenimiento para ese kilometraje.
          </p>
        )}

        {parts.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-neutral-700">
              {parts.length} pieza{parts.length !== 1 ? 's' : ''} recomendada
              {parts.length !== 1 ? 's' : ''}:
            </p>
            {parts.map((part) => (
              <div
                key={part.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-neutral-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-neutral-900 text-sm truncate">{part.name}</p>
                    {part.isCritical && (
                      <Badge variant="destructive" className="text-xs">
                        Crítica
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">
                    {part.taskDescription} — cada {part.mileageInterval.toLocaleString('es-AR')} km
                  </p>
                  <p className="text-xs text-neutral-500 font-mono">SKU: {part.sku}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-navy-700">${part.price.toFixed(2)}</p>
                  <p className="text-xs text-neutral-500">Cant: {part.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
