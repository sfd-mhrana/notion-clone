import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum ExportFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
}

export class ExportPageDto {
  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @IsOptional()
  @IsBoolean()
  includeChildren?: boolean = false;
}

export class ExportWorkspaceDto {
  @IsEnum(ExportFormat)
  format!: ExportFormat;
}

export class ExportResponseDto {
  filename!: string;
  contentType!: string;
  content!: string | Buffer;
}
