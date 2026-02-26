import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '../../../common/decorators/roles.decorator.js';

export class InviteMemberDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;
}
