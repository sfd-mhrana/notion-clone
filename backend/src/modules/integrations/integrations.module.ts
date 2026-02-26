import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportService } from './export.service.js';
import { ImportService } from './import.service.js';
import { IntegrationsController } from './integrations.controller.js';
import { Page } from '../../database/entities/page.entity.js';
import { Block } from '../../database/entities/block.entity.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Page, Block]),
    WorkspacesModule,
  ],
  controllers: [IntegrationsController],
  providers: [ExportService, ImportService],
  exports: [ExportService, ImportService],
})
export class IntegrationsModule {}
