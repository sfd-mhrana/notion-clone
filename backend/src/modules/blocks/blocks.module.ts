import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlocksController } from './blocks.controller.js';
import { BlocksService } from './blocks.service.js';
import { Block } from '../../database/entities/block.entity.js';
import { Page } from '../../database/entities/page.entity.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Block, Page]),
    WorkspacesModule,
  ],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
