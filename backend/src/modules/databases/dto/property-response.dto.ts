import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '../../../database/entities/database-property.entity.js';

export class PropertyResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pageId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: PropertyType })
  type!: PropertyType;

  @ApiProperty()
  config!: Record<string, unknown>;

  @ApiProperty()
  order!: number;
}
