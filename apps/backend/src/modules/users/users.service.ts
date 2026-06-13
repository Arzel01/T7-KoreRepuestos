import { UserRole, type CreateUserDto, type UserResponse } from '@kore/shared';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersRepository } from './users.repository';

import type { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly saltRounds: number;

  constructor(
    private readonly usersRepository: UsersRepository,
    config: ConfigService,
  ) {
    this.saltRounds = Number(config.get('BCRYPT_SALT_ROUNDS', '10'));
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    return this.usersRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      // firstName + lastName se combinan en el campo `nombres` del schema real
      nombres: `${dto.firstName} ${dto.lastName}`,
      telefono: dto.phone,
      role: dto.role ?? UserRole.CLIENTE,
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email.toLowerCase());
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Mapea la entidad `User` al DTO público `UserResponse`.
   * Separa `nombres` por el primer espacio para reconstruir firstName/lastName.
   */
  toResponse(user: User): UserResponse {
    const spaceIdx = user.nombres.indexOf(' ');
    const firstName = spaceIdx >= 0 ? user.nombres.slice(0, spaceIdx) : user.nombres;
    const lastName = spaceIdx >= 0 ? user.nombres.slice(spaceIdx + 1) : '';

    return {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      phone: user.telefono,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.creadoEn.toISOString(),
    };
  }
}
