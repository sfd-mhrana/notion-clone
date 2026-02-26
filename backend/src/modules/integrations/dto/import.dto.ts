import { IsEnum, IsUUID, IsOptional, IsString } from 'class-validator';

export enum ImportFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
}

export class ImportPageDto {
  @IsString()
  content!: string;

  @IsEnum(ImportFormat)
  format!: ImportFormat;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class ImportResponseDto {
  pageId!: string;
  title!: string;
  blocksCreated!: number;
}
