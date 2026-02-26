import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDatabaseRowDto {
  @ApiPropertyOptional({ example: 'Row Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Property values keyed by property ID',
    example: { 'prop-uuid-1': 'value', 'prop-uuid-2': ['option1', 'option2'] },
  })
  @IsObject()
  properties!: Record<string, unknown>;
}

export class UpdateDatabaseRowDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Property values to update' })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;
}

export class DatabaseRowResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  icon!: string | null;

  @ApiProperty()
  properties!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
