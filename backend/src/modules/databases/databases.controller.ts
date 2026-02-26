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
import { DatabasesService } from './databases.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  PropertyResponseDto,
  CreateDatabaseRowDto,
  UpdateDatabaseRowDto,
  DatabaseRowResponseDto,
} from './dto/index.js';

@ApiTags('Databases')
@ApiBearerAuth()
@Controller()
export class DatabasesController {
  constructor(private readonly databasesService: DatabasesService) {}

  // ============ Database ============

  @Post('workspaces/:workspaceId/databases')
  @ApiOperation({ summary: 'Create a new database' })
  @ApiResponse({ status: 201 })
  async createDatabase(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body('title') title: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.databasesService.createDatabase(workspaceId, title, userId);
  }

  @Get('databases/:id')
  @ApiOperation({ summary: 'Get database with properties and rows' })
  @ApiResponse({ status: 200 })
  async getDatabase(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.databasesService.getDatabase(id, userId);
  }

  // ============ Properties ============

  @Get('databases/:databaseId/properties')
  @ApiOperation({ summary: 'Get all properties for a database' })
  @ApiResponse({ status: 200, type: [PropertyResponseDto] })
  async getProperties(
    @Param('databaseId', ParseUUIDPipe) databaseId: string,
    @CurrentUser('id') userId: string,
  ): Promise<PropertyResponseDto[]> {
    return this.databasesService.getProperties(databaseId, userId);
  }

  @Post('databases/:databaseId/properties')
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, type: PropertyResponseDto })
  async createProperty(
    @Param('databaseId', ParseUUIDPipe) databaseId: string,
    @Body() dto: CreatePropertyDto,
    @CurrentUser('id') userId: string,
  ): Promise<PropertyResponseDto> {
    return this.databasesService.createProperty(databaseId, dto, userId);
  }

  @Patch('properties/:id')
  @ApiOperation({ summary: 'Update a property' })
  @ApiResponse({ status: 200, type: PropertyResponseDto })
  async updateProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser('id') userId: string,
  ): Promise<PropertyResponseDto> {
    return this.databasesService.updateProperty(id, dto, userId);
  }

  @Delete('properties/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a property' })
  @ApiResponse({ status: 204 })
  async deleteProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.databasesService.deleteProperty(id, userId);
  }

  // ============ Rows ============

  @Get('databases/:databaseId/rows')
  @ApiOperation({ summary: 'Get all rows in a database' })
  @ApiResponse({ status: 200, type: [DatabaseRowResponseDto] })
  async getRows(
    @Param('databaseId', ParseUUIDPipe) databaseId: string,
    @CurrentUser('id') userId: string,
  ): Promise<DatabaseRowResponseDto[]> {
    return this.databasesService.getRows(databaseId, userId);
  }

  @Post('databases/:databaseId/rows')
  @ApiOperation({ summary: 'Create a new row in a database' })
  @ApiResponse({ status: 201, type: DatabaseRowResponseDto })
  async createRow(
    @Param('databaseId', ParseUUIDPipe) databaseId: string,
    @Body() dto: CreateDatabaseRowDto,
    @CurrentUser('id') userId: string,
  ): Promise<DatabaseRowResponseDto> {
    return this.databasesService.createRow(databaseId, dto, userId);
  }

  @Patch('rows/:id')
  @ApiOperation({ summary: 'Update a row' })
  @ApiResponse({ status: 200, type: DatabaseRowResponseDto })
  async updateRow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDatabaseRowDto,
    @CurrentUser('id') userId: string,
  ): Promise<DatabaseRowResponseDto> {
    return this.databasesService.updateRow(id, dto, userId);
  }

  @Delete('rows/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a row' })
  @ApiResponse({ status: 204 })
  async deleteRow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.databasesService.deleteRow(id, userId);
  }
}
