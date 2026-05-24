import { UserRole, type CreateUserDto, type UserResponse } from '@kore/shared';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersRepository } from './users.repository';

import type { User } from './entities/user.entity';

/**
 * Servicio de dominio de Usuarios.
 *
 * Encapsula:
 *   · Hashing de contraseñas (bcrypt) — coste configurable por entorno.
 *   · Reglas de negocio: email único, mapeo a `UserResponse` (sin password_hash).
 *
 * El controlador no toca bcrypt ni el repositorio directamente:
 * todo pasa por este servicio (principio de responsabilidad única + testabilidad).
 */
@Injectable()
export class UsersService {
  private readonly saltRounds: number;

  constructor(
    private readonly usersRepository: UsersRepository,
    config: ConfigService,
  ) {
    this.saltRounds = Number(config.get('BCRYPT_SALT_ROUNDS', '10'));
  }

  /** Crea un nuevo usuario. Lanza 409 si el email ya existe. */
  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    return this.usersRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role ?? UserRole.CLIENTE,
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  /** Búsqueda por email (case-insensitive). Devuelve `null` si no existe. */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email.toLowerCase());
  }

  /** Actualiza el campo `last_login_at`. Side-effect del login exitoso. */
  async markLastLogin(id: string): Promise<void> {
    return this.usersRepository.markLastLogin(id);
  }

  /** Verifica una contraseña plana contra el hash almacenado. */
  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Mapea la entidad interna `User` al DTO público `UserResponse`,
   * filtrando explícitamente `passwordHash` y `deletedAt`. Aplicar este
   * mapeo en un único punto reduce el riesgo de fugas de datos sensibles.
   */
  toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
