import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../database/entities/page.entity.js';
import { DatabaseProperty } from '../../database/entities/database-property.entity.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  PropertyResponseDto,
  CreateDatabaseRowDto,
  UpdateDatabaseRowDto,
  DatabaseRowResponseDto,
} from './dto/index.js';

@Injectable()
export class DatabasesService {
  private readonly logger = new Logger(DatabasesService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(DatabaseProperty)
    private readonly propertyRepository: Repository<DatabaseProperty>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  // ============ Database Management ============

  async createDatabase(
    workspaceId: string,
    title: string,
    userId: string,
  ): Promise<Page> {
    this.logger.debug(`Creating database in workspace: ${workspaceId}`);

    await this.workspacesService.getMemberRole(workspaceId, userId);

    const database = this.pageRepository.create({
      title: title || 'Untitled Database',
      workspaceId,
      isDatabase: true,
      createdById: userId,
      updatedById: userId,
    });

    await this.pageRepository.save(database);

    // Create default Title property
    const titleProperty = this.propertyRepository.create({
      pageId: database.id,
      name: 'Title',
      type: 'text' as any,
      order: 0,
    });

    await this.propertyRepository.save(titleProperty);

    return database;
  }

  async getDatabase(databaseId: string, userId: string): Promise<{
    database: Page;
    properties: PropertyResponseDto[];
    rows: DatabaseRowResponseDto[];
  }> {
    this.logger.debug(`Getting database: ${databaseId}`);

    const database = await this.pageRepository.findOne({
      where: { id: databaseId, isDatabase: true, isDeleted: false },
    });

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    await this.workspacesService.getMemberRole(database.workspaceId, userId);

    const properties = await this.getProperties(databaseId, userId);
    const rows = await this.getRows(databaseId, userId);

    return { database, properties, rows };
  }

  // ============ Properties ============

  async getProperties(databaseId: string, userId: string): Promise<PropertyResponseDto[]> {
    this.logger.debug(`Getting properties for database: ${databaseId}`);

    await this.validateDatabase(databaseId, userId);

    const properties = await this.propertyRepository.find({
      where: { pageId: databaseId },
      order: { order: 'ASC' },
    });

    return properties.map((p) => this.mapPropertyToDto(p));
  }

  async createProperty(
    databaseId: string,
    dto: CreatePropertyDto,
    userId: string,
  ): Promise<PropertyResponseDto> {
    this.logger.debug(`Creating property in database: ${databaseId}`);

    await this.validateDatabase(databaseId, userId);

    const maxOrderResult = await this.propertyRepository
      .createQueryBuilder('prop')
      .select('MAX(prop.order)', 'maxOrder')
      .where('prop.pageId = :pageId', { pageId: databaseId })
      .getRawOne();

    const newOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

    const property = this.propertyRepository.create({
      pageId: databaseId,
      name: dto.name,
      type: dto.type,
      config: dto.config || {},
      order: newOrder,
    });

    await this.propertyRepository.save(property);

    return this.mapPropertyToDto(property);
  }

  async updateProperty(
    propertyId: string,
    dto: UpdatePropertyDto,
    userId: string,
  ): Promise<PropertyResponseDto> {
    this.logger.debug(`Updating property: ${propertyId}`);

    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
      relations: ['page'],
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    await this.workspacesService.getMemberRole(property.page.workspaceId, userId);

    if (dto.name !== undefined) property.name = dto.name;
    if (dto.type !== undefined) property.type = dto.type;
    if (dto.config !== undefined) property.config = dto.config;

    await this.propertyRepository.save(property);

    return this.mapPropertyToDto(property);
  }

  async deleteProperty(propertyId: string, userId: string): Promise<void> {
    this.logger.debug(`Deleting property: ${propertyId}`);

    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
      relations: ['page'],
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    await this.workspacesService.getMemberRole(property.page.workspaceId, userId);

    await this.propertyRepository.remove(property);
  }

  // ============ Rows (Pages with parent = database) ============

  async getRows(databaseId: string, userId: string): Promise<DatabaseRowResponseDto[]> {
    this.logger.debug(`Getting rows for database: ${databaseId}`);

    await this.validateDatabase(databaseId, userId);

    const rows = await this.pageRepository.find({
      where: { parentId: databaseId, isDeleted: false },
      order: { order: 'ASC' },
    });

    return rows.map((row) => this.mapRowToDto(row));
  }

  async createRow(
    databaseId: string,
    dto: CreateDatabaseRowDto,
    userId: string,
  ): Promise<DatabaseRowResponseDto> {
    this.logger.debug(`Creating row in database: ${databaseId}`);

    const database = await this.validateDatabase(databaseId, userId);

    const maxOrderResult = await this.pageRepository
      .createQueryBuilder('page')
      .select('MAX(page.order)', 'maxOrder')
      .where('page.parentId = :parentId', { parentId: databaseId })
      .andWhere('page.isDeleted = false')
      .getRawOne();

    const newOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

    const row = this.pageRepository.create({
      title: dto.title || 'Untitled',
      workspaceId: database.workspaceId,
      parentId: databaseId,
      order: newOrder,
      createdById: userId,
      updatedById: userId,
    });

    // Store properties in a JSON column or separate table
    // For simplicity, we'll store in a metadata field
    (row as any).properties = dto.properties;

    await this.pageRepository.save(row);

    return this.mapRowToDto(row);
  }

  async updateRow(
    rowId: string,
    dto: UpdateDatabaseRowDto,
    userId: string,
  ): Promise<DatabaseRowResponseDto> {
    this.logger.debug(`Updating row: ${rowId}`);

    const row = await this.pageRepository.findOne({
      where: { id: rowId, isDeleted: false },
    });

    if (!row || !row.parentId) {
      throw new NotFoundException('Row not found');
    }

    await this.workspacesService.getMemberRole(row.workspaceId, userId);

    if (dto.title !== undefined) row.title = dto.title;
    if (dto.properties !== undefined) {
      (row as any).properties = { ...(row as any).properties, ...dto.properties };
    }
    row.updatedById = userId;

    await this.pageRepository.save(row);

    return this.mapRowToDto(row);
  }

  async deleteRow(rowId: string, userId: string): Promise<void> {
    this.logger.debug(`Deleting row: ${rowId}`);

    const row = await this.pageRepository.findOne({
      where: { id: rowId },
    });

    if (!row || !row.parentId) {
      throw new NotFoundException('Row not found');
    }

    await this.workspacesService.getMemberRole(row.workspaceId, userId);

    row.isDeleted = true;
    row.deletedAt = new Date();
    row.updatedById = userId;

    await this.pageRepository.save(row);
  }

  // ============ Helpers ============

  private async validateDatabase(databaseId: string, userId: string): Promise<Page> {
    const database = await this.pageRepository.findOne({
      where: { id: databaseId, isDatabase: true, isDeleted: false },
    });

    if (!database) {
      throw new NotFoundException('Database not found');
    }

    await this.workspacesService.getMemberRole(database.workspaceId, userId);

    return database;
  }

  private mapPropertyToDto(property: DatabaseProperty): PropertyResponseDto {
    return {
      id: property.id,
      pageId: property.pageId,
      name: property.name,
      type: property.type,
      config: property.config,
      order: property.order,
    };
  }

  private mapRowToDto(row: Page): DatabaseRowResponseDto {
    return {
      id: row.id,
      title: row.title,
      icon: row.icon,
      properties: (row as any).properties || {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
