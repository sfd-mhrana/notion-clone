import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesController } from './pages.controller.js';
import { PagesService } from './pages.service.js';
import { Page } from '../../database/entities/page.entity.js';
import { Block } from '../../database/entities/block.entity.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Page, Block]),
    WorkspacesModule,
  ],
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
