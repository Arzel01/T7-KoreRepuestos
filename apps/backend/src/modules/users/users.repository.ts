import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseRepository } from '../../common/repositories/base.repository';

import { User } from './entities/user.entity';

/**
 * Repositorio concreto de Usuarios.
 *
 * Hereda toda la API CRUD genérica de `BaseRepository<User>` (findAll,
 * findById, create, update, delete, count, exists) y añade búsquedas
 * específicas del dominio que no encajan en el contrato genérico.
 *
 * Demuestra que la inyección de dependencias del Sprint 0 funciona:
 *   1. `@InjectRepository(User)` resuelve el repo de TypeORM.
 *   2. Lo pasa al constructor del `BaseRepository` (clase abstracta).
 *   3. Los servicios de dominio inyectan `UsersRepository` y operan
 *      contra la interfaz `IRepository<User>`, no contra TypeORM directo.
 */
@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    protected readonly repository: Repository<User>,
  ) {
    super(repository);
  }

  // -- Métodos específicos del dominio Usuario ------------------------------

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findActiveById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id, isActive: true },
    });
  }

  async markLastLogin(id: string): Promise<void> {
    await this.repository.update(id, { lastLoginAt: new Date() });
  }
}
