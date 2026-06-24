import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { MaintenancePlan } from '../maintenance/entities/maintenance-plan.entity';
import { Product } from '../products/entities/product.entity';

import { Marca } from './entities/marca.entity';
import { Modelo } from './entities/modelo.entity';
import { VehicleUser } from './entities/vehicle-user.entity';
import { MaintenanceLogRepository } from './maintenance-log.repository';
import { VehiclesController } from './vehicles.controller';
import { VehiclesRepository } from './vehicles.repository';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VehicleUser,
      Marca,
      Modelo,
      Product,
      MaintenanceLog,
      MaintenancePlan,
    ]),
  ],
  controllers: [VehiclesController],
  providers: [VehiclesRepository, MaintenanceLogRepository, VehiclesService],
})
export class GarageModule {}
