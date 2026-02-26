import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service.js';
import { CreateTemplateDto, UpdateTemplateDto, TemplateResponseDto } from './dto/index.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Templates')
@ApiBearerAuth()
@Controller('api/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiResponse({ status: 200, description: 'Returns list of templates' })
  async findAll(
    @CurrentUser() user: JwtUser,
    @Query('workspaceId') workspaceId?: string,
    @Query('category') category?: string,
  ): Promise<TemplateResponseDto[]> {
    return this.templatesService.findAll(user.sub, workspaceId, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Returns the template' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<TemplateResponseDto> {
    return this.templatesService.findOne(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async create(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: JwtUser,
  ): Promise<TemplateResponseDto> {
    return this.templatesService.create(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: JwtUser,
  ): Promise<TemplateResponseDto> {
    return this.templatesService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<void> {
    return this.templatesService.delete(id, user.sub);
  }

  @Post(':id/use')
  @ApiOperation({ summary: 'Use a template (increment usage count)' })
  @ApiResponse({ status: 200, description: 'Template usage recorded' })
  async useTemplate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.templatesService.incrementUsage(id);
  }
}
