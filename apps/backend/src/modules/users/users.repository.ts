import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../../common/repositories/base.repository';

import { User } from './entities/user.entity';

import type { Repository } from 'typeorm';

@Injectable()
export class UsersRepository extends BaseRepository<User, number> {
  constructor(
    @InjectRepository(User)
    protected readonly repository: Repository<User>,
  ) {
    super(repository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findActiveById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id, isActive: true } });
  }
}
