import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity.js';
import { UpdateUserDto, UserResponseDto } from './dto/index.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    this.logger.debug(`Finding user by id: ${id}`);

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    this.logger.debug(`Updating user: ${id}`);

    const user = await this.findById(id);

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    }

    return this.userRepository.save(user);
  }

  async softDelete(id: string): Promise<void> {
    this.logger.debug(`Soft deleting user: ${id}`);

    const user = await this.findById(id);

    // Soft delete - we keep the record but could add an isDeleted flag
    // For now, we'll just remove the user
    await this.userRepository.remove(user);
  }

  mapToDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
