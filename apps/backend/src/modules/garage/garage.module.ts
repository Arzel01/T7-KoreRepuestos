import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from '../products/entities/product.entity';

import { MaintenanceGuide } from './entities/maintenance-guide.entity';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { MaintenancePlan } from './entities/maintenance-plan.entity';
import { Marca } from './entities/marca.entity';
import { Modelo } from './entities/modelo.entity';
import { ProductTask } from './entities/product-task.entity';
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
      MaintenanceGuide,
      MaintenancePlan,
      MaintenanceLog,
      ProductTask,
      Product,
    ]),
  ],
  controllers: [VehiclesController],
  providers: [VehiclesRepository, MaintenanceLogRepository, VehiclesService],
})
export class GarageModule {}
