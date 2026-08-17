import { VehiclesRepository } from './vehicles.repository';

import type { VehicleUser } from './entities/vehicle-user.entity';
import type { Repository } from 'typeorm';

describe('VehiclesRepository.incrementAllMileage — avance en lotes', () => {
  it('recorre lotes por keyset (id > lastId) hasta un lote incompleto, sin OFFSET', async () => {
    const query = jest.fn();
    // Lote 1 lleno (500 filas, ids 1..500) → sigue. Lote 2 incompleto (ids 501..503) → corta.
    query
      .mockResolvedValueOnce(
        Array.from({ length: 500 }, (_, i) => ({ id_vehiculo_usuario: i + 1 })),
      )
      .mockResolvedValueOnce([
        { id_vehiculo_usuario: 501 },
        { id_vehiculo_usuario: 502 },
        { id_vehiculo_usuario: 503 },
      ]);

    const repo = { query } as unknown as Repository<VehicleUser>;
    const repository = new VehiclesRepository(repo);

    const total = await repository.incrementAllMileage();

    expect(total).toBe(503);
    expect(query).toHaveBeenCalledTimes(2);
    // Primer lote arranca en 0 (sin filtro real); segundo continúa desde el último id visto.
    expect(query.mock.calls[0][1]).toEqual([0, 500]);
    expect(query.mock.calls[1][1]).toEqual([500, 500]);
  });

  it('no hace ninguna consulta extra cuando no hay vehículos', async () => {
    const query = jest.fn().mockResolvedValueOnce([]);
    const repo = { query } as unknown as Repository<VehicleUser>;
    const repository = new VehiclesRepository(repo);

    const total = await repository.incrementAllMileage();

    expect(total).toBe(0);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
