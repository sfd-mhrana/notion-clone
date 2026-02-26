import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  icon!: string | null;

  @ApiPropertyOptional()
  coverImage!: string | null;

  @ApiProperty()
  workspaceId!: string;

  @ApiPropertyOptional()
  parentId!: string | null;

  @ApiProperty()
  isDatabase!: boolean;

  @ApiProperty()
  isTemplate!: boolean;

  @ApiProperty()
  order!: string;

  @ApiProperty()
  createdById!: string;

  @ApiProperty()
  updatedById!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PageTreeNodeDto extends PageResponseDto {
  @ApiProperty({ type: [PageTreeNodeDto] })
  children!: PageTreeNodeDto[];
}

export class TrashPageDto extends PageResponseDto {
  @ApiProperty()
  deletedAt!: Date;
}
