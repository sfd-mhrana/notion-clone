import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabasesController } from './databases.controller.js';
import { DatabasesService } from './databases.service.js';
import { Page } from '../../database/entities/page.entity.js';
import { DatabaseProperty } from '../../database/entities/database-property.entity.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Page, DatabaseProperty]),
    WorkspacesModule,
  ],
  controllers: [DatabasesController],
  providers: [DatabasesService],
  exports: [DatabasesService],
})
export class DatabasesModule {}
