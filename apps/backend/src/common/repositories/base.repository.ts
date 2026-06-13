import { NotFoundException } from '@nestjs/common';

import type { IRepository } from '../interfaces/repository.interface';
import type { DeepPartial, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';

/**
 * Implementación base abstracta del patrón Repository sobre TypeORM.
 *
 * @typeParam T  - Entidad gestionada.
 * @typeParam ID - Tipo del identificador primario. `string` para UUIDs,
 *                `number` para secuencias integer (schema real en español).
 */
export abstract class BaseRepository<
  T extends ObjectLiteral,
  ID extends string | number = string,
> implements IRepository<T, ID> {
  protected constructor(protected readonly repository: Repository<T>) {}

  async findAll(filter?: Partial<T>): Promise<T[]> {
    return this.repository.find({
      where: filter as FindOptionsWhere<T> | undefined,
    });
  }

  async findById(id: ID): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
    });
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    return this.repository.findOne({
      where: filter as FindOptionsWhere<T>,
    });
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as DeepPartial<T>);
    return this.repository.save(entity);
  }

  async update(id: ID, data: Partial<T>): Promise<T> {
    await this.repository.update(
      id as string | number,
      data as Parameters<Repository<T>['update']>[1],
    );
    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException(`Entidad con id "${id}" no encontrada tras update`);
    }
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const result = await this.repository.delete(id as string | number);
    return (result.affected ?? 0) > 0;
  }

  async count(filter?: Partial<T>): Promise<number> {
    return this.repository.count({
      where: filter as FindOptionsWhere<T> | undefined,
    });
  }

  async exists(filter: Partial<T>): Promise<boolean> {
    const count = await this.count(filter);
    return count > 0;
  }
}
