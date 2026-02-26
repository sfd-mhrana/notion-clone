import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { NotificationResponseDto } from './dto/index.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'Returns list of notifications' })
  async findAll(
    @CurrentUser() user: JwtUser,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.findAll(user.sub, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Returns unread count' })
  async getUnreadCount(@CurrentUser() user: JwtUser): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(user.sub);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: JwtUser): Promise<void> {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<void> {
    return this.notificationsService.delete(id, user.sub);
  }
}
