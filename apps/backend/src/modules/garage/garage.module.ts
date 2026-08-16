import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsModule } from '../notifications/notifications.module';
import { Product } from '../products/entities/product.entity';

import { MaintenanceGuide } from './entities/maintenance-guide.entity';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { MaintenancePlan } from './entities/maintenance-plan.entity';
import { Marca } from './entities/marca.entity';
import { Modelo } from './entities/modelo.entity';
import { ProductTask } from './entities/product-task.entity';
import { VehicleUser } from './entities/vehicle-user.entity';
import { MaintenanceGuideRepository } from './maintenance-guide.repository';
import { MaintenanceGuidesController } from './maintenance-guides.controller';
import { MaintenanceGuidesService } from './maintenance-guides.service';
import { MaintenanceLogRepository } from './maintenance-log.repository';
import { MaintenancePlannerService } from './maintenance-planner.service';
import { MaintenanceRecordsController } from './maintenance-records.controller';
import { MaintenanceRecordsService } from './maintenance-records.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';
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
    NotificationsModule,
  ],
  controllers: [VehiclesController, MaintenanceGuidesController, MaintenanceRecordsController],
  providers: [
    VehiclesRepository,
    MaintenanceLogRepository,
    MaintenancePlannerService,
    ReminderSchedulerService,
    VehiclesService,
    MaintenanceGuideRepository,
    MaintenanceGuidesService,
    MaintenanceRecordsService,
  ],
  exports: [ReminderSchedulerService],
})
export class GarageModule {}
