import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Modelo } from '../garage/entities/modelo.entity';

import { MaintenanceGuide } from './entities/maintenance-guide.entity';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { MaintenancePlan } from './entities/maintenance-plan.entity';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceGuide, MaintenancePlan, MaintenanceLog, Modelo])],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
