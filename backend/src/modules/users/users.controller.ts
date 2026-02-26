import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateUserDto, UserResponseDto } from './dto/index.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@CurrentUser('sub') userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    return this.usersService.mapToDto(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(userId, dto);
    return this.usersService.mapToDto(user);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async deleteMe(@CurrentUser('sub') userId: string): Promise<void> {
    await this.usersService.softDelete(userId);
  }
}
