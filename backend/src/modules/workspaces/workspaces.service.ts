import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../../database/entities/workspace.entity.js';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity.js';
import { User } from '../../database/entities/user.entity.js';
import { WorkspaceRole } from '../../common/decorators/roles.decorator.js';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  WorkspaceResponseDto,
  WorkspaceDetailResponseDto,
  WorkspaceMemberResponseDto,
} from './dto/index.js';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllForUser(userId: string): Promise<WorkspaceResponseDto[]> {
    this.logger.debug(`Finding all workspaces for user: ${userId}`);

    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: ['workspace'],
    });

    return memberships.map((m) => this.mapToDto(m.workspace, m.role));
  }

  async findById(workspaceId: string, userId: string): Promise<WorkspaceDetailResponseDto> {
    this.logger.debug(`Finding workspace: ${workspaceId}`);

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const currentMember = workspace.members.find((m) => m.userId === userId);
    if (!currentMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return this.mapToDetailDto(workspace, currentMember.role);
  }

  async create(dto: CreateWorkspaceDto, userId: string): Promise<WorkspaceResponseDto> {
    this.logger.debug(`Creating workspace for user: ${userId}`);

    const workspace = this.workspaceRepository.create({
      name: dto.name,
      iconEmoji: dto.iconEmoji || '🏠',
      ownerId: userId,
    });

    await this.workspaceRepository.save(workspace);

    // Add creator as owner
    const membership = this.memberRepository.create({
      workspaceId: workspace.id,
      userId,
      role: WorkspaceRole.OWNER,
    });

    await this.memberRepository.save(membership);

    return this.mapToDto(workspace, WorkspaceRole.OWNER);
  }

  async update(
    workspaceId: string,
    dto: UpdateWorkspaceDto,
    userId: string,
  ): Promise<WorkspaceResponseDto> {
    this.logger.debug(`Updating workspace: ${workspaceId}`);

    const { workspace, role } = await this.getWorkspaceWithRole(workspaceId, userId);

    if (role !== WorkspaceRole.OWNER && role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only owners and admins can update workspace settings');
    }

    if (dto.name !== undefined) {
      workspace.name = dto.name;
    }

    if (dto.iconEmoji !== undefined) {
      workspace.iconEmoji = dto.iconEmoji;
    }

    await this.workspaceRepository.save(workspace);

    return this.mapToDto(workspace, role);
  }

  async delete(workspaceId: string, userId: string): Promise<void> {
    this.logger.debug(`Deleting workspace: ${workspaceId}`);

    const { workspace, role } = await this.getWorkspaceWithRole(workspaceId, userId);

    if (role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only the owner can delete a workspace');
    }

    await this.workspaceRepository.remove(workspace);
  }

  async inviteMember(
    workspaceId: string,
    dto: InviteMemberDto,
    inviterId: string,
  ): Promise<WorkspaceMemberResponseDto> {
    this.logger.debug(`Inviting ${dto.email} to workspace: ${workspaceId}`);

    const { role: inviterRole } = await this.getWorkspaceWithRole(workspaceId, inviterId);

    if (inviterRole !== WorkspaceRole.OWNER && inviterRole !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only owners and admins can invite members');
    }

    const user = await this.userRepository.findOne({ where: { email: dto.email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.memberRepository.findOne({
      where: { workspaceId, userId: user.id },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const membership = this.memberRepository.create({
      workspaceId,
      userId: user.id,
      role: dto.role || WorkspaceRole.MEMBER,
    });

    await this.memberRepository.save(membership);

    return this.mapMemberToDto(membership, user);
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
    updaterId: string,
  ): Promise<WorkspaceMemberResponseDto> {
    this.logger.debug(`Updating role for user ${targetUserId} in workspace: ${workspaceId}`);

    const { role: updaterRole } = await this.getWorkspaceWithRole(workspaceId, updaterId);

    if (updaterRole !== WorkspaceRole.OWNER && updaterRole !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only owners and admins can change member roles');
    }

    const membership = await this.memberRepository.findOne({
      where: { workspaceId, userId: targetUserId },
      relations: ['user'],
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (membership.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot change the owner role');
    }

    if (dto.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot assign owner role');
    }

    membership.role = dto.role;
    await this.memberRepository.save(membership);

    return this.mapMemberToDto(membership, membership.user);
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
    removerId: string,
  ): Promise<void> {
    this.logger.debug(`Removing user ${targetUserId} from workspace: ${workspaceId}`);

    const { role: removerRole } = await this.getWorkspaceWithRole(workspaceId, removerId);

    if (removerRole !== WorkspaceRole.OWNER && removerRole !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only owners and admins can remove members');
    }

    const membership = await this.memberRepository.findOne({
      where: { workspaceId, userId: targetUserId },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (membership.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    await this.memberRepository.remove(membership);
  }

  async getMemberRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    const membership = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });

    return membership?.role || null;
  }

  private async getWorkspaceWithRole(
    workspaceId: string,
    userId: string,
  ): Promise<{ workspace: Workspace; role: WorkspaceRole }> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return { workspace, role: membership.role };
  }

  private mapToDto(workspace: Workspace, role: WorkspaceRole): WorkspaceResponseDto {
    return {
      id: workspace.id,
      name: workspace.name,
      iconEmoji: workspace.iconEmoji,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      currentUserRole: role,
    };
  }

  private mapToDetailDto(
    workspace: Workspace,
    role: WorkspaceRole,
  ): WorkspaceDetailResponseDto {
    return {
      ...this.mapToDto(workspace, role),
      members: workspace.members.map((m) => this.mapMemberToDto(m, m.user)),
    };
  }

  private mapMemberToDto(
    member: WorkspaceMember,
    user: User,
  ): WorkspaceMemberResponseDto {
    return {
      id: member.id,
      userId: member.userId,
      userName: user.name,
      userEmail: user.email,
      userAvatarUrl: user.avatarUrl,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }
}
