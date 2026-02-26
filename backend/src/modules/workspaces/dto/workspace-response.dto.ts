import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '../../../common/decorators/roles.decorator.js';

export class WorkspaceMemberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userName!: string;

  @ApiProperty()
  userEmail!: string;

  @ApiProperty({ nullable: true })
  userAvatarUrl!: string | null;

  @ApiProperty({ enum: WorkspaceRole })
  role!: WorkspaceRole;

  @ApiProperty()
  joinedAt!: Date;
}

export class WorkspaceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  iconEmoji!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ enum: WorkspaceRole })
  currentUserRole!: WorkspaceRole;
}

export class WorkspaceDetailResponseDto extends WorkspaceResponseDto {
  @ApiProperty({ type: [WorkspaceMemberResponseDto] })
  members!: WorkspaceMemberResponseDto[];
}
