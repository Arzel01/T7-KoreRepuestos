import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VehicleUser } from './entities/vehicle-user.entity';

// ponytail: tamaño fijo, hacer configurable (env) si el parque de vehículos
// crece tanto que este número deja de ser el punto justo entre "pocos viajes
// a la BD" y "lock/transacción demasiado grande".
const MILEAGE_BATCH_SIZE = 500;

@Injectable()
export class VehiclesRepository {
  constructor(
    @InjectRepository(VehicleUser)
    private readonly repo: Repository<VehicleUser>,
  ) {}

  findByUser(userId: number): Promise<VehicleUser[]> {
    return this.repo.find({
      where: { userId },
      relations: { model: { marca: true } },
      order: { createdAt: 'DESC' },
    });
  }

  /** Todos los vehículos (con modelo+marca) para el barrido de recordatorios. */
  findAllForReminders(): Promise<VehicleUser[]> {
    return this.repo.find({
      relations: { model: { marca: true } },
      order: { userId: 'ASC' },
    });
  }

  /**
   * Avance diario del odómetro: suma `kilometraje_diario_promedio` al
   * kilometraje de cada vehículo. Estimación — cualquier actualización manual
   * del usuario sigue siendo la fuente de verdad y este avance continúa
   * sumando desde ese nuevo valor al día siguiente.
   *
   * En lotes de `MILEAGE_BATCH_SIZE` (keyset por id, no OFFSET) en vez de un
   * único `UPDATE` sobre toda la tabla: con un parque de vehículos grande,
   * una sola sentencia mantendría el lock de todas las filas y una
   * transacción larga a la vez. Cada lote es su propia sentencia/transacción
   * corta. Devuelve el total de vehículos actualizados.
   */
  async incrementAllMileage(): Promise<number> {
    let lastId = 0;
    let totalAffected = 0;

    for (;;) {
      const rows: Array<{ id_vehiculo_usuario: number }> = await this.repo.query(
        `UPDATE vehiculos_usuario v
            SET kilometraje_actual = kilometraje_actual + kilometraje_diario_promedio
           FROM (
             SELECT id_vehiculo_usuario FROM vehiculos_usuario
              WHERE id_vehiculo_usuario > $1
              ORDER BY id_vehiculo_usuario
              LIMIT $2
           ) batch
          WHERE v.id_vehiculo_usuario = batch.id_vehiculo_usuario
          RETURNING v.id_vehiculo_usuario`,
        [lastId, MILEAGE_BATCH_SIZE],
      );
      if (rows.length === 0) break;

      totalAffected += rows.length;
      lastId = Math.max(...rows.map((r) => r.id_vehiculo_usuario));
      if (rows.length < MILEAGE_BATCH_SIZE) break;
    }

    return totalAffected;
  }

  findOne(id: number, userId: number): Promise<VehicleUser | null> {
    return this.repo.findOne({
      where: { id, userId },
      relations: { model: { marca: true } },
    });
  }

  async create(data: Partial<VehicleUser>): Promise<VehicleUser> {
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.repo.findOne({
      where: { id: saved.id },
      relations: { model: { marca: true } },
    }) as Promise<VehicleUser>;
  }

  async update(id: number, data: Partial<VehicleUser>): Promise<VehicleUser> {
    await this.repo.update(id, data);
    return this.repo.findOne({
      where: { id },
      relations: { model: { marca: true } },
    }) as Promise<VehicleUser>;
  }

  async updateMileage(id: number, mileage: number): Promise<void> {
    await this.repo.update(id, { currentMileage: mileage });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
