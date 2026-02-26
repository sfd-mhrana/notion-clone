import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesController } from './workspaces.controller.js';
import { WorkspacesService } from './workspaces.service.js';
import { Workspace } from '../../database/entities/workspace.entity.js';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity.js';
import { User } from '../../database/entities/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember, User])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
