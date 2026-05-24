import { NotFoundException } from '@nestjs/common';
import type {
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';

import type { IRepository } from '../interfaces/repository.interface';

/**
 * Implementación base abstracta del patrón Repository sobre TypeORM.
 *
 * Provee las operaciones CRUD genéricas a cualquier repositorio concreto
 * (UsersRepository, ProductsRepository, etc.). Las clases derivadas solo
 * deben implementar métodos específicos del dominio (p. ej. findByEmail).
 *
 * Se inyecta vía Dependency Injection de NestJS — el contenedor resuelve
 * el `Repository<T>` desde `@nestjs/typeorm`, cerrando el ciclo de DI
 * sin acoplar el dominio al ORM.
 */
export abstract class BaseRepository<T extends ObjectLiteral>
  implements IRepository<T>
{
  protected constructor(protected readonly repository: Repository<T>) {}

  async findAll(filter?: Partial<T>): Promise<T[]> {
    return this.repository.find({
      where: filter as FindOptionsWhere<T> | undefined,
    });
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
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

  async update(id: string, data: Partial<T>): Promise<T> {
    await this.repository.update(
      id,
      data as Parameters<Repository<T>['update']>[1],
    );
    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException(
        `Entidad con id "${id}" no encontrada tras update`,
      );
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
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
