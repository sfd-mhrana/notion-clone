import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesController } from './templates.controller.js';
import { TemplatesService } from './templates.service.js';
import { Template } from './entities/template.entity.js';
import { PagesModule } from '../pages/pages.module.js';
import { BlocksModule } from '../blocks/blocks.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Template]),
    PagesModule,
    BlocksModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
