import { MileageSource } from '@kore/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VehicleUser } from './entities/vehicle-user.entity';

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

  findOne(id: number, userId: number): Promise<VehicleUser | null> {
    return this.repo.findOne({
      where: { id, userId },
      relations: { model: { marca: true } },
    });
  }

  findById(id: number): Promise<VehicleUser | null> {
    return this.repo.findOne({
      where: { id },
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

  async updateMileageByUser(id: number, mileage: number): Promise<void> {
    await this.repo.update(id, {
      currentMileage: mileage,
      lastMileageSource: MileageSource.USUARIO,
    });
  }

  async updateMileageByAi(id: number, mileage: number): Promise<void> {
    await this.repo.update(id, {
      aiEstimatedMileage: mileage,
      lastMileageSource: MileageSource.IA,
    });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
