import { Module } from '@nestjs/common';
import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';

@Module({
  imports: [WorkspacesModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
