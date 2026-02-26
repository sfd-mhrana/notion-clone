import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  WorkspaceResponseDto,
  WorkspaceDetailResponseDto,
  WorkspaceMemberResponseDto,
} from './dto/index.js';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List all workspaces for the current user' })
  @ApiResponse({ status: 200, type: [WorkspaceResponseDto] })
  async findAll(@CurrentUser('id') userId: string): Promise<WorkspaceResponseDto[]> {
    return this.workspacesService.findAllForUser(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, type: WorkspaceResponseDto })
  async create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser('id') userId: string,
  ): Promise<WorkspaceResponseDto> {
    return this.workspacesService.create(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details with members' })
  @ApiResponse({ status: 200, type: WorkspaceDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Not a member of this workspace' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<WorkspaceDetailResponseDto> {
    return this.workspacesService.findById(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace settings' })
  @ApiResponse({ status: 200, type: WorkspaceResponseDto })
  @ApiResponse({ status: 403, description: 'Only owners and admins can update workspace settings' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkspaceDto,
    @CurrentUser('id') userId: string,
  ): Promise<WorkspaceResponseDto> {
    return this.workspacesService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiResponse({ status: 204, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only the owner can delete a workspace' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.workspacesService.delete(id, userId);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite a user to the workspace by email' })
  @ApiResponse({ status: 201, type: WorkspaceMemberResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  async inviteMember(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser('id') inviterId: string,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.workspacesService.inviteMember(workspaceId, dto, inviterId);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update a member\'s role' })
  @ApiResponse({ status: 200, type: WorkspaceMemberResponseDto })
  @ApiResponse({ status: 403, description: 'Cannot change owner role or assign owner role' })
  async updateMemberRole(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser('id') updaterId: string,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.workspacesService.updateMemberRole(workspaceId, targetUserId, dto, updaterId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Cannot remove the workspace owner' })
  async removeMember(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @CurrentUser('id') removerId: string,
  ): Promise<void> {
    return this.workspacesService.removeMember(workspaceId, targetUserId, removerId);
  }
}
